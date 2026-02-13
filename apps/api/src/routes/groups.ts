import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { groups, groupMembers, students } from "../db/schema.js";
import { authenticateCoordinator } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { param } from "../middleware/params.js";
import { logger } from "../config/logger.js";

const router: RouterType = Router();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createGroupSchema = z.object({
  name: z.string().min(1),
  leadId: z.string().uuid(),
  country: z.string().min(1),
  memberIds: z.array(z.string().uuid()).optional(),
});

const addMemberSchema = z.object({
  studentId: z.string().uuid(),
});

// ---------------------------------------------------------------------------
// POST / — Create group
// ---------------------------------------------------------------------------
router.post(
  "/",
  authenticateCoordinator,
  validate(createGroupSchema),
  async (req, res) => {
    try {
      const { name, leadId, country, memberIds } = req.body;

      const [group] = await db
        .insert(groups)
        .values({ name, leadId, country })
        .returning();

      // Add the lead as a member automatically
      const membersToInsert = [{ groupId: group!.id, studentId: leadId }];

      // Add any additional members
      if (memberIds && memberIds.length > 0) {
        for (const memberId of memberIds) {
          if (memberId !== leadId) {
            membersToInsert.push({ groupId: group!.id, studentId: memberId });
          }
        }
      }

      await db.insert(groupMembers).values(membersToInsert);

      logger.info(
        { groupId: group!.id, name, memberCount: membersToInsert.length },
        "Group created",
      );

      res.status(201).json({ data: group });
    } catch (err) {
      logger.error({ err }, "Failed to create group");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ---------------------------------------------------------------------------
// GET / — List groups
// ---------------------------------------------------------------------------
router.get("/", authenticateCoordinator, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;

    const result = await db
      .select()
      .from(groups)
      .orderBy(desc(groups.lastActivityAt))
      .limit(limit)
      .offset(offset);

    res.json({ data: result });
  } catch (err) {
    logger.error({ err }, "Failed to list groups");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// GET /:id — Get group with members
// ---------------------------------------------------------------------------
router.get("/:id", authenticateCoordinator, async (req, res) => {
  try {
    const id = req.params.id as string;

    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, id))
      .limit(1);

    if (!group) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    const members = await db
      .select({
        studentId: groupMembers.studentId,
        joinedAt: groupMembers.joinedAt,
        fullName: students.fullName,
        hostCountry: students.hostCountry,
      })
      .from(groupMembers)
      .innerJoin(students, eq(groupMembers.studentId, students.id))
      .where(eq(groupMembers.groupId, id));

    res.json({
      data: {
        ...group,
        members,
      },
    });
  } catch (err) {
    logger.error({ err, groupId: req.params.id }, "Failed to get group");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// POST /:id/members — Add member to group
// ---------------------------------------------------------------------------
router.post(
  "/:id/members",
  authenticateCoordinator,
  validate(addMemberSchema),
  async (req, res) => {
    try {
      const id = param(req, "id");
      const { studentId } = req.body;

      // Verify group exists
      const [group] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, id))
        .limit(1);

      if (!group) {
        res.status(404).json({ error: "Group not found" });
        return;
      }

      await db.insert(groupMembers).values({
        groupId: id,
        studentId,
      });

      // Update last activity
      await db
        .update(groups)
        .set({ lastActivityAt: new Date() })
        .where(eq(groups.id, id));

      logger.info(
        { groupId: id, studentId },
        "Member added to group",
      );

      res.status(201).json({ data: { groupId: id, studentId } });
    } catch (err) {
      logger.error(
        { err, groupId: req.params.id },
        "Failed to add member to group",
      );
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ---------------------------------------------------------------------------
// DELETE /:id/members/:studentId — Remove member from group
// ---------------------------------------------------------------------------
router.delete(
  "/:id/members/:studentId",
  authenticateCoordinator,
  async (req, res) => {
    try {
      const id = param(req, "id");
      const studentId = param(req, "studentId");

      const deleted = await db
        .delete(groupMembers)
        .where(
          and(
            eq(groupMembers.groupId, id),
            eq(groupMembers.studentId, studentId),
          ),
        )
        .returning();

      if (deleted.length === 0) {
        res.status(404).json({ error: "Member not found in group" });
        return;
      }

      // Update last activity
      await db
        .update(groups)
        .set({ lastActivityAt: new Date() })
        .where(eq(groups.id, id));

      logger.info(
        { groupId: id, studentId },
        "Member removed from group",
      );

      res.json({ data: { groupId: id, studentId, removed: true } });
    } catch (err) {
      logger.error(
        { err, groupId: req.params.id, studentId: req.params.studentId },
        "Failed to remove member from group",
      );
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
