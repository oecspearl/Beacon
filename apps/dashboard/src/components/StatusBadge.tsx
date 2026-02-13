import type { StudentStatus } from "@/stores/dashboard-store";

interface StatusBadgeProps {
  status: StudentStatus | string;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  safe: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    label: "Safe",
  },
  moving: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    dot: "bg-amber-400",
    label: "Moving",
  },
  assistance: {
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    dot: "bg-orange-400",
    label: "Need Assistance",
  },
  urgent: {
    bg: "bg-red-500/15",
    text: "text-red-400",
    dot: "bg-red-400",
    label: "Urgent",
  },
  overdue: {
    bg: "bg-gray-500/15",
    text: "text-gray-400",
    dot: "bg-gray-400",
    label: "Overdue",
  },
  lost: {
    bg: "bg-gray-800/50",
    text: "text-gray-300",
    dot: "bg-gray-700",
    label: "Lost Contact",
  },
};

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = (STATUS_CONFIG[status] ?? STATUS_CONFIG.overdue)!;

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";
  const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses}`}
    >
      <span className={`${dotSize} rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
