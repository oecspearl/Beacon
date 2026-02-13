import { config } from "../config/env.js";
import { logger } from "../config/logger.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

type BroadcastPriority = "informational" | "action_required" | "urgent";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasCredentials(): boolean {
  return !!(
    config.SMS_GATEWAY_SID &&
    config.SMS_GATEWAY_AUTH_TOKEN &&
    config.SMS_GATEWAY_PHONE_NUMBER
  );
}

const PRIORITY_TAGS: Record<BroadcastPriority, string> = {
  urgent: "[URGENT]",
  action_required: "[ACTION]",
  informational: "[INFO]",
};

// ---------------------------------------------------------------------------
// sendSMS — Send a single SMS via Twilio REST API
// ---------------------------------------------------------------------------

export async function sendSMS(to: string, body: string): Promise<SMSResult> {
  if (!hasCredentials()) {
    logger.warn(
      "SMS gateway credentials not configured — skipping SMS send",
    );
    return { success: false, error: "SMS gateway credentials not configured" };
  }

  const sid = config.SMS_GATEWAY_SID!;
  const authToken = config.SMS_GATEWAY_AUTH_TOKEN!;
  const from = config.SMS_GATEWAY_PHONE_NUMBER!;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const credentials = Buffer.from(`${sid}:${authToken}`).toString("base64");

  const params = new URLSearchParams();
  params.append("To", to);
  params.append("From", from);
  params.append("Body", body);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      const errorMessage =
        (data.message as string) ?? `Twilio API error: ${response.status}`;
      logger.error(
        { to, status: response.status, twilioError: data },
        "Failed to send SMS via Twilio",
      );
      return { success: false, error: errorMessage };
    }

    const messageId = data.sid as string;
    logger.info({ to, messageId }, "SMS sent successfully");
    return { success: true, messageId };
  } catch (err) {
    logger.error({ err, to }, "SMS send request failed");
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// sendBulkSMS — Send the same message to multiple recipients
// ---------------------------------------------------------------------------

export async function sendBulkSMS(
  recipients: string[],
  body: string,
): Promise<SMSResult[]> {
  logger.info(
    { recipientCount: recipients.length },
    "Sending bulk SMS",
  );

  const results = await Promise.all(
    recipients.map((to) => sendSMS(to, body)),
  );

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.length - succeeded;
  logger.info({ succeeded, failed, total: results.length }, "Bulk SMS complete");

  return results;
}

// ---------------------------------------------------------------------------
// sendBeaconAlert — Send a Beacon-formatted alert to a specific phone
// ---------------------------------------------------------------------------

export async function sendBeaconAlert(
  studentId: string,
  status: string,
  coordinates: { latitude: number; longitude: number },
  phone: string,
): Promise<SMSResult> {
  const timestamp = new Date().toISOString();
  const body = `BEACON ALERT: Student ${studentId} reported ${status} at ${coordinates.latitude},${coordinates.longitude} on ${timestamp}`;

  logger.info(
    { studentId, status, phone },
    "Sending Beacon alert SMS",
  );

  return sendSMS(phone, body);
}

// ---------------------------------------------------------------------------
// broadcastToStudents — Send a priority-tagged broadcast to multiple students
// ---------------------------------------------------------------------------

export async function broadcastToStudents(
  phones: string[],
  message: string,
  priority: BroadcastPriority,
): Promise<SMSResult[]> {
  const tag = PRIORITY_TAGS[priority];
  const body = `${tag} ${message}`;

  logger.info(
    { recipientCount: phones.length, priority },
    "Broadcasting SMS to students",
  );

  return sendBulkSMS(phones, body);
}
