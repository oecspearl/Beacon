import type { MeshPacketType } from "./types.js";

/**
 * Mesh packet structure.
 *
 * Packets are serialised to binary for BLE transmission.
 * Max BLE payload per write: ~512 bytes (negotiated MTU).
 * Packets exceeding this are fragmented automatically.
 */

export interface MeshPacket {
  /** Unique packet ID for deduplication */
  id: string;
  /** Packet type */
  type: MeshPacketType;
  /** Originating device ID */
  sourceId: string;
  /** Target device ID (null = broadcast) */
  targetId: string | null;
  /** Time-to-live: decremented at each hop, packet dropped at 0 */
  ttl: number;
  /** Hop count from origin */
  hopCount: number;
  /** Timestamp of creation (epoch ms) */
  timestamp: number;
  /** Payload (type-dependent) */
  payload: Uint8Array;
}

export const DEFAULT_TTL = 5;
export const MAX_PACKET_SIZE = 512;
export const DEDUP_WINDOW_MS = 60_000; // Ignore duplicate packet IDs within 60s

export function createPacket(
  type: MeshPacketType,
  sourceId: string,
  payload: Uint8Array,
  targetId: string | null = null,
  ttl: number = DEFAULT_TTL
): MeshPacket {
  return {
    id: generatePacketId(),
    type,
    sourceId,
    targetId,
    ttl,
    hopCount: 0,
    timestamp: Date.now(),
    payload,
  };
}

export function shouldRelay(packet: MeshPacket, localDeviceId: string): boolean {
  if (packet.ttl <= 0) return false;
  if (packet.sourceId === localDeviceId) return false;
  if (packet.targetId === localDeviceId) return false;
  return true;
}

export function decrementTTL(packet: MeshPacket): MeshPacket {
  return {
    ...packet,
    ttl: packet.ttl - 1,
    hopCount: packet.hopCount + 1,
  };
}

function generatePacketId(): string {
  const bytes = new Uint8Array(8);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
