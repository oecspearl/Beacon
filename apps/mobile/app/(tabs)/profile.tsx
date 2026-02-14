import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../../src/stores/app-store";
import { useConnectionStore } from "../../src/stores/connection-store";

// ---------------------------------------------------------------------------
// Readiness score calculation
// ---------------------------------------------------------------------------

function calculateReadiness(opts: {
  isRegistered: boolean;
  gpsEnabled: boolean;
  smsAvailable: boolean;
  dataConnected: boolean;
}): number {
  let score = 0;
  if (opts.isRegistered) score += 40;
  if (opts.gpsEnabled) score += 25;
  if (opts.smsAvailable) score += 20;
  if (opts.dataConnected) score += 15;
  return score;
}

function getReadinessColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

// ---------------------------------------------------------------------------
// Device info row component
// ---------------------------------------------------------------------------

interface DeviceInfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  active: boolean;
}

function DeviceInfoRow({ icon, label, value, active }: DeviceInfoRowProps) {
  return (
    <View style={styles.deviceRow}>
      <Ionicons name={icon} size={20} color={active ? "#22c55e" : "#6b7280"} />
      <Text style={styles.deviceLabel}>{label}</Text>
      <Text style={[styles.deviceValue, { color: active ? "#22c55e" : "#ef4444" }]}>
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Settings link component
// ---------------------------------------------------------------------------

interface SettingsLinkProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

function SettingsLink({ icon, label, onPress }: SettingsLinkProps) {
  return (
    <TouchableOpacity style={styles.settingsLink} onPress={onPress} activeOpacity={0.6}>
      <Ionicons name={icon} size={20} color="#94a3b8" />
      <Text style={styles.settingsLinkText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#64748b" />
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const isRegistered = useAppStore((s) => s.isRegistered);
  const profile = useAppStore((s) => s.studentProfile);

  const gpsEnabled = useConnectionStore((s) => s.gpsEnabled);
  const smsAvailable = useConnectionStore((s) => s.smsAvailable);
  const dataConnected = useConnectionStore((s) => s.dataConnected);
  const meshActive = useConnectionStore((s) => s.meshActive);

  const readiness = calculateReadiness({
    isRegistered,
    gpsEnabled,
    smsAvailable,
    dataConnected,
  });
  const readinessColor = getReadinessColor(readiness);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={36} color="#3b82f6" />
          </View>
          <Text style={styles.profileName}>
            {profile ? `${profile.firstName} ${profile.lastName}` : "Not Registered"}
          </Text>
          {profile && (
            <Text style={styles.profileDetail}>
              {profile.institution} -- {profile.hostCountry}
            </Text>
          )}

          {/* Registration status */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isRegistered ? "#22c55e20" : "#f59e0b20",
              },
            ]}
          >
            <Ionicons
              name={isRegistered ? "checkmark-circle" : "alert-circle"}
              size={16}
              color={isRegistered ? "#22c55e" : "#f59e0b"}
            />
            <Text
              style={[
                styles.statusBadgeText,
                { color: isRegistered ? "#22c55e" : "#f59e0b" },
              ]}
            >
              {isRegistered ? "Registered" : "Registration Incomplete"}
            </Text>
          </View>

          {!isRegistered && (
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push("/registration")}
              activeOpacity={0.7}
            >
              <Text style={styles.registerButtonText}>Complete Registration</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Readiness score */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Readiness Score</Text>
          <View style={styles.readinessCard}>
            <View style={styles.readinessHeader}>
              <Text style={[styles.readinessScore, { color: readinessColor }]}>
                {readiness}%
              </Text>
              <Text style={styles.readinessLabel}>Emergency Ready</Text>
            </View>
            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${readiness}%`, backgroundColor: readinessColor },
                ]}
              />
            </View>
            {/* Checklist */}
            <View style={styles.checklistContainer}>
              <ChecklistItem
                label="Profile registered"
                done={isRegistered}
              />
              <ChecklistItem label="GPS enabled" done={gpsEnabled} />
              <ChecklistItem label="SMS available" done={smsAvailable} />
              <ChecklistItem
                label="Data connected"
                done={dataConnected}
              />
            </View>
          </View>
        </View>

        {/* Device info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Status</Text>
          <View style={styles.card}>
            <DeviceInfoRow
              icon="navigate"
              label="GPS"
              value={gpsEnabled ? "Active" : "Disabled"}
              active={gpsEnabled}
            />
            <View style={styles.divider} />
            <DeviceInfoRow
              icon="bluetooth"
              label="Bluetooth Mesh"
              value={meshActive ? "Active" : "Inactive"}
              active={meshActive}
            />
            <View style={styles.divider} />
            <DeviceInfoRow
              icon="chatbox-ellipses"
              label="SMS"
              value={smsAvailable ? "Available" : "Unavailable"}
              active={smsAvailable}
            />
            <View style={styles.divider} />
            <DeviceInfoRow
              icon="wifi"
              label="Data"
              value={dataConnected ? "Connected" : "Offline"}
              active={dataConnected}
            />
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <SettingsLink
              icon="notifications-outline"
              label="Notifications"
              onPress={() => {
                Alert.alert(
                  "Notifications",
                  "Push notifications for emergency alerts, check-in reminders, and coordination messages are enabled by default.\n\nTo manage notification permissions, go to your device Settings.",
                  [
                    { text: "Open Settings", onPress: () => Linking.openSettings() },
                    { text: "OK" },
                  ],
                );
              }}
            />
            <View style={styles.divider} />
            <SettingsLink
              icon="lock-closed-outline"
              label="Security & Privacy"
              onPress={() => {
                Alert.alert(
                  "Security & Privacy",
                  "Your data is stored securely on this device and only shared with the OECS Coordination Centre during emergencies.\n\n\u2022 Location data is only transmitted during panic events or check-ins\n\u2022 Audio recordings are stored locally and shared with coordinators\n\u2022 Messages are encrypted in transit\n\u2022 Medical information is only accessed during emergencies",
                );
              }}
            />
            <View style={styles.divider} />
            <SettingsLink
              icon="language-outline"
              label="Language"
              onPress={() => {
                Alert.alert(
                  "Language",
                  "Beacon currently supports English. Additional languages (Spanish, French, Dutch) will be available in future updates for all OECS member states.",
                );
              }}
            />
            <View style={styles.divider} />
            <SettingsLink
              icon="help-circle-outline"
              label="Help & Support"
              onPress={() => {
                Alert.alert(
                  "Help & Support",
                  "For emergency assistance, use the SOS button on the home screen.\n\nFor technical support or feedback:\n\u2022 Email: support@oecs-beacon.org\n\u2022 Phone: +1-758-455-6327\n\nIf you are in immediate danger, always call local emergency services first.",
                );
              }}
            />
            <View style={styles.divider} />
            <SettingsLink
              icon="information-circle-outline"
              label="About Beacon"
              onPress={() => {
                Alert.alert(
                  "About Beacon",
                  "Beacon v0.1.0\n\nOECS Student Emergency Response System\n\nBeacon helps OECS students studying abroad stay safe during emergencies. Features include SOS alerts, real-time location sharing, multi-channel communication (Data, SMS, Mesh), and coordination with emergency response teams.\n\nDeveloped for the Organisation of Eastern Caribbean States (OECS).",
                );
              }}
            />
          </View>
        </View>

        {/* App version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Beacon v0.1.0</Text>
          <Text style={styles.versionSubtext}>
            OECS Student Emergency Response System
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Checklist item component
// ---------------------------------------------------------------------------

function ChecklistItem({ label, done }: { label: string; done: boolean }) {
  return (
    <View style={styles.checklistItem}>
      <Ionicons
        name={done ? "checkmark-circle" : "ellipse-outline"}
        size={18}
        color={done ? "#22c55e" : "#64748b"}
      />
      <Text style={[styles.checklistLabel, done && styles.checklistDone]}>
        {label}
      </Text>
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
    paddingBottom: 40,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#e2e8f0",
  },
  profileCard: {
    backgroundColor: "#16213e",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginTop: 12,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#3b82f620",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#e2e8f0",
  },
  profileDetail: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  registerButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 14,
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
  card: {
    backgroundColor: "#16213e",
    borderRadius: 14,
    padding: 16,
  },
  readinessCard: {
    backgroundColor: "#16213e",
    borderRadius: 14,
    padding: 20,
  },
  readinessHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 12,
  },
  readinessScore: {
    fontSize: 36,
    fontWeight: "800",
  },
  readinessLabel: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "500",
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#0f0f23",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  checklistContainer: {
    gap: 8,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checklistLabel: {
    fontSize: 13,
    color: "#94a3b8",
  },
  checklistDone: {
    color: "#e2e8f0",
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    gap: 12,
  },
  deviceLabel: {
    flex: 1,
    fontSize: 14,
    color: "#e2e8f0",
  },
  deviceValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#1e293b",
    marginVertical: 10,
  },
  settingsLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 12,
  },
  settingsLinkText: {
    flex: 1,
    fontSize: 14,
    color: "#e2e8f0",
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 32,
    paddingBottom: 16,
  },
  versionText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  versionSubtext: {
    fontSize: 11,
    color: "#475569",
    marginTop: 2,
  },
});
