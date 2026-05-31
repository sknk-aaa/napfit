import { getInProgressRecords, updateNapRecord } from '@/src/db/queries';
import type { NapRecord } from '@/src/types';
import type { Translations } from '@/src/i18n';

const RECOVERY_WINDOW_HOURS = 24;
const RECOVERY_GRACE_MINUTES = 30;

export async function detectRecoveryRecord(): Promise<NapRecord | null> {
  const inProgress = await getInProgressRecords();
  if (inProgress.length === 0) return null;

  const now = new Date();
  for (const record of inProgress) {
    const startedAt = new Date(record.startedAt);
    const ageHours = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60);

    if (ageHours > RECOVERY_WINDOW_HOURS) {
      await updateNapRecord(record.id, {
        status: 'interrupted',
        endedAt: now.toISOString(),
      });
      continue;
    }

    const expectedEndMs = startedAt.getTime() + record.napDurationMinutes * 60 * 1000;
    const elapsedAfterEndMinutes = (now.getTime() - expectedEndMs) / (1000 * 60);

    if (elapsedAfterEndMinutes >= RECOVERY_GRACE_MINUTES) return record;
  }

  return null;
}

export function formatRecoveryAge(
  startedAt: string,
  napDurationMinutes: number,
  t: Translations
): string {
  const endMs = new Date(startedAt).getTime() + napDurationMinutes * 60 * 1000;
  const diffMinutes = Math.floor((Date.now() - endMs) / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours >= 1) return t.recovery.hoursAgo(diffHours);
  return t.recovery.minutesAgo(diffMinutes);
}
