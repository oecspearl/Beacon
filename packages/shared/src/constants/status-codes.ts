import type { StatusCode } from "../types/status.js";

export const STATUS_CODES: StatusCode[] = ["OK", "MV", "NA", "UR", "DT", "MED"];

export const STATUS_PRIORITY: Record<StatusCode, number> = {
  UR: 0,
  MED: 1,
  DT: 2,
  NA: 3,
  MV: 4,
  OK: 5,
};

export const CHECK_IN_INTERVAL_NORMAL = 360; // 6 hours in minutes
export const CHECK_IN_INTERVAL_CRISIS = 60; // 1 hour in minutes
export const MISSED_CHECKIN_THRESHOLD = 2;
export const BATTERY_CRITICAL_THRESHOLD = 10; // percent
