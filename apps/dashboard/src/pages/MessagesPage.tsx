import { useState } from "react";
import {
  Search,
  Send,
  Radio,
  ChevronRight,
  Paperclip,
} from "lucide-react";
import BroadcastModal from "@/components/BroadcastModal";
import StatusBadge from "@/components/StatusBadge";
import type { StudentStatus } from "@/stores/dashboard-store";

interface Conversation {
  id: string;
  name: string;
  status: StudentStatus;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
}

interface Message {
  id: string;
  text: string;
  sender: "coordinator" | "student";
  timestamp: string;
}

const SAMPLE_CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    name: "Marcus Williams",
    status: "urgent",
    lastMessage: "Please help, my battery is dying",
    lastMessageTime: "5m ago",
    unread: 2,
  },
  {
    id: "c2",
    name: "Andre Charles",
    status: "assistance",
    lastMessage: "I need directions to the embassy",
    lastMessageTime: "12m ago",
    unread: 1,
  },
  {
    id: "c3",
    name: "Amara Joseph",
    status: "safe",
    lastMessage: "Arrived at accommodation safely",
    lastMessageTime: "55m ago",
    unread: 0,
  },
  {
    id: "c4",
    name: "Ryan Thomas",
    status: "overdue",
    lastMessage: "Will check in shortly",
    lastMessageTime: "2h ago",
    unread: 0,
  },
  {
    id: "c5",
    name: "Keisha Brown",
    status: "safe",
    lastMessage: "Thank you for the update",
    lastMessageTime: "3h ago",
    unread: 0,
  },
  {
    id: "c6",
    name: "Devon Clarke",
    status: "moving",
    lastMessage: "On my way to the hotel now",
    lastMessageTime: "4h ago",
    unread: 0,
  },
];

const SAMPLE_MESSAGES: Record<string, Message[]> = {
  c1: [
    { id: "m1", text: "Marcus, we've noticed your battery is critically low. Can you confirm your location?", sender: "coordinator", timestamp: "10m ago" },
    { id: "m2", text: "I'm near the harbour in Roseau. Battery at 5%.", sender: "student", timestamp: "8m ago" },
    { id: "m3", text: "Please help, my battery is dying", sender: "student", timestamp: "5m ago" },
  ],
  c2: [
    { id: "m4", text: "Hi Andre, how can we help?", sender: "coordinator", timestamp: "20m ago" },
    { id: "m5", text: "I need directions to the embassy", sender: "student", timestamp: "12m ago" },
  ],
  c3: [
    { id: "m6", text: "Please confirm your current location.", sender: "coordinator", timestamp: "1h ago" },
    { id: "m7", text: "I'm at the accommodation in Roseau. Everything is fine.", sender: "student", timestamp: "55m ago" },
    { id: "m8", text: "Arrived at accommodation safely", sender: "student", timestamp: "55m ago" },
    { id: "m9", text: "Thank you. Stay safe and check in at the scheduled time.", sender: "coordinator", timestamp: "50m ago" },
  ],
};

export default function MessagesPage() {
  const [selectedConvo, setSelectedConvo] = useState<string | null>("c1");
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  const filteredConversations = SAMPLE_CONVERSATIONS.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentConvo = SAMPLE_CONVERSATIONS.find((c) => c.id === selectedConvo);
  const messages = selectedConvo ? SAMPLE_MESSAGES[selectedConvo] ?? [] : [];

  function handleSendMessage() {
    if (!newMessage.trim()) return;
    // In production this would emit via socket or call API
    console.log("Send message:", newMessage, "to:", selectedConvo);
    setNewMessage("");
  }

  function handleBroadcast(payload: {
    targetType: string;
    targetValue: string;
    priority: string;
    message: string;
  }) {
    console.log("Broadcast:", payload);
  }

  return (
    <div className="flex h-full">
      {/* Left: Conversation list */}
      <div className="flex w-80 shrink-0 flex-col border-r border-slate-700/50">
        {/* Header */}
        <div className="border-b border-slate-700/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Messages</h2>
            <button
              onClick={() => setBroadcastOpen(true)}
              className="beacon-btn-primary text-xs"
            >
              <Radio className="h-3.5 w-3.5" />
              Broadcast
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="beacon-input pl-10"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto">
          {filteredConversations.map((convo) => (
            <button
              key={convo.id}
              onClick={() => setSelectedConvo(convo.id)}
              className={`flex w-full items-start gap-3 border-b border-slate-700/30 px-4 py-3 text-left transition-colors ${
                selectedConvo === convo.id
                  ? "bg-slate-700/40"
                  : "hover:bg-slate-800/50"
              }`}
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-300">
                {convo.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-200">
                    {convo.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {convo.lastMessageTime}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <StatusBadge status={convo.status} size="sm" />
                </div>
                <p className="mt-1 truncate text-xs text-slate-400">
                  {convo.lastMessage}
                </p>
              </div>

              {convo.unread > 0 && (
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-beacon-600 text-xs font-bold text-white">
                  {convo.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Message thread */}
      <div className="flex flex-1 flex-col">
        {currentConvo ? (
          <>
            {/* Thread header */}
            <div className="flex items-center justify-between border-b border-slate-700/50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-slate-300">
                  {currentConvo.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="font-medium text-slate-100">
                    {currentConvo.name}
                  </h3>
                  <StatusBadge status={currentConvo.status} size="sm" />
                </div>
              </div>
              <button className="beacon-btn-ghost text-xs">
                View Profile
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-auto p-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "coordinator"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-md rounded-lg px-4 py-2.5 ${
                      msg.sender === "coordinator"
                        ? "bg-beacon-600 text-white"
                        : "bg-slate-700 text-slate-200"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p
                      className={`mt-1 text-xs ${
                        msg.sender === "coordinator"
                          ? "text-beacon-200"
                          : "text-slate-400"
                      }`}
                    >
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Compose */}
            <div className="border-t border-slate-700/50 p-4">
              <div className="flex items-center gap-3">
                <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-slate-200">
                  <Paperclip className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="beacon-input flex-1"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="beacon-btn-primary"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <MessageSquareIcon className="mx-auto mb-3 h-12 w-12 text-slate-600" />
              <p className="text-sm text-slate-500">
                Select a conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Broadcast modal */}
      <BroadcastModal
        isOpen={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        onSend={handleBroadcast}
      />
    </div>
  );
}

function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
