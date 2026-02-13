import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { db } from "../db/index.js";
import { coordinators } from "../db/schema.js";
import { config } from "../config/env.js";
import { authenticateCoordinator, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { logger } from "../config/logger.js";

const router: RouterType = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Hash a password using scrypt (built-in, no external dependency needed).
 */
async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(":");
    crypto.scrypt(password, salt!, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(
        crypto.timingSafeEqual(Buffer.from(key!, "hex"), derivedKey),
      );
    });
  });
}

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const createCoordinatorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "coordinator", "observer"]).default("coordinator"),
  oecsState: z.string().optional(),
});

// ---------------------------------------------------------------------------
// POST /login — Authenticate coordinator
// ---------------------------------------------------------------------------
router.post("/login", validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const [coordinator] = await db
      .select()
      .from(coordinators)
      .where(eq(coordinators.email, email))
      .limit(1);

    if (!coordinator) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const passwordValid = await verifyPassword(
      password,
      coordinator.passwordHash,
    );

    if (!passwordValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = jwt.sign(
      {
        id: coordinator.id,
        email: coordinator.email,
        role: coordinator.role,
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions,
    );

    logger.info(
      { coordinatorId: coordinator.id, email },
      "Coordinator logged in",
    );

    res.json({
      data: {
        token,
        coordinator: {
          id: coordinator.id,
          name: coordinator.name,
          email: coordinator.email,
          role: coordinator.role,
          oecsState: coordinator.oecsState,
        },
      },
    });
  } catch (err) {
    logger.error({ err }, "Login failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// GET /me — Get current coordinator profile
// ---------------------------------------------------------------------------
router.get("/me", authenticateCoordinator, async (req, res) => {
  try {
    const coordinatorId = req.coordinator!.id;

    const [coordinator] = await db
      .select({
        id: coordinators.id,
        name: coordinators.name,
        email: coordinators.email,
        role: coordinators.role,
        oecsState: coordinators.oecsState,
        createdAt: coordinators.createdAt,
      })
      .from(coordinators)
      .where(eq(coordinators.id, coordinatorId))
      .limit(1);

    if (!coordinator) {
      res.status(404).json({ error: "Coordinator not found" });
      return;
    }

    res.json({ data: coordinator });
  } catch (err) {
    logger.error({ err }, "Failed to get coordinator profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// POST / — Create coordinator (admin only)
// ---------------------------------------------------------------------------
router.post(
  "/",
  authenticateCoordinator,
  requireRole("admin"),
  validate(createCoordinatorSchema),
  async (req, res) => {
    try {
      const { name, email, password, role, oecsState } = req.body;

      // Check for existing coordinator with this email
      const [existing] = await db
        .select({ id: coordinators.id })
        .from(coordinators)
        .where(eq(coordinators.email, email))
        .limit(1);

      if (existing) {
        res.status(409).json({ error: "Email already in use" });
        return;
      }

      const passwordHash = await hashPassword(password);

      const [coordinator] = await db
        .insert(coordinators)
        .values({
          name,
          email,
          passwordHash,
          role,
          oecsState: oecsState ?? null,
        })
        .returning({
          id: coordinators.id,
          name: coordinators.name,
          email: coordinators.email,
          role: coordinators.role,
          oecsState: coordinators.oecsState,
          createdAt: coordinators.createdAt,
        });

      logger.info(
        { coordinatorId: coordinator!.id, email, role, createdBy: req.coordinator!.id },
        "Coordinator created",
      );

      res.status(201).json({ data: coordinator });
    } catch (err) {
      logger.error({ err }, "Failed to create coordinator");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
