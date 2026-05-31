import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getCompletedRecords, getInProgressRecords, updateNapRecord } from '@/src/db/queries';
import { getRecommendedDuration, getStandardDurationStats } from '@/src/nap/statistics';
import { generateComment } from '@/src/comments/generator';
import { detectRecoveryRecord, formatRecoveryAge } from '@/src/nap/recovery';
import { useTheme, useThemedStyles } from '@/src/theme/ThemeProvider';
import { type ThemeColors } from '@/src/theme/colors';
import { useT } from '@/src/i18n';
import Sheep from '@/src/components/Sheep';
import type { DurationStats } from '@/src/nap/statistics';
import type { NapRecord, NapResult } from '@/src/types';

const STANDARD_DURATIONS = [15, 20, 30] as const;

const RESULT_SHEEP = {
  fresh: require('@/assets/images/sheep/fresh.png'),
  normal: require('@/assets/images/sheep/normal.png'),
  sluggish: require('@/assets/images/sheep/sluggish.png'),
};

export default function HomeScreen() {
  const t = useT();
  const styles = useThemedStyles(makeStyles);

  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [records, setRecords] = useState<NapRecord[]>([]);
  const [recoveryRecord, setRecoveryRecord] = useState<NapRecord | null>(null);
  const [hasActiveNap, setHasActiveNap] = useState(false);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customDuration, setCustomDuration] = useState(25);
  const [hasCustom, setHasCustom] = useState(false);

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
        const activeNap = inProgress.some((r) => r.id !== recovery?.id);
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
  const comment = generateComment(records, t);
  const hasEnoughData = records.length >= 5 && recommendedDuration !== null;
  const isCustomSelected =
    selectedDuration !== null && !(STANDARD_DURATIONS as readonly number[]).includes(selectedDuration);
  const canStart = selectedDuration !== null && recoveryRecord === null && !hasActiveNap;

  function handleStartNap() {
    if (!canStart || selectedDuration === null) return;
    router.push({ pathname: '/nap/active', params: { duration: String(selectedDuration) } });
  }

  function handleCustomConfirm() {
    setSelectedDuration(customDuration);
    setHasCustom(true);
    setCustomModalVisible(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      {recoveryRecord && <RecoveryBanner record={recoveryRecord} onSelect={handleRecovery} />}

      <View style={styles.header}>
        <Text style={styles.greeting}>{t.home.greeting}</Text>
        <Sheep pose="smile" size={32} />
      </View>
      <Text style={styles.greetingSub}>{t.home.greetingSub}</Text>

      <View style={styles.content}>
        <View style={styles.recommendCard}>
          <Text style={styles.recommendTitle}>{t.home.recommendCard.title}</Text>
          {hasEnoughData ? (
            <>
              <View style={styles.recommendMain}>
                <Text style={styles.recommendNumber}>{recommendedDuration}</Text>
                <Text style={styles.recommendUnit}>{t.home.recommendCard.unit}</Text>
              </View>
              <Text style={styles.recommendSub}>{t.home.recommendCard.subtitle}</Text>
              <BarChart stats={standardStats} recommended={recommendedDuration!} />
            </>
          ) : (
            <Text style={styles.recommendEmpty}>{t.home.recommendCard.notEnoughData}</Text>
          )}
        </View>

        <Text style={styles.comment}>{comment}</Text>

        <View style={styles.timeButtons}>
          {STANDARD_DURATIONS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.timeButton, selectedDuration === d && styles.timeButtonSelected]}
              onPress={() => setSelectedDuration(d)}
              activeOpacity={0.7}
            >
              <Text style={[styles.timeButtonText, selectedDuration === d && styles.timeButtonTextSelected]}>
                {d}
                {t.home.minUnit}
              </Text>
            </TouchableOpacity>
          ))}

          {hasCustom && (
            <TouchableOpacity
              style={[styles.timeButton, isCustomSelected && styles.timeButtonSelected]}
              onPress={() =>
                isCustomSelected ? setCustomModalVisible(true) : setSelectedDuration(customDuration)
              }
              activeOpacity={0.7}
            >
              <Text style={[styles.timeButtonText, isCustomSelected && styles.timeButtonTextSelected]}>
                {customDuration}
                {t.home.minUnit}
              </Text>
              <Text style={[styles.customSubLabel, isCustomSelected && styles.customSubLabelSelected]}>
                {isCustomSelected ? t.home.change : t.home.custom}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {!hasCustom && (
          <TouchableOpacity style={styles.customLink} onPress={() => setCustomModalVisible(true)} activeOpacity={0.7}>
            <Text style={styles.customLinkText}>{t.home.customTimeLink}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bottom}>
        {recoveryRecord && <Text style={styles.inProgressNote}>{t.home.noteRecovery}</Text>}
        {hasActiveNap && !recoveryRecord && <Text style={styles.inProgressNote}>{t.home.noteActive}</Text>}
        <TouchableOpacity
          style={[styles.startButton, canStart && styles.startButtonActive]}
          onPress={handleStartNap}
          disabled={!canStart}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>{t.home.startButton}</Text>
        </TouchableOpacity>
      </View>

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

function RecoveryBanner({
  record,
  onSelect,
}: {
  record: NapRecord;
  onSelect: (result: NapResult | null) => void;
}) {
  const t = useT();
  const styles = useThemedStyles(makeBannerStyles);
  const colorsByResult = useTheme().colors;
  const age = formatRecoveryAge(record.startedAt, record.napDurationMinutes, t);

  const options: { result: NapResult; label: string; bg: string; ink: string; image: number }[] = [
    { result: 'fresh', label: t.results.fresh, bg: colorsByResult.freshBg, ink: colorsByResult.freshInk, image: RESULT_SHEEP.fresh },
    { result: 'normal', label: t.results.normal, bg: colorsByResult.normalBg, ink: colorsByResult.normalInk, image: RESULT_SHEEP.normal },
    { result: 'sluggish', label: t.results.sluggish, bg: colorsByResult.sluggishBg, ink: colorsByResult.sluggishInk, image: RESULT_SHEEP.sluggish },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.recovery.bannerTitle(age, record.napDurationMinutes)}</Text>
      <Text style={styles.question}>{t.recovery.bannerQuestion}</Text>
      <View style={styles.buttons}>
        {options.map((o) => (
          <TouchableOpacity
            key={o.result}
            style={[styles.btn, { backgroundColor: o.bg }]}
            onPress={() => onSelect(o.result)}
            activeOpacity={0.7}
          >
            <Image source={o.image} style={styles.btnIcon} resizeMode="contain" />
            <Text style={[styles.btnText, { color: o.ink }]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={() => onSelect(null)} activeOpacity={0.7}>
        <Text style={styles.skip}>{t.recovery.skipButton}</Text>
      </TouchableOpacity>
    </View>
  );
}

function BarChart({ stats, recommended }: { stats: DurationStats[]; recommended: number }) {
  const t = useT();
  const styles = useThemedStyles(makeChartStyles);
  const maxRate = Math.max(...stats.map((s) => s.freshRate), 0.01);

  return (
    <View style={styles.container}>
      {stats.map((s) => {
        const barHeight = s.total > 0 ? Math.max((s.freshRate / maxRate) * 60, 4) : 0;
        const isRecommended = s.duration === recommended;
        return (
          <View key={s.duration} style={styles.column}>
            <Text style={styles.rateLabel}>{s.total > 0 ? `${Math.round(s.freshRate * 100)}%` : '—'}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.bar, { height: barHeight }, isRecommended && styles.barHighlighted]} />
            </View>
            <Text style={[styles.durationLabel, isRecommended && styles.durationLabelHighlighted]}>
              {s.duration}
              {t.home.minUnit}
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
  const t = useT();
  const styles = useThemedStyles(makeModalStyles);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card}>
          <Text style={styles.title}>{t.home.customModalTitle}</Text>
          <Text style={styles.subtitle}>{t.home.customModalSub}</Text>

          <View style={styles.counter}>
            <TouchableOpacity style={styles.counterButton} onPress={() => onChange(Math.max(5, value - 1))} activeOpacity={0.7}>
              <Text style={styles.counterSymbol}>−</Text>
            </TouchableOpacity>

            <View style={styles.counterDisplay}>
              <Text style={styles.counterNumber}>{value}</Text>
              <Text style={styles.counterUnit}>{t.home.minUnit}</Text>
            </View>

            <TouchableOpacity style={styles.counterButton} onPress={() => onChange(Math.min(60, value + 1))} activeOpacity={0.7}>
              <Text style={styles.counterSymbol}>＋</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.confirmButton} onPress={onConfirm} activeOpacity={0.8}>
            <Text style={styles.confirmText}>{t.home.customModalConfirm}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
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
      paddingTop: 10,
      paddingBottom: 2,
    },
    greeting: { fontSize: 26, fontWeight: '700', color: c.ink, letterSpacing: -0.2 },
    greetingSub: { fontSize: 13, color: c.ink2, paddingHorizontal: 20, marginTop: 4, marginBottom: 2 },
    content: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },
    recommendCard: {
      backgroundColor: c.card,
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    recommendTitle: { fontSize: 11, fontWeight: '600', color: c.ink2, letterSpacing: 0.3, marginBottom: 4 },
    recommendMain: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 2 },
    recommendNumber: { fontSize: 42, fontWeight: '800', color: c.primary, lineHeight: 48, letterSpacing: -1 },
    recommendUnit: { fontSize: 18, fontWeight: '700', color: c.primary, marginBottom: 4, marginLeft: 2 },
    recommendSub: { fontSize: 10.5, color: c.ink2, marginBottom: 12, lineHeight: 16 },
    recommendEmpty: { fontSize: 12, color: c.ink3, lineHeight: 20, marginTop: 4 },
    comment: { fontSize: 12, color: c.ink3, lineHeight: 18, marginBottom: 20, paddingHorizontal: 4 },
    timeButtons: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    timeButton: {
      flex: 1,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    timeButtonSelected: {
      backgroundColor: c.primary,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 4,
    },
    timeButtonText: { fontSize: 14, fontWeight: '700', color: c.ink },
    timeButtonTextSelected: { color: '#FFFFFF' },
    customSubLabel: { fontSize: 9, fontWeight: '600', color: c.ink3, marginTop: 2, letterSpacing: 0.2 },
    customSubLabelSelected: { color: 'rgba(255,255,255,0.72)' },
    customLink: {
      height: 36,
      borderRadius: 10,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.ink4,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    customLinkText: { fontSize: 11.5, fontWeight: '600', color: c.ink2 },
    bottom: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
    inProgressNote: { fontSize: 12, color: c.sluggishInk, textAlign: 'center', lineHeight: 18 },
    startButton: {
      height: 50,
      borderRadius: 14,
      backgroundColor: c.ink4,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    startButtonActive: {
      backgroundColor: c.primary,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 18,
      elevation: 6,
    },
    startButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 },
  });

const makeBannerStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: c.cream,
      marginHorizontal: 16,
      marginTop: 8,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: c.yellowBtn,
    },
    title: { fontSize: 12, fontWeight: '700', color: c.ink, marginBottom: 2 },
    question: { fontSize: 11.5, color: c.ink2, marginBottom: 10 },
    buttons: { flexDirection: 'row', gap: 6, marginBottom: 8 },
    btn: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 7,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    btnIcon: { width: 16, height: 16 },
    btnText: { fontSize: 11, fontWeight: '700' },
    skip: { fontSize: 11, color: c.ink3, textAlign: 'center' },
  });

const makeChartStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flexDirection: 'row', gap: 12, alignItems: 'flex-end', marginTop: 12 },
    column: { flex: 1, alignItems: 'center' },
    rateLabel: { fontSize: 9.5, color: c.ink2, fontWeight: '500', marginBottom: 4 },
    barTrack: { height: 60, justifyContent: 'flex-end', alignItems: 'center', width: '100%' },
    bar: { width: '55%', backgroundColor: c.primaryChip, borderRadius: 4 },
    barHighlighted: { backgroundColor: c.primary },
    durationLabel: { fontSize: 9.5, color: c.ink3, marginTop: 4, fontWeight: '500' },
    durationLabelHighlighted: { color: c.primary, fontWeight: '700' },
  });

const makeModalStyles = (c: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    card: {
      backgroundColor: c.card,
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
    title: { fontSize: 18, fontWeight: '700', color: c.ink, marginBottom: 4 },
    subtitle: { fontSize: 13, color: c.ink3, marginBottom: 28 },
    counter: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 28 },
    counterButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    counterSymbol: { fontSize: 22, color: c.primary, fontWeight: '600', lineHeight: 28 },
    counterDisplay: { flexDirection: 'row', alignItems: 'flex-end', minWidth: 90, justifyContent: 'center' },
    counterNumber: { fontSize: 52, fontWeight: '800', color: c.primary, lineHeight: 60, letterSpacing: -1 },
    counterUnit: { fontSize: 18, fontWeight: '700', color: c.primary, marginBottom: 6, marginLeft: 4 },
    confirmButton: { backgroundColor: c.primary, borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center' },
    confirmText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  });
