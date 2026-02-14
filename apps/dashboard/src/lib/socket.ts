import { io, Socket } from "socket.io-client";
import { useDashboardStore } from "@/stores/dashboard-store";
import type {
  StudentOnMap,
  Escalation,
  ActivityItem,
  DashboardStats,
  OperationMode,
  ChatMessage,
} from "@/stores/dashboard-store";

let socket: Socket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(window.location.origin, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
  });

  socket.on("connect", () => {
    console.log("[Beacon] Socket connected");
    useDashboardStore.getState().setConnected(true);

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("[Beacon] Socket disconnected:", reason);
    useDashboardStore.getState().setConnected(false);
  });

  socket.on("connect_error", (err) => {
    console.error("[Beacon] Socket connection error:", err.message);
    useDashboardStore.getState().setConnected(false);
  });

  // --- Real-time data events ---

  socket.on("students:sync", (students: StudentOnMap[]) => {
    useDashboardStore.getState().setStudents(students);
  });

  socket.on("student:updated", (data: { id: string } & Partial<StudentOnMap>) => {
    const { id, ...rest } = data;
    useDashboardStore.getState().updateStudent(id, rest);
  });

  socket.on("stats:sync", (stats: DashboardStats) => {
    useDashboardStore.getState().setStats(stats);
  });

  socket.on("escalation:new", (escalation: Escalation) => {
    useDashboardStore.getState().addEscalation(escalation);
  });

  socket.on("escalations:sync", (escalations: Escalation[]) => {
    useDashboardStore.getState().setEscalations(escalations);
  });

  socket.on("activity:new", (activity: ActivityItem) => {
    useDashboardStore.getState().addActivity(activity);
  });

  socket.on("activities:sync", (activities: ActivityItem[]) => {
    useDashboardStore.getState().setActivities(activities);
  });

  socket.on("mode:changed", (mode: OperationMode) => {
    useDashboardStore.getState().setOperationMode(mode);
  });

  // --- Server-emitted real-time events ---

  // Status update from a student
  socket.on("student:status", (payload: {
    studentId: string;
    status: string;
    latitude: number;
    longitude: number;
    batteryLevel?: number;
    channel?: string;
    country?: string;
    timestamp?: string;
  }) => {
    const STATUS_MAP: Record<string, string> = {
      OK: "safe",
      MV: "moving",
      NA: "assistance",
      UR: "urgent",
      DT: "lost",
      MED: "urgent",
    };

    const store = useDashboardStore.getState();
    const mappedStatus = STATUS_MAP[payload.status] ?? payload.status;

    store.updateStudent(payload.studentId, {
      lat: payload.latitude,
      lon: payload.longitude,
      status: mappedStatus as any,
      battery: payload.batteryLevel ?? undefined,
      lastSeen: payload.timestamp ?? new Date().toISOString(),
    });

    // Update stats based on current student list
    const students = useDashboardStore.getState().students;
    if (students.length > 0) {
      const stats = { total: students.length, safe: 0, moving: 0, assistance: 0, urgent: 0, overdue: 0 };
      for (const s of students) {
        if (s.status === "safe") stats.safe++;
        else if (s.status === "moving") stats.moving++;
        else if (s.status === "assistance") stats.assistance++;
        else if (s.status === "urgent") stats.urgent++;
        else if (s.status === "overdue" || s.status === "lost") stats.overdue++;
      }
      store.setStats(stats);
    }

    // Add activity
    const student = students.find((s) => s.id === payload.studentId);
    store.addActivity({
      id: `status-${Date.now()}`,
      type: "status_change",
      studentName: student?.name,
      description: `Status changed to ${mappedStatus} via ${payload.channel ?? "data"}`,
      timestamp: payload.timestamp ?? new Date().toISOString(),
    });
  });

  // Panic alert
  socket.on("student:panic", (payload: {
    id: string;
    studentId: string;
    latitude: number;
    longitude: number;
    audioUrl?: string;
    batteryLevel?: number;
    timestamp?: string;
  }) => {
    const store = useDashboardStore.getState();

    store.updateStudent(payload.studentId, {
      lat: payload.latitude,
      lon: payload.longitude,
      status: "urgent",
      battery: payload.batteryLevel ?? undefined,
      lastSeen: payload.timestamp ?? new Date().toISOString(),
    });

    const student = store.students.find((s) => s.id === payload.studentId);
    store.addActivity({
      id: `panic-${payload.id}`,
      type: "escalation",
      studentName: student?.name,
      description: "PANIC BUTTON ACTIVATED",
      timestamp: payload.timestamp ?? new Date().toISOString(),
    });

    // Trigger panic notification
    store.setPanicAlert({
      panicEventId: payload.id,
      studentId: payload.studentId,
      studentName: student?.name ?? "Unknown Student",
      latitude: payload.latitude,
      longitude: payload.longitude,
      audioUrl: payload.audioUrl,
      timestamp: payload.timestamp ?? new Date().toISOString(),
    });
  });

  // Check-in
  socket.on("student:checkin", (payload: {
    id: string;
    studentId: string;
    response: string;
    latitude?: number;
    longitude?: number;
    timestamp?: string;
  }) => {
    const store = useDashboardStore.getState();

    const RESPONSE_STATUS: Record<string, string> = {
      safe: "safe",
      moving: "moving",
      need_assistance: "assistance",
      urgent: "urgent",
    };

    const updates: Record<string, unknown> = {
      status: RESPONSE_STATUS[payload.response] ?? "safe",
      lastSeen: payload.timestamp ?? new Date().toISOString(),
    };
    if (payload.latitude != null) updates.lat = payload.latitude;
    if (payload.longitude != null) updates.lon = payload.longitude;

    store.updateStudent(payload.studentId, updates as any);

    const student = store.students.find((s) => s.id === payload.studentId);
    store.addActivity({
      id: `checkin-${payload.id}`,
      type: "check_in",
      studentName: student?.name,
      description: `Checked in: ${payload.response}`,
      timestamp: payload.timestamp ?? new Date().toISOString(),
    });
  });

  // Messages sync (initial load)
  socket.on("messages:sync", (msgs: ChatMessage[]) => {
    useDashboardStore.getState().setMessages(msgs);
  });

  // New message (real-time)
  socket.on("message:new", (payload: {
    id: string;
    senderId: string;
    recipientId?: string | null;
    groupId?: string | null;
    content: string;
    priority: string;
    channel: string;
    createdAt: string;
  }) => {
    const store = useDashboardStore.getState();
    const student = store.students.find((s) => s.id === payload.senderId);
    store.addMessage({
      ...payload,
      senderName: student?.name ?? "Unknown",
    });
    store.addActivity({
      id: `msg-${payload.id}`,
      type: "message",
      studentName: student?.name,
      description: `Message: ${payload.content.slice(0, 80)}${payload.content.length > 80 ? "..." : ""}`,
      timestamp: payload.createdAt ?? new Date().toISOString(),
    });
  });

  // Broadcast messages
  socket.on("broadcast:message", (payload: {
    id: string;
    content: string;
    targetType: string;
    priority: string;
    createdAt?: string;
  }) => {
    const store = useDashboardStore.getState();
    store.addActivity({
      id: `broadcast-${payload.id}`,
      type: "message",
      description: `Broadcast (${payload.targetType}): ${payload.content}`,
      timestamp: payload.createdAt ?? new Date().toISOString(),
    });
  });

  return socket;
}

export function disconnectSocket(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  useDashboardStore.getState().setConnected(false);
}

export function getSocket(): Socket | null {
  return socket;
}

export function emitEvent(event: string, data?: unknown): void {
  if (socket?.connected) {
    socket.emit(event, data);
  } else {
    console.warn("[Beacon] Socket not connected, cannot emit:", event);
  }
}
