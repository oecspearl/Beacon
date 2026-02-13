import * as SQLite from "expo-sqlite";

// ---------------------------------------------------------------------------
// Database singleton
// ---------------------------------------------------------------------------

const DB_NAME = "beacon.db";

let _db: SQLite.SQLiteDatabase | null = null;

/**
 * Returns the shared database instance, opening it if necessary.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DB_NAME);
  return _db;
}

// ---------------------------------------------------------------------------
// Schema initialisation
// ---------------------------------------------------------------------------

/**
 * Creates all required tables if they do not already exist.
 * Call this once at app startup.
 */
export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- Student profile data
    CREATE TABLE IF NOT EXISTS students (
      id              TEXT PRIMARY KEY,
      first_name      TEXT NOT NULL,
      last_name       TEXT NOT NULL,
      email           TEXT NOT NULL,
      phone           TEXT NOT NULL,
      nationality     TEXT NOT NULL,
      institution     TEXT NOT NULL,
      programme       TEXT NOT NULL,
      host_country    TEXT NOT NULL,
      blood_type      TEXT,
      allergies       TEXT,
      medical_conditions TEXT,
      medications     TEXT,
      emergency_contacts TEXT NOT NULL DEFAULT '[]',
      registered_at   TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Messages (inbound and outbound)
    CREATE TABLE IF NOT EXISTS messages (
      id              TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id       TEXT NOT NULL,
      recipient_id    TEXT,
      body            TEXT NOT NULL,
      channel         TEXT NOT NULL DEFAULT 'data',
      direction       TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
      status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
      priority        INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      sent_at         TEXT,
      received_at     TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conversation
      ON messages (conversation_id, created_at);

    CREATE INDEX IF NOT EXISTS idx_messages_status
      ON messages (status);

    -- Check-in history
    CREATE TABLE IF NOT EXISTS checkins (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id      TEXT NOT NULL,
      status          TEXT NOT NULL,
      latitude        REAL,
      longitude       REAL,
      accuracy        REAL,
      note            TEXT,
      channel         TEXT NOT NULL DEFAULT 'data',
      sent            INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_checkins_student
      ON checkins (student_id, created_at);

    -- Panic event log
    CREATE TABLE IF NOT EXISTS panic_events (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id      TEXT NOT NULL,
      latitude        REAL,
      longitude       REAL,
      accuracy        REAL,
      audio_uri       TEXT,
      channels_used   TEXT NOT NULL DEFAULT '[]',
      resolved        INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at     TEXT
    );

    -- Cached emergency protocols
    CREATE TABLE IF NOT EXISTS protocols (
      id              TEXT PRIMARY KEY,
      country_code    TEXT NOT NULL,
      title           TEXT NOT NULL,
      category        TEXT NOT NULL,
      severity        TEXT NOT NULL DEFAULT 'info',
      body            TEXT NOT NULL,
      decision_tree   TEXT,
      version         INTEGER NOT NULL DEFAULT 1,
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_protocols_country
      ON protocols (country_code);

    -- Country profiles
    CREATE TABLE IF NOT EXISTS countries (
      code            TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      emergency_number TEXT,
      embassy_phone   TEXT,
      embassy_address TEXT,
      risk_level      TEXT NOT NULL DEFAULT 'low',
      timezone        TEXT,
      metadata        TEXT NOT NULL DEFAULT '{}',
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Outbound message queue (offline-first)
    CREATE TABLE IF NOT EXISTS queue (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      type            TEXT NOT NULL,
      payload         TEXT NOT NULL,
      priority        INTEGER NOT NULL DEFAULT 0,
      channel         TEXT NOT NULL DEFAULT 'data',
      attempts        INTEGER NOT NULL DEFAULT 0,
      max_attempts    INTEGER NOT NULL DEFAULT 5,
      status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      last_attempt_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_queue_status_priority
      ON queue (status, priority DESC, created_at);
  `);
}

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

/**
 * Drop all tables and reinitialise. USE ONLY in development / tests.
 */
export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DROP TABLE IF EXISTS queue;
    DROP TABLE IF EXISTS countries;
    DROP TABLE IF EXISTS protocols;
    DROP TABLE IF EXISTS panic_events;
    DROP TABLE IF EXISTS checkins;
    DROP TABLE IF EXISTS messages;
    DROP TABLE IF EXISTS students;
  `);
  await initializeDatabase();
}

/**
 * Close the database connection.
 */
export async function closeDatabase(): Promise<void> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
  }
}
