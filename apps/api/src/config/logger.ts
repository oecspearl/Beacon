import pino from "pino";
import { config } from "./env.js";

const transport =
  config.NODE_ENV === "development"
    ? pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      })
    : undefined;

export const logger = pino(
  {
    level: config.LOG_LEVEL,
    ...(config.NODE_ENV === "production" && {
      formatters: {
        level(label: string) {
          return { level: label };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    }),
  },
  transport,
);
