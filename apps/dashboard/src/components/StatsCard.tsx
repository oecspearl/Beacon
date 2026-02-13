import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  color: "blue" | "green" | "amber" | "orange" | "red" | "gray";
  subtitle?: string;
}

const COLOR_MAP: Record<string, { iconBg: string; iconText: string; valueTint: string }> = {
  blue: {
    iconBg: "bg-blue-500/15",
    iconText: "text-blue-400",
    valueTint: "text-blue-100",
  },
  green: {
    iconBg: "bg-emerald-500/15",
    iconText: "text-emerald-400",
    valueTint: "text-emerald-100",
  },
  amber: {
    iconBg: "bg-amber-500/15",
    iconText: "text-amber-400",
    valueTint: "text-amber-100",
  },
  orange: {
    iconBg: "bg-orange-500/15",
    iconText: "text-orange-400",
    valueTint: "text-orange-100",
  },
  red: {
    iconBg: "bg-red-500/15",
    iconText: "text-red-400",
    valueTint: "text-red-100",
  },
  gray: {
    iconBg: "bg-gray-500/15",
    iconText: "text-gray-400",
    valueTint: "text-gray-100",
  },
};

export default function StatsCard({ icon: Icon, label, value, color, subtitle }: StatsCardProps) {
  const c = (COLOR_MAP[color] ?? COLOR_MAP.blue)!;

  return (
    <div className="beacon-card flex items-start gap-4">
      <div className={`rounded-lg p-3 ${c.iconBg}`}>
        <Icon className={`h-5 w-5 ${c.iconText}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-400">{label}</p>
        <p className={`text-2xl font-bold ${c.valueTint}`}>{value}</p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
