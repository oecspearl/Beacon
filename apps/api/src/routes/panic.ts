import { Router } from "express";
import { z } from "zod";
import { eq, isNull, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { panicEvents } from "../db/schema.js";
import { authenticateCoordinator } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { param } from "../middleware/params.js";
import { logger } from "../config/logger.js";
import { emitToCoordinators } from "../socket/index.js";
import { createEscalation } from "../services/escalation.js";

const router = Router();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const panicAlertSchema = z.object({
  studentId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  batteryLevel: z.number().int().min(0).max(100).optional(),
  audioUrl: z.string().url().optional(),
  transmittedVia: z.array(z.enum(["data", "mesh", "sms"])).default(["data"]),
});

// ---------------------------------------------------------------------------
// POST / — Receive panic alert
// ---------------------------------------------------------------------------
router.post("/", validate(panicAlertSchema), async (req, res) => {
  try {
    const {
      studentId,
      latitude,
      longitude,
      accuracy,
      batteryLevel,
      audioUrl,
      transmittedVia,
    } = req.body;

    const [event] = await db
      .insert(panicEvents)
      .values({
        studentId,
        latitude,
        longitude,
        accuracy: accuracy ?? null,
        batteryLevel: batteryLevel ?? null,
        audioUrl: audioUrl ?? null,
        transmittedVia,
      })
      .returning();

    // Create a critical escalation
    await createEscalation(
      studentId,
      "panic_activated",
      "critical",
      `Panic button activated at ${latitude}, ${longitude}`,
    );

    // Broadcast to all coordinators
    try {
      emitToCoordinators("student:panic", event);
    } catch {
      logger.debug("Socket.IO not available for panic broadcast");
    }

    logger.warn(
      { panicId: event.id, studentId },
      "Panic alert received and recorded",
    );

    res.status(201).json({ data: event });
  } catch (err) {
    logger.error({ err }, "Failed to record panic alert");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// GET / — List active (unresolved) panic events
// ---------------------------------------------------------------------------
router.get("/", authenticateCoordinator, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;

    const result = await db
      .select()
      .from(panicEvents)
      .where(isNull(panicEvents.resolvedAt))
      .orderBy(desc(panicEvents.timestamp))
      .limit(limit)
      .offset(offset);

    res.json({ data: result, total: result.length });
  } catch (err) {
    logger.error({ err }, "Failed to list panic events");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// PUT /:id/resolve — Resolve a panic event
// ---------------------------------------------------------------------------
router.put("/:id/resolve", authenticateCoordinator, async (req, res) => {
  try {
    const id = param(req, "id");
    const coordinatorId = req.coordinator!.id;

    const [updated] = await db
      .update(panicEvents)
      .set({
        resolvedAt: new Date(),
        resolvedBy: coordinatorId,
      })
      .where(eq(panicEvents.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Panic event not found" });
      return;
    }

    logger.info(
      { panicId: id, resolvedBy: coordinatorId },
      "Panic event resolved",
    );

    res.json({ data: updated });
  } catch (err) {
    logger.error({ err, panicId: req.params.id }, "Failed to resolve panic event");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
