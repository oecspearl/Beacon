import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  checkins,
  escalationEvents,
  students,
} from "../db/schema.js";
import { logger } from "../config/logger.js";
import { emitToCoordinators } from "../socket/index.js";
import {
  CHECK_IN_INTERVAL_NORMAL,
  CHECK_IN_INTERVAL_CRISIS,
  MISSED_CHECKIN_THRESHOLD,
  BATTERY_CRITICAL_THRESHOLD,
} from "@beacon/shared";

// Re-export thresholds for reference
export { MISSED_CHECKIN_THRESHOLD, BATTERY_CRITICAL_THRESHOLD };

/**
 * In-memory operation mode. In a production system this would be
 * persisted in the database or a config store, but for simplicity
 * we keep it here and expose helpers to toggle it.
 */
let operationMode: "normal" | "crisis" = "normal";

export function getOperationMode() {
  return operationMode;
}

export function setOperationMode(mode: "normal" | "crisis") {
  operationMode = mode;
  logger.info({ mode }, "Operation mode changed");
}

function getCheckinIntervalMinutes(): number {
  return operationMode === "crisis"
    ? CHECK_IN_INTERVAL_CRISIS
    : CHECK_IN_INTERVAL_NORMAL;
}

/**
 * Scan for students whose last check-in is older than the allowed
 * interval, and create escalation events for any that exceed the
 * missed-checkin threshold.
 *
 * Returns the number of new escalation events created.
 */
export async function checkMissedCheckins(): Promise<number> {
  const intervalMinutes = getCheckinIntervalMinutes();
  const threshold = new Date(Date.now() - intervalMinutes * 60 * 1000);

  logger.info(
    { intervalMinutes, threshold: threshold.toISOString(), mode: operationMode },
    "Running missed check-in scan",
  );

  // Find the latest check-in per student
  const latestCheckins = db
    .select({
      studentId: checkins.studentId,
      lastCheckinAt: sql<Date>`max(${checkins.timestamp})`.as("last_checkin_at"),
    })
    .from(checkins)
    .groupBy(checkins.studentId)
    .as("latest_checkins");

  // Find students whose latest check-in is before the threshold,
  // or who have never checked in at all
  const overdueStudents = await db
    .select({
      studentId: students.id,
      fullName: students.fullName,
      lastCheckinAt: latestCheckins.lastCheckinAt,
    })
    .from(students)
    .leftJoin(latestCheckins, eq(students.id, latestCheckins.studentId))
    .where(
      sql`${latestCheckins.lastCheckinAt} IS NULL OR ${latestCheckins.lastCheckinAt} < ${threshold}`,
    );

  let created = 0;

  for (const student of overdueStudents) {
    // Check if there is already an unresolved missed_checkin escalation
    const existing = await db
      .select({ id: escalationEvents.id })
      .from(escalationEvents)
      .where(
        and(
          eq(escalationEvents.studentId, student.studentId),
          eq(escalationEvents.type, "missed_checkin"),
          isNull(escalationEvents.resolvedAt),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      continue; // Already escalated, skip
    }

    await createEscalation(
      student.studentId,
      "missed_checkin",
      "warning",
      `Student ${student.fullName} has not checked in since ${
        student.lastCheckinAt
          ? new Date(student.lastCheckinAt).toISOString()
          : "registration"
      }`,
    );
    created++;
  }

  logger.info(
    { overdueCount: overdueStudents.length, newEscalations: created },
    "Missed check-in scan complete",
  );

  return created;
}

/**
 * Create a new escalation event and persist it to the database.
 * Returns the created escalation record.
 */
export async function createEscalation(
  studentId: string,
  type: string,
  severity: "warning" | "critical",
  description?: string,
) {
  const desc_ =
    description ?? `Escalation of type '${type}' for student ${studentId}`;

  const [escalation] = await db
    .insert(escalationEvents)
    .values({
      studentId,
      type,
      severity,
      description: desc_,
    })
    .returning();

  logger.warn(
    { escalationId: escalation?.id, studentId, type, severity },
    "Escalation event created",
  );

  // Broadcast to coordinators in real-time
  try {
    emitToCoordinators("escalation:new", escalation);
  } catch {
    logger.debug("Socket.IO not available for escalation broadcast");
  }

  return escalation;
}

/**
 * Start a periodic timer that runs the missed-checkin check.
 * Returns a cleanup function to stop the timer.
 */
export function startPeriodicChecks(intervalMs = 5 * 60 * 1000): () => void {
  logger.info(
    { intervalMs },
    "Starting periodic missed check-in scanner",
  );

  const timer = setInterval(async () => {
    try {
      await checkMissedCheckins();
    } catch (err) {
      logger.error({ err }, "Periodic missed check-in scan failed");
    }
  }, intervalMs);

  return () => {
    clearInterval(timer);
    logger.info("Stopped periodic missed check-in scanner");
  };
}
