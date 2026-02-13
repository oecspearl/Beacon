import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore, type StudentProfile } from "../src/stores/app-store";

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

const STEPS = [
  { title: "Personal Info", icon: "person" as const },
  { title: "Programme", icon: "school" as const },
  { title: "Emergency Contacts", icon: "call" as const },
  { title: "Medical Info", icon: "medkit" as const },
];

// ---------------------------------------------------------------------------
// Form data
// ---------------------------------------------------------------------------

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  institution: string;
  programme: string;
  hostCountry: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  emergencyEmail: string;
  bloodType: string;
  allergies: string;
  medicalConditions: string;
  medications: string;
}

const INITIAL_FORM: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  nationality: "",
  institution: "",
  programme: "",
  hostCountry: "",
  emergencyName: "",
  emergencyRelation: "",
  emergencyPhone: "",
  emergencyEmail: "",
  bloodType: "",
  allergies: "",
  medicalConditions: "",
  medications: "",
};

// ---------------------------------------------------------------------------
// InputField component
// ---------------------------------------------------------------------------

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  required?: boolean;
  multiline?: boolean;
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  required = false,
  multiline = false,
}: InputFieldProps) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#475569"
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function RegistrationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setStudentProfile = useAppStore((s) => s.setStudentProfile);

  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);

  const updateField = (field: keyof FormData) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = () => {
    if (!form.firstName || !form.lastName || !form.email) {
      Alert.alert(
        "Incomplete",
        "Please fill in at least your name and email to complete registration.",
      );
      return;
    }

    const profile: StudentProfile = {
      id: `STU-${Date.now().toString(36).toUpperCase()}`,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      nationality: form.nationality,
      institution: form.institution,
      programme: form.programme,
      hostCountry: form.hostCountry,
      bloodType: form.bloodType || undefined,
      allergies: form.allergies ? form.allergies.split(",").map((s) => s.trim()) : undefined,
      medicalConditions: form.medicalConditions
        ? form.medicalConditions.split(",").map((s) => s.trim())
        : undefined,
      medications: form.medications
        ? form.medications.split(",").map((s) => s.trim())
        : undefined,
      emergencyContacts: form.emergencyName
        ? [
            {
              name: form.emergencyName,
              relationship: form.emergencyRelation,
              phone: form.emergencyPhone,
              email: form.emergencyEmail || undefined,
            },
          ]
        : [],
      registeredAt: new Date().toISOString(),
    };

    setStudentProfile(profile);

    Alert.alert("Registration Complete", "Your profile has been saved securely on this device.", [
      { text: "Continue", onPress: () => router.back() },
    ]);
  };

  // Step content renderers
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <InputField
              label="First Name"
              value={form.firstName}
              onChangeText={updateField("firstName")}
              placeholder="Enter your first name"
              required
            />
            <InputField
              label="Last Name"
              value={form.lastName}
              onChangeText={updateField("lastName")}
              placeholder="Enter your last name"
              required
            />
            <InputField
              label="Email"
              value={form.email}
              onChangeText={updateField("email")}
              placeholder="you@university.edu"
              keyboardType="email-address"
              required
            />
            <InputField
              label="Phone"
              value={form.phone}
              onChangeText={updateField("phone")}
              placeholder="+1 234 567 890"
              keyboardType="phone-pad"
              required
            />
            <InputField
              label="Nationality"
              value={form.nationality}
              onChangeText={updateField("nationality")}
              placeholder="e.g. Barbadian"
            />
          </>
        );

      case 1:
        return (
          <>
            <InputField
              label="Institution"
              value={form.institution}
              onChangeText={updateField("institution")}
              placeholder="e.g. University of the West Indies"
              required
            />
            <InputField
              label="Programme"
              value={form.programme}
              onChangeText={updateField("programme")}
              placeholder="e.g. OECS Student Exchange 2025"
              required
            />
            <InputField
              label="Host Country"
              value={form.hostCountry}
              onChangeText={updateField("hostCountry")}
              placeholder="e.g. Cuba"
              required
            />
          </>
        );

      case 2:
        return (
          <>
            <View style={styles.stepNote}>
              <Ionicons name="information-circle" size={18} color="#3b82f6" />
              <Text style={styles.stepNoteText}>
                Add at least one emergency contact who can be reached if you activate an SOS.
              </Text>
            </View>
            <InputField
              label="Contact Name"
              value={form.emergencyName}
              onChangeText={updateField("emergencyName")}
              placeholder="Full name"
              required
            />
            <InputField
              label="Relationship"
              value={form.emergencyRelation}
              onChangeText={updateField("emergencyRelation")}
              placeholder="e.g. Parent, Sibling, Advisor"
              required
            />
            <InputField
              label="Phone Number"
              value={form.emergencyPhone}
              onChangeText={updateField("emergencyPhone")}
              placeholder="+1 234 567 890"
              keyboardType="phone-pad"
              required
            />
            <InputField
              label="Email (Optional)"
              value={form.emergencyEmail}
              onChangeText={updateField("emergencyEmail")}
              placeholder="contact@email.com"
              keyboardType="email-address"
            />
          </>
        );

      case 3:
        return (
          <>
            <View style={styles.stepNote}>
              <Ionicons name="lock-closed" size={18} color="#3b82f6" />
              <Text style={styles.stepNoteText}>
                Medical information is stored securely on your device and only shared during emergencies.
              </Text>
            </View>
            <InputField
              label="Blood Type"
              value={form.bloodType}
              onChangeText={updateField("bloodType")}
              placeholder="e.g. O+, A-, B+"
            />
            <InputField
              label="Allergies"
              value={form.allergies}
              onChangeText={updateField("allergies")}
              placeholder="Comma-separated, e.g. Penicillin, Peanuts"
              multiline
            />
            <InputField
              label="Medical Conditions"
              value={form.medicalConditions}
              onChangeText={updateField("medicalConditions")}
              placeholder="Comma-separated, e.g. Asthma, Diabetes"
              multiline
            />
            <InputField
              label="Current Medications"
              value={form.medications}
              onChangeText={updateField("medications")}
              placeholder="Comma-separated"
              multiline
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons
              name={currentStep === 0 ? "close" : "arrow-back"}
              size={24}
              color="#e2e8f0"
            />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Registration</Text>
            <Text style={styles.headerStep}>
              Step {currentStep + 1} of {STEPS.length}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.progressStep}>
              <View
                style={[
                  styles.progressDot,
                  {
                    backgroundColor:
                      i < currentStep
                        ? "#22c55e"
                        : i === currentStep
                          ? "#3b82f6"
                          : "#1e293b",
                  },
                ]}
              >
                {i < currentStep ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.progressDotText,
                      { color: i === currentStep ? "#fff" : "#64748b" },
                    ]}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              {i < STEPS.length - 1 && (
                <View
                  style={[
                    styles.progressLine,
                    {
                      backgroundColor: i < currentStep ? "#22c55e" : "#1e293b",
                    },
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        {/* Step title */}
        <View style={styles.stepHeader}>
          <Ionicons
            name={STEPS[currentStep].icon}
            size={24}
            color="#3b82f6"
          />
          <Text style={styles.stepTitle}>{STEPS[currentStep].title}</Text>
        </View>

        {/* Form fields */}
        <ScrollView
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>

        {/* Navigation buttons */}
        <View style={styles.footer}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.primaryButton, currentStep === 0 && { flex: 1 }]}
            onPress={handleNext}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryButtonText}>
              {currentStep === STEPS.length - 1 ? "Complete" : "Next"}
            </Text>
            <Ionicons
              name={
                currentStep === STEPS.length - 1
                  ? "checkmark"
                  : "arrow-forward"
              }
              size={18}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#16213e",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#e2e8f0",
  },
  headerStep: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  progressStep: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  progressDotText: {
    fontSize: 12,
    fontWeight: "700",
  },
  progressLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#e2e8f0",
  },
  stepNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#3b82f610",
    borderRadius: 10,
    padding: 14,
    gap: 10,
    marginBottom: 8,
  },
  stepNoteText: {
    flex: 1,
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 18,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 6,
  },
  required: {
    color: "#ef4444",
  },
  input: {
    backgroundColor: "#16213e",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1e293b",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#e2e8f0",
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: "top",
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
  },
  primaryButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16213e",
    borderRadius: 12,
    paddingVertical: 16,
  },
  secondaryButtonText: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "600",
  },
});
