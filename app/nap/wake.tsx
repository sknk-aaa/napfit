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
import type { NapResult } from '@/src/types';

type Phase = 'alarm' | 'record';

const RESULTS: {
  result: NapResult;
  label: string;
  desc: string;
  color: string;
  bg: string;
}[] = [
  { result: 'fresh',    label: 'すっきり', desc: 'よく休めた気がする',  color: '#4CAF50', bg: '#F1F8F2' },
  { result: 'normal',   label: '普通',     desc: 'ふつう',              color: '#F5A623', bg: '#FFFBF0' },
  { result: 'sluggish', label: 'だるい',   desc: 'まだ眠い・重い感じ', color: '#F44336', bg: '#FEF5F5' },
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
    router.replace('/(tabs)/');
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
    ]).start(() => router.replace('/(tabs)/'));
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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

// ---- フェーズ1: アラーム鳴動 ----

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
        <View style={styles.sheepCircle}>
          <Text style={styles.sheepEmoji}>🐑</Text>
        </View>
        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>おはようございます！</Text>
          <Text style={styles.greetingSub}>起きる時間です</Text>
        </View>
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
        <Text style={styles.skipNote}>スキップしても、仮眠の記録は残ります</Text>
      </View>
    </View>
  );
}

// ---- フェーズ2: 3択記録 ----

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
        {RESULTS.map(({ result, label, desc, color, bg }) => (
          <TouchableOpacity
            key={result}
            style={[styles.resultCard, { backgroundColor: bg }]}
            onPress={() => onResult(result)}
            disabled={processing}
            activeOpacity={0.72}
          >
            <View style={[styles.resultAccent, { backgroundColor: color }]} />
            <View style={styles.resultContent}>
              <Text style={[styles.resultLabel, { color }]}>{label}</Text>
              <Text style={styles.resultDesc}>{desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.resultNote}>記録すると、あなたに合う仮眠時間が見えてきます</Text>
    </View>
  );
}

// ---- スタイル ----

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  phaseWrap: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // フェーズ1
  alarmMain: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  sheepCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#F5F9FC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A8CCD8',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 3,
  },
  sheepEmoji: {
    fontSize: 52,
  },
  greetingBlock: {
    alignItems: 'center',
    gap: 6,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2C2C2C',
    letterSpacing: -0.3,
  },
  greetingSub: {
    fontSize: 16,
    color: '#888',
  },
  alarmBottom: {
    paddingBottom: 12,
    alignItems: 'center',
    gap: 14,
  },
  stopBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5B9BD5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5B9BD5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  stopBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipLink: {
    paddingVertical: 4,
  },
  skipLinkText: {
    fontSize: 14,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  skipNote: {
    fontSize: 11,
    color: '#CCCCCC',
    textAlign: 'center',
  },

  // フェーズ2
  recordHeader: {
    paddingTop: 44,
    paddingBottom: 28,
    alignItems: 'center',
    gap: 6,
  },
  recordTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C2C2C',
    letterSpacing: -0.3,
  },
  recordSub: {
    fontSize: 13,
    color: '#999',
  },
  resultCards: {
    gap: 12,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    overflow: 'hidden',
    height: 72,
  },
  resultAccent: {
    width: 6,
    alignSelf: 'stretch',
  },
  resultContent: {
    flex: 1,
    paddingHorizontal: 18,
    gap: 3,
  },
  resultLabel: {
    fontSize: 17,
    fontWeight: '700',
  },
  resultDesc: {
    fontSize: 12,
    color: '#AAA',
  },
  resultNote: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 12,
    color: '#BBBBBB',
    lineHeight: 18,
  },

  // トースト
  toast: {
    position: 'absolute',
    bottom: 52,
    left: 24,
    right: 24,
    backgroundColor: '#2C3E4A',
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
