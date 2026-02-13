import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DecisionNode {
  id: string;
  question: string;
  options: DecisionOption[];
}

interface DecisionOption {
  label: string;
  nextNodeId: string | null; // null means leaf / action
  action?: string;
  isUrgent?: boolean;
}

interface ProtocolStep {
  number: number;
  title: string;
  description: string;
  isCompleted: boolean;
}

// ---------------------------------------------------------------------------
// Sample protocol data (would come from database in production)
// ---------------------------------------------------------------------------

const SAMPLE_STEPS: ProtocolStep[] = [
  {
    number: 1,
    title: "Assess Your Immediate Safety",
    description:
      "Determine whether you are in immediate danger. If you are injured or in a life-threatening situation, activate the SOS panic button immediately.",
    isCompleted: false,
  },
  {
    number: 2,
    title: "Move to Safe Location",
    description:
      "If safe to do so, move to the nearest designated shelter or assembly point. Refer to the map for marked safe zones in your area.",
    isCompleted: false,
  },
  {
    number: 3,
    title: "Check In With Coordination Centre",
    description:
      'Use the Check In feature to report your status. Select "Safe" if you are secure, or "Need Assistance" if you require non-urgent help.',
    isCompleted: false,
  },
  {
    number: 4,
    title: "Contact Local Emergency Services",
    description:
      "If the situation requires it, contact local emergency services using the numbers provided below. Stay on the line and provide your GPS coordinates.",
    isCompleted: false,
  },
  {
    number: 5,
    title: "Document the Situation",
    description:
      "If it is safe to do so, take photos or notes about the situation. This information may be valuable for emergency responders.",
    isCompleted: false,
  },
  {
    number: 6,
    title: "Stay Connected",
    description:
      "Keep Beacon running in the background. Your location will be periodically shared with the coordination centre. Conserve your battery if possible.",
    isCompleted: false,
  },
];

const SAMPLE_DECISION_TREE: DecisionNode[] = [
  {
    id: "root",
    question: "Are you in immediate physical danger?",
    options: [
      { label: "Yes, I am in danger", nextNodeId: "danger", isUrgent: true },
      { label: "No, I am safe for now", nextNodeId: "safe" },
    ],
  },
  {
    id: "danger",
    question: "What type of danger are you facing?",
    options: [
      {
        label: "Natural disaster (hurricane, flood, earthquake)",
        nextNodeId: null,
        action: "Activate SOS and follow the shelter protocol for your area. Move to high ground for floods, interior rooms for hurricanes.",
      },
      {
        label: "Medical emergency",
        nextNodeId: null,
        action: "Activate SOS. Call local emergency number. If possible, send your GPS coordinates via check-in.",
      },
      {
        label: "Security threat",
        nextNodeId: null,
        action: "Move away from the threat if safe. Activate SOS silently. Do not confront. Contact embassy if possible.",
        isUrgent: true,
      },
    ],
  },
  {
    id: "safe",
    question: "Do you have a stable connection?",
    options: [
      {
        label: "Yes, I have data or WiFi",
        nextNodeId: null,
        action: "Check in via the app. Monitor the Messages tab for coordination updates. Keep your phone charged.",
      },
      {
        label: "No, limited or no connection",
        nextNodeId: null,
        action: "Try SMS check-in as a fallback. Enable Bluetooth mesh to relay messages through nearby Beacon users. Conserve battery.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ProtocolDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [steps, setSteps] = useState<ProtocolStep[]>(SAMPLE_STEPS);
  const [currentDecisionNode, setCurrentDecisionNode] = useState<string>("root");
  const [decisionResult, setDecisionResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"steps" | "decision">("steps");

  const toggleStep = (stepNumber: number) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.number === stepNumber ? { ...s, isCompleted: !s.isCompleted } : s,
      ),
    );
  };

  const handleDecision = (option: DecisionOption) => {
    if (option.nextNodeId) {
      setCurrentDecisionNode(option.nextNodeId);
    } else if (option.action) {
      setDecisionResult(option.action);
    }
  };

  const resetDecisionTree = () => {
    setCurrentDecisionNode("root");
    setDecisionResult(null);
  };

  const currentNode = SAMPLE_DECISION_TREE.find(
    (n) => n.id === currentDecisionNode,
  );
  const completedSteps = steps.filter((s) => s.isCompleted).length;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#e2e8f0" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            Protocol: {id}
          </Text>
          <Text style={styles.subtitle}>
            {completedSteps}/{steps.length} steps completed
          </Text>
        </View>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "steps" && styles.tabActive]}
          onPress={() => setActiveTab("steps")}
        >
          <Ionicons
            name="list"
            size={18}
            color={activeTab === "steps" ? "#3b82f6" : "#64748b"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "steps" && styles.tabTextActive,
            ]}
          >
            Steps
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "decision" && styles.tabActive]}
          onPress={() => setActiveTab("decision")}
        >
          <Ionicons
            name="git-branch"
            size={18}
            color={activeTab === "decision" ? "#3b82f6" : "#64748b"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "decision" && styles.tabTextActive,
            ]}
          >
            Decision Tree
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "steps" ? (
          // Steps view
          <View style={styles.stepsContainer}>
            {/* Progress indicator */}
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(completedSteps / steps.length) * 100}%`,
                  },
                ]}
              />
            </View>

            {steps.map((step) => (
              <TouchableOpacity
                key={step.number}
                style={[
                  styles.stepCard,
                  step.isCompleted && styles.stepCardCompleted,
                ]}
                onPress={() => toggleStep(step.number)}
                activeOpacity={0.7}
              >
                <View style={styles.stepLeft}>
                  <View
                    style={[
                      styles.stepCheck,
                      step.isCompleted && styles.stepCheckDone,
                    ]}
                  >
                    {step.isCompleted ? (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    ) : (
                      <Text style={styles.stepNumber}>{step.number}</Text>
                    )}
                  </View>
                  {step.number < steps.length && (
                    <View
                      style={[
                        styles.stepLine,
                        step.isCompleted && styles.stepLineDone,
                      ]}
                    />
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text
                    style={[
                      styles.stepTitle,
                      step.isCompleted && styles.stepTitleDone,
                    ]}
                  >
                    {step.title}
                  </Text>
                  <Text style={styles.stepDescription}>
                    {step.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          // Decision tree view
          <View style={styles.decisionContainer}>
            {decisionResult ? (
              // Result
              <View style={styles.decisionResult}>
                <View style={styles.resultIconCircle}>
                  <Ionicons
                    name="checkmark-circle"
                    size={40}
                    color="#22c55e"
                  />
                </View>
                <Text style={styles.resultTitle}>Recommended Action</Text>
                <Text style={styles.resultText}>{decisionResult}</Text>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={resetDecisionTree}
                >
                  <Ionicons name="refresh" size={18} color="#3b82f6" />
                  <Text style={styles.resetButtonText}>Start Over</Text>
                </TouchableOpacity>
              </View>
            ) : currentNode ? (
              // Question node
              <View style={styles.questionContainer}>
                <View style={styles.questionIconCircle}>
                  <Ionicons name="help" size={28} color="#3b82f6" />
                </View>
                <Text style={styles.questionText}>
                  {currentNode.question}
                </Text>
                <View style={styles.optionsContainer}>
                  {currentNode.options.map((option, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.optionButton,
                        option.isUrgent && styles.optionButtonUrgent,
                      ]}
                      onPress={() => handleDecision(option)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          option.isUrgent && styles.optionTextUrgent,
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={option.isUrgent ? "#ef4444" : "#94a3b8"}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {currentDecisionNode !== "root" && (
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={resetDecisionTree}
                  >
                    <Ionicons name="arrow-back" size={18} color="#3b82f6" />
                    <Text style={styles.resetButtonText}>Go Back</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 12,
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
    fontSize: 18,
    fontWeight: "700",
    color: "#e2e8f0",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#0f0f23",
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: "#16213e",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  tabTextActive: {
    color: "#3b82f6",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Steps styles
  stepsContainer: {},
  progressBar: {
    height: 4,
    backgroundColor: "#0f0f23",
    borderRadius: 2,
    marginBottom: 20,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#22c55e",
    borderRadius: 2,
  },
  stepCard: {
    flexDirection: "row",
    marginBottom: 4,
  },
  stepCardCompleted: {
    opacity: 0.7,
  },
  stepLeft: {
    alignItems: "center",
    width: 36,
    marginRight: 14,
  },
  stepCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#334155",
  },
  stepCheckDone: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#1e293b",
    marginVertical: 4,
  },
  stepLineDone: {
    backgroundColor: "#22c55e50",
  },
  stepContent: {
    flex: 1,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#e2e8f0",
    marginBottom: 4,
  },
  stepTitleDone: {
    textDecorationLine: "line-through",
    color: "#94a3b8",
  },
  stepDescription: {
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 19,
  },

  // Decision tree styles
  decisionContainer: {
    paddingTop: 20,
  },
  questionContainer: {
    alignItems: "center",
  },
  questionIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#3b82f620",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#e2e8f0",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 28,
  },
  optionsContainer: {
    width: "100%",
    gap: 10,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  optionButtonUrgent: {
    borderColor: "#ef444440",
    backgroundColor: "#ef444410",
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: "#e2e8f0",
    fontWeight: "500",
    marginRight: 8,
  },
  optionTextUrgent: {
    color: "#fca5a5",
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    gap: 6,
  },
  resetButtonText: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "600",
  },

  // Decision result
  decisionResult: {
    alignItems: "center",
    paddingTop: 20,
  },
  resultIconCircle: {
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 12,
  },
  resultText: {
    fontSize: 15,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 22,
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 20,
    overflow: "hidden",
  },
});
