// §5.2.5: 残り時間は絶対時刻基準で計算し setInterval の累積誤差を回避する
export function getRemainingSeconds(startedAt: string, durationMinutes: number): number {
  const endMs = new Date(startedAt).getTime() + durationMinutes * 60 * 1000;
  return Math.max(0, Math.ceil((endMs - Date.now()) / 1000));
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
