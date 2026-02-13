export interface Coordinator {
  id: string;
  name: string;
  email: string;
  role: "admin" | "coordinator" | "observer";
  oecsState: string | null; // null = regional coordinator
  countries: string[]; // assigned countries
  createdAt: string;
}

export interface EscalationEvent {
  id: string;
  studentId: string;
  type:
    | "missed_checkin"
    | "panic_activated"
    | "high_risk_zone"
    | "battery_critical"
    | "prolonged_absence";
  severity: "warning" | "critical";
  description: string;
  createdAt: string;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  actions: EscalationAction[];
}

export interface EscalationAction {
  type: "auto_outreach" | "sms_sent" | "email_sent" | "coordinator_notified" | "manual_note";
  description: string;
  timestamp: string;
  performedBy: string | null; // null = automated
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorType: "student" | "coordinator" | "system";
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface RemoteWipeCommand {
  id: string;
  studentId: string;
  issuedBy: string;
  issuedAt: string;
  executedAt: string | null;
  confirmedAt: string | null;
}
