import { Router } from "express";
import { z } from "zod";
import { eq, or, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { messages, broadcastMessages } from "../db/schema.js";
import { authenticateCoordinator } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { param } from "../middleware/params.js";
import { logger } from "../config/logger.js";
import { emitToCoordinators, emitToCountry } from "../socket/index.js";

const router = Router();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const sendMessageSchema = z.object({
  senderId: z.string().min(1),
  recipientId: z.string().min(1).optional(),
  groupId: z.string().min(1).optional(),
  content: z.string().min(1),
  priority: z.enum(["informational", "action_required", "urgent"]).default("informational"),
  encrypted: z.boolean().default(false),
  channel: z.enum(["data", "mesh", "sms"]).default("data"),
});

const broadcastSchema = z.object({
  targetType: z.enum(["all", "country", "status", "group", "individual"]),
  targetValue: z.string().optional(),
  content: z.string().min(1),
  priority: z.enum(["informational", "action_required", "urgent"]).default("informational"),
});

// ---------------------------------------------------------------------------
// POST / — Send message
// ---------------------------------------------------------------------------
router.post("/", validate(sendMessageSchema), async (req, res) => {
  try {
    const {
      senderId,
      recipientId,
      groupId,
      content,
      priority,
      encrypted,
      channel,
    } = req.body;

    const [message] = await db
      .insert(messages)
      .values({
        senderId,
        recipientId: recipientId ?? null,
        groupId: groupId ?? null,
        content,
        priority,
        encrypted,
        channel,
      })
      .returning();

    logger.info(
      { messageId: message.id, senderId, recipientId, groupId },
      "Message sent",
    );

    res.status(201).json({ data: message });
  } catch (err) {
    logger.error({ err }, "Failed to send message");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// POST /broadcast — Broadcast message (coordinator only)
// ---------------------------------------------------------------------------
router.post(
  "/broadcast",
  authenticateCoordinator,
  validate(broadcastSchema),
  async (req, res) => {
    try {
      const coordinatorId = req.coordinator!.id;
      const { targetType, targetValue, content, priority } = req.body;

      const [broadcast] = await db
        .insert(broadcastMessages)
        .values({
          senderId: coordinatorId,
          targetType,
          targetValue: targetValue ?? null,
          content,
          priority,
        })
        .returning();

      // Emit via Socket.IO to the appropriate room
      try {
        if (targetType === "all") {
          emitToCoordinators("broadcast:message", broadcast);
        } else if (targetType === "country" && targetValue) {
          emitToCountry(targetValue, "broadcast:message", broadcast);
          emitToCoordinators("broadcast:message", broadcast);
        } else {
          emitToCoordinators("broadcast:message", broadcast);
        }
      } catch {
        logger.debug("Socket.IO not available for broadcast");
      }

      logger.info(
        { broadcastId: broadcast.id, targetType, targetValue },
        "Broadcast message sent",
      );

      res.status(201).json({ data: broadcast });
    } catch (err) {
      logger.error({ err }, "Failed to send broadcast message");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ---------------------------------------------------------------------------
// GET /:studentId — Get messages for a student
// ---------------------------------------------------------------------------
router.get("/:studentId", authenticateCoordinator, async (req, res) => {
  try {
    const studentId = param(req, "studentId");
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;

    const result = await db
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, studentId),
          eq(messages.recipientId, studentId),
        ),
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ data: result });
  } catch (err) {
    logger.error(
      { err, studentId: req.params.studentId },
      "Failed to get messages",
    );
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
