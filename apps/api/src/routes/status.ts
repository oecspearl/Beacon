import { Router } from "express";
import { z } from "zod";
import { db } from "../db/index.js";
import { studentStatuses, studentLocations } from "../db/schema.js";
import { validate } from "../middleware/validate.js";
import { logger } from "../config/logger.js";
import { emitToCoordinators, emitToCountry } from "../socket/index.js";
import { decodeSMS, type DecodedSMS } from "@beacon/protocol";
import { createEscalation } from "../services/escalation.js";
// SMS gateway service — used below once coordinator phone numbers are available
// import { sendBeaconAlert } from "../services/sms-gateway.js";
import { BATTERY_CRITICAL_THRESHOLD } from "@beacon/shared";

const router = Router();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const statusUpdateSchema = z.object({
  studentId: z.string().uuid(),
  status: z.enum(["OK", "MV", "NA", "UR", "DT", "MED"]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  batteryLevel: z.number().int().min(0).max(100).optional(),
  channel: z.enum(["data", "mesh", "sms", "satellite"]).default("data"),
  groupId: z.string().uuid().optional(),
  country: z.string().optional(),
});

// ---------------------------------------------------------------------------
// POST / — Receive status update (from mobile app or mesh relay)
// ---------------------------------------------------------------------------
router.post("/", validate(statusUpdateSchema), async (req, res) => {
  try {
    const {
      studentId,
      status,
      latitude,
      longitude,
      batteryLevel,
      channel,
      groupId,
      country,
    } = req.body;

    // Insert status record
    const [statusRecord] = await db
      .insert(studentStatuses)
      .values({
        studentId,
        status,
        latitude,
        longitude,
        batteryLevel: batteryLevel ?? null,
        channel,
        groupId: groupId ?? null,
      })
      .returning();

    // Also record the location
    await db.insert(studentLocations).values({
      studentId,
      latitude,
      longitude,
      source: channel,
    });

    // Broadcast via Socket.IO
    const payload = { ...statusRecord, country };
    try {
      emitToCoordinators("student:status", payload);
      if (country) {
        emitToCountry(country, "student:status", payload);
      }
    } catch {
      // Socket.IO may not be initialized in tests
      logger.debug("Socket.IO not available for status broadcast");
    }

    // Check for auto-escalation conditions
    if (status === "UR" || status === "DT" || status === "MED") {
      await createEscalation(
        studentId,
        status === "MED" ? "panic_activated" : "high_risk_zone",
        "critical",
        `Student reported status: ${status}`,
      );

      // Notify coordinators via SMS for critical statuses
      // TODO: Retrieve coordinator phone numbers from the database once the
      // schema includes a phone column on the coordinators table. For now we
      // log the intent so the pathway is exercised in integration tests.
      logger.info(
        { studentId, status, latitude, longitude },
        "Critical status detected — SMS notification to coordinators would be sent here",
      );
      // Example usage once coordinator phones are available:
      // const coordinatorPhones = await getCoordinatorPhones(groupId);
      // await sendBeaconAlert(studentId, status, { latitude, longitude }, coordinatorPhones[0]);
    }

    if (
      batteryLevel !== undefined &&
      batteryLevel <= BATTERY_CRITICAL_THRESHOLD
    ) {
      await createEscalation(
        studentId,
        "battery_critical",
        "warning",
        `Student battery level critical: ${batteryLevel}%`,
      );
    }

    logger.info(
      { studentId, status, channel },
      "Status update recorded",
    );

    res.status(201).json({ data: statusRecord });
  } catch (err) {
    logger.error({ err }, "Failed to record status update");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// POST /sms-inbound — SMS gateway webhook for inbound status messages
// ---------------------------------------------------------------------------
router.post("/sms-inbound", async (req, res) => {
  try {
    const { Body, body, message } = req.body;
    const smsBody: string = Body ?? body ?? message;

    if (!smsBody) {
      res.status(400).json({ error: "Missing SMS body" });
      return;
    }

    let decoded: DecodedSMS;
    try {
      decoded = decodeSMS(smsBody);
    } catch (parseErr) {
      logger.warn({ smsBody, err: parseErr }, "Failed to parse inbound SMS");
      res.status(400).json({ error: "Invalid Beacon SMS format" });
      return;
    }

    // Persist the decoded status
    const [statusRecord] = await db
      .insert(studentStatuses)
      .values({
        studentId: decoded.studentId,
        status: decoded.status,
        latitude: decoded.latitude,
        longitude: decoded.longitude,
        channel: "sms",
        timestamp: decoded.timestamp,
      })
      .returning();

    await db.insert(studentLocations).values({
      studentId: decoded.studentId,
      latitude: decoded.latitude,
      longitude: decoded.longitude,
      source: "sms",
      timestamp: decoded.timestamp,
    });

    // Broadcast
    try {
      emitToCoordinators("student:status", statusRecord);
    } catch {
      logger.debug("Socket.IO not available for SMS status broadcast");
    }

    logger.info(
      { studentId: decoded.studentId, status: decoded.status },
      "SMS status update recorded",
    );

    // Respond with 200 (many SMS gateways expect a 200 with TwiML or plain text)
    res.status(200).json({ data: statusRecord });
  } catch (err) {
    logger.error({ err }, "Failed to process inbound SMS");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
