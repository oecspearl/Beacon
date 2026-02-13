import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { authenticateCoordinator, requireRole } from "../middleware/auth.js";
import { logger } from "../config/logger.js";
import {
  sendSMS,
  sendBeaconAlert,
  broadcastToStudents,
} from "../services/sms-gateway.js";

const router = Router();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const sendSchema = z.object({
  to: z.string().min(1, "Recipient phone number is required"),
  message: z.string().min(1, "Message body is required"),
});

const broadcastSchema = z.object({
  phones: z
    .array(z.string().min(1))
    .min(1, "At least one phone number is required"),
  message: z.string().min(1, "Message body is required"),
  priority: z.enum(["informational", "action_required", "urgent"]),
});

const alertSchema = z.object({
  studentId: z.string().uuid(),
  status: z.string().min(1, "Status is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().min(1, "Recipient phone number is required"),
});

// ---------------------------------------------------------------------------
// POST /send — Send SMS to a specific phone number
// ---------------------------------------------------------------------------
router.post(
  "/send",
  authenticateCoordinator,
  validate(sendSchema),
  async (req, res) => {
    try {
      const { to, message } = req.body;
      const coordinatorId = req.coordinator!.id;

      logger.info(
        { coordinatorId, to },
        "Coordinator sending SMS",
      );

      const result = await sendSMS(to, message);

      if (!result.success) {
        res.status(502).json({ error: result.error ?? "Failed to send SMS" });
        return;
      }

      res.json({ data: { messageId: result.messageId, to } });
    } catch (err) {
      logger.error({ err }, "Failed to send SMS");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ---------------------------------------------------------------------------
// POST /broadcast — Send SMS to multiple students
// ---------------------------------------------------------------------------
router.post(
  "/broadcast",
  authenticateCoordinator,
  requireRole("admin", "coordinator"),
  validate(broadcastSchema),
  async (req, res) => {
    try {
      const { phones, message, priority } = req.body;
      const coordinatorId = req.coordinator!.id;

      logger.info(
        { coordinatorId, recipientCount: phones.length, priority },
        "Coordinator broadcasting SMS",
      );

      const results = await broadcastToStudents(phones, message, priority);

      const succeeded = results.filter((r) => r.success).length;
      const failed = results.length - succeeded;

      res.json({
        data: {
          total: results.length,
          succeeded,
          failed,
          results,
        },
      });
    } catch (err) {
      logger.error({ err }, "Failed to broadcast SMS");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ---------------------------------------------------------------------------
// POST /alert — Send a Beacon-formatted alert SMS
// ---------------------------------------------------------------------------
router.post(
  "/alert",
  authenticateCoordinator,
  validate(alertSchema),
  async (req, res) => {
    try {
      const { studentId, status, latitude, longitude, phone } = req.body;
      const coordinatorId = req.coordinator!.id;

      logger.info(
        { coordinatorId, studentId, status, phone },
        "Coordinator sending Beacon alert SMS",
      );

      const result = await sendBeaconAlert(
        studentId,
        status,
        { latitude, longitude },
        phone,
      );

      if (!result.success) {
        res
          .status(502)
          .json({ error: result.error ?? "Failed to send alert SMS" });
        return;
      }

      res.json({ data: { messageId: result.messageId, studentId, phone } });
    } catch (err) {
      logger.error({ err }, "Failed to send Beacon alert SMS");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
