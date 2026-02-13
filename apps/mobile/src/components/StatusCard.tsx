import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppStore, type StatusCode } from "../stores/app-store";

// ---------------------------------------------------------------------------
// Status metadata
// ---------------------------------------------------------------------------

interface StatusMeta {
  label: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const STATUS_MAP: Record<StatusCode, StatusMeta> = {
  safe: {
    label: "Safe",
    color: "#22c55e",
    icon: "shield-checkmark",
    description: "You are safe and accounted for",
  },
  moving: {
    label: "Moving",
    color: "#3b82f6",
    icon: "walk",
    description: "You are on the move",
  },
  sheltering: {
    label: "Sheltering",
    color: "#a855f7",
    icon: "home",
    description: "You are sheltering in place",
  },
  need_assistance: {
    label: "Need Help",
    color: "#f59e0b",
    icon: "hand-left",
    description: "You need non-urgent assistance",
  },
  urgent: {
    label: "URGENT",
    color: "#ef4444",
    icon: "warning",
    description: "You need immediate help",
  },
  unknown: {
    label: "Not Checked In",
    color: "#6b7280",
    icon: "help-circle",
    description: "Tap to report your status",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StatusCard() {
  const currentStatus = useAppStore((s) => s.currentStatus);
  const lastCheckIn = useAppStore((s) => s.lastCheckIn);
  const router = useRouter();

  const meta = STATUS_MAP[currentStatus];

  const formattedTime = lastCheckIn
    ? new Date(lastCheckIn).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: meta.color }]}
      onPress={() => router.push("/checkin")}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: meta.color + "20" }]}>
          <Ionicons name={meta.icon} size={32} color={meta.color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.statusLabel, { color: meta.color }]}>
            {meta.label}
          </Text>
          <Text style={styles.description}>{meta.description}</Text>
          {formattedTime && (
            <Text style={styles.timestamp}>Last check-in: {formattedTime}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#16213e",
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
});
