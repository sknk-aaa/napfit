import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { getCompletedRecords } from '@/src/db/queries';
import { Colors } from '@/src/theme/colors';
import { isProActive } from '@/src/pro/gate';
import type { NapRecord } from '@/src/types';

type Tab = 'duration' | 'weekday' | 'timeofday';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const TIME_SLOTS = ['6-9時', '9-12時', '12-15時', '15-18時', '18時以降'];

function getTimeSlot(iso: string): string {
  const h = new Date(iso).getHours();
  if (h < 9) return '6-9時';
  if (h < 12) return '9-12時';
  if (h < 15) return '12-15時';
  if (h < 18) return '15-18時';
  return '18時以降';
}

type BarData = { label: string; freshRate: number; total: number };

function calcByDuration(records: NapRecord[]): BarData[] {
  const map = new Map<number, { fresh: number; total: number }>();
  for (const r of records) {
    const d = r.napDurationMinutes;
    const cur = map.get(d) ?? { fresh: 0, total: 0 };
    map.set(d, { fresh: cur.fresh + (r.result === 'fresh' ? 1 : 0), total: cur.total + 1 });
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([d, v]) => ({ label: `${d}分`, freshRate: v.total > 0 ? v.fresh / v.total : 0, total: v.total }));
}

function calcByWeekday(records: NapRecord[]): BarData[] {
  const slots = WEEKDAYS.map((label) => ({ label, fresh: 0, total: 0 }));
  for (const r of records) {
    const day = new Date(r.startedAt).getDay();
    slots[day].fresh += r.result === 'fresh' ? 1 : 0;
    slots[day].total += 1;
  }
  return slots.map((s) => ({ label: s.label, freshRate: s.total > 0 ? s.fresh / s.total : 0, total: s.total }));
}

function calcByTimeOfDay(records: NapRecord[]): BarData[] {
  const slots = TIME_SLOTS.map((label) => ({ label, fresh: 0, total: 0 }));
  for (const r of records) {
    const slot = getTimeSlot(r.startedAt);
    const i = TIME_SLOTS.indexOf(slot);
    if (i >= 0) {
      slots[i].fresh += r.result === 'fresh' ? 1 : 0;
      slots[i].total += 1;
    }
  }
  return slots.map((s) => ({ label: s.label, freshRate: s.total > 0 ? s.fresh / s.total : 0, total: s.total }));
}

function getBestDuration(records: NapRecord[]): BarData | null {
  const data = calcByDuration(records).filter((d) => d.total >= 2);
  if (data.length === 0) return null;
  return data.reduce((best, cur) => (cur.freshRate > best.freshRate ? cur : best));
}

async function exportData(records: NapRecord[], format: 'csv' | 'json') {
  let content: string;
  let filename: string;
  if (format === 'csv') {
    const header = 'id,startedAt,endedAt,napDurationMinutes,result,status,createdAt';
    const rows = records.map((r) =>
      [r.id, r.startedAt, r.endedAt ?? '', r.napDurationMinutes, r.result ?? '', r.status, r.createdAt].join(',')
    );
    content = [header, ...rows].join('\n');
    filename = 'napfit_records.csv';
  } else {
    content = JSON.stringify(records, null, 2);
    filename = 'napfit_records.json';
  }

  try {
    await Share.share({ message: content, title: filename });
  } catch {
    Alert.alert('エラー', 'エクスポートに失敗しました。');
  }
}

export default function AnalyticsScreen() {
  const [records, setRecords] = useState<NapRecord[]>([]);
  const [tab, setTab] = useState<Tab>('duration');

  useFocusEffect(
    useCallback(() => {
      getCompletedRecords().then(setRecords);
    }, [])
  );

  const barData =
    tab === 'duration'
      ? calcByDuration(records)
      : tab === 'weekday'
      ? calcByWeekday(records)
      : calcByTimeOfDay(records);

  const maxRate = Math.max(...barData.map((d) => d.freshRate), 0.01);
  const best = getBestDuration(records);

  const tabLabels: { key: Tab; label: string }[] = [
    { key: 'duration', label: '時間別' },
    { key: 'weekday', label: '曜日別' },
    { key: 'timeofday', label: '時間帯別' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>‹ 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>分析</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 最適仮眠時間カード */}
        <View style={styles.bestCard}>
          <Text style={styles.bestLabel}>あなたの最適仮眠時間（診断）</Text>
          {best ? (
            <View style={styles.bestRow}>
              <Text style={styles.bestNumber}>{best.label.replace('分', '')}</Text>
              <Text style={styles.bestUnit}>分</Text>
              <View style={styles.bestBadge}>
                <Text style={styles.bestBadgeText}>
                  すっきり率 {Math.round(best.freshRate * 100)}%
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.bestEmpty}>
              各時間で2回以上記録すると診断が表示されます
            </Text>
          )}
        </View>

        {/* タブ */}
        <View style={styles.tabBar}>
          {tabLabels.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.tabItem, tab === key && styles.tabItemActive]}
              onPress={() => setTab(key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, tab === key && styles.tabLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 棒グラフ */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>すっきり率（%）</Text>
          {records.length < 3 ? (
            <Text style={styles.chartEmpty}>記録が少なすぎます。仮眠を続けましょう！</Text>
          ) : (
            <View style={styles.chartArea}>
              {barData.map((d) => (
                <View key={d.label} style={styles.barCol}>
                  <Text style={styles.barRateLabel}>
                    {d.total > 0 ? `${Math.round(d.freshRate * 100)}%` : '—'}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        { height: d.total > 0 ? Math.max((d.freshRate / maxRate) * 80, 4) : 0 },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel} numberOfLines={1}>{d.label}</Text>
                  <Text style={styles.barCount}>{d.total}回</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 診断レポート */}
        <DiagnosticReport records={records} />

        {/* エクスポート */}
        {isProActive() && (
          <View style={styles.exportCard}>
            <Text style={styles.exportTitle}>データエクスポート</Text>
            <View style={styles.exportButtons}>
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={() => exportData(records, 'csv')}
                activeOpacity={0.7}
              >
                <Text style={styles.exportBtnText}>CSV でエクスポート</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={() => exportData(records, 'json')}
                activeOpacity={0.7}
              >
                <Text style={styles.exportBtnText}>JSON でエクスポート</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DiagnosticReport({ records }: { records: NapRecord[] }) {
  if (records.length < 5) {
    return (
      <View style={styles.reportCard}>
        <Text style={styles.reportTitle}>診断レポート</Text>
        <Text style={styles.reportEmpty}>
          5件以上記録すると詳細レポートが生成されます（現在 {records.length} 件）
        </Text>
      </View>
    );
  }

  const byDuration = calcByDuration(records).filter((d) => d.total >= 2);
  const sortedByRate = [...byDuration].sort((a, b) => b.freshRate - a.freshRate);
  const best = sortedByRate[0];
  const worst = sortedByRate[sortedByRate.length - 1];

  const weekdayData = calcByWeekday(records).filter((d) => d.total >= 1);
  const bestWeekday = weekdayData.reduce(
    (a, b) => (b.freshRate > a.freshRate ? b : a),
    weekdayData[0]
  );
  const worstWeekday = weekdayData.reduce(
    (a, b) => (b.freshRate < a.freshRate ? b : a),
    weekdayData[0]
  );

  const lines: string[] = [];
  if (best && best !== worst) {
    lines.push(`${best.label}仮眠のすっきり率が最も高く（${Math.round(best.freshRate * 100)}%）、あなたに向いています。`);
    if (worst.freshRate < best.freshRate - 0.3) {
      lines.push(`${worst.label}仮眠はすっきり率が低め（${Math.round(worst.freshRate * 100)}%）。避けてみましょう。`);
    }
  }
  if (bestWeekday && worstWeekday && bestWeekday.label !== worstWeekday.label && bestWeekday.total >= 2) {
    lines.push(`${bestWeekday.label}曜日の仮眠後はすっきりしやすい傾向があります。`);
  }
  if (lines.length === 0) {
    lines.push('まだパターンを分析するデータが足りません。記録を続けましょう！');
  }

  return (
    <View style={styles.reportCard}>
      <Text style={styles.reportTitle}>診断レポート</Text>
      {lines.map((line, i) => (
        <View key={i} style={styles.reportLine}>
          <Text style={styles.reportBullet}>•</Text>
          <Text style={styles.reportText}>{line}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backBtn: {
    width: 60,
  },
  backBtnText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: Colors.ink,
  },
  scroll: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  bestCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bestLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.ink2,
    marginBottom: 6,
  },
  bestRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  bestNumber: {
    fontSize: 52,
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 58,
    letterSpacing: -1,
  },
  bestUnit: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 6,
  },
  bestBadge: {
    backgroundColor: Colors.primaryChip,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
    marginBottom: 6,
  },
  bestBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  bestEmpty: {
    fontSize: 12,
    color: Colors.ink3,
    lineHeight: 20,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 4,
    gap: 2,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabItemActive: {
    backgroundColor: Colors.primary,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.ink3,
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.ink2,
    marginBottom: 12,
  },
  chartEmpty: {
    fontSize: 12,
    color: Colors.ink3,
    textAlign: 'center',
    paddingVertical: 20,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    minHeight: 120,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barRateLabel: {
    fontSize: 9,
    color: Colors.ink2,
    fontWeight: '500',
    marginBottom: 4,
  },
  barTrack: {
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  bar: {
    width: '60%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 9,
    color: Colors.ink2,
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  barCount: {
    fontSize: 8,
    color: Colors.ink3,
    marginTop: 1,
  },
  reportCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reportTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 10,
  },
  reportEmpty: {
    fontSize: 12,
    color: Colors.ink3,
    lineHeight: 20,
  },
  reportLine: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  reportBullet: {
    fontSize: 14,
    color: Colors.primary,
    marginTop: 1,
  },
  reportText: {
    flex: 1,
    fontSize: 12,
    color: Colors.ink,
    lineHeight: 20,
  },
  exportCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  exportTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
  },
  exportButtons: {
    gap: 8,
  },
  exportBtn: {
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
});
