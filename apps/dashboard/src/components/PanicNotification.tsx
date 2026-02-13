import { useEffect } from "react";
import { Siren, X, MapPin, ExternalLink } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useNavigate } from "react-router-dom";

export default function PanicNotification() {
  const panicAlert = useDashboardStore((s) => s.panicAlert);
  const clearPanicAlert = useDashboardStore((s) => s.clearPanicAlert);
  const navigate = useNavigate();
  useEffect(() => {
    if (panicAlert) {
      // Play alarm sound using Web Audio API
      try {
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = 880;
        oscillator.type = "square";
        gainNode.gain.value = 0.3;
        oscillator.start();

        // Pulse the alarm
        const interval = setInterval(() => {
          gainNode.gain.value = gainNode.gain.value > 0 ? 0 : 0.3;
        }, 500);

        // Stop after 5 seconds
        setTimeout(() => {
          clearInterval(interval);
          oscillator.stop();
          ctx.close();
        }, 5000);

        return () => {
          clearInterval(interval);
          oscillator.stop();
          ctx.close();
        };
      } catch {
        // Audio not available
      }
    }
  }, [panicAlert]);

  if (!panicAlert) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={clearPanicAlert}
      />

      {/* Alert card */}
      <div className="relative w-full max-w-lg animate-pulse rounded-xl border-2 border-red-500 bg-slate-800 shadow-2xl shadow-red-500/20">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-500/30 bg-red-500/15 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500">
              <Siren className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-400">
                PANIC ALERT
              </h3>
              <p className="text-sm text-red-300/80">
                Immediate attention required
              </p>
            </div>
          </div>
          <button
            onClick={clearPanicAlert}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          <div>
            <p className="text-sm text-slate-400">Student</p>
            <p className="text-lg font-semibold text-slate-100">
              {panicAlert.studentName}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-300">
            <MapPin className="h-4 w-4 text-red-400" />
            <span>
              {panicAlert.latitude.toFixed(6)}, {panicAlert.longitude.toFixed(6)}
            </span>
          </div>

          <div>
            <p className="text-xs text-slate-500">
              {new Date(panicAlert.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-slate-700 p-5">
          <button
            onClick={() => {
              navigate(`/students/${panicAlert.studentId}`);
              clearPanicAlert();
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500"
          >
            <ExternalLink className="h-4 w-4" />
            View Student
          </button>
          <button
            onClick={() => {
              navigate("/map");
              clearPanicAlert();
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-600"
          >
            <MapPin className="h-4 w-4" />
            Show on Map
          </button>
        </div>
      </div>
    </div>
  );
}
