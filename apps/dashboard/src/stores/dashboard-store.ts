import { create } from "zustand";

export type StudentStatus =
  | "safe"
  | "moving"
  | "assistance"
  | "urgent"
  | "overdue"
  | "lost";

export type OperationMode = "normal" | "alert" | "crisis";

export type EscalationSeverity = "warning" | "critical";
export type EscalationType =
  | "missed_checkin"
  | "sos_triggered"
  | "battery_critical"
  | "geofence_breach"
  | "lost_contact";

export interface StudentOnMap {
  id: string;
  name: string;
  lat: number;
  lon: number;
  status: StudentStatus;
  country: string;
  lastSeen: string;
  battery: number;
  phone?: string;
  email?: string;
  institution?: string;
  programme?: string;
  emergencyContact?: string;
}

export interface Escalation {
  id: string;
  studentId: string;
  studentName: string;
  type: EscalationType;
  severity: EscalationSeverity;
  message: string;
  createdAt: string;
  acknowledged: boolean;
  resolved: boolean;
  actionsTaken: string[];
}

export interface ActivityItem {
  id: string;
  type: "check_in" | "status_change" | "escalation" | "message" | "system";
  studentName?: string;
  description: string;
  timestamp: string;
}

export interface PanicAlert {
  panicEventId: string;
  studentId: string;
  studentName: string;
  latitude: number;
  longitude: number;
  audioUrl?: string;
  timestamp: string;
}

export interface DashboardStats {
  total: number;
  safe: number;
  moving: number;
  assistance: number;
  urgent: number;
  overdue: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  recipientId?: string | null;
  groupId?: string | null;
  content: string;
  priority: string;
  channel: string;
  createdAt: string;
}

interface DashboardState {
  students: StudentOnMap[];
  escalations: Escalation[];
  activities: ActivityItem[];
  messages: ChatMessage[];
  operationMode: OperationMode;
  stats: DashboardStats;
  isConnected: boolean;
  unreadNotifications: number;
  panicAlert: PanicAlert | null;

  setStudents: (students: StudentOnMap[]) => void;
  updateStudent: (id: string, data: Partial<StudentOnMap>) => void;
  setEscalations: (escalations: Escalation[]) => void;
  addEscalation: (escalation: Escalation) => void;
  acknowledgeEscalation: (id: string) => void;
  resolveEscalation: (id: string) => void;
  addActivity: (activity: ActivityItem) => void;
  setActivities: (activities: ActivityItem[]) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setOperationMode: (mode: OperationMode) => void;
  setStats: (stats: DashboardStats) => void;
  setConnected: (connected: boolean) => void;
  setUnreadNotifications: (count: number) => void;
  setPanicAlert: (alert: PanicAlert) => void;
  clearPanicAlert: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  students: [],
  escalations: [],
  activities: [],
  messages: [],
  operationMode: "normal",
  stats: { total: 0, safe: 0, moving: 0, assistance: 0, urgent: 0, overdue: 0 },
  isConnected: false,
  unreadNotifications: 0,
  panicAlert: null,

  setStudents: (students) => set({ students }),

  updateStudent: (id, data) =>
    set((state) => ({
      students: state.students.map((s) =>
        s.id === id ? { ...s, ...data } : s
      ),
    })),

  setEscalations: (escalations) => set({ escalations }),

  addEscalation: (escalation) =>
    set((state) => ({
      escalations: [escalation, ...state.escalations],
      unreadNotifications: state.unreadNotifications + 1,
    })),

  acknowledgeEscalation: (id) =>
    set((state) => ({
      escalations: state.escalations.map((e) =>
        e.id === id ? { ...e, acknowledged: true } : e
      ),
    })),

  resolveEscalation: (id) =>
    set((state) => ({
      escalations: state.escalations.map((e) =>
        e.id === id ? { ...e, resolved: true } : e
      ),
    })),

  addActivity: (activity) =>
    set((state) => ({
      activities: [activity, ...state.activities].slice(0, 100),
    })),

  setActivities: (activities) => set({ activities }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [message, ...state.messages].slice(0, 200),
    })),

  setOperationMode: (operationMode) => set({ operationMode }),

  setStats: (stats) => set({ stats }),

  setConnected: (isConnected) => set({ isConnected }),

  setUnreadNotifications: (unreadNotifications) =>
    set({ unreadNotifications }),

  setPanicAlert: (panicAlert) =>
    set({ panicAlert, unreadNotifications: (useDashboardStore.getState().unreadNotifications) + 1 }),

  clearPanicAlert: () => set({ panicAlert: null }),
}));
