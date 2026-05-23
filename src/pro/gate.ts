import { getCachedProStatus } from './revenuecat';

let _isPro: boolean | null = null;

export async function loadProStatus(): Promise<void> {
  _isPro = await getCachedProStatus();
}

export function isProActive(): boolean {
  return _isPro === true;
}

export function setProActive(value: boolean): void {
  _isPro = value;
}

export const PRO_FEATURES = {
  UNLIMITED_HISTORY: 'unlimited_history',
  CALENDAR: 'calendar',
  ANALYTICS: 'analytics',
  EXPORT: 'export',
  DARK_MODE: 'dark_mode',
  ALARM_SOUND: 'alarm_sound',
} as const;
