import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { stopAlarm } from '@/src/audio/alarm';
import { updateNapRecord } from '@/src/db/queries';
import { Colors } from '@/src/theme/colors';
import Sheep from '@/src/components/Sheep';
import type { NapResult } from '@/src/types';

type Phase = 'alarm' | 'record';

type RecordItem = {
  result: NapResult;
  label: string;
  desc: string;
  image: ImageSourcePropType;
  bg: string;
  accent: string;
  ink: string;
};

const RECORD_ITEMS: RecordItem[] = [
  {
    result: 'fresh',
    label: 'すっきり',
    desc: 'よく休めた！',
    image: require('@/assets/images/sheep/fresh.png'),
    bg: '#F0FBF1',
    accent: '#4CAF50',
    ink: Colors.freshInk,
  },
  {
    result: 'normal',
    label: 'ふつう',
    desc: 'まあまあかな',
    image: require('@/assets/images/sheep/normal.png'),
    bg: '#FFFCF0',
    accent: '#FFC107',
    ink: '#C47A00',
  },
  {
    result: 'sluggish',
    label: 'だるい',
    desc: 'まだ眠い…',
    image: require('@/assets/images/sheep/sluggish.png'),
    bg: '#FFF2F5',
    accent: '#EF9A9A',
    ink: Colors.sluggishInk,
  },
];

export default function NapWakeScreen() {
  const { recordId } = useLocalSearchParams<{ recordId: string; duration: string }>();
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
      await updateNapRecord(recordId, {
        status: 'skipped',
        endedAt: new Date().toISOString(),
      });
    }
    router.replace('/(tabs)');
  }

  async function handleResult(result: NapResult) {
    if (processing) return;
    setProcessing(true);
    if (recordId) {
      await updateNapRecord(recordId, {
        status: 'completed',
        result,
        endedAt: new Date().toISOString(),
      });
    }
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(820),
      Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => router.replace('/(tabs)'));
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: phase === 'alarm' ? Colors.cream : Colors.background }]}
      edges={['top', 'bottom']}
    >
      {phase === 'alarm' ? (
        <AlarmPhase onStop={handleStopAlarm} onSkip={handleSkip} processing={processing} />
      ) : (
        <RecordPhase onResult={handleResult} onSkip={handleSkip} processing={processing} />
      )}

      <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
        <Text style={styles.toastText}>記録しました ✓</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

function AlarmPhase({
  onStop,
  onSkip,
  processing,
}: {
  onStop: () => void;
  onSkip: () => void;
  processing: boolean;
}) {
  return (
    <View style={styles.phaseWrap}>
      <View style={styles.alarmMain}>
        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>おはようございます！</Text>
          <Text style={styles.greetingSub}>起きる時間です</Text>
        </View>
        <Sheep pose="alert" size={160} />
      </View>

      <View style={styles.alarmBottom}>
        <TouchableOpacity style={styles.stopBtn} onPress={onStop} activeOpacity={0.85}>
          <Text style={styles.stopBtnText}>アラームを止める</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipLink}
          onPress={onSkip}
          disabled={processing}
          activeOpacity={0.7}
        >
          <Text style={styles.skipLinkText}>スキップ（記録しない）</Text>
        </TouchableOpacity>
        <Text style={styles.skipNote}>※スキップしても、仮眠の記録は残りません</Text>
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
  const scales = useRef(RECORD_ITEMS.map(() => new Animated.Value(1))).current;

  function pressIn(i: number) {
    Animated.spring(scales[i], {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }

  function pressOut(i: number) {
    Animated.spring(scales[i], {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 7,
    }).start();
  }

  return (
    <View style={recordStyles.container}>
      <View style={recordStyles.header}>
        <Text style={recordStyles.title}>起きた感じは？</Text>
        <Text style={recordStyles.subtitle}>今日のコンディションを教えてください</Text>
      </View>

      <View style={recordStyles.cards}>
        {RECORD_ITEMS.map((item, i) => (
          <Animated.View key={item.result} style={{ transform: [{ scale: scales[i] }] }}>
            <TouchableOpacity
              style={[recordStyles.card, { backgroundColor: item.bg }]}
              onPress={() => onResult(item.result)}
              onPressIn={() => pressIn(i)}
              onPressOut={() => pressOut(i)}
              disabled={processing}
              activeOpacity={1}
            >
              <View style={[recordStyles.stripe, { backgroundColor: item.accent }]} />
              <View style={recordStyles.sheepWrap}>
                <Image
                  source={item.image}
                  style={recordStyles.sheepImg}
                  resizeMode="contain"
                />
              </View>
              <View style={recordStyles.textBlock}>
                <Text style={[recordStyles.label, { color: item.ink }]}>{item.label}</Text>
                <Text style={recordStyles.desc}>{item.desc}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <TouchableOpacity
        onPress={onSkip}
        style={recordStyles.skipBtn}
        activeOpacity={0.6}
        disabled={processing}
      >
        <Text style={recordStyles.skipText}>スキップ（記録しない）</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  phaseWrap: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // フェーズ1
  alarmMain: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  greetingBlock: {
    alignItems: 'center',
    gap: 8,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  greetingSub: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.ink2,
  },
  alarmBottom: {
    paddingBottom: 12,
    alignItems: 'center',
    gap: 14,
  },
  stopBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.yellowBtn,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.yellowBtn,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 5,
  },
  stopBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.yellowBtnText,
    letterSpacing: 0.2,
  },
  skipLink: {
    paddingVertical: 4,
  },
  skipLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink2,
  },
  skipNote: {
    fontSize: 10.5,
    color: Colors.ink3,
    textAlign: 'center',
  },

  // トースト
  toast: {
    position: 'absolute',
    bottom: 52,
    left: 24,
    right: 24,
    backgroundColor: Colors.ink,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
  toastText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

const recordStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.ink3,
    marginTop: 4,
  },
  cards: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
  },
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
  stripe: {
    width: 5,
    alignSelf: 'stretch',
  },
  sheepWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  sheepImg: {
    width: 90,
    height: 90,
  },
  textBlock: {
    flex: 1,
    paddingRight: 18,
    gap: 5,
  },
  label: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 29,
  },
  desc: {
    fontSize: 12.5,
    color: Colors.ink2,
    fontWeight: '500',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingBottom: 8,
  },
  skipText: {
    fontSize: 13,
    color: Colors.ink3,
    fontWeight: '500',
  },
});
