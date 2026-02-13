import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Protocol {
  id: string;
  title: string;
  category: string;
  country: string;
  countryFlag: string;
  severity: "info" | "warning" | "critical";
  summary: string;
  steps: number;
}

// ---------------------------------------------------------------------------
// Sample protocol data
// ---------------------------------------------------------------------------

const SAMPLE_PROTOCOLS: Protocol[] = [
  {
    id: "hurricane-bb",
    title: "Hurricane Response Protocol",
    category: "Natural Disaster",
    country: "Barbados",
    countryFlag: "BB",
    severity: "critical",
    summary:
      "Step-by-step actions during hurricane warnings and active hurricanes. Includes shelter locations and evacuation routes.",
    steps: 8,
  },
  {
    id: "earthquake-tt",
    title: "Earthquake Safety Protocol",
    category: "Natural Disaster",
    country: "Trinidad & Tobago",
    countryFlag: "TT",
    severity: "critical",
    summary:
      "Immediate actions during seismic events. Drop, cover, and hold procedures with local assembly points.",
    steps: 6,
  },
  {
    id: "medical-cu",
    title: "Medical Emergency Protocol",
    category: "Medical",
    country: "Cuba",
    countryFlag: "CU",
    severity: "warning",
    summary:
      "Steps to follow during a medical emergency including local hospital contacts and insurance procedures.",
    steps: 7,
  },
  {
    id: "security-jm",
    title: "Security Incident Protocol",
    category: "Security",
    country: "Jamaica",
    countryFlag: "JM",
    severity: "warning",
    summary:
      "Response procedures for security threats, theft, or civil unrest. Embassy contacts and safe zones included.",
    steps: 5,
  },
  {
    id: "flood-gd",
    title: "Flood Response Protocol",
    category: "Natural Disaster",
    country: "Grenada",
    countryFlag: "GD",
    severity: "critical",
    summary:
      "Flash flood and storm surge response. High ground locations and emergency shelter information.",
    steps: 6,
  },
  {
    id: "general-all",
    title: "General Emergency Checklist",
    category: "General",
    country: "All Countries",
    countryFlag: "UN",
    severity: "info",
    summary:
      "Universal emergency preparedness checklist applicable to all OECS programme countries.",
    steps: 10,
  },
];

// ---------------------------------------------------------------------------
// Severity badge config
// ---------------------------------------------------------------------------

const SEVERITY_CONFIG = {
  info: { label: "Info", color: "#3b82f6", bg: "#3b82f620" },
  warning: { label: "Warning", color: "#f59e0b", bg: "#f59e0b20" },
  critical: { label: "Critical", color: "#ef4444", bg: "#ef444420" },
};

// ---------------------------------------------------------------------------
// Protocol card component
// ---------------------------------------------------------------------------

function ProtocolCard({
  item,
  onPress,
}: {
  item: Protocol;
  onPress: () => void;
}) {
  const severity = SEVERITY_CONFIG[item.severity];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.severityBadge, { backgroundColor: severity.bg }]}>
          <Text style={[styles.severityText, { color: severity.color }]}>
            {severity.label}
          </Text>
        </View>
        <Text style={styles.cardCountry}>{item.country}</Text>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>

      <View style={styles.cardCategory}>
        <Ionicons name="folder-outline" size={14} color="#64748b" />
        <Text style={styles.cardCategoryText}>{item.category}</Text>
      </View>

      <Text style={styles.cardSummary} numberOfLines={2}>
        {item.summary}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.stepsIndicator}>
          <Ionicons name="git-branch-outline" size={14} color="#94a3b8" />
          <Text style={styles.stepsText}>{item.steps} steps</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#64748b" />
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ProtocolsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const renderItem = ({ item }: { item: Protocol }) => (
    <ProtocolCard
      item={item}
      onPress={() => router.push(`/protocols/${item.id}`)}
    />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#e2e8f0" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Emergency Protocols</Text>
          <Text style={styles.subtitle}>
            Country-specific emergency response guides
          </Text>
        </View>
      </View>

      {/* Protocol list */}
      <FlatList
        data={SAMPLE_PROTOCOLS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#16213e",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#e2e8f0",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#16213e",
    borderRadius: 14,
    padding: 18,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardCountry: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 6,
  },
  cardCategory: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  cardCategoryText: {
    fontSize: 12,
    color: "#64748b",
  },
  cardSummary: {
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 19,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    paddingTop: 10,
  },
  stepsIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stepsText: {
    fontSize: 12,
    color: "#94a3b8",
  },
});
