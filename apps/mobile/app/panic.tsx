import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Vibration } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../src/stores/app-store";
import { activatePanic, deactivatePanic as deactivatePanicService } from "../src/services/panic";
import type { PanicEvent } from "../src/services/panic";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TransmissionStatus = "pending" | "sending" | "sent" | "failed";

interface ChannelTransmission {
  channel: string;
  icon: keyof typeof Ionicons.glyphMap;
  status: TransmissionStatus;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function PanicScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const studentProfile = useAppStore((s) => s.studentProfile);

  // Live state
  const [gpsCoords, setGpsCoords] = useState<string>("Acquiring...");
  const [audioRecording, setAudioRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [channels, setChannels] = useState<ChannelTransmission[]>([
    { channel: "Data", icon: "wifi", status: "pending" },
    { channel: "Mesh", icon: "bluetooth", status: "pending" },
    { channel: "SMS", icon: "chatbox-ellipses", status: "pending" },
  ]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const panicEventRef = useRef<PanicEvent | null>(null);

  // Pulse animation
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    let cancelled = false;

    // Start pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 1000, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      true,
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: 1000 }),
        withTiming(0.6, { duration: 1000 }),
      ),
      -1,
      true,
    );

    // Vibrate
    Vibration.vibrate([0, 500, 500, 500], true);

    // Elapsed-time timer
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Activate panic via the real service
    const studentId = studentProfile?.id ?? "UNKNOWN";

    (async () => {
      // Mark all channels as "sending" while we await the service
      setChannels((prev) =>
        prev.map((c) => ({ ...c, status: "sending" as const })),
      );

      const event = await activatePanic(studentId);
      if (cancelled) return;

      panicEventRef.current = event;

      if (event) {
        // Display real GPS coordinates
        if (event.latitude !== null && event.longitude !== null) {
          const latDir = event.latitude >= 0 ? "N" : "S";
          const lonDir = event.longitude >= 0 ? "E" : "W";
          setGpsCoords(
            `${Math.abs(event.latitude).toFixed(4)}\u00B0${latDir}, ${Math.abs(event.longitude).toFixed(4)}\u00B0${lonDir}`,
          );
        } else {
          setGpsCoords("Unavailable");
        }

        // Audio recording is started inside activatePanic; reflect that in UI
        setAudioRecording(true);

        // Set channel statuses based on actual channelsUsed
        setChannels((prev) =>
          prev.map((c) => {
            const key = c.channel.toLowerCase(); // "data", "mesh", "sms"
            if (event.channelsUsed.includes(key)) {
              return { ...c, status: "sent" as const };
            }
            // Mesh is not implemented yet, mark as failed
            if (key === "mesh") {
              return { ...c, status: "failed" as const };
            }
            // Channel was attempted but not in channelsUsed => failed
            return { ...c, status: "failed" as const };
          }),
        );
      } else {
        // activatePanic returned null (e.g. duplicate), show what we can
        setGpsCoords("Unavailable");
        setChannels((prev) =>
          prev.map((c) => ({ ...c, status: "failed" as const })),
        );
      }
    })();

    return () => {
      cancelled = true;
      Vibration.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pulseScale, pulseOpacity, studentProfile]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const handleCancel = async () => {
    Vibration.cancel();
    if (timerRef.current) clearInterval(timerRef.current);
    setAudioRecording(false);
    await deactivatePanicService();
    router.back();
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getStatusIcon = (
    status: TransmissionStatus,
  ): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case "pending":
        return "ellipse-outline";
      case "sending":
        return "sync";
      case "sent":
        return "checkmark-circle";
      case "failed":
        return "close-circle";
    }
  };

  const getStatusColor = (status: TransmissionStatus): string => {
    switch (status) {
      case "pending":
        return "#6b7280";
      case "sending":
        return "#f59e0b";
      case "sent":
        return "#22c55e";
      case "failed":
        return "#ef4444";
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      {/* Pulsing background circle */}
      <Animated.View style={[styles.pulseCircle, pulseStyle]} />

      {/* SOS indicator */}
      <View style={styles.sosContainer}>
        <Ionicons name="warning" size={48} color="#fff" />
        <Text style={styles.sosText}>SOS ACTIVE</Text>
        <Text style={styles.sosTimer}>{formatTime(elapsedSeconds)}</Text>
      </View>

      {/* GPS coordinates */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Ionicons name="navigate" size={20} color="#fff" />
          <Text style={styles.infoLabel}>GPS Location</Text>
        </View>
        <Text style={styles.infoValue}>{gpsCoords}</Text>
      </View>

      {/* Audio recording */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Ionicons name="mic" size={20} color="#fff" />
          <Text style={styles.infoLabel}>Audio Recording</Text>
        </View>
        <View style={styles.recordingRow}>
          {audioRecording && <View style={styles.recordingDot} />}
          <Text style={styles.infoValue}>
            {audioRecording ? "Recording..." : "Starting..."}
          </Text>
        </View>
      </View>

      {/* Transmission status */}
      <View style={styles.transmissionSection}>
        <Text style={styles.transmissionTitle}>Alert Transmission</Text>
        {channels.map((ch) => (
          <View key={ch.channel} style={styles.channelRow}>
            <Ionicons name={ch.icon} size={18} color="#fff" />
            <Text style={styles.channelName}>{ch.channel}</Text>
            <View style={styles.channelStatusRow}>
              <Text style={[styles.channelStatus, { color: getStatusColor(ch.status) }]}>
                {ch.status.charAt(0).toUpperCase() + ch.status.slice(1)}
              </Text>
              <Ionicons
                name={getStatusIcon(ch.status)}
                size={18}
                color={getStatusColor(ch.status)}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Reassurance text */}
      <Text style={styles.reassurance}>
        Help is being notified. Stay where you are if it is safe to do so.
      </Text>

      {/* Cancel button */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={handleCancel}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={20} color="#fff" />
        <Text style={styles.cancelText}>Cancel Emergency</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#7f1d1d",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  pulseCircle: {
    position: "absolute",
    top: "20%",
    alignSelf: "center",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#ef4444",
  },
  sosContainer: {
    alignItems: "center",
    marginBottom: 40,
    zIndex: 10,
  },
  sosText: {
    fontSize: 36,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 4,
    marginTop: 12,
  },
  sosTimer: {
    fontSize: 20,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
  infoSection: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    zIndex: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    fontVariant: ["tabular-nums"],
  },
  recordingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ef4444",
  },
  transmissionSection: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    zIndex: 10,
  },
  transmissionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    gap: 10,
  },
  channelName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  channelStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  channelStatus: {
    fontSize: 13,
    fontWeight: "600",
  },
  reassurance: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    zIndex: 10,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    paddingVertical: 16,
    gap: 8,
    zIndex: 10,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
