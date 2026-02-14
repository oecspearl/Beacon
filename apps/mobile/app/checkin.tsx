import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore, type StatusCode } from "../src/stores/app-store";
import { postCheckIn } from "../src/services/api-client";
import { getCurrentLocation } from "../src/services/location";
import { getBatteryLevel } from "../src/services/device-info";

// ---------------------------------------------------------------------------
// Status button definitions
// ---------------------------------------------------------------------------

interface StatusOption {
  code: StatusCode;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    code: "safe",
    label: "Safe",
    description: "I am safe and in no danger",
    icon: "shield-checkmark",
    color: "#22c55e",
  },
  {
    code: "moving",
    label: "Moving",
    description: "I am on the move to a safe location",
    icon: "walk",
    color: "#3b82f6",
  },
  {
    code: "need_assistance",
    label: "Need Assistance",
    description: "I need non-urgent help or guidance",
    icon: "hand-left",
    color: "#f59e0b",
  },
  {
    code: "urgent",
    label: "Urgent",
    description: "I need immediate assistance",
    icon: "warning",
    color: "#ef4444",
  },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function CheckInScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setStatus = useAppStore((s) => s.setStatus);
  const currentStatus = useAppStore((s) => s.currentStatus);
  const [submitting, setSubmitting] = useState(false);

  const studentProfile = useAppStore((s) => s.studentProfile);

  const handleCheckIn = async (option: StatusOption) => {
    setSubmitting(true);

    try {
      // Update local status immediately
      setStatus(option.code);

      // Capture location
      let latitude: number | undefined;
      let longitude: number | undefined;
      try {
        const loc = await getCurrentLocation();
        if (loc) {
          latitude = loc.latitude;
          longitude = loc.longitude;
        }
      } catch {
        console.warn("[CheckIn] Could not get location");
      }

      // Capture battery level
      const batteryLevel = await getBatteryLevel().catch(() => null);

      // Send to backend API
      const studentId = studentProfile?.id ?? "unknown";
      const checkInData = {
        studentId,
        response: option.code,
        latitude,
        longitude,
        batteryLevel: batteryLevel ?? undefined,
        channel: "data" as const,
      };

      const result = await postCheckIn(checkInData);

      if (result) {
        Alert.alert(
          "Checked In",
          `Your status has been updated to "${option.label}" and shared with the coordination centre.`,
          [{ text: "OK", onPress: () => router.back() }],
        );
      } else {
        Alert.alert(
          "Saved Locally",
          `Your status has been updated to "${option.label}" but could not reach the server. It will sync when connectivity is restored.`,
          [{ text: "OK", onPress: () => router.back() }],
        );
      }
    } catch {
      Alert.alert("Error", "Failed to update your status. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Check In</Text>
          <Text style={styles.subtitle}>
            Select your current status to share with the coordination centre
          </Text>
        </View>
      </View>

      {/* Current status indicator */}
      {currentStatus !== "unknown" && (
        <View style={styles.currentStatusBar}>
          <Ionicons name="time-outline" size={16} color="#94a3b8" />
          <Text style={styles.currentStatusText}>
            Current status:{" "}
            <Text style={styles.currentStatusValue}>
              {STATUS_OPTIONS.find((o) => o.code === currentStatus)?.label ?? currentStatus}
            </Text>
          </Text>
        </View>
      )}

      {/* Status buttons */}
      <View style={styles.buttonsContainer}>
        {STATUS_OPTIONS.map((option) => {
          const isActive = currentStatus === option.code;

          return (
            <TouchableOpacity
              key={option.code}
              style={[
                styles.statusButton,
                {
                  borderColor: option.color + "40",
                  backgroundColor: isActive ? option.color + "15" : "#16213e",
                },
              ]}
              onPress={() => handleCheckIn(option)}
              activeOpacity={0.7}
              disabled={submitting}
            >
              <View
                style={[
                  styles.statusIconCircle,
                  { backgroundColor: option.color + "20" },
                ]}
              >
                <Ionicons name={option.icon} size={36} color={option.color} />
              </View>
              <Text style={[styles.statusLabel, { color: option.color }]}>
                {option.label}
              </Text>
              <Text style={styles.statusDescription}>{option.description}</Text>
              {isActive && (
                <View style={[styles.activeBadge, { backgroundColor: option.color }]}>
                  <Text style={styles.activeBadgeText}>Current</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Info text */}
      <View style={styles.infoContainer}>
        <Ionicons name="information-circle-outline" size={16} color="#64748b" />
        <Text style={styles.infoText}>
          Your check-in will be sent via the best available channel (Data, Mesh, or SMS)
          and queued if no connection is available.
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#16213e",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    alignSelf: "flex-end",
  },
  headerTextContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    lineHeight: 20,
  },
  currentStatusBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16213e",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 8,
  },
  currentStatusText: {
    fontSize: 13,
    color: "#94a3b8",
  },
  currentStatusValue: {
    fontWeight: "600",
    color: "#e2e8f0",
  },
  buttonsContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: 12,
  },
  statusButton: {
    width: "47%",
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
    position: "relative",
  },
  statusIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  statusDescription: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 16,
  },
  activeBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: "#64748b",
    lineHeight: 16,
  },
});
