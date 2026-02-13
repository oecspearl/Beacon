/**
 * Offline message queue.
 *
 * All outbound data is queued locally and flushed when a channel becomes available.
 * Priority order: panic alerts > status updates > messages > telemetry.
 */

export interface QueueEntry {
  id: string;
  priority: QueuePriority;
  channel: "data" | "mesh" | "sms" | "any";
  payload: string;
  createdAt: number;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt: number | null;
}

export enum QueuePriority {
  PANIC = 0,
  STATUS = 1,
  CHECKIN = 2,
  MESSAGE = 3,
  TELEMETRY = 4,
}

export function sortByPriority(entries: QueueEntry[]): QueueEntry[] {
  return [...entries].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.createdAt - b.createdAt; // FIFO within same priority
  });
}

export function shouldRetry(entry: QueueEntry): boolean {
  return entry.attempts < entry.maxAttempts;
}

export function createQueueEntry(
  priority: QueuePriority,
  payload: string,
  channel: QueueEntry["channel"] = "any",
  maxAttempts: number = 10
): QueueEntry {
  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    priority,
    channel,
    payload,
    createdAt: Date.now(),
    attempts: 0,
    maxAttempts,
    lastAttemptAt: null,
  };
}
