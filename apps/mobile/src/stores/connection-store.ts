import { create } from "zustand";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChannelName = "data" | "mesh" | "sms";

export interface ConnectionState {
  /** Whether the device has an active internet connection */
  dataConnected: boolean;

  /** Whether the BLE mesh network is active */
  meshActive: boolean;

  /** Number of peers currently connected via mesh */
  meshPeerCount: number;

  /** Whether SMS sending is available on this device */
  smsAvailable: boolean;

  /** Whether GPS / location services are enabled */
  gpsEnabled: boolean;

  /** Signal strength estimate (0-100) for the primary data connection */
  signalStrength: number;

  /** Timestamp of last connectivity check */
  lastChecked: string | null;
}

interface ConnectionActions {
  updateConnectionState: (partial: Partial<ConnectionState>) => void;
  setDataConnected: (connected: boolean) => void;
  setMeshActive: (active: boolean) => void;
  setMeshPeerCount: (count: number) => void;
  setSmsAvailable: (available: boolean) => void;
  setGpsEnabled: (enabled: boolean) => void;
  setSignalStrength: (strength: number) => void;
}

// ---------------------------------------------------------------------------
// Derived helpers (not in the store, just utilities)
// ---------------------------------------------------------------------------

/**
 * Returns a list of currently available communication channels.
 */
export function getActiveChannels(state: ConnectionState): ChannelName[] {
  const channels: ChannelName[] = [];
  if (state.dataConnected) channels.push("data");
  if (state.meshActive) channels.push("mesh");
  if (state.smsAvailable) channels.push("sms");
  return channels;
}

/**
 * Returns true if at least one outbound channel is available.
 */
export function hasAnyChannel(state: ConnectionState): boolean {
  return state.dataConnected || state.meshActive || state.smsAvailable;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useConnectionStore = create<ConnectionState & ConnectionActions>()(
  (set) => ({
    // Initial state -- assume nothing is connected until verified
    dataConnected: false,
    meshActive: false,
    meshPeerCount: 0,
    smsAvailable: false,
    gpsEnabled: false,
    signalStrength: 0,
    lastChecked: null,

    // Actions
    updateConnectionState: (partial) =>
      set((state) => ({
        ...state,
        ...partial,
        lastChecked: new Date().toISOString(),
      })),

    setDataConnected: (connected) =>
      set({ dataConnected: connected, lastChecked: new Date().toISOString() }),

    setMeshActive: (active) =>
      set({ meshActive: active, lastChecked: new Date().toISOString() }),

    setMeshPeerCount: (count) =>
      set({ meshPeerCount: count }),

    setSmsAvailable: (available) =>
      set({ smsAvailable: available, lastChecked: new Date().toISOString() }),

    setGpsEnabled: (enabled) =>
      set({ gpsEnabled: enabled, lastChecked: new Date().toISOString() }),

    setSignalStrength: (strength) =>
      set({ signalStrength: Math.max(0, Math.min(100, strength)) }),
  }),
);
