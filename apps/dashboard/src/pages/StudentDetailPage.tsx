import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import {
  ArrowLeft,
  MessageSquare,
  Bell,
  Trash2,
  Battery,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Globe,
  Smartphone,
  Shield,
  Activity,
  Calendar,
} from "lucide-react";
import { useDashboardStore, type StudentOnMap } from "@/stores/dashboard-store";
import StatusBadge from "@/components/StatusBadge";

// Sample student for development
const SAMPLE_STUDENT: StudentOnMap = {
  id: "s1",
  name: "Amara Joseph",
  lat: 15.301,
  lon: -61.387,
  status: "safe",
  country: "Dominica",
  lastSeen: new Date(Date.now() - 120000).toISOString(),
  battery: 87,
  phone: "+1 (767) 555-0142",
  email: "amara.joseph@university.edu",
  institution: "University of the West Indies",
  programme: "Marine Biology Exchange",
  emergencyContact: "Ruth Joseph (+1 767 555-0100)",
};

type Tab = "overview" | "location" | "messages" | "checkins" | "escalations";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "location", label: "Location History" },
  { id: "messages", label: "Messages" },
  { id: "checkins", label: "Check-ins" },
  { id: "escalations", label: "Escalations" },
];

const STATUS_COLORS: Record<string, string> = {
  safe: "#22c55e",
  moving: "#f59e0b",
  assistance: "#f97316",
  urgent: "#ef4444",
  overdue: "#6b7280",
  lost: "#111827",
};

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const storeStudents = useDashboardStore((s) => s.students);
  const student = useMemo(() => {
    const found = storeStudents.find((s) => s.id === id);
    return found ?? { ...SAMPLE_STUDENT, id: id ?? "s1" };
  }, [storeStudents, id]);

  const markerColor = STATUS_COLORS[student.status] ?? "#6b7280";

  return (
    <div className="space-y-6 p-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/students")}
        className="beacon-btn-ghost -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </button>

      {/* Header card */}
      <div className="beacon-card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-700 text-xl font-bold text-slate-300">
              {student.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-100">
                  {student.name}
                </h1>
                <StatusBadge status={student.status} />
              </div>
              <p className="mt-1 text-sm text-slate-400">
                {student.country} &middot; ID: {student.id}
              </p>
              {student.institution && (
                <p className="text-sm text-slate-500">{student.institution}</p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button className="beacon-btn-primary">
              <MessageSquare className="h-4 w-4" />
              Send Message
            </button>
            <button className="beacon-btn-secondary">
              <Bell className="h-4 w-4" />
              Request Check-in
            </button>
            <button className="beacon-btn-danger">
              <Trash2 className="h-4 w-4" />
              Remote Wipe
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-beacon-500 text-beacon-400"
                  : "border-transparent text-slate-400 hover:border-slate-600 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile info */}
          <div className="beacon-card space-y-4">
            <h3 className="font-semibold text-slate-100">Profile Information</h3>
            <div className="space-y-3">
              <InfoRow icon={User} label="Full Name" value={student.name} />
              <InfoRow icon={Globe} label="Country" value={student.country} />
              <InfoRow icon={Mail} label="Email" value={student.email ?? "N/A"} />
              <InfoRow icon={Phone} label="Phone" value={student.phone ?? "N/A"} />
              <InfoRow
                icon={Calendar}
                label="Programme"
                value={student.programme ?? "N/A"}
              />
              <InfoRow
                icon={Shield}
                label="Emergency Contact"
                value={student.emergencyContact ?? "N/A"}
              />
            </div>
          </div>

          {/* Mini map */}
          <div className="beacon-card">
            <h3 className="mb-3 font-semibold text-slate-100">
              Current Location
            </h3>
            <div className="h-64 overflow-hidden rounded-lg">
              <MapContainer
                center={[student.lat, student.lon]}
                zoom={13}
                className="h-full w-full"
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <CircleMarker
                  center={[student.lat, student.lon]}
                  radius={10}
                  pathOptions={{
                    color: markerColor,
                    fillColor: markerColor,
                    fillOpacity: 0.8,
                    weight: 2,
                  }}
                />
              </MapContainer>
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {student.lat.toFixed(4)}, {student.lon.toFixed(4)}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Last seen: {new Date(student.lastSeen).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Device info */}
          <div className="beacon-card space-y-4">
            <h3 className="font-semibold text-slate-100">Device Information</h3>
            <div className="space-y-3">
              <InfoRow icon={Smartphone} label="Device" value="Beacon Mobile App v2.1" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm">
                  <Battery className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-400">Battery</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-700">
                    <div
                      className={`h-full rounded-full ${
                        student.battery > 50
                          ? "bg-emerald-400"
                          : student.battery > 20
                            ? "bg-amber-400"
                            : "bg-red-400"
                      }`}
                      style={{ width: `${student.battery}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-200">
                    {student.battery}%
                  </span>
                </div>
              </div>
              <InfoRow icon={Activity} label="Status" value={student.status} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "location" && (
        <div className="beacon-card">
          <h3 className="mb-4 font-semibold text-slate-100">Location History</h3>
          <div className="space-y-3">
            {[
              { time: "2h ago", location: "Roseau, Dominica", coords: "15.3017, -61.3872" },
              { time: "4h ago", location: "Canefield, Dominica", coords: "15.3320, -61.3925" },
              { time: "8h ago", location: "Portsmouth, Dominica", coords: "15.5765, -61.4571" },
              { time: "12h ago", location: "Roseau, Dominica", coords: "15.3017, -61.3872" },
              { time: "1d ago", location: "Roseau, Dominica", coords: "15.3010, -61.3880" },
            ].map((entry, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-lg px-3 py-2.5 hover:bg-slate-700/30"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-beacon-600/15">
                  <MapPin className="h-4 w-4 text-beacon-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200">
                    {entry.location}
                  </p>
                  <p className="text-xs text-slate-500">{entry.coords}</p>
                </div>
                <span className="text-xs text-slate-500">{entry.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "messages" && (
        <div className="beacon-card">
          <h3 className="mb-4 font-semibold text-slate-100">Messages</h3>
          <div className="space-y-3">
            {[
              { from: "Coordinator", text: "Please confirm your current location.", time: "1h ago", incoming: false },
              { from: student.name, text: "I'm at the accommodation in Roseau. Everything is fine.", time: "55m ago", incoming: true },
              { from: "Coordinator", text: "Thank you. Stay safe and check in at the scheduled time.", time: "50m ago", incoming: false },
            ].map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.incoming ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-md rounded-lg px-4 py-2.5 ${
                    msg.incoming
                      ? "bg-slate-700 text-slate-200"
                      : "bg-beacon-600 text-white"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p className={`mt-1 text-xs ${msg.incoming ? "text-slate-400" : "text-beacon-200"}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "checkins" && (
        <div className="beacon-card">
          <h3 className="mb-4 font-semibold text-slate-100">Check-in History</h3>
          <div className="space-y-2">
            {[
              { time: "Today, 10:00 AM", status: "On time", type: "Scheduled" },
              { time: "Today, 6:00 AM", status: "On time", type: "Scheduled" },
              { time: "Yesterday, 10:00 PM", status: "On time", type: "Scheduled" },
              { time: "Yesterday, 6:00 PM", status: "Late (15m)", type: "Scheduled" },
              { time: "Yesterday, 2:00 PM", status: "On time", type: "Manual" },
              { time: "Yesterday, 10:00 AM", status: "Missed", type: "Scheduled" },
            ].map((checkin, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-slate-700/30"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      checkin.status === "On time"
                        ? "bg-emerald-400"
                        : checkin.status === "Missed"
                          ? "bg-red-400"
                          : "bg-amber-400"
                    }`}
                  />
                  <span className="text-sm text-slate-200">{checkin.time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                    {checkin.type}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      checkin.status === "On time"
                        ? "text-emerald-400"
                        : checkin.status === "Missed"
                          ? "text-red-400"
                          : "text-amber-400"
                    }`}
                  >
                    {checkin.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "escalations" && (
        <div className="beacon-card">
          <h3 className="mb-4 font-semibold text-slate-100">Escalation History</h3>
          <p className="py-8 text-center text-sm text-slate-500">
            No escalations recorded for this student.
          </p>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 text-sm">
        <Icon className="h-4 w-4 text-slate-400" />
        <span className="text-slate-400">{label}</span>
      </div>
      <span className="text-sm text-slate-200">{value}</span>
    </div>
  );
}
