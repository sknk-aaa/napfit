import { NapRecord } from '../types';

export type DurationStats = {
  duration: number;
  total: number;
  freshCount: number;
  normalCount: number;
  sluggishCount: number;
  freshRate: number;
};

export function getDurationStats(records: NapRecord[]): DurationStats[] {
  const map = new Map<
    number,
    { total: number; freshCount: number; normalCount: number; sluggishCount: number }
  >();

  for (const r of records) {
    const d = r.napDurationMinutes;
    const s = map.get(d) ?? { total: 0, freshCount: 0, normalCount: 0, sluggishCount: 0 };
    map.set(d, {
      total: s.total + 1,
      freshCount: s.freshCount + (r.result === 'fresh' ? 1 : 0),
      normalCount: s.normalCount + (r.result === 'normal' ? 1 : 0),
      sluggishCount: s.sluggishCount + (r.result === 'sluggish' ? 1 : 0),
    });
  }

  return Array.from(map.entries()).map(([duration, s]) => ({
    duration,
    ...s,
    freshRate: s.total > 0 ? s.freshCount / s.total : 0,
  }));
}

// §7.3: 2件以上の記録がある時間のうち、すっきり率が最も高い時間を返す
export function getRecommendedDuration(records: NapRecord[]): number | null {
  const qualified = getDurationStats(records).filter((s) => s.total >= 2);
  if (qualified.length === 0) return null;

  return qualified.reduce((best, curr) => {
    if (curr.freshRate > best.freshRate) return curr;
    if (curr.freshRate === best.freshRate && curr.total > best.total) return curr;
    return best;
  }).duration;
}

// 棒グラフ用: 15/20/30分のデータを常に3要素で返す
export function getStandardDurationStats(records: NapRecord[]): DurationStats[] {
  const allStats = getDurationStats(records);
  return [15, 20, 30].map((d) => {
    return (
      allStats.find((s) => s.duration === d) ?? {
        duration: d,
        total: 0,
        freshCount: 0,
        normalCount: 0,
        sluggishCount: 0,
        freshRate: 0,
      }
    );
  });
}
