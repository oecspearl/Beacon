import { getCurrentLocation, startBackgroundTracking, stopBackgroundTracking, setTrackingStudentId } from "./location";
import { sendPanicSMS } from "./sms";
import { enqueue } from "./queue";
import { getDatabase } from "./database";
import { useAppStore } from "../stores/app-store";
import { startRecording, stopRecording, RECORDING_DURATION_MS, type RecordingHandle } from "./audio";
import { getBatteryLevel } from "./device-info";
import type { BeaconLocation } from "./location";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PanicEvent {
  id: number;
  studentId: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  audioUri: string | null;
  channelsUsed: string[];
  resolved: boolean;
  createdAt: string;
  resolvedAt: string | null;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _activePanicId: number | null = null;
let _audioRecordingUri: string | null = null;
let _activeRecording: RecordingHandle | null = null;
let _recordingTimer: ReturnType<typeof setTimeout> | null = null;

// ---------------------------------------------------------------------------
// Panic activation
// ---------------------------------------------------------------------------

/**
 * Activate a panic event. This:
 *  1. Captures the current GPS location
 *  2. Starts background location tracking
 *  3. Queues an SOS alert on all available channels
 *  4. Begins audio recording via expo-av
 *  5. Persists the event to the local database
 */
export async function activatePanic(studentId: string): Promise<PanicEvent | null> {
  // Prevent duplicate activations
  if (_activePanicId !== null) {
    console.warn("[Panic] Already active, ignoring duplicate activation");
    return null;
  }

  console.log("[Panic] ACTIVATING PANIC EVENT");

  // 1. Capture GPS and battery level in parallel
  let location: BeaconLocation | null = null;
  let batteryLevel: number | null = null;
  try {
    [location, batteryLevel] = await Promise.all([
      getCurrentLocation(),
      getBatteryLevel(),
    ]);
  } catch {
    console.error("[Panic] Could not get GPS location or battery");
  }

  // 2. Start background tracking (sends real-time location to API)
  setTrackingStudentId(studentId);
  await startBackgroundTracking();

  // 3. Persist to database
  const db = await getDatabase();
  const channelsUsed: string[] = [];

  const result = await db.runAsync(
    `INSERT INTO panic_events (student_id, latitude, longitude, accuracy, channels_used)
     VALUES (?, ?, ?, ?, ?)`,
    [
      studentId,
      location?.latitude ?? null,
      location?.longitude ?? null,
      location?.accuracy ?? null,
      "[]",
    ],
  );

  _activePanicId = result.lastInsertRowId;

  // 4. Queue SOS on data channel (includes battery level)
  try {
    await enqueue(
      JSON.stringify({
        type: "SOS",
        studentId,
        location: location
          ? { lat: location.latitude, lon: location.longitude, acc: location.accuracy }
          : null,
        batteryLevel,
        timestamp: new Date().toISOString(),
      }),
      10, // highest priority
      "data",
    );
    channelsUsed.push("data");
  } catch (err) {
    console.error("[Panic] Failed to enqueue data SOS:", err);
  }

  // 5. Send SMS SOS
  try {
    const sent = await sendPanicSMS(location, studentId);
    if (sent) channelsUsed.push("sms");
  } catch (err) {
    console.error("[Panic] Failed to send SMS SOS:", err);
  }

  // 6. Update database with channels used
  await db.runAsync(
    `UPDATE panic_events SET channels_used = ? WHERE id = ?`,
    [JSON.stringify(channelsUsed), _activePanicId],
  );

  // 7. Update global state
  useAppStore.getState().activatePanic();

  // 8. Start audio recording
  try {
    _activeRecording = await startRecording();
    console.log("[Panic] Audio recording started");

    // Auto-stop recording after RECORDING_DURATION_MS (60s)
    _recordingTimer = setTimeout(async () => {
      if (_activeRecording) {
        try {
          const uri = await stopRecording(_activeRecording);
          _audioRecordingUri = uri;
          _activeRecording = null;
          _recordingTimer = null;
          console.log("[Panic] Audio recording auto-stopped after timeout");

          // Persist the audio URI to the database
          if (_activePanicId !== null && uri) {
            const innerDb = await getDatabase();
            await innerDb.runAsync(
              `UPDATE panic_events SET audio_uri = ? WHERE id = ?`,
              [uri, _activePanicId],
            );
          }
        } catch (stopErr) {
          console.error("[Panic] Error auto-stopping recording:", stopErr);
        }
      }
    }, RECORDING_DURATION_MS);
  } catch (audioErr) {
    console.error("[Panic] Could not start audio recording:", audioErr);
    _activeRecording = null;
  }

  const event: PanicEvent = {
    id: _activePanicId,
    studentId,
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
    accuracy: location?.accuracy ?? null,
    audioUri: _audioRecordingUri,
    channelsUsed,
    resolved: false,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };

  console.log("[Panic] Event created:", event.id);
  return event;
}

// ---------------------------------------------------------------------------
// Panic deactivation
// ---------------------------------------------------------------------------

/**
 * Deactivate the current panic event.
 */
export async function deactivatePanic(): Promise<void> {
  if (_activePanicId === null) {
    console.warn("[Panic] No active panic to deactivate");
    return;
  }

  console.log("[Panic] Deactivating panic event:", _activePanicId);

  // Stop background tracking
  setTrackingStudentId(null);
  await stopBackgroundTracking();

  // Stop audio recording if still active
  if (_recordingTimer) {
    clearTimeout(_recordingTimer);
    _recordingTimer = null;
  }
  if (_activeRecording) {
    try {
      const uri = await stopRecording(_activeRecording);
      _audioRecordingUri = uri;
    } catch (audioErr) {
      console.error("[Panic] Error stopping recording on deactivation:", audioErr);
    }
    _activeRecording = null;
  }

  // Mark as resolved in database
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE panic_events SET resolved = 1, resolved_at = datetime('now'), audio_uri = ? WHERE id = ?`,
    [_audioRecordingUri, _activePanicId],
  );

  // Update global state
  useAppStore.getState().deactivatePanic();

  _activePanicId = null;
}

// ---------------------------------------------------------------------------
// Panic log retrieval
// ---------------------------------------------------------------------------

/**
 * Retrieve all panic events for a student, most recent first.
 */
export async function getPanicLog(studentId?: string): Promise<PanicEvent[]> {
  const db = await getDatabase();

  const query = studentId
    ? `SELECT * FROM panic_events WHERE student_id = ? ORDER BY created_at DESC`
    : `SELECT * FROM panic_events ORDER BY created_at DESC`;

  const args = studentId ? [studentId] : [];
  const rows = await db.getAllAsync(query, args);

  return (rows as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as number,
    studentId: row.student_id as string,
    latitude: row.latitude as number | null,
    longitude: row.longitude as number | null,
    accuracy: row.accuracy as number | null,
    audioUri: row.audio_uri as string | null,
    channelsUsed: JSON.parse((row.channels_used as string) || "[]"),
    resolved: (row.resolved as number) === 1,
    createdAt: row.created_at as string,
    resolvedAt: row.resolved_at as string | null,
  }));
}

/**
 * Returns whether a panic event is currently active.
 */
export function isPanicActive(): boolean {
  return _activePanicId !== null;
}
