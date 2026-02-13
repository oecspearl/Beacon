import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChannelType = "data" | "mesh" | "sms";

interface ChannelIndicatorProps {
  channel: ChannelType;
  active: boolean;
  /** Optional detail text, e.g. peer count for mesh */
  detail?: string;
}

// ---------------------------------------------------------------------------
// Channel metadata
// ---------------------------------------------------------------------------

const CHANNEL_META: Record<
  ChannelType,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  data: { label: "Data", icon: "wifi" },
  mesh: { label: "Mesh", icon: "bluetooth" },
  sms: { label: "SMS", icon: "chatbox-ellipses" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChannelIndicator({ channel, active, detail }: ChannelIndicatorProps) {
  const meta = CHANNEL_META[channel];

  return (
    <View style={styles.container}>
      <View style={[styles.dot, active ? styles.dotActive : styles.dotInactive]} />
      <Ionicons
        name={meta.icon}
        size={16}
        color={active ? "#22c55e" : "#6b7280"}
        style={styles.icon}
      />
      <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
        {meta.label}
      </Text>
      {detail ? (
        <Text style={styles.detail}>{detail}</Text>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotActive: {
    backgroundColor: "#22c55e",
  },
  dotInactive: {
    backgroundColor: "#6b7280",
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
  labelActive: {
    color: "#e2e8f0",
  },
  labelInactive: {
    color: "#6b7280",
  },
  detail: {
    fontSize: 10,
    color: "#94a3b8",
    marginLeft: 4,
  },
});
