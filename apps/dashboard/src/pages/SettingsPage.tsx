import { useState } from "react";
import {
  Clock,
  Shield,
  Smartphone,
  Users,
  Save,
  Plus,
  Trash2,
  Mail,
  Globe,
} from "lucide-react";
import { useDashboardStore, type OperationMode } from "@/stores/dashboard-store";

interface Coordinator {
  id: string;
  name: string;
  email: string;
  role: "admin" | "coordinator" | "viewer";
}

const SAMPLE_COORDINATORS: Coordinator[] = [
  { id: "co1", name: "Dr. Sandra Mitchell", email: "s.mitchell@uwi.edu", role: "admin" },
  { id: "co2", name: "Prof. James Phillip", email: "j.phillip@uwi.edu", role: "coordinator" },
  { id: "co3", name: "Maria Garcia", email: "m.garcia@uwi.edu", role: "coordinator" },
  { id: "co4", name: "Thomas Williams", email: "t.williams@uwi.edu", role: "viewer" },
];

export default function SettingsPage() {
  const { operationMode, setOperationMode } = useDashboardStore();

  const [checkinInterval, setCheckinInterval] = useState("6");
  const [checkinWindowMinutes, setCheckinWindowMinutes] = useState("30");
  const [smsGatewayUrl, setSmsGatewayUrl] = useState("https://api.twilio.com/2010-04-01");
  const [smsApiKey, setSmsApiKey] = useState("");
  const [smsSenderId, setSmsSenderId] = useState("BEACON");
  const [coordinators, setCoordinators] = useState<Coordinator[]>(SAMPLE_COORDINATORS);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    console.log("Settings saved:", {
      checkinInterval,
      checkinWindowMinutes,
      operationMode,
      smsGatewayUrl,
      smsApiKey,
      smsSenderId,
    });
  }

  function removeCoordinator(id: string) {
    setCoordinators((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
          <p className="mt-1 text-sm text-slate-400">
            Configure system parameters and coordinator access
          </p>
        </div>
        <button onClick={handleSave} className="beacon-btn-primary">
          <Save className="h-4 w-4" />
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Check-in Configuration */}
        <div className="beacon-card space-y-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-beacon-600/15 p-2.5">
              <Clock className="h-5 w-5 text-beacon-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-100">Check-in Configuration</h2>
              <p className="text-sm text-slate-400">
                Set how often students must check in
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Check-in Interval (hours)
              </label>
              <select
                value={checkinInterval}
                onChange={(e) => setCheckinInterval(e.target.value)}
                className="beacon-input"
              >
                <option value="1">Every 1 hour</option>
                <option value="2">Every 2 hours</option>
                <option value="4">Every 4 hours</option>
                <option value="6">Every 6 hours</option>
                <option value="8">Every 8 hours</option>
                <option value="12">Every 12 hours</option>
                <option value="24">Every 24 hours</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Check-in Window (minutes)
              </label>
              <input
                type="number"
                value={checkinWindowMinutes}
                onChange={(e) => setCheckinWindowMinutes(e.target.value)}
                min="5"
                max="120"
                className="beacon-input"
              />
              <p className="mt-1 text-xs text-slate-500">
                Grace period before a check-in is marked as overdue.
              </p>
            </div>
          </div>
        </div>

        {/* Operation Mode */}
        <div className="beacon-card space-y-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-beacon-600/15 p-2.5">
              <Shield className="h-5 w-5 text-beacon-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-100">Operation Mode</h2>
              <p className="text-sm text-slate-400">
                Set the current operational alert level
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {(
              [
                {
                  mode: "normal" as OperationMode,
                  label: "Normal",
                  description: "Standard monitoring. Regular check-in intervals.",
                  color: "border-emerald-500/50 bg-emerald-500/5",
                  activeColor: "border-emerald-500 bg-emerald-500/15",
                  dot: "bg-emerald-400",
                },
                {
                  mode: "alert" as OperationMode,
                  label: "Alert",
                  description: "Heightened awareness. Increased check-in frequency. Weather warnings or regional advisories active.",
                  color: "border-amber-500/50 bg-amber-500/5",
                  activeColor: "border-amber-500 bg-amber-500/15",
                  dot: "bg-amber-400",
                },
                {
                  mode: "crisis" as OperationMode,
                  label: "Crisis",
                  description: "Emergency mode. Maximum check-in frequency. All coordinators notified. Escalation protocols active.",
                  color: "border-red-500/50 bg-red-500/5",
                  activeColor: "border-red-500 bg-red-500/15",
                  dot: "bg-red-400",
                },
              ]
            ).map((item) => (
              <button
                key={item.mode}
                onClick={() => setOperationMode(item.mode)}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  operationMode === item.mode ? item.activeColor : item.color
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                  <span className="text-sm font-semibold text-slate-200">
                    {item.label}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* SMS Gateway */}
        <div className="beacon-card space-y-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-beacon-600/15 p-2.5">
              <Smartphone className="h-5 w-5 text-beacon-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-100">SMS Gateway</h2>
              <p className="text-sm text-slate-400">
                Configure SMS delivery for notifications and check-ins
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Gateway URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  value={smsGatewayUrl}
                  onChange={(e) => setSmsGatewayUrl(e.target.value)}
                  className="beacon-input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                API Key
              </label>
              <input
                type="password"
                value={smsApiKey}
                onChange={(e) => setSmsApiKey(e.target.value)}
                placeholder="Enter API key"
                className="beacon-input"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Sender ID
              </label>
              <input
                type="text"
                value={smsSenderId}
                onChange={(e) => setSmsSenderId(e.target.value)}
                className="beacon-input"
              />
              <p className="mt-1 text-xs text-slate-500">
                Alphanumeric sender ID displayed on student devices.
              </p>
            </div>
          </div>
        </div>

        {/* Coordinator Management */}
        <div className="beacon-card space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-beacon-600/15 p-2.5">
                <Users className="h-5 w-5 text-beacon-400" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-100">Coordinators</h2>
                <p className="text-sm text-slate-400">
                  Manage dashboard access
                </p>
              </div>
            </div>
            <button className="beacon-btn-secondary text-xs">
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>

          <div className="space-y-2">
            {coordinators.map((coord) => (
              <div
                key={coord.id}
                className="flex items-center justify-between rounded-lg bg-slate-700/30 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-600 text-xs font-bold text-slate-300">
                    {coord.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {coord.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Mail className="h-3 w-3" />
                      {coord.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      coord.role === "admin"
                        ? "bg-beacon-600/15 text-beacon-400"
                        : coord.role === "coordinator"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-slate-600/50 text-slate-400"
                    }`}
                  >
                    {coord.role}
                  </span>
                  {coord.role !== "admin" && (
                    <button
                      onClick={() => removeCoordinator(coord.id)}
                      className="rounded-md p-1 text-slate-500 hover:bg-slate-600 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
