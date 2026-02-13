import type { CommunicationChannel } from "../types/status.js";

/**
 * Channel priority order — lower index = higher priority.
 * Data first for bandwidth, mesh for local, SMS as fallback.
 */
export const CHANNEL_PRIORITY: CommunicationChannel[] = [
  "data",
  "mesh",
  "sms",
  "satellite",
];

export const SMS_ENCODING_PREFIX = "BCN";
export const SMS_FIELD_SEPARATOR = "|";
export const SMS_MAX_LENGTH = 160;

/** Pre-configured coordination centre phone numbers */
export const DEFAULT_COORDINATION_NUMBERS = [
  "+1268XXXXXXX", // Antigua (placeholder)
  "+1767XXXXXXX", // Dominica (placeholder)
];
