import { Audio } from "expo-av";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default recording duration in milliseconds (60 seconds). */
export const RECORDING_DURATION_MS = 60_000;

// ---------------------------------------------------------------------------
// Recording lifecycle
// ---------------------------------------------------------------------------

/**
 * Start an audio recording session.
 *
 * Requests microphone permission, configures a high-quality AAC recording,
 * and begins capturing audio. Returns the Recording handle so the caller
 * can stop it later.
 */
export async function startRecording(): Promise<Audio.Recording> {
  // Request microphone permission
  const { status } = await Audio.requestPermissionsAsync();
  if (status !== "granted") {
    throw new Error("[Audio] Microphone permission not granted");
  }

  // Configure audio mode for recording
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY,
  );
  await recording.startAsync();

  console.log("[Audio] Recording started");
  return recording;
}

/**
 * Stop an in-progress recording and return the local file URI.
 *
 * @param recording - The Recording handle returned by `startRecording()`.
 * @returns The local URI of the recorded audio file, or null if unavailable.
 */
export async function stopRecording(
  recording: Audio.Recording,
): Promise<string | null> {
  try {
    await recording.stopAndUnloadAsync();

    // Reset audio mode so playback works normally again
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    const uri = recording.getURI();
    console.log("[Audio] Recording stopped, URI:", uri);
    return uri ?? null;
  } catch (err) {
    console.error("[Audio] Error stopping recording:", err);
    return null;
  }
}
