export interface StudentGroup {
  id: string;
  name: string;
  leadId: string;
  memberIds: string[];
  createdAt: string;
  lastActivityAt: string;
  country: string;
}

export interface GroupMemberSummary {
  studentId: string;
  name: string;
  status: string;
  batteryLevel: number;
  lastSeen: string;
}

export interface GroupReport {
  groupId: string;
  leadId: string;
  memberCount: number;
  memberSummaries: GroupMemberSummary[];
  latitude: number;
  longitude: number;
  timestamp: string;
}
