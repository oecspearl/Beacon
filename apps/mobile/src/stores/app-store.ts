import { create } from "zustand";

// ---------------------------------------------------------------------------
// Types (inline until @beacon/shared is built)
// ---------------------------------------------------------------------------

export type OperationMode = "normal" | "alert" | "crisis";

export type StatusCode =
  | "safe"
  | "moving"
  | "sheltering"
  | "need_assistance"
  | "urgent"
  | "unknown";

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  institution: string;
  programme: string;
  hostCountry: string;
  bloodType?: string;
  allergies?: string[];
  medicalConditions?: string[];
  medications?: string[];
  emergencyContacts: EmergencyContact[];
  registeredAt: string;
}

// ---------------------------------------------------------------------------
// Store state
// ---------------------------------------------------------------------------

interface AppState {
  /** Current system-wide operation mode */
  operationMode: OperationMode;

  /** The logged-in student profile, null before registration */
  studentProfile: StudentProfile | null;

  /** The student's last reported status */
  currentStatus: StatusCode;

  /** Whether the student has completed registration */
  isRegistered: boolean;

  /** Whether a panic event is currently active */
  isPanicActive: boolean;

  /** Timestamp of last successful check-in */
  lastCheckIn: string | null;

  /** Number of unread messages */
  unreadMessages: number;
}

interface AppActions {
  setOperationMode: (mode: OperationMode) => void;
  setStatus: (status: StatusCode) => void;
  activatePanic: () => void;
  deactivatePanic: () => void;
  setStudentProfile: (profile: StudentProfile) => void;
  setRegistered: (registered: boolean) => void;
  setLastCheckIn: (timestamp: string) => void;
  incrementUnread: () => void;
  clearUnread: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAppStore = create<AppState & AppActions>()((set) => ({
  // Initial state
  operationMode: "normal",
  studentProfile: null,
  currentStatus: "unknown",
  isRegistered: false,
  isPanicActive: false,
  lastCheckIn: null,
  unreadMessages: 0,

  // Actions
  setOperationMode: (mode) => set({ operationMode: mode }),

  setStatus: (status) =>
    set({ currentStatus: status, lastCheckIn: new Date().toISOString() }),

  activatePanic: () =>
    set({ isPanicActive: true, operationMode: "crisis", currentStatus: "urgent" }),

  deactivatePanic: () =>
    set({ isPanicActive: false }),

  setStudentProfile: (profile) =>
    set({ studentProfile: profile, isRegistered: true }),

  setRegistered: (registered) => set({ isRegistered: registered }),

  setLastCheckIn: (timestamp) => set({ lastCheckIn: timestamp }),

  incrementUnread: () =>
    set((state) => ({ unreadMessages: state.unreadMessages + 1 })),

  clearUnread: () => set({ unreadMessages: 0 }),
}));
