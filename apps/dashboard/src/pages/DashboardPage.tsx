import {
  Users,
  ShieldCheck,
  MoveRight,
  HandHelping,
  Siren,
  Clock,
  AlertTriangle,
  Activity,
  Globe,
  UserCheck,
  MessageCircle,
  AlertOctagon,
  Info,
} from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import type { ActivityItem } from "@/stores/dashboard-store";
import StatsCard from "@/components/StatsCard";
import EscalationCard from "@/components/EscalationCard";

// Sample data for display when server data is not yet loaded
const SAMPLE_STATS = {
  total: 247,
  safe: 189,
  moving: 23,
  assistance: 8,
  urgent: 3,
  overdue: 24,
};

const SAMPLE_ACTIVITIES: ActivityItem[] = [
  {
    id: "a1",
    type: "check_in",
    studentName: "Amara Joseph",
    description: "Checked in from Roseau, Dominica",
    timestamp: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: "a2",
    type: "escalation",
    studentName: "Marcus Williams",
    description: "SOS triggered - Battery critical (5%)",
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: "a3",
    type: "status_change",
    studentName: "Keisha Brown",
    description: "Status changed from Moving to Safe",
    timestamp: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: "a4",
    type: "check_in",
    studentName: "Devon Clarke",
    description: "Checked in from Castries, St. Lucia",
    timestamp: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: "a5",
    type: "message",
    studentName: "Tricia James",
    description: "Sent message: 'Arrived at accommodation safely'",
    timestamp: new Date(Date.now() - 1500000).toISOString(),
  },
  {
    id: "a6",
    type: "system",
    description: "Check-in window opened for Grenada cohort",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "a7",
    type: "escalation",
    studentName: "Ryan Thomas",
    description: "Missed scheduled check-in (2h overdue)",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];

const COUNTRY_DATA = [
  { country: "Dominica", count: 62, flag: "DM" },
  { country: "St. Lucia", count: 54, flag: "LC" },
  { country: "Antigua & Barbuda", count: 41, flag: "AG" },
  { country: "Grenada", count: 38, flag: "GD" },
  { country: "St. Kitts & Nevis", count: 29, flag: "KN" },
  { country: "St. Vincent", count: 23, flag: "VC" },
];

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ACTIVITY_ICONS: Record<string, typeof Activity> = {
  check_in: UserCheck,
  status_change: Activity,
  escalation: AlertTriangle,
  message: MessageCircle,
  system: Info,
};

const ACTIVITY_COLORS: Record<string, string> = {
  check_in: "text-emerald-400",
  status_change: "text-blue-400",
  escalation: "text-red-400",
  message: "text-beacon-400",
  system: "text-slate-400",
};

export default function DashboardPage() {
  const { stats, escalations, activities, acknowledgeEscalation, resolveEscalation } =
    useDashboardStore();

  // Use sample data if store is empty (no server connection)
  const displayStats = stats.total > 0 ? stats : SAMPLE_STATS;
  const displayActivities = activities.length > 0 ? activities : SAMPLE_ACTIVITIES;
  const activeEscalations = escalations.filter((e) => !e.resolved);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Student safety overview and coordination centre
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard
          icon={Users}
          label="Total Students"
          value={displayStats.total}
          color="blue"
        />
        <StatsCard
          icon={ShieldCheck}
          label="Safe"
          value={displayStats.safe}
          color="green"
        />
        <StatsCard
          icon={MoveRight}
          label="Moving"
          value={displayStats.moving}
          color="amber"
        />
        <StatsCard
          icon={HandHelping}
          label="Need Assistance"
          value={displayStats.assistance}
          color="orange"
        />
        <StatsCard
          icon={Siren}
          label="Urgent"
          value={displayStats.urgent}
          color="red"
        />
        <StatsCard
          icon={Clock}
          label="Overdue Check-ins"
          value={displayStats.overdue}
          color="gray"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity feed */}
        <div className="lg:col-span-2">
          <div className="beacon-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">
                Recent Activity
              </h2>
              <span className="text-xs text-slate-500">Live</span>
            </div>

            <div className="space-y-1">
              {displayActivities.slice(0, 10).map((activity) => {
                const Icon = ACTIVITY_ICONS[activity.type] ?? Activity;
                const colorClass = ACTIVITY_COLORS[activity.type] ?? "text-slate-400";

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-700/30"
                  >
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${colorClass}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-200">
                        {activity.studentName && (
                          <span className="font-medium">
                            {activity.studentName}
                          </span>
                        )}{" "}
                        {activity.description}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-500">
                      {timeAgo(activity.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Escalations + Countries */}
        <div className="space-y-6">
          {/* Active Escalations */}
          <div className="beacon-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                <AlertOctagon className="h-5 w-5 text-red-400" />
                Active Escalations
              </h2>
              <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">
                {activeEscalations.length}
              </span>
            </div>

            {activeEscalations.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">
                No active escalations
              </p>
            ) : (
              <div className="space-y-3">
                {activeEscalations.slice(0, 3).map((esc) => (
                  <EscalationCard
                    key={esc.id}
                    escalation={esc}
                    onAcknowledge={acknowledgeEscalation}
                    onResolve={resolveEscalation}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Countries overview */}
          <div className="beacon-card">
            <div className="mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-beacon-400" />
              <h2 className="text-lg font-semibold text-slate-100">
                Countries
              </h2>
            </div>

            <div className="space-y-2">
              {COUNTRY_DATA.map((c) => (
                <div
                  key={c.country}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-700/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-700 text-xs font-bold text-slate-300">
                      {c.flag}
                    </span>
                    <span className="text-sm font-medium text-slate-200">
                      {c.country}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-slate-300">
                    {c.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
