export interface PanicEvent {
  id: string;
  studentId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  batteryLevel: number;
  timestamp: string;
  audioRecordingUri: string | null;
  transmittedVia: ("data" | "mesh" | "sms")[];
  resolvedAt: string | null;
}

export interface EmergencyProtocol {
  id: string;
  countryCode: string;
  version: number;
  lastUpdated: string;
  sections: ProtocolSection[];
}

export interface ProtocolSection {
  id: string;
  title: string;
  type: "info" | "decision_tree" | "contact_list" | "checklist";
  content: string; // Markdown content for info type
  decisionTree?: DecisionNode;
  contacts?: EmergencyContact[];
  items?: ChecklistItem[];
}

export interface DecisionNode {
  question: string;
  options: {
    label: string;
    nextNode?: DecisionNode;
    action?: string; // Final instruction
  }[];
}

export interface EmergencyContact {
  name: string;
  type: "embassy" | "consulate" | "hospital" | "police" | "fire" | "hotline";
  phone: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
}

export interface ChecklistItem {
  label: string;
  description: string | null;
  critical: boolean;
}

export type OperationMode = "normal" | "alert" | "crisis";
