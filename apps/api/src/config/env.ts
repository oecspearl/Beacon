import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(8, "JWT_SECRET must be at least 8 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173")
    .transform((val) =>
      val
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),

  // SMS Gateway (Twilio)
  SMS_GATEWAY_SID: z.string().optional(),
  SMS_GATEWAY_AUTH_TOKEN: z.string().optional(),
  SMS_GATEWAY_PHONE_NUMBER: z.string().optional(),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.format();
    const messages = Object.entries(formatted)
      .filter(([key]) => key !== "_errors")
      .map(([key, value]) => {
        const errors = (value as { _errors: string[] })._errors;
        return `  ${key}: ${errors.join(", ")}`;
      })
      .join("\n");

    console.error("Invalid environment variables:\n" + messages);
    process.exit(1);
  }

  return result.data;
}

export const config = loadConfig();
export type Config = z.infer<typeof envSchema>;
