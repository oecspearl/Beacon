import { useState, useMemo } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { Filter, X, ChevronDown } from "lucide-react";
import { useDashboardStore, type StudentStatus } from "@/stores/dashboard-store";
import type { StudentOnMap } from "@/stores/dashboard-store";
import StudentMarker from "@/components/StudentMarker";
import { useNavigate } from "react-router-dom";

// Sample data for development / when server data is not yet loaded
const SAMPLE_STUDENTS: StudentOnMap[] = [
  { id: "s1", name: "Amara Joseph", lat: 15.301, lon: -61.387, status: "safe", country: "Dominica", lastSeen: new Date(Date.now() - 120000).toISOString(), battery: 87 },
  { id: "s2", name: "Marcus Williams", lat: 15.415, lon: -61.256, status: "urgent", country: "Dominica", lastSeen: new Date(Date.now() - 300000).toISOString(), battery: 5 },
  { id: "s3", name: "Keisha Brown", lat: 14.01, lon: -60.987, status: "safe", country: "St. Lucia", lastSeen: new Date(Date.now() - 600000).toISOString(), battery: 62 },
  { id: "s4", name: "Devon Clarke", lat: 14.0101, lon: -60.9875, status: "moving", country: "St. Lucia", lastSeen: new Date(Date.now() - 900000).toISOString(), battery: 44 },
  { id: "s5", name: "Tricia James", lat: 12.056, lon: -61.749, status: "safe", country: "Grenada", lastSeen: new Date(Date.now() - 1500000).toISOString(), battery: 91 },
  { id: "s6", name: "Ryan Thomas", lat: 17.127, lon: -61.846, status: "overdue", country: "Antigua & Barbuda", lastSeen: new Date(Date.now() - 7200000).toISOString(), battery: 33 },
  { id: "s7", name: "Jasmine Lewis", lat: 17.296, lon: -62.727, status: "safe", country: "St. Kitts & Nevis", lastSeen: new Date(Date.now() - 300000).toISOString(), battery: 78 },
  { id: "s8", name: "Andre Charles", lat: 13.16, lon: -61.227, status: "assistance", country: "St. Vincent", lastSeen: new Date(Date.now() - 1800000).toISOString(), battery: 22 },
  { id: "s9", name: "Shanice George", lat: 15.437, lon: -61.348, status: "safe", country: "Dominica", lastSeen: new Date(Date.now() - 240000).toISOString(), battery: 55 },
  { id: "s10", name: "Kyle Joseph", lat: 12.116, lon: -61.679, status: "moving", country: "Grenada", lastSeen: new Date(Date.now() - 450000).toISOString(), battery: 68 },
  { id: "s11", name: "Anika Phillip", lat: 14.08, lon: -60.949, status: "safe", country: "St. Lucia", lastSeen: new Date(Date.now() - 180000).toISOString(), battery: 95 },
  { id: "s12", name: "Brandon Martin", lat: 15.34, lon: -61.395, status: "lost", country: "Dominica", lastSeen: new Date(Date.now() - 86400000).toISOString(), battery: 0 },
];

const COUNTRIES = [
  "All Countries",
  "Dominica",
  "St. Lucia",
  "Antigua & Barbuda",
  "Grenada",
  "St. Kitts & Nevis",
  "St. Vincent",
];

const STATUSES: { value: StudentStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "safe", label: "Safe" },
  { value: "moving", label: "Moving" },
  { value: "assistance", label: "Need Assistance" },
  { value: "urgent", label: "Urgent" },
  { value: "overdue", label: "Overdue" },
  { value: "lost", label: "Lost Contact" },
];

const STATUS_LEGEND: { status: StudentStatus; label: string; color: string }[] = [
  { status: "safe", label: "Safe", color: "bg-emerald-500" },
  { status: "moving", label: "Moving", color: "bg-amber-500" },
  { status: "assistance", label: "Assistance", color: "bg-orange-500" },
  { status: "urgent", label: "Urgent", color: "bg-red-500" },
  { status: "overdue", label: "Overdue", color: "bg-gray-500" },
  { status: "lost", label: "Lost", color: "bg-gray-800 border border-gray-600" },
];

export default function MapPage() {
  const [filterOpen, setFilterOpen] = useState(true);
  const [countryFilter, setCountryFilter] = useState("All Countries");
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "all">("all");
  const navigate = useNavigate();

  const storeStudents = useDashboardStore((s) => s.students);
  const students = storeStudents.length > 0 ? storeStudents : SAMPLE_STUDENTS;

  const filtered = useMemo(() => {
    return students.filter((s) => {
      // Skip students with no valid location data (default 0,0 is Gulf of Guinea)
      if (s.lat === 0 && s.lon === 0) return false;
      if (countryFilter !== "All Countries" && s.country !== countryFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      return true;
    });
  }, [students, countryFilter, statusFilter]);

  function handleMarkerClick(student: StudentOnMap) {
    navigate(`/students/${student.id}`);
  }

  return (
    <div className="absolute inset-0">
      {/* Map */}
      <MapContainer
        center={[15, -61]}
        zoom={7}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {filtered.map((student) => (
          <StudentMarker
            key={student.id}
            student={student}
            onClick={handleMarkerClick}
          />
        ))}
      </MapContainer>

      {/* Filter panel overlay */}
      <div className="absolute left-4 top-4 z-[1000]">
        {filterOpen ? (
          <div className="w-72 rounded-xl border border-slate-700 bg-slate-800/95 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-beacon-400" />
                <span className="text-sm font-semibold text-slate-100">
                  Filters
                </span>
              </div>
              <button
                onClick={() => setFilterOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              {/* Country filter */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Country
                </label>
                <div className="relative">
                  <select
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    className="beacon-input appearance-none pr-8"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Status filter */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as StudentStatus | "all")
                    }
                    className="beacon-input appearance-none pr-8"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Results count */}
              <div className="text-xs text-slate-500">
                Showing {filtered.length} of {students.length} students
              </div>
            </div>

            {/* Legend */}
            <div className="border-t border-slate-700 px-4 py-3">
              <p className="mb-2 text-xs font-medium text-slate-400">Legend</p>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_LEGEND.map((item) => (
                  <div key={item.status} className="flex items-center gap-1.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${item.color}`}
                    />
                    <span className="text-xs text-slate-400">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setFilterOpen(true)}
            className="rounded-lg border border-slate-700 bg-slate-800/95 p-2.5 shadow-lg backdrop-blur-sm hover:bg-slate-700"
          >
            <Filter className="h-5 w-5 text-slate-300" />
          </button>
        )}
      </div>
    </div>
  );
}
