import * as SMS from "expo-sms";
import type { BeaconLocation } from "./location";
import type { StatusCode } from "../stores/app-store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SmsRecipient {
  label: string;
  phone: string;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Default coordination centre SMS number.
 * In production this comes from the country profile / registration data.
 */
const DEFAULT_COORDINATION_NUMBER = "+1234567890";

/**
 * Maximum SMS body length for a single segment.
 */
const MAX_SMS_LENGTH = 160;

// ---------------------------------------------------------------------------
// SMS encoding helpers
//
// These mirror the compact encoding from @beacon/protocol.
// Format: BCN|<type>|<student_id>|<lat>,<lon>|<timestamp>|<payload>
// ---------------------------------------------------------------------------

function encodeTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString(36);
}

function encodeCoordinates(location: BeaconLocation | null): string {
  if (!location) return "0,0";
  return `${location.latitude.toFixed(5)},${location.longitude.toFixed(5)}`;
}

function buildSmsBody(
  type: string,
  studentId: string,
  location: BeaconLocation | null,
  payload: string = "",
): string {
  const parts = [
    "BCN",
    type,
    studentId.substring(0, 8),
    encodeCoordinates(location),
    encodeTimestamp(),
  ];
  if (payload) parts.push(payload);
  const body = parts.join("|");
  return body.substring(0, MAX_SMS_LENGTH);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether SMS sending is available on this device.
 */
export async function isSmsAvailable(): Promise<boolean> {
  return SMS.isAvailableAsync();
}

/**
 * Send a status check-in via SMS.
 */
export async function sendStatusSMS(
  status: StatusCode,
  location: BeaconLocation | null,
  studentId: string = "UNKNOWN",
  recipients: SmsRecipient[] = [],
): Promise<boolean> {
  const available = await isSmsAvailable();
  if (!available) {
    console.warn("[SMS] SMS is not available on this device");
    return false;
  }

  const statusMap: Record<StatusCode, string> = {
    safe: "S",
    moving: "M",
    sheltering: "H",
    need_assistance: "A",
    urgent: "U",
    unknown: "X",
  };

  const body = buildSmsBody("CHK", studentId, location, statusMap[status]);

  const phones =
    recipients.length > 0
      ? recipients.map((r) => r.phone)
      : [DEFAULT_COORDINATION_NUMBER];

  try {
    const { result } = await SMS.sendSMSAsync(phones, body);
    return result === "sent";
  } catch (err) {
    console.error("[SMS] Failed to send status SMS:", err);
    return false;
  }
}

/**
 * Send a panic alert via SMS. This is a high-priority message.
 */
export async function sendPanicSMS(
  location: BeaconLocation | null,
  studentId: string = "UNKNOWN",
  recipients: SmsRecipient[] = [],
): Promise<boolean> {
  const available = await isSmsAvailable();
  if (!available) {
    console.warn("[SMS] SMS is not available on this device");
    return false;
  }

  const body = buildSmsBody("SOS", studentId, location, "PANIC");

  const phones =
    recipients.length > 0
      ? recipients.map((r) => r.phone)
      : [DEFAULT_COORDINATION_NUMBER];

  try {
    const { result } = await SMS.sendSMSAsync(phones, body);
    return result === "sent";
  } catch (err) {
    console.error("[SMS] Failed to send panic SMS:", err);
    return false;
  }
}

/**
 * Send a free-form message via SMS (used by the queue flush).
 */
export async function sendRawSMS(
  phone: string,
  message: string,
): Promise<boolean> {
  const available = await isSmsAvailable();
  if (!available) return false;

  try {
    const { result } = await SMS.sendSMSAsync([phone], message);
    return result === "sent";
  } catch (err) {
    console.error("[SMS] Failed to send raw SMS:", err);
    return false;
  }
}
