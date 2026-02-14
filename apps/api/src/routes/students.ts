import { Router } from "express";
import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  students,
  emergencyContacts,
  studentStatuses,
  studentLocations,
  checkins,
} from "../db/schema.js";
import { authenticateCoordinator } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { param } from "../middleware/params.js";
import { logger } from "../config/logger.js";

const router = Router();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createStudentSchema = z.object({
  fullName: z.string().min(1),
  nationality: z.string().min(1),
  oecsState: z.string().min(1),
  passportNumberEncrypted: z.string().optional(),
  programme: z.string().min(1),
  hostInstitution: z.string().min(1),
  hostCountry: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  bloodType: z.string().optional(),
  medicalConditions: z.string().optional(),
  photoUrl: z.string().url().optional(),
  emergencyContacts: z
    .array(
      z.object({
        name: z.string().min(1),
        relationship: z.string().min(1),
        phone: z.string().min(1),
        email: z.string().email().optional(),
        isInCountry: z.boolean().default(false),
      }),
    )
    .min(1)
    .optional(),
});

const updateStudentSchema = createStudentSchema.partial();

// ---------------------------------------------------------------------------
// GET / — List students with optional filters
// ---------------------------------------------------------------------------
router.get("/", authenticateCoordinator, async (req, res) => {
  try {
    const { country, status, oecs_state, limit, offset } = req.query;

    const conditions = [];
    if (country && typeof country === "string") {
      conditions.push(eq(students.hostCountry, country));
    }
    if (oecs_state && typeof oecs_state === "string") {
      conditions.push(eq(students.oecsState, oecs_state));
    }

    const pageLimit = Math.min(Number(limit) || 50, 200);
    const pageOffset = Number(offset) || 0;

    let query = db.select().from(students).$dynamic();

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query
      .orderBy(desc(students.createdAt))
      .limit(pageLimit)
      .offset(pageOffset);

    // If a status filter is provided, we post-filter by latest status
    if (status && typeof status === "string") {
      const studentIds = result.map((s) => s.id);
      if (studentIds.length === 0) {
        res.json({ data: [], total: 0 });
        return;
      }

      const latestStatuses = await db
        .select()
        .from(studentStatuses)
        .where(sql`${studentStatuses.studentId} = ANY(${studentIds})`)
        .orderBy(desc(studentStatuses.timestamp));

      const latestByStudent = new Map<string, typeof studentStatuses.$inferSelect>();
      for (const s of latestStatuses) {
        if (!latestByStudent.has(s.studentId)) {
          latestByStudent.set(s.studentId, s);
        }
      }

      const filtered = result.filter((student) => {
        const latest = latestByStudent.get(student.id);
        return latest?.status === status;
      });

      res.json({ data: filtered, total: filtered.length });
      return;
    }

    res.json({ data: result, total: result.length });
  } catch (err) {
    logger.error({ err }, "Failed to list students");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// GET /:id — Get student by ID with latest status and location
// ---------------------------------------------------------------------------
router.get("/:id", authenticateCoordinator, async (req, res) => {
  try {
    const id = param(req, "id");

    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, id))
      .limit(1);

    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    const contacts = await db
      .select()
      .from(emergencyContacts)
      .where(eq(emergencyContacts.studentId, id));

    const [latestStatus] = await db
      .select()
      .from(studentStatuses)
      .where(eq(studentStatuses.studentId, id))
      .orderBy(desc(studentStatuses.timestamp))
      .limit(1);

    const [latestLocation] = await db
      .select()
      .from(studentLocations)
      .where(eq(studentLocations.studentId, id))
      .orderBy(desc(studentLocations.timestamp))
      .limit(1);

    res.json({
      data: {
        ...student,
        emergencyContacts: contacts,
        latestStatus: latestStatus ?? null,
        latestLocation: latestLocation ?? null,
      },
    });
  } catch (err) {
    logger.error({ err, studentId: req.params.id }, "Failed to get student");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// POST / — Register new student
// ---------------------------------------------------------------------------
router.post("/", validate(createStudentSchema), async (req, res) => {
  try {
    const { emergencyContacts: contacts, ...studentData } = req.body;

    const [student] = await db
      .insert(students)
      .values(studentData)
      .returning();

    if (contacts && contacts.length > 0) {
      const contactRows = (contacts as Array<{
        name: string;
        relationship: string;
        phone: string;
        email?: string;
        isInCountry: boolean;
      }>).map((c) => ({
        ...c,
        studentId: student.id,
      }));
      await db.insert(emergencyContacts).values(contactRows);
    }

    logger.info({ studentId: student.id }, "Student registered");
    res.status(201).json({ data: student });
  } catch (err) {
    logger.error({ err }, "Failed to register student");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// PUT /:id — Update student profile
// ---------------------------------------------------------------------------
router.put(
  "/:id",
  authenticateCoordinator,
  validate(updateStudentSchema),
  async (req, res) => {
    try {
      const id = param(req, "id");
      const { emergencyContacts: _contacts, ...updates } = req.body;

      const [updated] = await db
        .update(students)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(students.id, id))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Student not found" });
        return;
      }

      logger.info({ studentId: id }, "Student profile updated");
      res.json({ data: updated });
    } catch (err) {
      logger.error({ err, studentId: req.params.id }, "Failed to update student");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ---------------------------------------------------------------------------
// GET /:id/statuses — Status history
// ---------------------------------------------------------------------------
router.get("/:id/statuses", authenticateCoordinator, async (req, res) => {
  try {
    const id = param(req, "id");
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;

    const result = await db
      .select()
      .from(studentStatuses)
      .where(eq(studentStatuses.studentId, id))
      .orderBy(desc(studentStatuses.timestamp))
      .limit(limit)
      .offset(offset);

    res.json({ data: result });
  } catch (err) {
    logger.error({ err, studentId: req.params.id }, "Failed to get status history");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// GET /:id/checkins — Check-in history
// ---------------------------------------------------------------------------
router.get("/:id/checkins", authenticateCoordinator, async (req, res) => {
  try {
    const id = param(req, "id");
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;

    const result = await db
      .select()
      .from(checkins)
      .where(eq(checkins.studentId, id))
      .orderBy(desc(checkins.timestamp))
      .limit(limit)
      .offset(offset);

    res.json({ data: result });
  } catch (err) {
    logger.error({ err, studentId: req.params.id }, "Failed to get check-in history");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// GET /:id/locations — Location history
// ---------------------------------------------------------------------------
router.get("/:id/locations", authenticateCoordinator, async (req, res) => {
  try {
    const id = param(req, "id");
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const offset = Number(req.query.offset) || 0;

    const result = await db
      .select()
      .from(studentLocations)
      .where(eq(studentLocations.studentId, id))
      .orderBy(desc(studentLocations.timestamp))
      .limit(limit)
      .offset(offset);

    res.json({ data: result });
  } catch (err) {
    logger.error({ err, studentId: req.params.id }, "Failed to get location history");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
