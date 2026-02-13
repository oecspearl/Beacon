export type CheckInResponse = "safe" | "moving" | "need_assistance" | "urgent";

export interface CheckIn {
  id: string;
  studentId: string;
  response: CheckInResponse;
  latitude: number | null;
  longitude: number | null;
  timestamp: string;
  channel: "data" | "mesh" | "sms";
}

export interface CheckInSchedule {
  intervalMinutes: number; // default 360 (6 hours) normal, 60 crisis
  mode: "normal" | "crisis";
  lastCheckInAt: string | null;
  nextCheckInAt: string;
  missedCount: number;
  escalated: boolean;
}
