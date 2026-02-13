import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  ExternalLink,
  Users,
} from "lucide-react";
import { useDashboardStore, type StudentStatus } from "@/stores/dashboard-store";
import type { StudentOnMap } from "@/stores/dashboard-store";
import StatusBadge from "@/components/StatusBadge";

// Sample data for development
const SAMPLE_STUDENTS: StudentOnMap[] = [
  { id: "s1", name: "Amara Joseph", lat: 15.301, lon: -61.387, status: "safe", country: "Dominica", lastSeen: new Date(Date.now() - 120000).toISOString(), battery: 87, email: "amara.j@example.edu" },
  { id: "s2", name: "Marcus Williams", lat: 15.415, lon: -61.256, status: "urgent", country: "Dominica", lastSeen: new Date(Date.now() - 300000).toISOString(), battery: 5, email: "marcus.w@example.edu" },
  { id: "s3", name: "Keisha Brown", lat: 14.01, lon: -60.987, status: "safe", country: "St. Lucia", lastSeen: new Date(Date.now() - 600000).toISOString(), battery: 62, email: "keisha.b@example.edu" },
  { id: "s4", name: "Devon Clarke", lat: 14.0101, lon: -60.9875, status: "moving", country: "St. Lucia", lastSeen: new Date(Date.now() - 900000).toISOString(), battery: 44, email: "devon.c@example.edu" },
  { id: "s5", name: "Tricia James", lat: 12.056, lon: -61.749, status: "safe", country: "Grenada", lastSeen: new Date(Date.now() - 1500000).toISOString(), battery: 91, email: "tricia.j@example.edu" },
  { id: "s6", name: "Ryan Thomas", lat: 17.127, lon: -61.846, status: "overdue", country: "Antigua & Barbuda", lastSeen: new Date(Date.now() - 7200000).toISOString(), battery: 33, email: "ryan.t@example.edu" },
  { id: "s7", name: "Jasmine Lewis", lat: 17.296, lon: -62.727, status: "safe", country: "St. Kitts & Nevis", lastSeen: new Date(Date.now() - 300000).toISOString(), battery: 78, email: "jasmine.l@example.edu" },
  { id: "s8", name: "Andre Charles", lat: 13.16, lon: -61.227, status: "assistance", country: "St. Vincent", lastSeen: new Date(Date.now() - 1800000).toISOString(), battery: 22, email: "andre.c@example.edu" },
  { id: "s9", name: "Shanice George", lat: 15.437, lon: -61.348, status: "safe", country: "Dominica", lastSeen: new Date(Date.now() - 240000).toISOString(), battery: 55, email: "shanice.g@example.edu" },
  { id: "s10", name: "Kyle Joseph", lat: 12.116, lon: -61.679, status: "moving", country: "Grenada", lastSeen: new Date(Date.now() - 450000).toISOString(), battery: 68, email: "kyle.j@example.edu" },
  { id: "s11", name: "Anika Phillip", lat: 14.08, lon: -60.949, status: "safe", country: "St. Lucia", lastSeen: new Date(Date.now() - 180000).toISOString(), battery: 95, email: "anika.p@example.edu" },
  { id: "s12", name: "Brandon Martin", lat: 15.34, lon: -61.395, status: "lost", country: "Dominica", lastSeen: new Date(Date.now() - 86400000).toISOString(), battery: 0, email: "brandon.m@example.edu" },
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

function batteryColor(level: number): string {
  if (level > 50) return "text-emerald-400";
  if (level > 20) return "text-amber-400";
  return "text-red-400";
}

function batteryBg(level: number): string {
  if (level > 50) return "bg-emerald-400";
  if (level > 20) return "bg-amber-400";
  return "bg-red-400";
}

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "all">("all");
  const navigate = useNavigate();

  const storeStudents = useDashboardStore((s) => s.students);
  const students = storeStudents.length > 0 ? storeStudents : SAMPLE_STUDENTS;

  const countries = useMemo(
    () => ["all", ...Array.from(new Set(students.map((s) => s.country))).sort()],
    [students]
  );

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !s.name.toLowerCase().includes(q) &&
          !s.country.toLowerCase().includes(q) &&
          !s.id.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (countryFilter !== "all" && s.country !== countryFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      return true;
    });
  }, [students, search, countryFilter, statusFilter]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Students</h1>
          <p className="mt-1 text-sm text-slate-400">
            {students.length} registered students across OECS member states
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5">
          <Users className="h-4 w-4 text-beacon-400" />
          <span className="text-sm font-medium text-slate-300">
            {filtered.length} shown
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, country, or ID..."
            className="beacon-input pl-10"
          />
        </div>

        <div className="relative">
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="beacon-input appearance-none pr-8"
          >
            <option value="all">All Countries</option>
            {countries.filter((c) => c !== "all").map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as StudentStatus | "all")
            }
            className="beacon-input appearance-none pr-8"
          >
            <option value="all">All Statuses</option>
            <option value="safe">Safe</option>
            <option value="moving">Moving</option>
            <option value="assistance">Need Assistance</option>
            <option value="urgent">Urgent</option>
            <option value="overdue">Overdue</option>
            <option value="lost">Lost Contact</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-700">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/80">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Country
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Last Check-in
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Battery
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {filtered.map((student) => (
              <tr
                key={student.id}
                onClick={() => navigate(`/students/${student.id}`)}
                className="cursor-pointer bg-slate-800/30 transition-colors hover:bg-slate-700/40"
              >
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-300">
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {student.name}
                      </p>
                      <p className="text-xs text-slate-500">{student.id}</p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-300">
                  {student.country}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusBadge status={student.status} size="sm" />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-400">
                  {timeAgo(student.lastSeen)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-700">
                      <div
                        className={`h-full rounded-full ${batteryBg(student.battery)}`}
                        style={{ width: `${student.battery}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${batteryColor(student.battery)}`}>
                      {student.battery}%
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/students/${student.id}`);
                    }}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                    title="View details"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-500">
            No students match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
