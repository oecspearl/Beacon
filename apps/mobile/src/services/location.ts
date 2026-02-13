import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BACKGROUND_LOCATION_TASK = "beacon-background-location";

export interface BeaconLocation {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Background task definition
// ---------------------------------------------------------------------------

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error("[Location] Background task error:", error.message);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    if (locations && locations.length > 0) {
      // In production this would push to the queue service.
      // For now we just log -- the panic service hooks into this.
      console.log(
        "[Location] Background update:",
        locations.map((l) => ({
          lat: l.coords.latitude,
          lon: l.coords.longitude,
        })),
      );
    }
  }
});

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

export async function requestLocationPermissions(): Promise<boolean> {
  const { status: foreground } =
    await Location.requestForegroundPermissionsAsync();
  if (foreground !== "granted") return false;

  const { status: background } =
    await Location.requestBackgroundPermissionsAsync();
  return background === "granted";
}

// ---------------------------------------------------------------------------
// Foreground location
// ---------------------------------------------------------------------------

/**
 * Get the device's current location with high accuracy.
 * Returns null if permissions are not granted.
 */
export async function getCurrentLocation(): Promise<BeaconLocation | null> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== "granted") {
    const granted = await requestLocationPermissions();
    if (!granted) return null;
  }

  try {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });

    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      altitude: loc.coords.altitude,
      accuracy: loc.coords.accuracy,
      heading: loc.coords.heading,
      speed: loc.coords.speed,
      timestamp: loc.timestamp,
    };
  } catch (err) {
    console.error("[Location] Failed to get current location:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Background tracking
// ---------------------------------------------------------------------------

/**
 * Start continuous background location tracking.
 * Used during crisis mode and active panic events.
 */
export async function startBackgroundTracking(): Promise<boolean> {
  const granted = await requestLocationPermissions();
  if (!granted) return false;

  const isTracking = await Location.hasStartedLocationUpdatesAsync(
    BACKGROUND_LOCATION_TASK,
  ).catch(() => false);

  if (isTracking) return true;

  try {
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 10_000, // every 10 seconds
      distanceInterval: 10, // or every 10 metres
      deferredUpdatesInterval: 10_000,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Beacon",
        notificationBody: "Tracking your location for safety",
        notificationColor: "#3b82f6",
      },
    });
    return true;
  } catch (err) {
    console.error("[Location] Failed to start background tracking:", err);
    return false;
  }
}

/**
 * Stop background location tracking.
 */
export async function stopBackgroundTracking(): Promise<void> {
  const isTracking = await Location.hasStartedLocationUpdatesAsync(
    BACKGROUND_LOCATION_TASK,
  ).catch(() => false);

  if (isTracking) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}

// ---------------------------------------------------------------------------
// Distance calculation (Haversine)
// ---------------------------------------------------------------------------

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate the great-circle distance between two coordinates in kilometres.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}
