import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";
import * as schema from "./schema.js";

const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  logger.error({ err }, "Unexpected error on idle database client");
});

pool.on("connect", () => {
  logger.debug("New database client connected");
});

export const db = drizzle(pool, { schema });

export { pool };
