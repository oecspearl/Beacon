// ---------------------------------------------------------------------------
// Audio Recording Service (stub)
//
// expo-av is excluded from the current build to avoid native CMake errors.
// This stub provides the same API surface so the rest of the app compiles.
// Audio recording will be a no-op until expo-av is re-added.
// ---------------------------------------------------------------------------

/** Default recording duration in milliseconds (60 seconds). */
export const RECORDING_DURATION_MS = 60_000;

/** Opaque recording handle (stub). */
export type RecordingHandle = { _stub: true };

/**
 * Start an audio recording session (stub — no-op).
 */
export async function startRecording(): Promise<RecordingHandle> {
  console.warn("[Audio] Recording not available — expo-av is not installed");
  return { _stub: true };
}

/**
 * Stop an in-progress recording (stub — no-op).
 */
export async function stopRecording(
  _recording: RecordingHandle,
): Promise<string | null> {
  console.warn("[Audio] Stop recording not available — expo-av is not installed");
  return null;
}
