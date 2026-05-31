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
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { getCompletedRecords, getNapRecords } from '@/src/db/queries';
import { Colors } from '@/src/theme/colors';
import Sheep from '@/src/components/Sheep';
import { isProActive } from '@/src/pro/gate';
import type { NapRecord, NapResult } from '@/src/types';

const FREE_LIMIT = 10;

const RESULT_CONFIG: Record<NapResult, { label: string; image: ImageSourcePropType; ink: string }> = {
  fresh:    { label: 'すっきり', image: require('@/assets/images/sheep/fresh.png'),    ink: Colors.freshInk },
  normal:   { label: '普通',     image: require('@/assets/images/sheep/normal.png'),   ink: Colors.normalInk },
  sluggish: { label: 'だるい',   image: require('@/assets/images/sheep/sluggish.png'), ink: Colors.sluggishInk },
};

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[d.getDay()];
  return `${month}/${day} (${weekday})`;
}

function formatYearMonth(year: number, month: number): string {
  return `${year}年${month + 1}月`;
}

type ViewMode = 'list' | 'calendar';

export default function HistoryScreen() {
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

  const completedRecords = records.filter(
    (r) => r.status === 'completed' || r.status === 'recovered'
  );
  const displayRecords = isPro ? records : records.slice(0, FREE_LIMIT);
  const last10 = completedRecords.slice(0, 10);
  const freshCount = last10.filter((r) => r.result === 'fresh').length;
  const normalCount = last10.filter((r) => r.result === 'normal').length;
  const sluggishCount = last10.filter((r) => r.result === 'sluggish').length;

  function openDayModal(dayRecords: NapRecord[]) {
    setDayModalRecords(dayRecords);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>履歴</Text>
          <Sheep pose="pillow" size={28} />
        </View>
        {isPro && (
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleBtnText, viewMode === 'list' && styles.toggleBtnTextActive]}>
                リスト
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'calendar' && styles.toggleBtnActive]}
              onPress={() => setViewMode('calendar')}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleBtnText, viewMode === 'calendar' && styles.toggleBtnTextActive]}>
                カレンダー
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* まとめカード */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>直近10回のまとめ</Text>
          <View style={styles.summaryRow}>
            <SummaryItem color={Colors.freshInk} label="すっきり" count={freshCount} />
            <View style={styles.summaryDivider} />
            <SummaryItem color={Colors.normalInk} label="普通" count={normalCount} />
            <View style={styles.summaryDivider} />
            <SummaryItem color={Colors.sluggishInk} label="だるい" count={sluggishCount} />
          </View>
        </View>

        {records.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Sheep pose="smile" size={80} />
            <Text style={styles.emptyText}>まだ記録がありません</Text>
            <Text style={styles.emptySubText}>仮眠を終えると、ここに記録が残ります</Text>
          </View>
        ) : isPro && viewMode === 'calendar' ? (
          <CalendarView
            records={records}
            year={calendarYear}
            month={calendarMonth}
            onPrevMonth={() => {
              if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); }
              else setCalendarMonth(m => m - 1);
            }}
            onNextMonth={() => {
              if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); }
              else setCalendarMonth(m => m + 1);
            }}
            onDayPress={openDayModal}
          />
        ) : (
          <>
            <View style={styles.listCard}>
              {displayRecords.map((r, i) => (
                <RecordRow key={r.id} record={r} isLast={i === displayRecords.length - 1} />
              ))}
            </View>
            {!isPro && records.length > FREE_LIMIT && (
              <TouchableOpacity
                style={styles.proCtaCard}
                onPress={() => router.push('/pro-modal')}
                activeOpacity={0.8}
              >
                <View style={styles.proCtaTitleRow}>
                  <Ionicons name="sparkles" size={15} color={Colors.primary} />
                  <Text style={styles.proCtaTitle}>無制限履歴を見る</Text>
                </View>
                <Text style={styles.proCtaDesc}>
                  {records.length - FREE_LIMIT}件の記録が隠れています。
                  NapFit Pro にアップグレードすると全件閲覧できます。
                </Text>
                <View style={styles.proCtaBtn}>
                  <Text style={styles.proCtaBtnText}>Pro を見る</Text>
                </View>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {dayModalRecords && (
        <DayModal records={dayModalRecords} onClose={() => setDayModalRecords(null)} />
      )}
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
    <View style={calStyles.container}>
      <View style={calStyles.header}>
        <TouchableOpacity onPress={onPrevMonth} activeOpacity={0.7}>
          <Text style={calStyles.arrow}>‹</Text>
        </TouchableOpacity>
        <Text style={calStyles.monthLabel}>{formatYearMonth(year, month)}</Text>
        <TouchableOpacity onPress={onNextMonth} activeOpacity={0.7}>
          <Text style={calStyles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={calStyles.dayHeaders}>
        {['日', '月', '火', '水', '木', '金', '土'].map((d) => (
          <Text key={d} style={calStyles.dayHeader}>{d}</Text>
        ))}
      </View>

      <View style={calStyles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={`empty-${i}`} style={calStyles.cell} />;
          const dayRecords = byDay.get(day) ?? [];
          const best = getBestResult(dayRecords);
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;
          return (
            <TouchableOpacity
              key={day}
              style={[calStyles.cell, isToday && calStyles.cellToday]}
              onPress={() => dayRecords.length > 0 && onDayPress(dayRecords)}
              activeOpacity={dayRecords.length > 0 ? 0.7 : 1}
            >
              <Text style={[calStyles.dayNum, isToday && calStyles.dayNumToday]}>{day}</Text>
              {best && (
                <Image source={RESULT_CONFIG[best].image} style={calStyles.face} resizeMode="contain" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function DayModal({ records, onClose }: { records: NapRecord[]; onClose: () => void }) {
  const d = new Date(records[0].startedAt);
  const title = formatDate(records[0].startedAt);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={dayModalStyles.backdrop} onPress={onClose}>
        <Pressable style={dayModalStyles.card}>
          <Text style={dayModalStyles.title}>{title}</Text>
          {records.map((r, i) => {
            const cfg = r.result ? RESULT_CONFIG[r.result] : null;
            return (
              <View key={r.id} style={[dayModalStyles.row, i < records.length - 1 && dayModalStyles.rowBorder]}>
                <Text style={dayModalStyles.duration}>{r.napDurationMinutes}分</Text>
                {cfg ? (
                  <>
                    <Text style={[dayModalStyles.tag, { color: cfg.ink }]}>{cfg.label}</Text>
                    <Image source={cfg.image} style={dayModalStyles.face} resizeMode="contain" />
                  </>
                ) : (
                  <Text style={dayModalStyles.skipped}>
                    {r.status === 'interrupted' ? '中断' : 'スキップ'}
                  </Text>
                )}
              </View>
            );
          })}
          <TouchableOpacity style={dayModalStyles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={dayModalStyles.closeBtnText}>閉じる</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SummaryItem({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryItemLabel}>{label}</Text>
      <Text style={[styles.summaryItemCount, { color }]}>
        {count}<Text style={styles.summaryItemUnit}>回</Text>
      </Text>
    </View>
  );
}

function RecordRow({ record, isLast }: { record: NapRecord; isLast: boolean }) {
  const cfg = record.result ? RESULT_CONFIG[record.result] : null;
  return (
    <View style={[styles.recordRow, !isLast && styles.recordRowBorder]}>
      <Text style={styles.recordDate}>{formatDate(record.startedAt)}</Text>
      <Text style={styles.recordDuration}>{record.napDurationMinutes}分</Text>
      {cfg ? (
        <>
          <Text style={[styles.recordTag, { color: cfg.ink }]}>{cfg.label}</Text>
          <Image source={cfg.image} style={styles.recordFace} resizeMode="contain" />
        </>
      ) : (
        <Text style={styles.recordSkipped}>
          {record.status === 'interrupted' ? '中断' : 'スキップ'}
        </Text>
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.ink3,
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    padding: 16,
    gap: 14,
    paddingBottom: 32,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.ink2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 6,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.ink2,
  },
  summaryItemCount: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  summaryItemUnit: {
    fontSize: 11,
    fontWeight: '600',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.divider,
    alignSelf: 'stretch',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.ink2,
    marginTop: 4,
  },
  emptySubText: {
    fontSize: 12,
    color: Colors.ink3,
    textAlign: 'center',
    lineHeight: 18,
  },
  listCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  recordRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  recordDate: {
    width: 80,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.ink,
  },
  recordDuration: {
    flex: 1,
    fontSize: 12,
    color: Colors.ink2,
  },
  recordTag: {
    fontSize: 11.5,
    fontWeight: '600',
    marginRight: 8,
  },
  recordFace: {
    width: 26,
    height: 26,
  },
  recordSkipped: {
    fontSize: 11.5,
    color: Colors.ink3,
  },
  proCtaCard: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primaryChip,
    gap: 6,
  },
  proCtaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proCtaTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.ink,
  },
  proCtaDesc: {
    fontSize: 12,
    color: Colors.ink2,
    lineHeight: 18,
  },
  proCtaBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  proCtaBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

const calStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
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
    borderBottomColor: Colors.divider,
  },
  arrow: {
    fontSize: 28,
    color: Colors.primary,
    fontWeight: '300',
    lineHeight: 30,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.ink,
  },
  dayHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: Colors.ink3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  cellToday: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 8,
  },
  dayNum: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.ink,
  },
  dayNumToday: {
    color: Colors.primary,
    fontWeight: '700',
  },
  face: {
    width: 18,
    height: 18,
  },
});

const dayModalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.card,
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
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  duration: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink,
  },
  tag: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  face: {
    width: 24,
    height: 24,
  },
  skipped: {
    fontSize: 12,
    color: Colors.ink3,
  },
  closeBtn: {
    marginTop: 14,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.ink4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink2,
  },
});
