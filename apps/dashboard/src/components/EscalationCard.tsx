import {
  AlertTriangle,
  AlertOctagon,
  Clock,
  CheckCircle2,
  Eye,
} from "lucide-react";
import type { Escalation } from "@/stores/dashboard-store";

interface EscalationCardProps {
  escalation: Escalation;
  onAcknowledge?: (id: string) => void;
  onResolve?: (id: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  missed_checkin: "Missed Check-in",
  sos_triggered: "SOS Triggered",
  battery_critical: "Battery Critical",
  geofence_breach: "Geofence Breach",
  lost_contact: "Lost Contact",
};

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function EscalationCard({
  escalation,
  onAcknowledge,
  onResolve,
}: EscalationCardProps) {
  const isCritical = escalation.severity === "critical";

  return (
    <div
      className={`beacon-card relative overflow-hidden ${
        escalation.resolved
          ? "opacity-60"
          : isCritical
            ? "border-red-500/50"
            : "border-amber-500/50"
      }`}
    >
      {/* Severity stripe */}
      <div
        className={`absolute left-0 top-0 h-full w-1 ${
          isCritical ? "bg-red-500" : "bg-amber-500"
        }`}
      />

      <div className="pl-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {isCritical ? (
              <AlertOctagon className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            )}

            <div className="min-w-0">
              <p className="font-medium text-slate-100">
                {escalation.studentName}
              </p>
              <p
                className={`text-sm font-medium ${
                  isCritical ? "text-red-400" : "text-amber-400"
                }`}
              >
                {TYPE_LABELS[escalation.type] ?? escalation.type}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {escalation.message}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            {timeAgo(escalation.createdAt)}
          </div>
        </div>

        {escalation.actionsTaken.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {escalation.actionsTaken.map((action, i) => (
              <span
                key={i}
                className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-400"
              >
                {action}
              </span>
            ))}
          </div>
        )}

        {!escalation.resolved && (
          <div className="mt-3 flex gap-2">
            {!escalation.acknowledged && (
              <button
                onClick={() => onAcknowledge?.(escalation.id)}
                className="beacon-btn-secondary text-xs"
              >
                <Eye className="h-3.5 w-3.5" />
                Acknowledge
              </button>
            )}
            <button
              onClick={() => onResolve?.(escalation.id)}
              className="beacon-btn-secondary text-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Resolve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
