import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { stopAlarm } from '@/src/audio/alarm';
import { updateNapRecord } from '@/src/db/queries';
import { Colors } from '@/src/theme/colors';
import Sheep from '@/src/components/Sheep';
import type { NapResult } from '@/src/types';

type Phase = 'alarm' | 'record';

const RESULTS: { result: NapResult; label: string; desc: string; bg: string; ink: string; face: string }[] = [
  { result: 'fresh',    label: 'すっきり', desc: 'よく休めた気がする',  bg: Colors.freshBg,    ink: Colors.freshInk,    face: '😊' },
  { result: 'normal',   label: '普通',     desc: 'ふつう',              bg: Colors.normalBg,   ink: Colors.normalInk,   face: '😐' },
  { result: 'sluggish', label: 'だるい',   desc: 'まだ眠い・重い感じ', bg: Colors.sluggishBg, ink: Colors.sluggishInk, face: '😞' },
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
        <RecordPhase onResult={handleResult} processing={processing} />
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
  processing,
}: {
  onResult: (r: NapResult) => void;
  processing: boolean;
}) {
  return (
    <View style={styles.phaseWrap}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordTitle}>起きた感じを教えてください</Text>
        <Text style={styles.recordSub}>今日のコンディションを記録しましょう</Text>
      </View>

      <View style={styles.resultCards}>
        {RESULTS.map(({ result, label, desc, bg, ink, face }) => (
          <TouchableOpacity
            key={result}
            style={[styles.resultCard, { backgroundColor: bg }]}
            onPress={() => onResult(result)}
            disabled={processing}
            activeOpacity={0.72}
          >
            <View style={[styles.faceCircle, { backgroundColor: ink }]}>
              <Text style={styles.faceEmoji}>{face}</Text>
            </View>
            <View style={styles.resultContent}>
              <Text style={[styles.resultLabel, { color: ink }]}>{label}</Text>
              <Text style={styles.resultDesc}>{desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.resultNote}>記録すると、あなたに合う仮眠時間が見えてきます</Text>
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

  // フェーズ2
  recordHeader: {
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 6,
  },
  recordTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  recordSub: {
    fontSize: 12.5,
    color: Colors.ink2,
  },
  resultCards: {
    gap: 12,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    gap: 14,
  },
  faceCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceEmoji: {
    fontSize: 22,
  },
  resultContent: {
    flex: 1,
    gap: 3,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  resultDesc: {
    fontSize: 11.5,
    color: Colors.ink2,
  },
  resultNote: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 11.5,
    color: Colors.ink3,
    lineHeight: 18,
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
