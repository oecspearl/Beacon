import * as Battery from "expo-battery";
import * as Device from "expo-device";
import { Platform } from "react-native";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DeviceInfo {
  /** Battery level 0-100 (integer) */
  batteryLevel: number | null;
  /** Whether device is currently charging */
  isCharging: boolean;
  /** Device manufacturer (e.g. "Samsung", "Apple") */
  manufacturer: string | null;
  /** Device model name (e.g. "iPhone 14", "Pixel 7") */
  modelName: string | null;
  /** OS name ("iOS" or "Android") */
  osName: string;
  /** OS version string (e.g. "17.2", "14") */
  osVersion: string;
  /** App version */
  appVersion: string;
}

// ---------------------------------------------------------------------------
// Battery
// ---------------------------------------------------------------------------

/**
 * Get the current battery level as an integer 0-100, or null if unavailable.
 */
export async function getBatteryLevel(): Promise<number | null> {
  try {
    const level = await Battery.getBatteryLevelAsync();
    // expo-battery returns -1 on simulators / when unavailable
    if (level < 0) return null;
    return Math.round(level * 100);
  } catch {
    console.warn("[DeviceInfo] Could not read battery level");
    return null;
  }
}

/**
 * Check whether the device is currently charging.
 */
export async function isCharging(): Promise<boolean> {
  try {
    const state = await Battery.getBatteryStateAsync();
    return (
      state === Battery.BatteryState.CHARGING ||
      state === Battery.BatteryState.FULL
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Device metadata
// ---------------------------------------------------------------------------

/**
 * Collect a snapshot of device information.
 * Safe to call on both physical devices and simulators.
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  const [batteryLevel, charging] = await Promise.all([
    getBatteryLevel(),
    isCharging(),
  ]);

  return {
    batteryLevel,
    isCharging: charging,
    manufacturer: Device.manufacturer,
    modelName: Device.modelName,
    osName: Platform.OS === "ios" ? "iOS" : "Android",
    osVersion: Platform.Version?.toString() ?? "unknown",
    appVersion: "0.1.0",
  };
}
