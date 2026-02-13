export type MessagePriority = "informational" | "action_required" | "urgent";

export interface Message {
  id: string;
  senderId: string;
  recipientId: string | null; // null = broadcast
  groupId: string | null;
  content: string;
  priority: MessagePriority;
  encrypted: boolean;
  channel: "data" | "mesh" | "sms";
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
}

export interface BroadcastMessage {
  id: string;
  senderId: string;
  senderRole: "coordinator";
  targetType: "all" | "country" | "status" | "group" | "individual";
  targetValue: string | null; // country code, status code, group id, or student id
  content: string;
  priority: MessagePriority;
  createdAt: string;
}

export interface QueuedMessage {
  id: string;
  payload: string;
  channel: "data" | "mesh" | "sms";
  priority: number; // lower = higher priority
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  lastAttemptAt: string | null;
}
