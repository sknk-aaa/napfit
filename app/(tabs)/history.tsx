import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { getCompletedRecords } from '@/src/db/queries';
import { Colors } from '@/src/theme/colors';
import Sheep from '@/src/components/Sheep';
import type { NapRecord, NapResult } from '@/src/types';

const RESULT_CONFIG: Record<NapResult, { label: string; face: string; ink: string }> = {
  fresh:    { label: 'すっきり', face: '😊', ink: Colors.freshInk },
  normal:   { label: '普通',     face: '😐', ink: Colors.normalInk },
  sluggish: { label: 'だるい',   face: '😞', ink: Colors.sluggishInk },
};

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[d.getDay()];
  return `${month}/${day} (${weekday})`;
}

export default function HistoryScreen() {
  const [records, setRecords] = useState<NapRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      getCompletedRecords().then(setRecords);
    }, [])
  );

  const last10 = records.slice(0, 10);
  const freshCount = last10.filter(r => r.result === 'fresh').length;
  const normalCount = last10.filter(r => r.result === 'normal').length;
  const sluggishCount = last10.filter(r => r.result === 'sluggish').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>履歴</Text>
          <Sheep pose="pillow" size={28} />
        </View>
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

        {/* レコードリスト */}
        {records.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Sheep pose="smile" size={80} />
            <Text style={styles.emptyText}>まだ記録がありません</Text>
            <Text style={styles.emptySubText}>仮眠を終えると、ここに記録が残ります</Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {records.map((r, i) => (
              <RecordRow key={r.id} record={r} isLast={i === records.length - 1} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
          <Text style={styles.recordFace}>{cfg.face}</Text>
        </>
      ) : (
        <Text style={styles.recordSkipped}>スキップ</Text>
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
    fontSize: 20,
  },
  recordSkipped: {
    fontSize: 11.5,
    color: Colors.ink3,
  },
});
