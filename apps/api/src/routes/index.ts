import { Router } from "express";
import studentsRouter from "./students.js";
import statusRouter from "./status.js";
import panicRouter from "./panic.js";
import checkinsRouter from "./checkins.js";
import messagesRouter from "./messages.js";
import groupsRouter from "./groups.js";
import escalationsRouter from "./escalations.js";
import coordinatorsRouter from "./coordinators.js";
import countriesRouter from "./countries.js";
import smsOutboundRouter from "./sms-outbound.js";

const router = Router();

router.use("/students", studentsRouter);
router.use("/status", statusRouter);
router.use("/panic", panicRouter);
router.use("/checkins", checkinsRouter);
router.use("/messages", messagesRouter);
router.use("/groups", groupsRouter);
router.use("/escalations", escalationsRouter);
router.use("/coordinators", coordinatorsRouter);
router.use("/countries", countriesRouter);
router.use("/sms", smsOutboundRouter);

// Health check
router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
