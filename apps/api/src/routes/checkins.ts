import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { checkins, students } from "../db/schema.js";
import { authenticateCoordinator } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { logger } from "../config/logger.js";
import { emitToCoordinators } from "../socket/index.js";
import {
  getOperationMode,
  setOperationMode,
} from "../services/escalation.js";
import {
  CHECK_IN_INTERVAL_NORMAL,
  CHECK_IN_INTERVAL_CRISIS,
} from "@beacon/shared";

const router: RouterType = Router();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const checkinSchema = z.object({
  studentId: z.string().uuid(),
  response: z.enum(["safe", "moving", "need_assistance", "urgent"]),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  channel: z.enum(["data", "mesh", "sms"]).default("data"),
});

const scheduleSchema = z.object({
  mode: z.enum(["normal", "crisis"]),
});

// ---------------------------------------------------------------------------
// POST / — Receive check-in
// ---------------------------------------------------------------------------
router.post("/", validate(checkinSchema), async (req, res) => {
  try {
    const { studentId, response, latitude, longitude, channel } = req.body;

    const [record] = await db
      .insert(checkins)
      .values({
        studentId,
        response,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        channel,
      })
      .returning();

    // Broadcast to coordinators
    try {
      emitToCoordinators("student:checkin", record);
    } catch {
      logger.debug("Socket.IO not available for check-in broadcast");
    }

    logger.info(
      { checkinId: record?.id, studentId, response },
      "Check-in recorded",
    );

    res.status(201).json({ data: record });
  } catch (err) {
    logger.error({ err }, "Failed to record check-in");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// GET /overdue — List students with overdue check-ins
// ---------------------------------------------------------------------------
router.get("/overdue", authenticateCoordinator, async (_req, res) => {
  try {
    const mode = getOperationMode();
    const intervalMinutes =
      mode === "crisis" ? CHECK_IN_INTERVAL_CRISIS : CHECK_IN_INTERVAL_NORMAL;
    const threshold = new Date(Date.now() - intervalMinutes * 60 * 1000);

    // Subquery: latest check-in per student
    const latestCheckins = db
      .select({
        studentId: checkins.studentId,
        lastCheckinAt: sql<Date>`max(${checkins.timestamp})`.as("last_checkin_at"),
      })
      .from(checkins)
      .groupBy(checkins.studentId)
      .as("latest_checkins");

    const overdueStudents = await db
      .select({
        studentId: students.id,
        fullName: students.fullName,
        hostCountry: students.hostCountry,
        oecsState: students.oecsState,
        lastCheckinAt: latestCheckins.lastCheckinAt,
      })
      .from(students)
      .leftJoin(latestCheckins, sql`${students.id} = ${latestCheckins.studentId}`)
      .where(
        sql`${latestCheckins.lastCheckinAt} IS NULL OR ${latestCheckins.lastCheckinAt} < ${threshold}`,
      );

    res.json({
      data: overdueStudents,
      total: overdueStudents.length,
      mode,
      intervalMinutes,
    });
  } catch (err) {
    logger.error({ err }, "Failed to list overdue check-ins");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// PUT /schedule — Update check-in schedule (toggle crisis mode)
// ---------------------------------------------------------------------------
router.put(
  "/schedule",
  authenticateCoordinator,
  validate(scheduleSchema),
  async (req, res) => {
    try {
      const { mode } = req.body;
      setOperationMode(mode);

      // Broadcast mode change to all connected coordinators
      try {
        emitToCoordinators("mode:changed", mode);
      } catch {
        logger.debug("Socket.IO not available for mode change broadcast");
      }

      const intervalMinutes =
        mode === "crisis" ? CHECK_IN_INTERVAL_CRISIS : CHECK_IN_INTERVAL_NORMAL;

      logger.info(
        { mode, intervalMinutes, changedBy: req.coordinator!.id },
        "Check-in schedule updated",
      );

      res.json({
        data: {
          mode,
          intervalMinutes,
          updatedBy: req.coordinator!.id,
        },
      });
    } catch (err) {
      logger.error({ err }, "Failed to update check-in schedule");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
