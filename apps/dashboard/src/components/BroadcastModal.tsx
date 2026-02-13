import { useState } from "react";
import { X, Send, Radio } from "lucide-react";

type TargetType = "all" | "country" | "status" | "individual";
type Priority = "normal" | "high" | "critical";

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (payload: {
    targetType: TargetType;
    targetValue: string;
    priority: Priority;
    message: string;
  }) => void;
  countries?: string[];
}

export default function BroadcastModal({
  isOpen,
  onClose,
  onSend,
  countries = ["Dominica", "St. Lucia", "Antigua & Barbuda", "Grenada", "St. Kitts & Nevis", "St. Vincent"],
}: BroadcastModalProps) {
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [targetValue, setTargetValue] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  function handleSend() {
    if (!message.trim()) return;
    onSend({ targetType, targetValue, priority, message });
    setMessage("");
    setTargetType("all");
    setTargetValue("");
    setPriority("normal");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-beacon-400" />
            <h2 className="text-lg font-semibold text-slate-100">
              Broadcast Message
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {/* Target type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Target Audience
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  ["all", "All Students"],
                  ["country", "By Country"],
                  ["status", "By Status"],
                  ["individual", "Individual"],
                ] as [TargetType, string][]
              ).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => {
                    setTargetType(type);
                    setTargetValue("");
                  }}
                  className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    targetType === type
                      ? "bg-beacon-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Target value selector */}
          {targetType === "country" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Country
              </label>
              <select
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="beacon-input"
              >
                <option value="">Select a country</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetType === "status" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Status
              </label>
              <select
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="beacon-input"
              >
                <option value="">Select a status</option>
                <option value="safe">Safe</option>
                <option value="moving">Moving</option>
                <option value="assistance">Need Assistance</option>
                <option value="urgent">Urgent</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          )}

          {targetType === "individual" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Student Name or ID
              </label>
              <input
                type="text"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="Enter name or student ID..."
                className="beacon-input"
              />
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Priority
            </label>
            <div className="flex gap-2">
              {(
                [
                  ["normal", "Normal", "bg-slate-600"],
                  ["high", "High", "bg-amber-600"],
                  ["critical", "Critical", "bg-red-600"],
                ] as [Priority, string, string][]
              ).map(([p, label, activeColor]) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`rounded-md px-4 py-2 text-xs font-medium transition-colors ${
                    priority === p
                      ? `${activeColor} text-white`
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your broadcast message..."
              rows={4}
              className="beacon-input resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-700 px-6 py-4">
          <button onClick={onClose} className="beacon-btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="beacon-btn-primary"
          >
            <Send className="h-4 w-4" />
            Send Broadcast
          </button>
        </div>
      </div>
    </div>
  );
}
