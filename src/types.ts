export type NapResult = 'fresh' | 'normal' | 'sluggish';

export type NapStatus =
  | 'in_progress'
  | 'completed'
  | 'skipped'
  | 'interrupted'
  | 'recovered';

export interface NapRecord {
  id: string;
  startedAt: string;
  endedAt: string | null;
  napDurationMinutes: number;
  result: NapResult | null;
  status: NapStatus;
  createdAt: string;
}
