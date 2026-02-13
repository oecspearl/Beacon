import type { StatusCode } from "@beacon/shared";

/**
 * SMS Encoding Format:
 * BCN|<student_id>|<lat>,<lon>|<status_code>|<timestamp>
 *
 * Example: BCN|a1b2c3d4|18.0425,-63.0548|OK|1707840000
 *
 * Must fit within 160 characters (single SMS).
 */

export interface SMSPayload {
  studentId: string;
  latitude: number;
  longitude: number;
  status: StatusCode;
  timestamp: Date;
}

const PREFIX = "BCN";
const SEPARATOR = "|";

export function encodeSMS(payload: SMSPayload): string {
  const shortId = payload.studentId.slice(0, 8);
  const lat = payload.latitude.toFixed(4);
  const lon = payload.longitude.toFixed(4);
  const ts = Math.floor(payload.timestamp.getTime() / 1000).toString(36); // base36 for compactness

  const message = [PREFIX, shortId, `${lat},${lon}`, payload.status, ts].join(
    SEPARATOR
  );

  if (message.length > 160) {
    throw new Error(
      `SMS payload exceeds 160 characters: ${message.length} chars`
    );
  }

  return message;
}

export function isBeaconSMS(message: string): boolean {
  return message.startsWith(PREFIX + SEPARATOR);
}
