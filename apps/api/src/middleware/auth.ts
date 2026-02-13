import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";
import { db } from "../db/index.js";
import { coordinators } from "../db/schema.js";

export interface CoordinatorPayload {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      coordinator?: CoordinatorPayload;
    }
  }
}

export function authenticateCoordinator(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as CoordinatorPayload;
    req.coordinator = decoded;
    next();
  } catch (err) {
    logger.warn({ err }, "JWT verification failed");
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.coordinator) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!roles.includes(req.coordinator.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}

export async function resolveCoordinator(
  coordinatorId: string,
): Promise<typeof coordinators.$inferSelect | null> {
  const result = await db
    .select()
    .from(coordinators)
    .where(eq(coordinators.id, coordinatorId))
    .limit(1);

  return result[0] ?? null;
}
