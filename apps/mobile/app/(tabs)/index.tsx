import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusCard } from "../../src/components/StatusCard";
import { PanicButton } from "../../src/components/PanicButton";
import { ConnectionBar } from "../../src/components/ConnectionBar";
import { useAppStore, type OperationMode } from "../../src/stores/app-store";

// ---------------------------------------------------------------------------
// Operation mode badge config
// ---------------------------------------------------------------------------

const MODE_CONFIG: Record<
  OperationMode,
  { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  normal: { label: "Normal Operations", color: "#22c55e", icon: "radio-button-on" },
  alert: { label: "Alert Mode", color: "#f59e0b", icon: "alert-circle" },
  crisis: { label: "Crisis Mode", color: "#ef4444", icon: "warning" },
};

// ---------------------------------------------------------------------------
// Quick action definitions
// ---------------------------------------------------------------------------

interface QuickAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Check In", icon: "checkmark-circle", route: "/checkin", color: "#22c55e" },
  { label: "Group", icon: "people", route: "/messages", color: "#3b82f6" },
  { label: "Protocols", icon: "document-text", route: "/protocols", color: "#a855f7" },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const operationMode = useAppStore((s) => s.operationMode);
  const studentProfile = useAppStore((s) => s.studentProfile);
  const modeConfig = MODE_CONFIG[operationMode];

  const firstName = studentProfile?.firstName ?? "Student";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {firstName}</Text>
            <Text style={styles.subtitle}>Beacon Emergency System</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push("/messages")}
          >
            <Ionicons name="notifications-outline" size={24} color="#e2e8f0" />
          </TouchableOpacity>
        </View>

        {/* Operation mode indicator */}
        <View style={[styles.modeBar, { backgroundColor: modeConfig.color + "15" }]}>
          <Ionicons name={modeConfig.icon} size={16} color={modeConfig.color} />
          <Text style={[styles.modeText, { color: modeConfig.color }]}>
            {modeConfig.label}
          </Text>
        </View>

        {/* Status card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Status</Text>
          <StatusCard />
        </View>

        {/* Connection status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Channels</Text>
          <ConnectionBar />
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionCard}
                onPress={() => router.push(action.route as never)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: action.color + "20" },
                  ]}
                >
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Spacer for panic button */}
        <View style={{ height: 200 }} />
      </ScrollView>

      {/* Panic button -- fixed at bottom */}
      <View style={[styles.panicContainer, { paddingBottom: insets.bottom + 100 }]}>
        <PanicButton />
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "700",
    color: "#e2e8f0",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#16213e",
    justifyContent: "center",
    alignItems: "center",
  },
  modeBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  modeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#16213e",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#e2e8f0",
  },
  panicContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingTop: 12,
    // Gradient effect approximated with background
    backgroundColor: "transparent",
  },
});
