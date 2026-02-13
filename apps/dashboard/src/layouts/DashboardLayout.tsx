import { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  Users,
  MessageSquare,
  AlertTriangle,
  Settings,
  Bell,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Radio,
  Shield,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useDashboardStore, type OperationMode } from "@/stores/dashboard-store";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import PanicNotification from "@/components/PanicNotification";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/map", icon: Map, label: "Map", end: false },
  { to: "/students", icon: Users, label: "Students", end: false },
  { to: "/messages", icon: MessageSquare, label: "Messages", end: false },
  { to: "/escalations", icon: AlertTriangle, label: "Escalations", end: false },
  { to: "/settings", icon: Settings, label: "Settings", end: false },
];

const MODE_CONFIG: Record<OperationMode, { label: string; color: string; bg: string }> = {
  normal: { label: "Normal", color: "text-emerald-400", bg: "bg-emerald-500/15" },
  alert: { label: "Alert", color: "text-amber-400", bg: "bg-amber-500/15" },
  crisis: { label: "Crisis", color: "text-red-400", bg: "bg-red-500/15" },
};

export default function DashboardLayout() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const { coordinator, token, logout } = useAuthStore();
  const { operationMode, setOperationMode, isConnected, unreadNotifications } =
    useDashboardStore();

  // Connect to socket on mount
  useEffect(() => {
    if (token) {
      connectSocket(token);
    }
    return () => {
      disconnectSocket();
    };
  }, [token]);

  const modeConfig = MODE_CONFIG[operationMode];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      {/* Sidebar */}
      <aside
        className={`flex shrink-0 flex-col border-r border-slate-700/50 bg-slate-800 transition-all duration-200 ${
          sidebarExpanded ? "w-60" : "w-16"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-slate-700/50 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-beacon-600">
              <Radio className="h-4 w-4 text-white" />
            </div>
            {sidebarExpanded && (
              <span className="text-lg font-bold tracking-wider text-slate-100">
                BEACON
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-beacon-600/15 text-beacon-400"
                    : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {sidebarExpanded && <span>{label}</span>}
              {label === "Escalations" &&
                unreadNotifications > 0 &&
                sidebarExpanded && (
                  <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                    {unreadNotifications}
                  </span>
                )}
            </NavLink>
          ))}
        </nav>

        {/* Toggle + User */}
        <div className="border-t border-slate-700/50 p-2">
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="mb-2 flex w-full items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
          >
            {sidebarExpanded ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {coordinator && (
            <div
              className={`flex items-center gap-3 rounded-lg p-2 ${
                sidebarExpanded ? "" : "justify-center"
              }`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-beacon-600 text-sm font-bold text-white">
                {coordinator.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              {sidebarExpanded && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-200">
                    {coordinator.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {coordinator.role}
                  </p>
                </div>
              )}
              {sidebarExpanded && (
                <button
                  onClick={logout}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-700/50 bg-slate-800/50 px-6">
          {/* Left: Operation mode */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className={`h-4 w-4 ${modeConfig.color}`} />
              <span className="text-sm font-medium text-slate-300">Mode:</span>
            </div>
            <div className="flex rounded-lg bg-slate-700/50 p-0.5">
              {(["normal", "alert", "crisis"] as OperationMode[]).map((mode) => {
                const cfg = MODE_CONFIG[mode];
                return (
                  <button
                    key={mode}
                    onClick={() => setOperationMode(mode)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      operationMode === mode
                        ? `${cfg.bg} ${cfg.color}`
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Status indicators */}
          <div className="flex items-center gap-4">
            {/* Connection status */}
            <div className="flex items-center gap-1.5">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-400" />
                  <span className="text-xs text-red-400">Disconnected</span>
                </>
              )}
            </div>

            {/* Notifications */}
            <button className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-slate-200">
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="relative flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <PanicNotification />
    </div>
  );
}
