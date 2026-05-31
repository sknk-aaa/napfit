import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Image,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { getNapRecords } from '@/src/db/queries';
import { useTheme, useThemedStyles } from '@/src/theme/ThemeProvider';
import { type ThemeColors } from '@/src/theme/colors';
import { useT, type Translations } from '@/src/i18n';
import Sheep from '@/src/components/Sheep';
import { isProActive } from '@/src/pro/gate';
import type { NapRecord, NapResult } from '@/src/types';

const FREE_LIMIT = 10;

const RESULT_IMAGE: Record<NapResult, ImageSourcePropType> = {
  fresh: require('@/assets/images/sheep/fresh.png'),
  normal: require('@/assets/images/sheep/normal.png'),
  sluggish: require('@/assets/images/sheep/sluggish.png'),
};

function inkOf(r: NapResult, c: ThemeColors): string {
  return r === 'fresh' ? c.freshInk : r === 'normal' ? c.normalInk : c.sluggishInk;
}

function labelOf(r: NapResult, t: Translations): string {
  return t.results[r];
}

function formatDate(iso: string, t: Translations): string {
  const d = new Date(iso);
  return t.history.dateLabel(d.getMonth() + 1, d.getDate(), t.history.weekdays[d.getDay()]);
}

type ViewMode = 'list' | 'calendar';

export default function HistoryScreen() {
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();

  const [records, setRecords] = useState<NapRecord[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [dayModalRecords, setDayModalRecords] = useState<NapRecord[] | null>(null);

  const isPro = isProActive();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const all = await getNapRecords();
        setRecords(all);
      })();
    }, [])
  );

  const completedRecords = records.filter((r) => r.status === 'completed' || r.status === 'recovered');
  const displayRecords = isPro ? records : records.slice(0, FREE_LIMIT);
  const last10 = completedRecords.slice(0, 10);
  const freshCount = last10.filter((r) => r.result === 'fresh').length;
  const normalCount = last10.filter((r) => r.result === 'normal').length;
  const sluggishCount = last10.filter((r) => r.result === 'sluggish').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{t.history.title}</Text>
          <Sheep pose="pillow" size={28} />
        </View>
        {isPro && (
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleBtnText, viewMode === 'list' && styles.toggleBtnTextActive]}>{t.history.viewList}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'calendar' && styles.toggleBtnActive]}
              onPress={() => setViewMode('calendar')}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleBtnText, viewMode === 'calendar' && styles.toggleBtnTextActive]}>{t.history.viewCalendar}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t.history.summary}</Text>
          <View style={styles.summaryRow}>
            <SummaryItem color={colors.freshInk} label={t.results.fresh} count={freshCount} />
            <View style={styles.summaryDivider} />
            <SummaryItem color={colors.normalInk} label={t.results.normal} count={normalCount} />
            <View style={styles.summaryDivider} />
            <SummaryItem color={colors.sluggishInk} label={t.results.sluggish} count={sluggishCount} />
          </View>
        </View>

        {records.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Sheep pose="smile" size={80} />
            <Text style={styles.emptyText}>{t.history.emptyTitle}</Text>
            <Text style={styles.emptySubText}>{t.history.emptySub}</Text>
          </View>
        ) : isPro && viewMode === 'calendar' ? (
          <CalendarView
            records={records}
            year={calendarYear}
            month={calendarMonth}
            onPrevMonth={() => {
              if (calendarMonth === 0) {
                setCalendarMonth(11);
                setCalendarYear((y) => y - 1);
              } else setCalendarMonth((m) => m - 1);
            }}
            onNextMonth={() => {
              if (calendarMonth === 11) {
                setCalendarMonth(0);
                setCalendarYear((y) => y + 1);
              } else setCalendarMonth((m) => m + 1);
            }}
            onDayPress={setDayModalRecords}
          />
        ) : (
          <>
            <View style={styles.listCard}>
              {displayRecords.map((r, i) => (
                <RecordRow key={r.id} record={r} isLast={i === displayRecords.length - 1} />
              ))}
            </View>
            {!isPro && records.length > FREE_LIMIT && (
              <TouchableOpacity style={styles.proCtaCard} onPress={() => router.push('/pro-modal')} activeOpacity={0.8}>
                <View style={styles.proCtaTitleRow}>
                  <Ionicons name="sparkles" size={15} color={colors.primary} />
                  <Text style={styles.proCtaTitle}>{t.history.proCtaTitle}</Text>
                </View>
                <Text style={styles.proCtaDesc}>{t.history.proCtaDesc(records.length - FREE_LIMIT)}</Text>
                <View style={styles.proCtaBtn}>
                  <Text style={styles.proCtaBtnText}>{t.history.proCtaBtn}</Text>
                </View>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {dayModalRecords && <DayModal records={dayModalRecords} onClose={() => setDayModalRecords(null)} />}
    </SafeAreaView>
  );
}

function CalendarView({
  records,
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onDayPress,
}: {
  records: NapRecord[];
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayPress: (records: NapRecord[]) => void;
}) {
  const t = useT();
  const styles = useThemedStyles(makeCalStyles);
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDay = new Map<number, NapRecord[]>();
  for (const r of records) {
    const d = new Date(r.startedAt);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      const list = byDay.get(day) ?? [];
      list.push(r);
      byDay.set(day, list);
    }
  }

  function getBestResult(dayRecords: NapRecord[]): NapResult | null {
    const priority: NapResult[] = ['fresh', 'normal', 'sluggish'];
    for (const p of priority) {
      if (dayRecords.some((r) => r.result === p)) return p;
    }
    return null;
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const today = new Date();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onPrevMonth} activeOpacity={0.7}>
          <Text style={styles.arrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{t.history.monthYear(year, month)}</Text>
        <TouchableOpacity onPress={onNextMonth} activeOpacity={0.7}>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dayHeaders}>
        {t.history.weekdays.map((d) => (
          <Text key={d} style={styles.dayHeader}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={`empty-${i}`} style={styles.cell} />;
          const dayRecords = byDay.get(day) ?? [];
          const best = getBestResult(dayRecords);
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          return (
            <TouchableOpacity
              key={day}
              style={[styles.cell, isToday && styles.cellToday]}
              onPress={() => dayRecords.length > 0 && onDayPress(dayRecords)}
              activeOpacity={dayRecords.length > 0 ? 0.7 : 1}
            >
              <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>{day}</Text>
              {best && <Image source={RESULT_IMAGE[best]} style={styles.face} resizeMode="contain" />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function DayModal({ records, onClose }: { records: NapRecord[]; onClose: () => void }) {
  const t = useT();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeDayModalStyles);
  const title = formatDate(records[0].startedAt, t);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {records.map((r, i) => (
            <View key={r.id} style={[styles.row, i < records.length - 1 && styles.rowBorder]}>
              <Text style={styles.duration}>{r.napDurationMinutes}{t.home.minUnit}</Text>
              {r.result ? (
                <>
                  <Text style={[styles.tag, { color: inkOf(r.result, colors) }]}>{labelOf(r.result, t)}</Text>
                  <Image source={RESULT_IMAGE[r.result]} style={styles.face} resizeMode="contain" />
                </>
              ) : (
                <Text style={styles.skipped}>{r.status === 'interrupted' ? t.history.recordInterrupted : t.history.recordSkipped}</Text>
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>{t.history.close}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SummaryItem({ color, label, count }: { color: string; label: string; count: number }) {
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryItemLabel}>{label}</Text>
      <Text style={[styles.summaryItemCount, { color }]}>
        {count}
        <Text style={styles.summaryItemUnit}>{t.history.countUnit}</Text>
      </Text>
    </View>
  );
}

function RecordRow({ record, isLast }: { record: NapRecord; isLast: boolean }) {
  const t = useT();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const r = record.result;
  return (
    <View style={[styles.recordRow, !isLast && styles.recordRowBorder]}>
      <Text style={styles.recordDate}>{formatDate(record.startedAt, t)}</Text>
      <Text style={styles.recordDuration}>{record.napDurationMinutes}{t.home.minUnit}</Text>
      {r ? (
        <>
          <Text style={[styles.recordTag, { color: inkOf(r, colors) }]}>{labelOf(r, t)}</Text>
          <Image source={RESULT_IMAGE[r]} style={styles.recordFace} resizeMode="contain" />
        </>
      ) : (
        <Text style={styles.recordSkipped}>{record.status === 'interrupted' ? t.history.recordInterrupted : t.history.recordSkipped}</Text>
      )}
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 6,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 22, fontWeight: '800', color: c.ink, letterSpacing: -0.2 },
    viewToggle: { flexDirection: 'row', backgroundColor: c.card, borderRadius: 10, padding: 3, gap: 2 },
    toggleBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    toggleBtnActive: { backgroundColor: c.primary },
    toggleBtnText: { fontSize: 11, fontWeight: '600', color: c.ink3 },
    toggleBtnTextActive: { color: '#FFFFFF' },
    scroll: { padding: 16, gap: 14, paddingBottom: 32 },
    summaryCard: {
      backgroundColor: c.card,
      borderRadius: 18,
      padding: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    summaryLabel: { fontSize: 11.5, fontWeight: '600', color: c.ink2 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 6 },
    summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
    summaryItemLabel: { fontSize: 11, fontWeight: '600', color: c.ink2 },
    summaryItemCount: { fontSize: 20, fontWeight: '800', marginTop: 2 },
    summaryItemUnit: { fontSize: 11, fontWeight: '600' },
    summaryDivider: { width: 1, backgroundColor: c.divider, alignSelf: 'stretch' },
    emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { fontSize: 15, fontWeight: '700', color: c.ink2, marginTop: 4 },
    emptySubText: { fontSize: 12, color: c.ink3, textAlign: 'center', lineHeight: 18 },
    listCard: {
      backgroundColor: c.card,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    recordRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 16 },
    recordRowBorder: { borderBottomWidth: 1, borderBottomColor: c.divider },
    recordDate: { width: 80, fontSize: 12, fontWeight: '600', color: c.ink },
    recordDuration: { flex: 1, fontSize: 12, color: c.ink2 },
    recordTag: { fontSize: 11.5, fontWeight: '600', marginRight: 8 },
    recordFace: { width: 26, height: 26 },
    recordSkipped: { fontSize: 11.5, color: c.ink3 },
    proCtaCard: {
      backgroundColor: c.primarySoft,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: c.primaryChip,
      gap: 6,
    },
    proCtaTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    proCtaTitle: { fontSize: 14, fontWeight: '800', color: c.ink },
    proCtaDesc: { fontSize: 12, color: c.ink2, lineHeight: 18 },
    proCtaBtn: { marginTop: 4, alignSelf: 'flex-start', backgroundColor: c.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
    proCtaBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  });

const makeCalStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: c.card,
      borderRadius: 18,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    arrow: { fontSize: 28, color: c.primary, fontWeight: '300', lineHeight: 30 },
    monthLabel: { fontSize: 16, fontWeight: '700', color: c.ink },
    dayHeaders: { flexDirection: 'row', paddingHorizontal: 8, paddingTop: 8, paddingBottom: 4 },
    dayHeader: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: c.ink3 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, paddingBottom: 8 },
    cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
    cellToday: { backgroundColor: c.primarySoft, borderRadius: 8 },
    dayNum: { fontSize: 12, fontWeight: '500', color: c.ink },
    dayNumToday: { color: c.primary, fontWeight: '700' },
    face: { width: 18, height: 18 },
  });

const makeDayModalStyles = (c: ThemeColors) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    card: {
      backgroundColor: c.card,
      borderRadius: 20,
      padding: 20,
      width: '100%',
      maxWidth: 320,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 12,
    },
    title: { fontSize: 16, fontWeight: '700', color: c.ink, marginBottom: 12 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: c.divider },
    duration: { flex: 1, fontSize: 13, fontWeight: '600', color: c.ink },
    tag: { fontSize: 12, fontWeight: '600', marginRight: 4 },
    face: { width: 24, height: 24 },
    skipped: { fontSize: 12, color: c.ink3 },
    closeBtn: { marginTop: 14, height: 40, borderRadius: 10, backgroundColor: c.backgroundAlt, alignItems: 'center', justifyContent: 'center' },
    closeBtnText: { fontSize: 13, fontWeight: '600', color: c.ink2 },
  });
