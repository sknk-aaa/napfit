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
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { getCompletedRecords } from '@/src/db/queries';
import { useTheme, useThemedStyles } from '@/src/theme/ThemeProvider';
import { type ThemeColors } from '@/src/theme/colors';
import { useT, type Translations } from '@/src/i18n';
import { isProActive } from '@/src/pro/gate';
import type { NapRecord } from '@/src/types';

type Tab = 'duration' | 'weekday' | 'timeofday';

type BarData = { label: string; freshRate: number; total: number; value?: number };

function timeSlotIndex(iso: string): number {
  const h = new Date(iso).getHours();
  if (h < 9) return 0;
  if (h < 12) return 1;
  if (h < 15) return 2;
  if (h < 18) return 3;
  return 4;
}

function calcByDuration(records: NapRecord[], t: Translations): BarData[] {
  const map = new Map<number, { fresh: number; total: number }>();
  for (const r of records) {
    const d = r.napDurationMinutes;
    const cur = map.get(d) ?? { fresh: 0, total: 0 };
    map.set(d, { fresh: cur.fresh + (r.result === 'fresh' ? 1 : 0), total: cur.total + 1 });
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([d, v]) => ({
      label: `${d}${t.home.minUnit}`,
      freshRate: v.total > 0 ? v.fresh / v.total : 0,
      total: v.total,
      value: d,
    }));
}

function calcByWeekday(records: NapRecord[], t: Translations): BarData[] {
  const slots = t.history.weekdays.map((label) => ({ label, fresh: 0, total: 0 }));
  for (const r of records) {
    const day = new Date(r.startedAt).getDay();
    slots[day].fresh += r.result === 'fresh' ? 1 : 0;
    slots[day].total += 1;
  }
  return slots.map((s) => ({ label: s.label, freshRate: s.total > 0 ? s.fresh / s.total : 0, total: s.total }));
}

function calcByTimeOfDay(records: NapRecord[], t: Translations): BarData[] {
  const slots = t.analytics.timeSlots.map((label) => ({ label, fresh: 0, total: 0 }));
  for (const r of records) {
    const i = timeSlotIndex(r.startedAt);
    slots[i].fresh += r.result === 'fresh' ? 1 : 0;
    slots[i].total += 1;
  }
  return slots.map((s) => ({ label: s.label, freshRate: s.total > 0 ? s.fresh / s.total : 0, total: s.total }));
}

function getBestDuration(records: NapRecord[], t: Translations): BarData | null {
  const data = calcByDuration(records, t).filter((d) => d.total >= 2);
  if (data.length === 0) return null;
  return data.reduce((best, cur) => (cur.freshRate > best.freshRate ? cur : best));
}

async function exportData(records: NapRecord[], format: 'csv' | 'json', t: Translations) {
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
    Alert.alert(t.errors.generic, t.analytics.exportError);
  }
}

export default function AnalyticsScreen() {
  const t = useT();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [records, setRecords] = useState<NapRecord[]>([]);
  const [tab, setTab] = useState<Tab>('duration');

  useFocusEffect(
    useCallback(() => {
      getCompletedRecords().then(setRecords);
    }, [])
  );

  const barData =
    tab === 'duration'
      ? calcByDuration(records, t)
      : tab === 'weekday'
      ? calcByWeekday(records, t)
      : calcByTimeOfDay(records, t);

  const maxRate = Math.max(...barData.map((d) => d.freshRate), 0.01);
  const best = getBestDuration(records, t);

  const tabLabels: { key: Tab; label: string }[] = [
    { key: 'duration', label: t.analytics.tabDuration },
    { key: 'weekday', label: t.analytics.tabWeekday },
    { key: 'timeofday', label: t.analytics.tabTimeofday },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
          <Text style={styles.backBtnText}>{t.analytics.back}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.analytics.title}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.bestCard}>
          <Text style={styles.bestLabel}>{t.analytics.bestLabel}</Text>
          {best ? (
            <View style={styles.bestRow}>
              <Text style={styles.bestNumber}>{best.value}</Text>
              <Text style={styles.bestUnit}>{t.home.minUnit}</Text>
              <View style={styles.bestBadge}>
                <Text style={styles.bestBadgeText}>{t.analytics.freshRateBadge(Math.round(best.freshRate * 100))}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.bestEmpty}>{t.analytics.bestEmpty}</Text>
          )}
        </View>

        <View style={styles.tabBar}>
          {tabLabels.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.tabItem, tab === key && styles.tabItemActive]}
              onPress={() => setTab(key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, tab === key && styles.tabLabelActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{t.analytics.chartTitle}</Text>
          {records.length < 3 ? (
            <Text style={styles.chartEmpty}>{t.analytics.chartEmpty}</Text>
          ) : (
            <View style={styles.chartArea}>
              {barData.map((d) => (
                <View key={d.label} style={styles.barCol}>
                  <Text style={styles.barRateLabel}>{d.total > 0 ? `${Math.round(d.freshRate * 100)}%` : '—'}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.bar, { height: d.total > 0 ? Math.max((d.freshRate / maxRate) * 80, 4) : 0 }]} />
                  </View>
                  <Text style={styles.barLabel} numberOfLines={1}>{d.label}</Text>
                  <Text style={styles.barCount}>
                    {d.total}
                    {t.history.countUnit}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <DiagnosticReport records={records} />

        {isProActive() && (
          <View style={styles.exportCard}>
            <Text style={styles.exportTitle}>{t.analytics.exportTitle}</Text>
            <View style={styles.exportButtons}>
              <TouchableOpacity style={styles.exportBtn} onPress={() => exportData(records, 'csv', t)} activeOpacity={0.7}>
                <Text style={styles.exportBtnText}>{t.analytics.exportCsv}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportBtn} onPress={() => exportData(records, 'json', t)} activeOpacity={0.7}>
                <Text style={styles.exportBtnText}>{t.analytics.exportJson}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DiagnosticReport({ records }: { records: NapRecord[] }) {
  const t = useT();
  const styles = useThemedStyles(makeStyles);

  if (records.length < 5) {
    return (
      <View style={styles.reportCard}>
        <Text style={styles.reportTitle}>{t.analytics.reportTitle}</Text>
        <Text style={styles.reportEmpty}>{t.analytics.reportEmpty(records.length)}</Text>
      </View>
    );
  }

  const byDuration = calcByDuration(records, t).filter((d) => d.total >= 2);
  const sortedByRate = [...byDuration].sort((a, b) => b.freshRate - a.freshRate);
  const best = sortedByRate[0];
  const worst = sortedByRate[sortedByRate.length - 1];

  const weekdayData = calcByWeekday(records, t).filter((d) => d.total >= 1);
  const bestWeekday = weekdayData.reduce((a, b) => (b.freshRate > a.freshRate ? b : a), weekdayData[0]);
  const worstWeekday = weekdayData.reduce((a, b) => (b.freshRate < a.freshRate ? b : a), weekdayData[0]);

  const lines: string[] = [];
  if (best && best !== worst) {
    lines.push(t.analytics.reportBestLength(best.label, Math.round(best.freshRate * 100)));
    if (worst.freshRate < best.freshRate - 0.3) {
      lines.push(t.analytics.reportWorstLength(worst.label, Math.round(worst.freshRate * 100)));
    }
  }
  if (bestWeekday && worstWeekday && bestWeekday.label !== worstWeekday.label && bestWeekday.total >= 2) {
    lines.push(t.analytics.reportBestWeekday(bestWeekday.label));
  }
  if (lines.length === 0) {
    lines.push(t.analytics.reportNoPattern);
  }

  return (
    <View style={styles.reportCard}>
      <Text style={styles.reportTitle}>{t.analytics.reportTitle}</Text>
      {lines.map((line, i) => (
        <View key={i} style={styles.reportLine}>
          <Text style={styles.reportBullet}>•</Text>
          <Text style={styles.reportText}>{line}</Text>
        </View>
      ))}
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
    backBtn: { width: 72, flexDirection: 'row', alignItems: 'center' },
    backBtnText: { fontSize: 15, color: c.primary, fontWeight: '600' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: c.ink },
    scroll: { padding: 16, gap: 14, paddingBottom: 40 },
    bestCard: {
      backgroundColor: c.card,
      borderRadius: 18,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    bestLabel: { fontSize: 11, fontWeight: '600', color: c.ink2, marginBottom: 6 },
    bestRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
    bestNumber: { fontSize: 52, fontWeight: '800', color: c.primary, lineHeight: 58, letterSpacing: -1 },
    bestUnit: { fontSize: 20, fontWeight: '700', color: c.primary, marginBottom: 6 },
    bestBadge: { backgroundColor: c.primaryChip, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 4, marginBottom: 6 },
    bestBadgeText: { fontSize: 11, fontWeight: '700', color: c.primary },
    bestEmpty: { fontSize: 12, color: c.ink3, lineHeight: 20, marginTop: 4 },
    tabBar: { flexDirection: 'row', backgroundColor: c.card, borderRadius: 14, padding: 4, gap: 2 },
    tabItem: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
    tabItemActive: { backgroundColor: c.primary },
    tabLabel: { fontSize: 12, fontWeight: '600', color: c.ink3 },
    tabLabelActive: { color: '#FFFFFF' },
    chartCard: {
      backgroundColor: c.card,
      borderRadius: 18,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    chartTitle: { fontSize: 11, fontWeight: '600', color: c.ink2, marginBottom: 12 },
    chartEmpty: { fontSize: 12, color: c.ink3, textAlign: 'center', paddingVertical: 20 },
    chartArea: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, minHeight: 120 },
    barCol: { flex: 1, alignItems: 'center' },
    barRateLabel: { fontSize: 9, color: c.ink2, fontWeight: '500', marginBottom: 4 },
    barTrack: { height: 80, justifyContent: 'flex-end', alignItems: 'center', width: '100%' },
    bar: { width: '60%', backgroundColor: c.primary, borderRadius: 4 },
    barLabel: { fontSize: 9, color: c.ink2, marginTop: 4, fontWeight: '500', textAlign: 'center' },
    barCount: { fontSize: 8, color: c.ink3, marginTop: 1 },
    reportCard: {
      backgroundColor: c.card,
      borderRadius: 18,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    reportTitle: { fontSize: 13, fontWeight: '700', color: c.ink, marginBottom: 10 },
    reportEmpty: { fontSize: 12, color: c.ink3, lineHeight: 20 },
    reportLine: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    reportBullet: { fontSize: 14, color: c.primary, marginTop: 1 },
    reportText: { flex: 1, fontSize: 12, color: c.ink, lineHeight: 20 },
    exportCard: { backgroundColor: c.card, borderRadius: 18, padding: 16, gap: 12 },
    exportTitle: { fontSize: 13, fontWeight: '700', color: c.ink },
    exportButtons: { gap: 8 },
    exportBtn: { height: 40, borderRadius: 10, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' },
    exportBtnText: { fontSize: 13, fontWeight: '600', color: c.primary },
  });
