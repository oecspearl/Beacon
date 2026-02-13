import { getDatabase } from "./database";
import { postPanicAlert, postCheckIn, postStatusUpdate, postMessage } from "./api-client";
import { sendRawSMS } from "./sms";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Default SMS number for queue-based SMS fallback delivery. */
const DEFAULT_COORDINATION_SMS = "+1234567890";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QueueChannel = "data" | "mesh" | "sms";

export type QueueStatus = "pending" | "sending" | "sent" | "failed";

export interface QueueItem {
  id: number;
  type: string;
  payload: string;
  priority: number;
  channel: QueueChannel;
  attempts: number;
  maxAttempts: number;
  status: QueueStatus;
  createdAt: string;
  lastAttemptAt: string | null;
}

// ---------------------------------------------------------------------------
// Core operations
// ---------------------------------------------------------------------------

/**
 * Add a message to the offline queue.
 *
 * @param payload   - JSON-encoded message payload
 * @param priority  - 0 (lowest) to 10 (highest, e.g. SOS)
 * @param channel   - Preferred outbound channel
 * @param type      - Message type identifier (e.g. "checkin", "sos", "message")
 */
export async function enqueue(
  payload: string,
  priority: number = 0,
  channel: QueueChannel = "data",
  type: string = "message",
): Promise<number> {
  const db = await getDatabase();

  const result = await db.runAsync(
    `INSERT INTO queue (type, payload, priority, channel, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [type, payload, priority, channel],
  );

  console.log(`[Queue] Enqueued item #${result.lastInsertRowId} (${type}, priority=${priority}, channel=${channel})`);
  return result.lastInsertRowId;
}

/**
 * Attempt to flush all pending messages from the queue.
 * Processes items in priority-descending, creation-ascending order.
 *
 * Returns the number of successfully sent items.
 */
export async function flush(): Promise<number> {
  const db = await getDatabase();

  // Fetch all pending items ordered by priority (highest first)
  const items = await db.getAllAsync(
    `SELECT * FROM queue
     WHERE status = 'pending' AND attempts < max_attempts
     ORDER BY priority DESC, created_at ASC`,
  );

  let sentCount = 0;

  for (const raw of items as Array<Record<string, unknown>>) {
    const item: QueueItem = mapRow(raw);

    // Mark as sending
    await db.runAsync(
      `UPDATE queue SET status = 'sending', last_attempt_at = datetime('now'), attempts = attempts + 1
       WHERE id = ?`,
      [item.id],
    );

    try {
      const success = await sendItem(item);

      if (success) {
        await db.runAsync(
          `UPDATE queue SET status = 'sent' WHERE id = ?`,
          [item.id],
        );
        sentCount++;
      } else {
        // Check if we've exceeded max attempts
        const newAttempts = item.attempts + 1;
        const newStatus = newAttempts >= item.maxAttempts ? "failed" : "pending";
        await db.runAsync(
          `UPDATE queue SET status = ? WHERE id = ?`,
          [newStatus, item.id],
        );
      }
    } catch (err) {
      console.error(`[Queue] Error sending item #${item.id}:`, err);
      const newAttempts = item.attempts + 1;
      const newStatus = newAttempts >= item.maxAttempts ? "failed" : "pending";
      await db.runAsync(
        `UPDATE queue SET status = ? WHERE id = ?`,
        [newStatus, item.id],
      );
    }
  }

  if (sentCount > 0) {
    console.log(`[Queue] Flushed ${sentCount}/${(items as unknown[]).length} items`);
  }

  return sentCount;
}

/**
 * Get the count of items in each status.
 */
export async function getQueueSize(): Promise<{
  pending: number;
  sending: number;
  sent: number;
  failed: number;
  total: number;
}> {
  const db = await getDatabase();

  const rows = await db.getAllAsync(
    `SELECT status, COUNT(*) as count FROM queue GROUP BY status`,
  );

  const counts = { pending: 0, sending: 0, sent: 0, failed: 0, total: 0 };

  for (const row of rows as Array<{ status: string; count: number }>) {
    const status = row.status as QueueStatus;
    if (status in counts) {
      counts[status] = row.count;
    }
    counts.total += row.count;
  }

  return counts;
}

/**
 * Remove all sent items from the queue (cleanup).
 */
export async function purgeSent(): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(`DELETE FROM queue WHERE status = 'sent'`);
  return result.changes;
}

/**
 * Retry all failed items by resetting their status to pending.
 */
export async function retryFailed(): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `UPDATE queue SET status = 'pending', attempts = 0 WHERE status = 'failed'`,
  );
  return result.changes;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function mapRow(raw: Record<string, unknown>): QueueItem {
  return {
    id: raw.id as number,
    type: raw.type as string,
    payload: raw.payload as string,
    priority: raw.priority as number,
    channel: raw.channel as QueueChannel,
    attempts: raw.attempts as number,
    maxAttempts: raw.max_attempts as number,
    status: raw.status as QueueStatus,
    createdAt: raw.created_at as string,
    lastAttemptAt: raw.last_attempt_at as string | null,
  };
}

/**
 * Attempt to actually send a queue item via its designated channel.
 *
 * Dispatches to the appropriate transport:
 * - data: HTTP POST to the coordination API (routed by payload type)
 * - mesh: BLE broadcast to nearby peers (not yet implemented)
 * - sms: SMS via expo-sms to the coordination number
 */
async function sendItem(item: QueueItem): Promise<boolean> {
  switch (item.channel) {
    case "data": {
      console.log(`[Queue] Sending item #${item.id} via data channel`);
      try {
        const payload = JSON.parse(item.payload);
        const type = (payload.type ?? item.type ?? "").toUpperCase();

        let result: unknown | null = null;
        if (type === "SOS" || type === "PANIC") {
          result = await postPanicAlert(payload);
        } else if (type === "CHECKIN" || type === "CHK") {
          result = await postCheckIn(payload);
        } else if (type === "STATUS") {
          result = await postStatusUpdate(payload);
        } else {
          result = await postMessage(payload);
        }

        return result !== null;
      } catch (err) {
        console.error(`[Queue] Data channel send failed for item #${item.id}:`, err);
        return false;
      }
    }

    case "sms": {
      console.log(`[Queue] Sending item #${item.id} via SMS channel`);
      try {
        return await sendRawSMS(DEFAULT_COORDINATION_SMS, item.payload);
      } catch (err) {
        console.error(`[Queue] SMS channel send failed for item #${item.id}:`, err);
        return false;
      }
    }

    case "mesh":
      // TODO: Implement BLE mesh broadcast when hardware layer is ready
      console.log(`[Queue] Sending item #${item.id} via mesh channel (not yet implemented)`);
      return false;

    default:
      console.warn(`[Queue] Unknown channel: ${item.channel}`);
      return false;
  }
}
