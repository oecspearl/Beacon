import { useState, useMemo } from "react";
import {
  Search,
  Send,
  Radio,
  ChevronRight,
  Paperclip,
} from "lucide-react";
import BroadcastModal from "@/components/BroadcastModal";
import StatusBadge from "@/components/StatusBadge";
import { useDashboardStore } from "@/stores/dashboard-store";
import type { StudentStatus, ChatMessage } from "@/stores/dashboard-store";
import { api } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Conversation {
  id: string;
  name: string;
  status: StudentStatus;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MessagesPage() {
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  const storeMessages = useDashboardStore((s) => s.messages);
  const students = useDashboardStore((s) => s.students);

  // Group messages by senderId into conversations
  const conversations = useMemo<Conversation[]>(() => {
    const convoMap = new Map<string, { msgs: ChatMessage[]; name: string }>();

    for (const msg of storeMessages) {
      const key = msg.senderId;
      if (!convoMap.has(key)) {
        convoMap.set(key, { msgs: [], name: msg.senderName ?? "Unknown" });
      }
      convoMap.get(key)!.msgs.push(msg);
    }

    // Sort messages within each conversation by time
    const result: Conversation[] = [];
    for (const [senderId, { msgs, name }] of convoMap) {
      const sorted = [...msgs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const latest = sorted[0];
      if (!latest) continue;
      const student = students.find((s) => s.id === senderId);

      result.push({
        id: senderId,
        name: student?.name ?? name,
        status: (student?.status ?? "safe") as StudentStatus,
        lastMessage: latest.content,
        lastMessageTime: timeAgo(latest.createdAt),
        unread: 0,
      });
    }

    // Sort conversations by most recent message
    result.sort((a, b) => {
      const aMsg = storeMessages.find((m) => m.senderId === a.id);
      const bMsg = storeMessages.find((m) => m.senderId === b.id);
      return new Date(bMsg?.createdAt ?? 0).getTime() - new Date(aMsg?.createdAt ?? 0).getTime();
    });

    return result;
  }, [storeMessages, students]);

  // Get messages for selected conversation
  const currentMessages = useMemo(() => {
    if (!selectedConvo) return [];
    return storeMessages
      .filter((m) => m.senderId === selectedConvo || m.recipientId === selectedConvo)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [storeMessages, selectedConvo]);

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentConvo = conversations.find((c) => c.id === selectedConvo);

  async function handleSendMessage() {
    if (!newMessage.trim() || !selectedConvo) return;
    setSending(true);
    try {
      await api.post("/messages", {
        senderId: "coordinator",
        recipientId: selectedConvo,
        content: newMessage.trim(),
        priority: "informational",
        channel: "data",
      });
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  }

  function handleBroadcast(payload: {
    targetType: string;
    targetValue: string;
    priority: string;
    message: string;
  }) {
    console.log("Broadcast:", payload);
  }

  // Select first conversation by default
  const firstConvo = filteredConversations[0];
  if (!selectedConvo && firstConvo) {
    setSelectedConvo(firstConvo.id);
  }

  const hasMessages = storeMessages.length > 0;

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
          {!hasMessages && (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              No messages yet. Messages from students will appear here.
            </div>
          )}
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
                  .toUpperCase()
                  .slice(0, 2)}
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
                    .toUpperCase()
                    .slice(0, 2)}
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
              {currentMessages.length === 0 && (
                <div className="py-12 text-center text-sm text-slate-500">
                  No messages in this conversation yet.
                </div>
              )}
              {currentMessages.map((msg) => {
                const isCoordinator = msg.senderId !== selectedConvo;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${
                      isCoordinator ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-md rounded-lg px-4 py-2.5 ${
                        isCoordinator
                          ? "bg-beacon-600 text-white"
                          : "bg-slate-700 text-slate-200"
                      }`}
                    >
                      {!isCoordinator && (
                        <p className="mb-1 text-xs font-semibold text-slate-400">
                          {msg.senderName}
                        </p>
                      )}
                      <p className="text-sm">{msg.content}</p>
                      <p
                        className={`mt-1 text-xs ${
                          isCoordinator
                            ? "text-beacon-200"
                            : "text-slate-400"
                        }`}
                      >
                        {timeAgo(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
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
                  disabled={sending}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
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
                {hasMessages
                  ? "Select a conversation to view messages"
                  : "No messages yet. Messages from students will appear here."}
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
