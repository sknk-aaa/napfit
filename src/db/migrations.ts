import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SCHEMA_VERSION_KEY = 'app:schema_version';
const CURRENT_VERSION = 1;

type Migration = {
  version: number;
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;
};

const migrations: Migration[] = [
  {
    version: 1,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS nap_records (
          id TEXT PRIMARY KEY NOT NULL,
          started_at TEXT NOT NULL,
          ended_at TEXT,
          nap_duration_minutes INTEGER NOT NULL,
          result TEXT,
          status TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_started_at ON nap_records(started_at);
        CREATE INDEX IF NOT EXISTS idx_status ON nap_records(status);
      `);
    },
  },
];

export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const stored = await AsyncStorage.getItem(SCHEMA_VERSION_KEY);
  const currentVersion = stored ? parseInt(stored, 10) : 0;

  if (currentVersion >= CURRENT_VERSION) return;

  const pending = migrations.filter((m) => m.version > currentVersion);
  for (const migration of pending) {
    await migration.up(db);
    await AsyncStorage.setItem(SCHEMA_VERSION_KEY, String(migration.version));
  }
}
