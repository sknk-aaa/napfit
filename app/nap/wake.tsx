import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { stopAlarm } from '@/src/audio/alarm';
import { updateNapRecord } from '@/src/db/queries';
import { useTheme, useThemedStyles } from '@/src/theme/ThemeProvider';
import { type ThemeColors } from '@/src/theme/colors';
import { useT } from '@/src/i18n';
import Sheep from '@/src/components/Sheep';
import type { NapResult } from '@/src/types';

type Phase = 'alarm' | 'record';

const RECORD_IMAGE: Record<NapResult, ImageSourcePropType> = {
  fresh: require('@/assets/images/sheep/fresh.png'),
  normal: require('@/assets/images/sheep/normal.png'),
  sluggish: require('@/assets/images/sheep/sluggish.png'),
};

export default function NapWakeScreen() {
  const { recordId } = useLocalSearchParams<{ recordId: string; duration: string }>();
  const t = useT();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [phase, setPhase] = useState<Phase>('alarm');
  const [processing, setProcessing] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  async function handleStopAlarm() {
    await stopAlarm();
    setPhase('record');
  }

  async function handleSkip() {
    if (processing) return;
    setProcessing(true);
    await stopAlarm();
    if (recordId) {
      await updateNapRecord(recordId, { status: 'skipped', endedAt: new Date().toISOString() });
    }
    router.replace('/(tabs)');
  }

  async function handleResult(result: NapResult) {
    if (processing) return;
    setProcessing(true);
    if (recordId) {
      await updateNapRecord(recordId, { status: 'completed', result, endedAt: new Date().toISOString() });
    }
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(820),
      Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => router.replace('/(tabs)'));
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: phase === 'alarm' ? colors.cream : colors.background }]}
      edges={['top', 'bottom']}
    >
      {phase === 'alarm' ? (
        <AlarmPhase onStop={handleStopAlarm} onSkip={handleSkip} processing={processing} />
      ) : (
        <RecordPhase onResult={handleResult} onSkip={handleSkip} processing={processing} />
      )}

      <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
        <Text style={styles.toastText}>{t.napWake.recordedToast}</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

function AlarmPhase({ onStop, onSkip, processing }: { onStop: () => void; onSkip: () => void; processing: boolean }) {
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.phaseWrap}>
      <View style={styles.alarmMain}>
        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>{t.napWake.phase1Title}</Text>
          <Text style={styles.greetingSub}>{t.napWake.phase1Subtitle}</Text>
        </View>
        <Sheep pose="alert" size={160} />
      </View>

      <View style={styles.alarmBottom}>
        <TouchableOpacity style={styles.stopBtn} onPress={onStop} activeOpacity={0.85}>
          <Text style={styles.stopBtnText}>{t.napWake.stopAlarmButton}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipLink} onPress={onSkip} disabled={processing} activeOpacity={0.7}>
          <Text style={styles.skipLinkText}>{t.napWake.skipLink}</Text>
        </TouchableOpacity>
        <Text style={styles.skipNote}>{t.napWake.skipNote}</Text>
      </View>
    </View>
  );
}

function RecordPhase({
  onResult,
  onSkip,
  processing,
}: {
  onResult: (r: NapResult) => void;
  onSkip: () => void;
  processing: boolean;
}) {
  const t = useT();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeRecordStyles);
  const scales = useRef([0, 1, 2].map(() => new Animated.Value(1))).current;

  const items: { result: NapResult; image: ImageSourcePropType; label: string; desc: string; bg: string; ink: string }[] = [
    { result: 'fresh', image: RECORD_IMAGE.fresh, label: t.results.fresh, desc: t.results.freshDesc, bg: colors.freshBg, ink: colors.freshInk },
    { result: 'normal', image: RECORD_IMAGE.normal, label: t.results.normal, desc: t.results.normalDesc, bg: colors.normalBg, ink: colors.normalInk },
    { result: 'sluggish', image: RECORD_IMAGE.sluggish, label: t.results.sluggish, desc: t.results.sluggishDesc, bg: colors.sluggishBg, ink: colors.sluggishInk },
  ];

  function pressIn(i: number) {
    Animated.spring(scales[i], { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  }
  function pressOut(i: number) {
    Animated.spring(scales[i], { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 7 }).start();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.napWake.phase2Title}</Text>
        <Text style={styles.subtitle}>{t.napWake.phase2Subtitle}</Text>
      </View>

      <View style={styles.cards}>
        {items.map((item, i) => (
          <Animated.View key={item.result} style={{ transform: [{ scale: scales[i] }] }}>
            <TouchableOpacity
              style={[styles.card, { backgroundColor: item.bg }]}
              onPress={() => onResult(item.result)}
              onPressIn={() => pressIn(i)}
              onPressOut={() => pressOut(i)}
              disabled={processing}
              activeOpacity={1}
            >
              <View style={[styles.stripe, { backgroundColor: item.ink }]} />
              <View style={styles.sheepWrap}>
                <Image source={item.image} style={styles.sheepImg} resizeMode="contain" />
              </View>
              <View style={styles.textBlock}>
                <Text style={[styles.label, { color: item.ink }]}>{item.label}</Text>
                <Text style={styles.desc}>{item.desc}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <TouchableOpacity onPress={onSkip} style={styles.skipBtn} activeOpacity={0.6} disabled={processing}>
        <Text style={styles.skipText}>{t.napWake.skipLink}</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1 },
    phaseWrap: { flex: 1, paddingHorizontal: 20 },
    alarmMain: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 32 },
    greetingBlock: { alignItems: 'center', gap: 8 },
    greeting: { fontSize: 26, fontWeight: '800', color: c.ink, letterSpacing: -0.3 },
    greetingSub: { fontSize: 15, fontWeight: '600', color: c.ink2 },
    alarmBottom: { paddingBottom: 12, alignItems: 'center', gap: 14 },
    stopBtn: {
      width: '100%',
      height: 52,
      borderRadius: 14,
      backgroundColor: c.yellowBtn,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.yellowBtn,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 5,
    },
    stopBtnText: { fontSize: 15, fontWeight: '800', color: c.yellowBtnText, letterSpacing: 0.2 },
    skipLink: { paddingVertical: 4 },
    skipLinkText: { fontSize: 13, fontWeight: '600', color: c.ink2 },
    skipNote: { fontSize: 10.5, color: c.ink3, textAlign: 'center' },
    toast: {
      position: 'absolute',
      bottom: 52,
      left: 24,
      right: 24,
      backgroundColor: c.primary,
      borderRadius: 12,
      paddingVertical: 14,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 7,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
      elevation: 8,
    },
    toastText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', letterSpacing: 0.2 },
  });

const makeRecordStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    header: { marginBottom: 20 },
    title: { fontSize: 28, fontWeight: '800', color: c.ink, letterSpacing: -0.5, lineHeight: 34 },
    subtitle: { fontSize: 13, color: c.ink3, marginTop: 4 },
    cards: { flex: 1, justifyContent: 'center', gap: 10 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 20,
      overflow: 'hidden',
      height: 108,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
    stripe: { width: 5, alignSelf: 'stretch' },
    sheepWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
    sheepImg: { width: 90, height: 90 },
    textBlock: { flex: 1, paddingRight: 18, gap: 5 },
    label: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3, lineHeight: 29 },
    desc: { fontSize: 12.5, color: c.ink2, fontWeight: '500' },
    skipBtn: { alignItems: 'center', paddingVertical: 14, paddingBottom: 8 },
    skipText: { fontSize: 13, color: c.ink3, fontWeight: '500' },
  });
