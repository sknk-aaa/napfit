import { getDb } from './client';
import { NapRecord, NapResult, NapStatus } from '../types';

type NapRecordRow = {
  id: string;
  started_at: string;
  ended_at: string | null;
  nap_duration_minutes: number;
  result: string | null;
  status: string;
  created_at: string;
};

function rowToRecord(row: NapRecordRow): NapRecord {
  return {
    id: row.id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    napDurationMinutes: row.nap_duration_minutes,
    result: row.result as NapResult | null,
    status: row.status as NapStatus,
    createdAt: row.created_at,
  };
}

export async function insertNapRecord(
  record: Omit<NapRecord, 'endedAt' | 'result'> & { endedAt: null; result: null }
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO nap_records (id, started_at, ended_at, nap_duration_minutes, result, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id,
      record.startedAt,
      record.endedAt,
      record.napDurationMinutes,
      record.result,
      record.status,
      record.createdAt,
    ]
  );
}

export async function updateNapRecord(
  id: string,
  fields: Partial<Pick<NapRecord, 'status' | 'result' | 'endedAt'>>
): Promise<void> {
  const db = await getDb();
  const sets: string[] = [];
  const values: (string | null)[] = [];

  if (fields.status !== undefined) {
    sets.push('status = ?');
    values.push(fields.status);
  }
  if (fields.result !== undefined) {
    sets.push('result = ?');
    values.push(fields.result);
  }
  if (fields.endedAt !== undefined) {
    sets.push('ended_at = ?');
    values.push(fields.endedAt);
  }

  if (sets.length === 0) return;
  values.push(id);

  await db.runAsync(
    `UPDATE nap_records SET ${sets.join(', ')} WHERE id = ?`,
    values
  );
}

export async function getNapRecords(limit?: number): Promise<NapRecord[]> {
  const db = await getDb();
  const sql = limit
    ? `SELECT * FROM nap_records ORDER BY started_at DESC LIMIT ${limit}`
    : 'SELECT * FROM nap_records ORDER BY started_at DESC';
  const rows = await db.getAllAsync<NapRecordRow>(sql);
  return rows.map(rowToRecord);
}

export async function getInProgressRecords(): Promise<NapRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<NapRecordRow>(
    `SELECT * FROM nap_records WHERE status = 'in_progress' ORDER BY started_at DESC`
  );
  return rows.map(rowToRecord);
}

export async function getCompletedRecords(): Promise<NapRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<NapRecordRow>(
    `SELECT * FROM nap_records WHERE status IN ('completed', 'recovered') ORDER BY started_at DESC`
  );
  return rows.map(rowToRecord);
}

export async function getNapRecordById(id: string): Promise<NapRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<NapRecordRow>(
    'SELECT * FROM nap_records WHERE id = ?',
    [id]
  );
  return row ? rowToRecord(row) : null;
}
