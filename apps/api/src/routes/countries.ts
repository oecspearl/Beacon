import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { countries, emergencyProtocols } from "../db/schema.js";
import { authenticateCoordinator } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { logger } from "../config/logger.js";

const router: RouterType = Router();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const updateCountrySchema = z.object({
  name: z.string().min(1).optional(),
  emergencyNumbers: z
    .object({
      police: z.string(),
      ambulance: z.string(),
      fire: z.string(),
      general: z.string().nullable(),
    })
    .optional(),
  mapBounds: z
    .object({
      north: z.number(),
      south: z.number(),
      east: z.number(),
      west: z.number(),
    })
    .optional(),
});

const updateProtocolSchema = z.object({
  version: z.number().int().positive().optional(),
  content: z.record(z.unknown()),
});

// ---------------------------------------------------------------------------
// GET / — List countries
// ---------------------------------------------------------------------------
router.get("/", authenticateCoordinator, async (_req, res) => {
  try {
    const result = await db
      .select()
      .from(countries)
      .orderBy(countries.name);

    res.json({ data: result });
  } catch (err) {
    logger.error({ err }, "Failed to list countries");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// GET /:code — Get country profile
// ---------------------------------------------------------------------------
router.get("/:code", authenticateCoordinator, async (req, res) => {
  try {
    const code = req.params.code as string;

    const [country] = await db
      .select()
      .from(countries)
      .where(eq(countries.code, code.toUpperCase()))
      .limit(1);

    if (!country) {
      res.status(404).json({ error: "Country not found" });
      return;
    }

    res.json({ data: country });
  } catch (err) {
    logger.error({ err, code: req.params.code }, "Failed to get country");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// PUT /:code — Update country profile
// ---------------------------------------------------------------------------
router.put(
  "/:code",
  authenticateCoordinator,
  validate(updateCountrySchema),
  async (req, res) => {
    try {
      const code = req.params.code as string;
      const updates = req.body;

      const [updated] = await db
        .update(countries)
        .set({ ...updates, lastUpdated: new Date() })
        .where(eq(countries.code, code.toUpperCase()))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Country not found" });
        return;
      }

      logger.info(
        { code: code.toUpperCase(), updatedBy: req.coordinator!.id },
        "Country profile updated",
      );

      res.json({ data: updated });
    } catch (err) {
      logger.error({ err, code: req.params.code }, "Failed to update country");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ---------------------------------------------------------------------------
// GET /:code/protocols — Get emergency protocols for country
// ---------------------------------------------------------------------------
router.get("/:code/protocols", authenticateCoordinator, async (req, res) => {
  try {
    const code = req.params.code as string;

    const protocols = await db
      .select()
      .from(emergencyProtocols)
      .where(eq(emergencyProtocols.countryCode, code.toUpperCase()))
      .orderBy(desc(emergencyProtocols.version));

    res.json({ data: protocols });
  } catch (err) {
    logger.error(
      { err, code: req.params.code },
      "Failed to get protocols",
    );
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// PUT /:code/protocols — Create or update protocol for country
// ---------------------------------------------------------------------------
router.put(
  "/:code/protocols",
  authenticateCoordinator,
  validate(updateProtocolSchema),
  async (req, res) => {
    try {
      const code = req.params.code as string;
      const { version, content } = req.body;

      // Verify country exists
      const [country] = await db
        .select({ code: countries.code })
        .from(countries)
        .where(eq(countries.code, code.toUpperCase()))
        .limit(1);

      if (!country) {
        res.status(404).json({ error: "Country not found" });
        return;
      }

      // Upsert: if a protocol with the same version exists, update it;
      // otherwise create a new one
      if (version) {
        const [existing] = await db
          .select()
          .from(emergencyProtocols)
          .where(eq(emergencyProtocols.countryCode, code.toUpperCase()))
          .orderBy(desc(emergencyProtocols.version))
          .limit(1);

        if (existing && existing.version === version) {
          const [updated] = await db
            .update(emergencyProtocols)
            .set({ content, lastUpdated: new Date() })
            .where(eq(emergencyProtocols.id, existing.id))
            .returning();

          logger.info(
            { code: code.toUpperCase(), version },
            "Emergency protocol updated",
          );

          res.json({ data: updated });
          return;
        }
      }

      // Determine next version number
      const [latest] = await db
        .select({ version: emergencyProtocols.version })
        .from(emergencyProtocols)
        .where(eq(emergencyProtocols.countryCode, code.toUpperCase()))
        .orderBy(desc(emergencyProtocols.version))
        .limit(1);

      const nextVersion = version ?? (latest ? latest.version + 1 : 1);

      const [protocol] = await db
        .insert(emergencyProtocols)
        .values({
          countryCode: code.toUpperCase(),
          version: nextVersion,
          content,
        })
        .returning();

      logger.info(
        { code: code.toUpperCase(), version: nextVersion },
        "Emergency protocol created",
      );

      res.status(201).json({ data: protocol });
    } catch (err) {
      logger.error(
        { err, code: req.params.code },
        "Failed to update protocol",
      );
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
