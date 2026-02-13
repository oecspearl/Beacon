import { CircleMarker, Popup } from "react-leaflet";
import { Battery, Clock, MapPin } from "lucide-react";
import type { StudentOnMap, StudentStatus } from "@/stores/dashboard-store";
import StatusBadge from "./StatusBadge";

interface StudentMarkerProps {
  student: StudentOnMap;
  onClick?: (student: StudentOnMap) => void;
}

const STATUS_COLORS: Record<StudentStatus, string> = {
  safe: "#22c55e",
  moving: "#f59e0b",
  assistance: "#f97316",
  urgent: "#ef4444",
  overdue: "#6b7280",
  lost: "#111827",
};

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function batteryColor(level: number): string {
  if (level > 50) return "text-emerald-400";
  if (level > 20) return "text-amber-400";
  return "text-red-400";
}

export default function StudentMarker({ student, onClick }: StudentMarkerProps) {
  const color = STATUS_COLORS[student.status] ?? STATUS_COLORS.overdue;

  return (
    <CircleMarker
      center={[student.lat, student.lon]}
      radius={8}
      pathOptions={{
        color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: 2,
      }}
      eventHandlers={{
        click: () => onClick?.(student),
      }}
    >
      <Popup>
        <div className="min-w-[200px] text-slate-900">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-semibold">{student.name}</h3>
            <StatusBadge status={student.status} size="sm" />
          </div>

          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span>{student.country}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>Last seen: {timeAgo(student.lastSeen)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Battery className={`h-3.5 w-3.5 ${batteryColor(student.battery)}`} />
              <span>{student.battery}%</span>
            </div>
          </div>
        </div>
      </Popup>
    </CircleMarker>
  );
}
