import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { eq, desc, isNull } from "drizzle-orm";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";
import type { CoordinatorPayload } from "../middleware/auth.js";
import { db } from "../db/index.js";
import {
  students,
  studentStatuses,
  studentLocations,
  escalationEvents,
  checkins,
} from "../db/schema.js";

// Extend socket data type
interface SocketData {
  coordinator?: CoordinatorPayload;
  role: "coordinator" | "student";
  country?: string;
}

let io: SocketIOServer | null = null;

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }
  return io;
}

async function syncCoordinatorState(socket: import("socket.io").Socket) {
  // 1. Fetch all students with their latest status and location
  const allStudents = await db.select().from(students);

  const studentData = await Promise.all(
    allStudents.map(async (student) => {
      const [latestStatus] = await db
        .select()
        .from(studentStatuses)
        .where(eq(studentStatuses.studentId, student.id))
        .orderBy(desc(studentStatuses.timestamp))
        .limit(1);

      const [latestLocation] = await db
        .select()
        .from(studentLocations)
        .where(eq(studentLocations.studentId, student.id))
        .orderBy(desc(studentLocations.timestamp))
        .limit(1);

      const STATUS_MAP: Record<string, string> = {
        OK: "safe",
        MV: "moving",
        NA: "assistance",
        UR: "urgent",
        DT: "lost",
        MED: "urgent",
      };

      return {
        id: student.id,
        name: student.fullName,
        lat: latestLocation?.latitude ?? 0,
        lon: latestLocation?.longitude ?? 0,
        status: STATUS_MAP[latestStatus?.status ?? "OK"] ?? "safe",
        country: student.hostCountry,
        lastSeen: latestStatus?.timestamp?.toISOString() ?? student.createdAt.toISOString(),
        battery: latestStatus?.batteryLevel ?? 100,
        phone: student.phone ?? undefined,
        institution: student.hostInstitution,
        programme: student.programme,
      };
    }),
  );

  socket.emit("students:sync", studentData);

  // 2. Fetch active escalations (with student names)
  const activeEscalations = await db
    .select({
      id: escalationEvents.id,
      studentId: escalationEvents.studentId,
      type: escalationEvents.type,
      severity: escalationEvents.severity,
      description: escalationEvents.description,
      createdAt: escalationEvents.createdAt,
      acknowledgedAt: escalationEvents.acknowledgedAt,
      resolvedAt: escalationEvents.resolvedAt,
      studentName: students.fullName,
    })
    .from(escalationEvents)
    .innerJoin(students, eq(escalationEvents.studentId, students.id))
    .where(isNull(escalationEvents.resolvedAt))
    .orderBy(desc(escalationEvents.createdAt))
    .limit(50);

  const escalationsForClient = activeEscalations.map((e) => ({
    id: e.id,
    studentId: e.studentId,
    studentName: e.studentName,
    type: e.type,
    severity: e.severity,
    message: e.description,
    createdAt: e.createdAt.toISOString(),
    acknowledged: !!e.acknowledgedAt,
    resolved: !!e.resolvedAt,
    actionsTaken: [],
  }));

  socket.emit("escalations:sync", escalationsForClient);

  // 3. Compute and emit stats
  const totalStudents = allStudents.length;
  let safe = 0, moving = 0, assistance = 0, urgent = 0, overdue = 0;

  for (const s of studentData) {
    switch (s.status) {
      case "safe": safe++; break;
      case "moving": moving++; break;
      case "assistance": assistance++; break;
      case "urgent": urgent++; break;
      case "lost":
      case "overdue": overdue++; break;
    }
  }

  socket.emit("stats:sync", {
    total: totalStudents,
    safe,
    moving,
    assistance,
    urgent,
    overdue,
  });

  // 4. Build recent activity from latest check-ins, status changes, and escalations
  const recentCheckins = await db
    .select({
      id: checkins.id,
      studentId: checkins.studentId,
      response: checkins.response,
      timestamp: checkins.timestamp,
      studentName: students.fullName,
    })
    .from(checkins)
    .innerJoin(students, eq(checkins.studentId, students.id))
    .orderBy(desc(checkins.timestamp))
    .limit(10);

  const recentEscalations = await db
    .select({
      id: escalationEvents.id,
      studentId: escalationEvents.studentId,
      type: escalationEvents.type,
      description: escalationEvents.description,
      createdAt: escalationEvents.createdAt,
      studentName: students.fullName,
    })
    .from(escalationEvents)
    .innerJoin(students, eq(escalationEvents.studentId, students.id))
    .orderBy(desc(escalationEvents.createdAt))
    .limit(10);

  const activities = [
    ...recentCheckins.map((c) => ({
      id: `checkin-${c.id}`,
      type: "check_in" as const,
      studentName: c.studentName,
      description: `Checked in: ${c.response}`,
      timestamp: c.timestamp.toISOString(),
    })),
    ...recentEscalations.map((e) => ({
      id: `escalation-${e.id}`,
      type: "escalation" as const,
      studentName: e.studentName,
      description: e.description ?? `Escalation: ${e.type}`,
      timestamp: e.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
   .slice(0, 20);

  socket.emit("activities:sync", activities);

  logger.info(
    { socketId: socket.id, students: studentData.length, escalations: escalationsForClient.length },
    "Coordinator state synced",
  );
}

export function setupSocketIO(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.CORS_ORIGINS,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60_000,
    pingInterval: 25_000,
  });

  // -----------------------------------------------------------------------
  // Authentication middleware
  // -----------------------------------------------------------------------
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      next(new Error("Authentication required"));
      return;
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as CoordinatorPayload;
      (socket.data as SocketData).coordinator = decoded;
      (socket.data as SocketData).role = "coordinator";
      next();
    } catch {
      // If the token is not a coordinator JWT, treat it as a student connection.
      // In a full implementation this would verify a student-specific token.
      (socket.data as SocketData).role = "student";
      next();
    }
  });

  // -----------------------------------------------------------------------
  // Connection handler
  // -----------------------------------------------------------------------
  io.on("connection", (socket) => {
    const data = socket.data as SocketData;
    const country = (socket.handshake.auth.country as string) ?? undefined;

    logger.info(
      { socketId: socket.id, role: data.role, country },
      "Socket connected",
    );

    // Join role-based room
    if (data.role === "coordinator") {
      socket.join("coordinators");
      logger.debug({ socketId: socket.id }, "Joined coordinators room");
    }

    // Join country-based room
    if (country) {
      socket.join(`country:${country}`);
      (socket.data as SocketData).country = country;
      logger.debug({ socketId: socket.id, country }, "Joined country room");
    }

    // ----- Initial sync for coordinators ----------------------------------
    if (data.role === "coordinator") {
      syncCoordinatorState(socket).catch((err) =>
        logger.error({ err, socketId: socket.id }, "Failed to sync coordinator state"),
      );
    }

    // ----- Event: student status update -----------------------------------
    socket.on("student:status", (payload: unknown) => {
      logger.debug({ socketId: socket.id, payload }, "student:status received");

      // Broadcast to coordinators and to the relevant country room
      io!.to("coordinators").emit("student:status", payload);
      if (country) {
        io!.to(`country:${country}`).emit("student:status", payload);
      }
    });

    // ----- Event: panic alert ---------------------------------------------
    socket.on("student:panic", (payload: unknown) => {
      logger.warn({ socketId: socket.id, payload }, "student:panic received");

      // Panic events go to all coordinators
      io!.to("coordinators").emit("student:panic", payload);
      if (country) {
        io!.to(`country:${country}`).emit("student:panic", payload);
      }
    });

    // ----- Event: check-in ------------------------------------------------
    socket.on("student:checkin", (payload: unknown) => {
      logger.debug({ socketId: socket.id, payload }, "student:checkin received");

      io!.to("coordinators").emit("student:checkin", payload);
      if (country) {
        io!.to(`country:${country}`).emit("student:checkin", payload);
      }
    });

    // ----- Event: new escalation ------------------------------------------
    socket.on("escalation:new", (payload: unknown) => {
      logger.info({ socketId: socket.id, payload }, "escalation:new received");

      io!.to("coordinators").emit("escalation:new", payload);
    });

    // ----- Event: broadcast message ---------------------------------------
    socket.on("broadcast:send", (payload: { targetRoom?: string; data: unknown }) => {
      logger.info({ socketId: socket.id, payload }, "broadcast:send received");

      if (payload.targetRoom) {
        io!.to(payload.targetRoom).emit("broadcast:message", payload.data);
      } else {
        // Send to everyone
        io!.emit("broadcast:message", payload.data);
      }
    });

    // ----- Disconnect -----------------------------------------------------
    socket.on("disconnect", (reason) => {
      logger.info({ socketId: socket.id, reason }, "Socket disconnected");
    });
  });

  logger.info("Socket.IO server initialized");
  return io;
}

/**
 * Convenience function to emit an event from anywhere in the server.
 */
export function emitToCoordinators(event: string, payload: unknown): void {
  getIO().to("coordinators").emit(event, payload);
}

export function emitToCountry(
  countryCode: string,
  event: string,
  payload: unknown,
): void {
  getIO().to(`country:${countryCode}`).emit(event, payload);
}
