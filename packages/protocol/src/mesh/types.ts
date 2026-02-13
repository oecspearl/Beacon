/**
 * BLE Mesh Protocol Types
 *
 * The mesh network uses BLE to form ad hoc device-to-device networks.
 * Messages are relayed through intermediate devices with TTL-based hop limits.
 */

export type MeshPacketType =
  | "discovery"    // Device announcing presence
  | "location"     // Location ping broadcast
  | "status"       // Status update
  | "message"      // Text message (encrypted)
  | "relay"        // Relayed packet from another device
  | "group_form"   // Group formation request
  | "group_ack"    // Group formation acknowledgement
  | "panic"        // Panic alert broadcast
  | "checkin"      // Check-in response
  | "command";     // Coordination centre command

export interface MeshPeer {
  deviceId: string;
  studentId: string;
  rssi: number; // signal strength
  lastSeen: number; // timestamp
  batteryLevel: number;
  hopCount: number;
}

export interface MeshNetworkState {
  localDeviceId: string;
  peers: Map<string, MeshPeer>;
  relayEnabled: boolean;
  scanInterval: number; // milliseconds
  advertiseInterval: number; // milliseconds
}

/** BLE Service and Characteristic UUIDs for Beacon mesh */
export const MESH_SERVICE_UUID = "B3AC0N00-0001-4000-8000-000000000000";
export const MESH_WRITE_CHAR_UUID = "B3AC0N00-0002-4000-8000-000000000000";
export const MESH_NOTIFY_CHAR_UUID = "B3AC0N00-0003-4000-8000-000000000000";
