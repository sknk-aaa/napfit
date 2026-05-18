import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { getCompletedRecords, getInProgressRecords } from '@/src/db/queries';
import { getRecommendedDuration, getStandardDurationStats } from '@/src/nap/statistics';
import { generateComment } from '@/src/comments/generator';
import type { DurationStats } from '@/src/nap/statistics';
import type { NapRecord } from '@/src/types';

const STANDARD_DURATIONS = [15, 20, 30] as const;

export default function HomeScreen() {
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [records, setRecords] = useState<NapRecord[]>([]);
  const [hasInProgress, setHasInProgress] = useState(false);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customDuration, setCustomDuration] = useState(25);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [completed, inProgress] = await Promise.all([
          getCompletedRecords(),
          getInProgressRecords(),
        ]);
        setRecords(completed);
        setHasInProgress(inProgress.length > 0);
      })();
    }, [])
  );

  const recommendedDuration = getRecommendedDuration(records);
  const standardStats = getStandardDurationStats(records);
  const comment = generateComment(records);
  const hasEnoughData = records.length >= 5 && recommendedDuration !== null;
  const isCustomSelected =
    selectedDuration !== null &&
    !(STANDARD_DURATIONS as readonly number[]).includes(selectedDuration);
  const canStart = selectedDuration !== null && !hasInProgress;

  function handleStartNap() {
    if (!canStart || selectedDuration === null) return;
    router.push({ pathname: '/nap/active', params: { duration: String(selectedDuration) } });
  }

  function handleCustomConfirm() {
    setSelectedDuration(customDuration);
    setCustomModalVisible(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.logo}>NapFit 🌙</Text>
      </View>

      <View style={styles.content}>
        {/* おすすめ仮眠時間カード */}
        <View style={styles.recommendCard}>
          <Text style={styles.recommendTitle}>あなたのおすすめ仮眠時間</Text>
          {hasEnoughData ? (
            <>
              <View style={styles.recommendMain}>
                <Text style={styles.recommendNumber}>{recommendedDuration}</Text>
                <Text style={styles.recommendUnit}>分</Text>
              </View>
              <Text style={styles.recommendSub}>すっきり率が最も高い時間です</Text>
              <BarChart stats={standardStats} recommended={recommendedDuration!} />
            </>
          ) : (
            <Text style={styles.recommendEmpty}>
              記録を続けると、あなたのおすすめ仮眠時間が表示されます
            </Text>
          )}
        </View>

        {/* 簡単コメント */}
        <Text style={styles.comment}>{comment}</Text>

        {/* 時間選択ボタン */}
        <View style={styles.timeButtons}>
          {STANDARD_DURATIONS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.timeButton, selectedDuration === d && styles.timeButtonSelected]}
              onPress={() => setSelectedDuration(d)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.timeButtonText,
                  selectedDuration === d && styles.timeButtonTextSelected,
                ]}
              >
                {d}分
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* カスタム時間リンク */}
        <TouchableOpacity
          style={styles.customLink}
          onPress={() => setCustomModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.customLinkText}>
            {isCustomSelected ? `カスタム: ${selectedDuration}分` : 'カスタム時間を設定'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 仮眠をはじめるボタン */}
      <View style={styles.bottom}>
        {hasInProgress && (
          <Text style={styles.inProgressNote}>前回の仮眠が未記録です。上のバナーから記録してください。</Text>
        )}
        <TouchableOpacity
          style={[styles.startButton, canStart && styles.startButtonActive]}
          onPress={handleStartNap}
          disabled={!canStart}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>仮眠をはじめる</Text>
        </TouchableOpacity>
      </View>

      {/* カスタム時間モーダル */}
      <CustomTimeModal
        visible={customModalVisible}
        value={customDuration}
        onChange={setCustomDuration}
        onConfirm={handleCustomConfirm}
        onClose={() => setCustomModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// ---- サブコンポーネント ----

function BarChart({
  stats,
  recommended,
}: {
  stats: DurationStats[];
  recommended: number;
}) {
  const maxRate = Math.max(...stats.map((s) => s.freshRate), 0.01);

  return (
    <View style={chartStyles.container}>
      {stats.map((s) => {
        const barHeight = s.total > 0 ? Math.max((s.freshRate / maxRate) * 60, 4) : 0;
        const isRecommended = s.duration === recommended;
        return (
          <View key={s.duration} style={chartStyles.column}>
            <Text style={chartStyles.rateLabel}>
              {s.total > 0 ? `${Math.round(s.freshRate * 100)}%` : '—'}
            </Text>
            <View style={chartStyles.barTrack}>
              <View
                style={[
                  chartStyles.bar,
                  { height: barHeight },
                  isRecommended && chartStyles.barHighlighted,
                ]}
              />
            </View>
            <Text
              style={[
                chartStyles.durationLabel,
                isRecommended && chartStyles.durationLabelHighlighted,
              ]}
            >
              {s.duration}分
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function CustomTimeModal({
  visible,
  value,
  onChange,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  value: number;
  onChange: (v: number) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose}>
        <Pressable style={modalStyles.card}>
          <Text style={modalStyles.title}>カスタム時間を設定</Text>
          <Text style={modalStyles.subtitle}>5〜60分、1分刻みで選べます</Text>

          <View style={modalStyles.counter}>
            <TouchableOpacity
              style={modalStyles.counterButton}
              onPress={() => onChange(Math.max(5, value - 1))}
              activeOpacity={0.7}
            >
              <Text style={modalStyles.counterSymbol}>−</Text>
            </TouchableOpacity>

            <View style={modalStyles.counterDisplay}>
              <Text style={modalStyles.counterNumber}>{value}</Text>
              <Text style={modalStyles.counterUnit}>分</Text>
            </View>

            <TouchableOpacity
              style={modalStyles.counterButton}
              onPress={() => onChange(Math.min(60, value + 1))}
              activeOpacity={0.7}
            >
              <Text style={modalStyles.counterSymbol}>＋</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={modalStyles.confirmButton}
            onPress={onConfirm}
            activeOpacity={0.8}
          >
            <Text style={modalStyles.confirmText}>この時間で設定</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---- スタイル ----

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  logo: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C2C2C',
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  recommendCard: {
    backgroundColor: '#EEF6FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  recommendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5B9BD5',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  recommendMain: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 2,
  },
  recommendNumber: {
    fontSize: 52,
    fontWeight: '700',
    color: '#2C2C2C',
    lineHeight: 58,
  },
  recommendUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 6,
    marginLeft: 4,
  },
  recommendSub: {
    fontSize: 12,
    color: '#5B9BD5',
    marginBottom: 16,
  },
  recommendEmpty: {
    fontSize: 13,
    color: '#999',
    lineHeight: 21,
    marginTop: 4,
  },
  comment: {
    fontSize: 13,
    color: '#999',
    lineHeight: 20,
    marginBottom: 24,
  },
  timeButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  timeButtonSelected: {
    backgroundColor: '#5B9BD5',
    borderColor: '#5B9BD5',
    shadowColor: '#5B9BD5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  timeButtonTextSelected: {
    color: '#FFFFFF',
  },
  customLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  customLinkText: {
    fontSize: 13,
    color: '#5B9BD5',
    fontWeight: '500',
  },
  bottom: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
  },
  inProgressNote: {
    fontSize: 12,
    color: '#F44336',
    textAlign: 'center',
    lineHeight: 18,
  },
  startButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonActive: {
    backgroundColor: '#5B9BD5',
    shadowColor: '#5B9BD5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  rateLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
    marginBottom: 4,
  },
  barTrack: {
    height: 60,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  bar: {
    width: '55%',
    backgroundColor: '#B8D8F0',
    borderRadius: 4,
  },
  barHighlighted: {
    backgroundColor: '#5B9BD5',
  },
  durationLabel: {
    fontSize: 11,
    color: '#BBB',
    marginTop: 4,
    fontWeight: '500',
  },
  durationLabelHighlighted: {
    color: '#5B9BD5',
    fontWeight: '700',
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#BBB',
    marginBottom: 28,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 28,
  },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterSymbol: {
    fontSize: 22,
    color: '#5B9BD5',
    fontWeight: '600',
    lineHeight: 28,
  },
  counterDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minWidth: 90,
    justifyContent: 'center',
  },
  counterNumber: {
    fontSize: 52,
    fontWeight: '700',
    color: '#2C2C2C',
    lineHeight: 60,
  },
  counterUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 6,
    marginLeft: 4,
  },
  confirmButton: {
    backgroundColor: '#5B9BD5',
    borderRadius: 28,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
