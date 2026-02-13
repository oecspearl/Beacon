export type StatusCode = "OK" | "MV" | "NA" | "UR" | "DT" | "MED";

export interface StudentStatus {
  studentId: string;
  status: StatusCode;
  latitude: number;
  longitude: number;
  timestamp: string;
  batteryLevel: number;
  channel: CommunicationChannel;
  groupId: string | null;
}

export type CommunicationChannel = "data" | "mesh" | "sms" | "satellite";

export type DashboardStatus =
  | "safe"
  | "moving"
  | "assistance"
  | "urgent"
  | "overdue"
  | "lost";

export const STATUS_CODE_TO_DASHBOARD: Record<StatusCode, DashboardStatus> = {
  OK: "safe",
  MV: "moving",
  NA: "assistance",
  UR: "urgent",
  DT: "urgent",
  MED: "urgent",
};

export const STATUS_LABELS: Record<StatusCode, string> = {
  OK: "Safe",
  MV: "Moving",
  NA: "Need Assistance",
  UR: "Urgent",
  DT: "Detained",
  MED: "Medical Emergency",
};

export const DASHBOARD_STATUS_COLORS: Record<DashboardStatus, string> = {
  safe: "#22c55e",
  moving: "#f59e0b",
  assistance: "#f97316",
  urgent: "#ef4444",
  overdue: "#6b7280",
  lost: "#111827",
};
