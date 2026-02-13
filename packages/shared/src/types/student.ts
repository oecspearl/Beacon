import { z } from "zod";

export const StudentRegistrationSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().min(1),
  nationality: z.string(),
  oecsState: z.string(),
  passportNumber: z.string(),
  programmeOfStudy: z.string(),
  hostInstitution: z.string(),
  hostCountry: z.string(),
  inCountryAddress: z.string().optional(),
  inCountryPhone: z.string().optional(),
  emergencyContacts: z.array(
    z.object({
      name: z.string(),
      relationship: z.string(),
      phone: z.string(),
      email: z.string().email().optional(),
      isInCountry: z.boolean(),
    })
  ).min(2),
  bloodType: z.string().optional(),
  medicalConditions: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  photoUri: z.string().optional(),
  registeredAt: z.string().datetime(),
  lastVerifiedAt: z.string().datetime().optional(),
});

export type StudentRegistration = z.infer<typeof StudentRegistrationSchema>;

export interface StudentProfile extends StudentRegistration {
  readinessScore: number;
  walkthroughCompleted: boolean;
  lastSyncedAt: string | null;
}

export interface StudentLocation {
  studentId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  timestamp: string;
  source: "gps" | "network" | "mesh";
}

export interface StudentDevice {
  studentId: string;
  platform: "ios" | "android";
  osVersion: string;
  appVersion: string;
  batteryLevel: number;
  bluetoothEnabled: boolean;
  locationEnabled: boolean;
  smsCapable: boolean;
  lastReportedAt: string;
}
