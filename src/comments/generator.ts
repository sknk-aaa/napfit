import { NapRecord } from '../types';
import { ja } from '../i18n/ja';
import { getDurationStats } from '../nap/statistics';

// §6.3-6.4 に従い、優先順位: カテゴリ4 → 2 → 3 → 1 の順に評価
export function generateComment(records: NapRecord[]): string {
  const total = records.length;

  // カテゴリ4: 励まし(データ不足時)
  if (total === 0) return ja.comments.noRecord;
  if (total <= 2) return ja.comments.fewRecords1_2;
  if (total <= 4) return ja.comments.fewRecords3_4(5 - total);

  // カテゴリ2: 直近5件の傾向(4件以上が同じ結果)
  const recent5 = records.slice(0, 5);
  const freshCount = recent5.filter((r) => r.result === 'fresh').length;
  const sluggishCount = recent5.filter((r) => r.result === 'sluggish').length;
  const normalCount = recent5.filter((r) => r.result === 'normal').length;

  if (freshCount >= 4) return ja.comments.freshStreak(5);
  if (sluggishCount >= 4) return ja.comments.sluggishStreak(5);
  if (normalCount >= 4) return ja.comments.normalStreak(5);

  // カテゴリ3: ベスト仮眠時間の示唆(すっきり率に30%以上の差)
  const allStats = getDurationStats(records);
  const qualified = allStats.filter((s) => s.total >= 2);

  if (qualified.length >= 2) {
    const maxRate = Math.max(...qualified.map((q) => q.freshRate));
    const minRate = Math.min(...qualified.map((q) => q.freshRate));
    if (maxRate - minRate >= 0.3) {
      const best = qualified.find((q) => q.freshRate === maxRate)!;
      return ja.comments.bestTime(best.duration);
    }
  }

  // カテゴリ1: 特定時間の成績(3件以上、60%以上が同じ結果)
  for (const s of allStats) {
    if (s.total < 3) continue;
    if (s.freshCount / s.total >= 0.6)
      return ja.comments.freshMany(s.duration, s.freshCount, s.total);
    if (s.sluggishCount / s.total >= 0.6)
      return ja.comments.sluggishMany(s.duration, s.sluggishCount, s.total);
    if (s.normalCount / s.total >= 0.6)
      return ja.comments.normalMany(s.duration, s.normalCount, s.total);
  }

  return ja.comments.fewRecords1_2;
}
