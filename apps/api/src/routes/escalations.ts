import { Router, type Router as RouterType } from "express";
import { eq, isNull, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { escalationEvents } from "../db/schema.js";
import { authenticateCoordinator } from "../middleware/auth.js";
import { logger } from "../config/logger.js";

const router: RouterType = Router();

// ---------------------------------------------------------------------------
// GET / — List active (unresolved) escalations
// ---------------------------------------------------------------------------
router.get("/", authenticateCoordinator, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const severity = req.query.severity as string | undefined;

    let query = db
      .select()
      .from(escalationEvents)
      .where(isNull(escalationEvents.resolvedAt))
      .$dynamic();

    if (severity === "warning" || severity === "critical") {
      query = query.where(eq(escalationEvents.severity, severity));
    }

    const result = await query
      .orderBy(desc(escalationEvents.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ data: result, total: result.length });
  } catch (err) {
    logger.error({ err }, "Failed to list escalations");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// PUT /:id/acknowledge — Acknowledge an escalation
// ---------------------------------------------------------------------------
router.put("/:id/acknowledge", authenticateCoordinator, async (req, res) => {
  try {
    const id = req.params.id as string;
    const coordinatorId = req.coordinator!.id;

    const [updated] = await db
      .update(escalationEvents)
      .set({
        acknowledgedAt: new Date(),
        acknowledgedBy: coordinatorId,
      })
      .where(eq(escalationEvents.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Escalation not found" });
      return;
    }

    logger.info(
      { escalationId: id, acknowledgedBy: coordinatorId },
      "Escalation acknowledged",
    );

    res.json({ data: updated });
  } catch (err) {
    logger.error(
      { err, escalationId: req.params.id },
      "Failed to acknowledge escalation",
    );
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// PUT /:id/resolve — Resolve an escalation
// ---------------------------------------------------------------------------
router.put("/:id/resolve", authenticateCoordinator, async (req, res) => {
  try {
    const id = req.params.id as string;
    const coordinatorId = req.coordinator!.id;

    const [updated] = await db
      .update(escalationEvents)
      .set({
        resolvedAt: new Date(),
        resolvedBy: coordinatorId,
      })
      .where(eq(escalationEvents.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Escalation not found" });
      return;
    }

    logger.info(
      { escalationId: id, resolvedBy: coordinatorId },
      "Escalation resolved",
    );

    res.json({ data: updated });
  } catch (err) {
    logger.error(
      { err, escalationId: req.params.id },
      "Failed to resolve escalation",
    );
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
