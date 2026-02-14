import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  doublePrecision,
  timestamp,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  nationality: varchar("nationality", { length: 100 }).notNull(),
  oecsState: varchar("oecs_state", { length: 100 }).notNull(),
  passportNumberEncrypted: text("passport_number_encrypted").notNull(),
  programme: varchar("programme", { length: 255 }).notNull(),
  hostInstitution: varchar("host_institution", { length: 255 }).notNull(),
  hostCountry: varchar("host_country", { length: 100 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 30 }),
  bloodType: varchar("blood_type", { length: 10 }),
  medicalConditions: text("medical_conditions"),
  photoUrl: text("photo_url"),
  deviceInfo: jsonb("device_info").$type<{
    manufacturer?: string;
    modelName?: string;
    osName?: string;
    osVersion?: string;
    appVersion?: string;
  }>(),
  readinessScore: integer("readiness_score").notNull().default(0),
  walkthroughCompleted: boolean("walkthrough_completed").notNull().default(false),
  registeredAt: timestamp("registered_at", { withTimezone: true }).notNull().defaultNow(),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const studentsRelations = relations(students, ({ many }) => ({
  emergencyContacts: many(emergencyContacts),
  locations: many(studentLocations),
  statuses: many(studentStatuses),
  checkins: many(checkins),
  panicEvents: many(panicEvents),
  escalationEvents: many(escalationEvents),
  groupMemberships: many(groupMembers),
}));

// ---------------------------------------------------------------------------
// Emergency Contacts
// ---------------------------------------------------------------------------

export const emergencyContacts = pgTable("emergency_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  relationship: varchar("relationship", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  email: varchar("email", { length: 255 }),
  isInCountry: boolean("is_in_country").notNull().default(false),
});

export const emergencyContactsRelations = relations(emergencyContacts, ({ one }) => ({
  student: one(students, {
    fields: [emergencyContacts.studentId],
    references: [students.id],
  }),
}));

// ---------------------------------------------------------------------------
// Student Locations
// ---------------------------------------------------------------------------

export const studentLocations = pgTable("student_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  accuracy: doublePrecision("accuracy"),
  altitude: doublePrecision("altitude"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  source: varchar("source", { length: 20 }).notNull().default("gps"),
});

export const studentLocationsRelations = relations(studentLocations, ({ one }) => ({
  student: one(students, {
    fields: [studentLocations.studentId],
    references: [students.id],
  }),
}));

// ---------------------------------------------------------------------------
// Student Statuses
// ---------------------------------------------------------------------------

export const studentStatuses = pgTable("student_statuses", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 10 }).notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  batteryLevel: integer("battery_level"),
  channel: varchar("channel", { length: 20 }).notNull().default("data"),
  groupId: uuid("group_id"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const studentStatusesRelations = relations(studentStatuses, ({ one }) => ({
  student: one(students, {
    fields: [studentStatuses.studentId],
    references: [students.id],
  }),
}));

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  senderId: varchar("sender_id", { length: 255 }).notNull(),
  recipientId: varchar("recipient_id", { length: 255 }),
  groupId: varchar("group_id", { length: 255 }),
  content: text("content").notNull(),
  priority: varchar("priority", { length: 30 }).notNull().default("informational"),
  encrypted: boolean("encrypted").notNull().default(false),
  channel: varchar("channel", { length: 20 }).notNull().default("data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  readAt: timestamp("read_at", { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// Broadcast Messages
// ---------------------------------------------------------------------------

export const broadcastMessages = pgTable("broadcast_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  senderId: uuid("sender_id").notNull(),
  targetType: varchar("target_type", { length: 30 }).notNull(),
  targetValue: varchar("target_value", { length: 255 }),
  content: text("content").notNull(),
  priority: varchar("priority", { length: 30 }).notNull().default("informational"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Panic Events
// ---------------------------------------------------------------------------

export const panicEvents = pgTable("panic_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  accuracy: doublePrecision("accuracy"),
  batteryLevel: integer("battery_level"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  audioUrl: text("audio_url"),
  transmittedVia: jsonb("transmitted_via").$type<string[]>().default([]),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedBy: uuid("resolved_by"),
});

export const panicEventsRelations = relations(panicEvents, ({ one }) => ({
  student: one(students, {
    fields: [panicEvents.studentId],
    references: [students.id],
  }),
}));

// ---------------------------------------------------------------------------
// Check-ins
// ---------------------------------------------------------------------------

export const checkins = pgTable("checkins", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  response: varchar("response", { length: 30 }).notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  channel: varchar("channel", { length: 20 }).notNull().default("data"),
});

export const checkinsRelations = relations(checkins, ({ one }) => ({
  student: one(students, {
    fields: [checkins.studentId],
    references: [students.id],
  }),
}));

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => students.id),
  country: varchar("country", { length: 100 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull().defaultNow(),
});

export const groupsRelations = relations(groups, ({ one, many }) => ({
  lead: one(students, {
    fields: [groups.leadId],
    references: [students.id],
  }),
  members: many(groupMembers),
}));

// ---------------------------------------------------------------------------
// Group Members (junction table)
// ---------------------------------------------------------------------------

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.groupId, table.studentId] }),
  }),
);

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  student: one(students, {
    fields: [groupMembers.studentId],
    references: [students.id],
  }),
}));

// ---------------------------------------------------------------------------
// Escalation Events
// ---------------------------------------------------------------------------

export const escalationEvents = pgTable("escalation_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  acknowledgedBy: uuid("acknowledged_by"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedBy: uuid("resolved_by"),
});

export const escalationEventsRelations = relations(escalationEvents, ({ one }) => ({
  student: one(students, {
    fields: [escalationEvents.studentId],
    references: [students.id],
  }),
}));

// ---------------------------------------------------------------------------
// Coordinators
// ---------------------------------------------------------------------------

export const coordinators = pgTable("coordinators", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("coordinator"),
  oecsState: varchar("oecs_state", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").notNull(),
  actorType: varchar("actor_type", { length: 20 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("target_type", { length: 50 }).notNull(),
  targetId: uuid("target_id").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Remote Wipe Commands
// ---------------------------------------------------------------------------

export const remoteWipeCommands = pgTable("remote_wipe_commands", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  issuedBy: uuid("issued_by").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  executedAt: timestamp("executed_at", { withTimezone: true }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// Countries
// ---------------------------------------------------------------------------

export const countries = pgTable("countries", {
  code: varchar("code", { length: 10 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  emergencyNumbers: jsonb("emergency_numbers")
    .$type<{
      police: string;
      ambulance: string;
      fire: string;
      general: string | null;
    }>()
    .notNull(),
  mapBounds: jsonb("map_bounds")
    .$type<{
      north: number;
      south: number;
      east: number;
      west: number;
    }>(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
});

export const countriesRelations = relations(countries, ({ many }) => ({
  protocols: many(emergencyProtocols),
}));

// ---------------------------------------------------------------------------
// Emergency Protocols
// ---------------------------------------------------------------------------

export const emergencyProtocols = pgTable("emergency_protocols", {
  id: uuid("id").primaryKey().defaultRandom(),
  countryCode: varchar("country_code", { length: 10 })
    .notNull()
    .references(() => countries.code, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
  content: jsonb("content").$type<Record<string, unknown>>().notNull(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
});

export const emergencyProtocolsRelations = relations(emergencyProtocols, ({ one }) => ({
  country: one(countries, {
    fields: [emergencyProtocols.countryCode],
    references: [countries.code],
  }),
}));
