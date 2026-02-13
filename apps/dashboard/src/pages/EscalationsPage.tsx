import { useState, useMemo } from "react";
import {
  AlertTriangle,
  Filter,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import {
  useDashboardStore,
  type Escalation,
  type EscalationType,
  type EscalationSeverity,
} from "@/stores/dashboard-store";
import EscalationCard from "@/components/EscalationCard";

const SAMPLE_ESCALATIONS: Escalation[] = [
  {
    id: "e1",
    studentId: "s2",
    studentName: "Marcus Williams",
    type: "battery_critical",
    severity: "critical",
    message: "Battery level dropped to 5%. Last known location: Roseau harbour, Dominica.",
    createdAt: new Date(Date.now() - 300000).toISOString(),
    acknowledged: false,
    resolved: false,
    actionsTaken: [],
  },
  {
    id: "e2",
    studentId: "s6",
    studentName: "Ryan Thomas",
    type: "missed_checkin",
    severity: "warning",
    message: "Missed scheduled check-in. 2 hours overdue. Last seen in St. John's, Antigua.",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    acknowledged: true,
    resolved: false,
    actionsTaken: ["SMS sent", "Email sent"],
  },
  {
    id: "e3",
    studentId: "s8",
    studentName: "Andre Charles",
    type: "sos_triggered",
    severity: "critical",
    message: "SOS button pressed. Student reported needing assistance with directions near Kingstown.",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    acknowledged: true,
    resolved: false,
    actionsTaken: ["Message sent", "Local contact notified"],
  },
  {
    id: "e4",
    studentId: "s12",
    studentName: "Brandon Martin",
    type: "lost_contact",
    severity: "critical",
    message: "No contact for 24 hours. Device appears offline. Last known location: Roseau, Dominica.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    acknowledged: true,
    resolved: false,
    actionsTaken: ["SMS sent", "Email sent", "Emergency contact notified", "Local authorities contacted"],
  },
  {
    id: "e5",
    studentId: "s9",
    studentName: "Shanice George",
    type: "geofence_breach",
    severity: "warning",
    message: "Student left designated safe zone. Moving away from registered accommodation area.",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    acknowledged: true,
    resolved: true,
    actionsTaken: ["Contacted student", "Confirmed safe"],
  },
  {
    id: "e6",
    studentId: "s4",
    studentName: "Devon Clarke",
    type: "missed_checkin",
    severity: "warning",
    message: "Missed evening check-in window by 45 minutes.",
    createdAt: new Date(Date.now() - 5400000).toISOString(),
    acknowledged: true,
    resolved: true,
    actionsTaken: ["Student responded to SMS"],
  },
];

type FilterType = EscalationType | "all";
type FilterSeverity = EscalationSeverity | "all";
type FilterStatus = "active" | "acknowledged" | "resolved" | "all";

export default function EscalationsPage() {
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [severityFilter, setSeverityFilter] = useState<FilterSeverity>("all");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("active");

  const storeEscalations = useDashboardStore((s) => s.escalations);
  const { acknowledgeEscalation, resolveEscalation } = useDashboardStore();

  const escalations =
    storeEscalations.length > 0 ? storeEscalations : SAMPLE_ESCALATIONS;

  const filtered = useMemo(() => {
    return escalations.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (severityFilter !== "all" && e.severity !== severityFilter) return false;
      if (statusFilter === "active" && e.resolved) return false;
      if (statusFilter === "acknowledged" && (!e.acknowledged || e.resolved))
        return false;
      if (statusFilter === "resolved" && !e.resolved) return false;
      return true;
    });
  }, [escalations, typeFilter, severityFilter, statusFilter]);

  const activeCount = escalations.filter((e) => !e.resolved).length;
  const criticalCount = escalations.filter(
    (e) => !e.resolved && e.severity === "critical"
  ).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Escalations</h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor and manage student safety escalations
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-red-500/15 px-3 py-1.5">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">
              {criticalCount} Critical
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/15 px-3 py-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">
              {activeCount} Active
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Filter className="h-4 w-4" />
          <span>Filters:</span>
        </div>

        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as FilterType)}
            className="beacon-input appearance-none pr-8 text-sm"
          >
            <option value="all">All Types</option>
            <option value="missed_checkin">Missed Check-in</option>
            <option value="sos_triggered">SOS Triggered</option>
            <option value="battery_critical">Battery Critical</option>
            <option value="geofence_breach">Geofence Breach</option>
            <option value="lost_contact">Lost Contact</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>

        <div className="relative">
          <select
            value={severityFilter}
            onChange={(e) =>
              setSeverityFilter(e.target.value as FilterSeverity)
            }
            className="beacon-input appearance-none pr-8 text-sm"
          >
            <option value="all">All Severities</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="beacon-input appearance-none pr-8 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>

        <span className="text-xs text-slate-500">
          {filtered.length} escalation{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Escalation list */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((esc) => (
            <EscalationCard
              key={esc.id}
              escalation={esc}
              onAcknowledge={acknowledgeEscalation}
              onResolve={resolveEscalation}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-slate-600" />
          <p className="text-sm text-slate-500">
            No escalations match your current filters.
          </p>
        </div>
      )}
    </div>
  );
}
