import { useState, useCallback, useEffect } from 'react';
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

import AsyncStorage from '@react-native-async-storage/async-storage';

import { getCompletedRecords, getInProgressRecords, updateNapRecord } from '@/src/db/queries';
import { getRecommendedDuration, getStandardDurationStats } from '@/src/nap/statistics';
import { generateComment } from '@/src/comments/generator';
import { detectRecoveryRecord, formatRecoveryAge } from '@/src/nap/recovery';
import { Colors } from '@/src/theme/colors';
import Sheep from '@/src/components/Sheep';
import type { DurationStats } from '@/src/nap/statistics';
import type { NapRecord, NapResult } from '@/src/types';

const STANDARD_DURATIONS = [15, 20, 30] as const;

export default function HomeScreen() {
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [records, setRecords] = useState<NapRecord[]>([]);
  const [recoveryRecord, setRecoveryRecord] = useState<NapRecord | null>(null);
  const [hasActiveNap, setHasActiveNap] = useState(false);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customDuration, setCustomDuration] = useState(25);

  // 初回マウント時のみオンボーディング確認（Stack が描画済みなので安全）
  useEffect(() => {
    AsyncStorage.getItem('app:onboarding_completed').then((val) => {
      if (val !== 'true') router.replace('/onboarding');
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [completed, recovery, inProgress] = await Promise.all([
          getCompletedRecords(),
          detectRecoveryRecord(),
          getInProgressRecords(),
        ]);
        setRecords(completed);
        setRecoveryRecord(recovery);
        // recovery に含まれないアクティブな進行中仮眠（タイマー稼働中）を検出
        const activeNap = inProgress.some(
          (r) => r.id !== recovery?.id
        );
        setHasActiveNap(activeNap);
      })();
    }, [])
  );

  async function handleRecovery(result: NapResult | null) {
    if (!recoveryRecord) return;
    const now = new Date().toISOString();
    if (result) {
      await updateNapRecord(recoveryRecord.id, { status: 'recovered', result, endedAt: now });
    } else {
      await updateNapRecord(recoveryRecord.id, { status: 'skipped', endedAt: now });
    }
    const completed = await getCompletedRecords();
    setRecords(completed);
    setRecoveryRecord(null);
  }

  const recommendedDuration = getRecommendedDuration(records);
  const standardStats = getStandardDurationStats(records);
  const comment = generateComment(records);
  const hasEnoughData = records.length >= 5 && recommendedDuration !== null;
  const isCustomSelected =
    selectedDuration !== null &&
    !(STANDARD_DURATIONS as readonly number[]).includes(selectedDuration);
  const canStart = selectedDuration !== null && recoveryRecord === null && !hasActiveNap;

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
      {/* 救済UXバナー */}
      {recoveryRecord && (
        <RecoveryBanner record={recoveryRecord} onSelect={handleRecovery} />
      )}

      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.greeting}>こんにちは！</Text>
        <Sheep pose="smile" size={32} />
      </View>
      <Text style={styles.greetingSub}>今日も、いい仮眠で整えましょう。</Text>

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
        {recoveryRecord && (
          <Text style={styles.inProgressNote}>上のバナーで前回の記録を完了してから始めてください。</Text>
        )}
        {hasActiveNap && !recoveryRecord && (
          <Text style={styles.inProgressNote}>仮眠中の記録があります。新しい仮眠は開始できません。</Text>
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

function RecoveryBanner({
  record,
  onSelect,
}: {
  record: NapRecord;
  onSelect: (result: NapResult | null) => void;
}) {
  const age = formatRecoveryAge(record.startedAt, record.napDurationMinutes);
  return (
    <View style={bannerStyles.container}>
      <Text style={bannerStyles.title}>
        {age}の{record.napDurationMinutes}分仮眠が記録されていません
      </Text>
      <Text style={bannerStyles.question}>どうでしたか?</Text>
      <View style={bannerStyles.buttons}>
        <TouchableOpacity
          style={[bannerStyles.btn, { backgroundColor: Colors.freshBg }]}
          onPress={() => onSelect('fresh')}
          activeOpacity={0.7}
        >
          <Text style={[bannerStyles.btnText, { color: Colors.freshInk }]}>😊 すっきり</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[bannerStyles.btn, { backgroundColor: Colors.normalBg }]}
          onPress={() => onSelect('normal')}
          activeOpacity={0.7}
        >
          <Text style={[bannerStyles.btnText, { color: Colors.normalInk }]}>😐 普通</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[bannerStyles.btn, { backgroundColor: Colors.sluggishBg }]}
          onPress={() => onSelect('sluggish')}
          activeOpacity={0.7}
        >
          <Text style={[bannerStyles.btnText, { color: Colors.sluggishInk }]}>😞 だるい</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => onSelect(null)} activeOpacity={0.7}>
        <Text style={bannerStyles.skip}>スキップ</Text>
      </TouchableOpacity>
    </View>
  );
}

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
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 2,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  greetingSub: {
    fontSize: 13,
    color: Colors.ink2,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  recommendCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  recommendTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.ink2,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  recommendMain: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 2,
  },
  recommendNumber: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 48,
    letterSpacing: -1,
  },
  recommendUnit: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
    marginLeft: 2,
  },
  recommendSub: {
    fontSize: 10.5,
    color: Colors.ink2,
    marginBottom: 12,
    lineHeight: 16,
  },
  recommendEmpty: {
    fontSize: 12,
    color: Colors.ink3,
    lineHeight: 20,
    marginTop: 4,
  },
  comment: {
    fontSize: 12,
    color: Colors.ink3,
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  timeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  timeButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  timeButtonSelected: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ink,
  },
  timeButtonTextSelected: {
    color: '#FFFFFF',
  },
  customLink: {
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.ink4,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  customLinkText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.ink2,
  },
  bottom: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  inProgressNote: {
    fontSize: 12,
    color: Colors.sluggishInk,
    textAlign: 'center',
    lineHeight: 18,
  },
  startButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.ink4,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  startButtonActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 6,
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

const bannerStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cream,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.yellowBtn,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 2,
  },
  question: {
    fontSize: 11.5,
    color: Colors.ink2,
    marginBottom: 10,
  },
  buttons: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  btn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  skip: {
    fontSize: 11,
    color: Colors.ink3,
    textAlign: 'center',
  },
});

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
    marginTop: 12,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  rateLabel: {
    fontSize: 9.5,
    color: Colors.ink2,
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
    backgroundColor: Colors.primaryChip,
    borderRadius: 4,
  },
  barHighlighted: {
    backgroundColor: Colors.primary,
  },
  durationLabel: {
    fontSize: 9.5,
    color: Colors.ink3,
    marginTop: 4,
    fontWeight: '500',
  },
  durationLabelHighlighted: {
    color: Colors.primary,
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
    backgroundColor: Colors.card,
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
    color: Colors.ink,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.ink3,
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
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterSymbol: {
    fontSize: 22,
    color: Colors.primary,
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
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 60,
    letterSpacing: -1,
  },
  counterUnit: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 6,
    marginLeft: 4,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
