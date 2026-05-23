import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Crypto from 'expo-crypto';

import { insertNapRecord, updateNapRecord } from '@/src/db/queries';
import { startBgm, stopBgm, resumeBgm, hasBgm } from '@/src/audio/bgm';
import { startAlarm, stopAlarm } from '@/src/audio/alarm';
import { getRemainingSeconds, formatTime } from '@/src/nap/timer';
import { scheduleAlarmNotification, cancelNotification } from '@/src/notifications/schedule';
import { Colors } from '@/src/theme/colors';
import Sheep from '@/src/components/Sheep';

export default function NapActiveScreen() {
  const { duration } = useLocalSearchParams<{ duration: string }>();
  const durationMinutes = Math.max(5, parseInt(duration ?? '20', 10) || 20);

  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(durationMinutes * 60);
  const [bgmActive, setBgmActive] = useState(false);

  // ref で非同期コールバックから最新値を参照する
  const recordIdRef = useRef<string | null>(null);
  const notifIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<string | null>(null);
  const alarmFiredRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- マウント時: DB挿入 → keep-awake → BGM → 通知予約 ----
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const id = Crypto.randomUUID();
      const now = new Date().toISOString();

      try {
        await insertNapRecord({
          id,
          startedAt: now,
          endedAt: null,
          napDurationMinutes: durationMinutes,
          result: null,
          status: 'in_progress',
          createdAt: now,
        });
      } catch {
        router.back();
        return;
      }

      if (cancelled) return;

      recordIdRef.current = id;
      startedAtRef.current = now;
      setStartedAt(now);

      await activateKeepAwakeAsync();

      try {
        await startBgm();
        if (!cancelled) setBgmActive(hasBgm());
      } catch {}

      const targetDate = new Date(new Date(now).getTime() + durationMinutes * 60 * 1000);
      notifIdRef.current = await scheduleAlarmNotification(targetDate, durationMinutes);
    })();

    return () => {
      cancelled = true;
      deactivateKeepAwake();
      stopBgm();
      stopAlarm();
      if (notifIdRef.current) {
        cancelNotification(notifIdRef.current);
        notifIdRef.current = null;
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ---- タイマー: 500ms 毎に絶対時刻で残り時間を計算 ----
  useEffect(() => {
    if (!startedAt) return;

    intervalRef.current = setInterval(async () => {
      const remaining = getRemainingSeconds(startedAt, durationMinutes);
      setRemainingSeconds(remaining);

      if (remaining === 0 && !alarmFiredRef.current) {
        alarmFiredRef.current = true;
        if (intervalRef.current) clearInterval(intervalRef.current);
        await fireAlarmAndNavigate();
      }
    }, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startedAt, durationMinutes]);

  // ---- AppState: 電話終了・バックグラウンド復帰時の処理 (§9.6.1) ----
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next: AppStateStatus) => {
      if (next !== 'active' || !startedAtRef.current) return;
      const remaining = getRemainingSeconds(startedAtRef.current, durationMinutes);

      if (remaining <= 0 && !alarmFiredRef.current) {
        alarmFiredRef.current = true;
        if (intervalRef.current) clearInterval(intervalRef.current);
        await fireAlarmAndNavigate();
      } else if (remaining > 0) {
        try { await resumeBgm(); } catch {}
      }
    });
    return () => sub.remove();
  }, [durationMinutes]);

  async function fireAlarmAndNavigate() {
    if (notifIdRef.current) {
      await cancelNotification(notifIdRef.current);
      notifIdRef.current = null;
    }
    await stopBgm();
    setBgmActive(false);
    await startAlarm();
    router.replace({
      pathname: '/nap/wake',
      params: { recordId: recordIdRef.current ?? '', duration: String(durationMinutes) },
    });
  }

  // ---- 中断 ----
  function handleInterrupt() {
    Alert.alert(
      '仮眠を中断しますか?',
      '',
      [
        { text: '続ける', style: 'cancel' },
        {
          text: '中断',
          style: 'destructive',
          onPress: async () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (notifIdRef.current) {
              await cancelNotification(notifIdRef.current);
              notifIdRef.current = null;
            }
            await stopBgm();
            if (recordIdRef.current) {
              await updateNapRecord(recordIdRef.current, {
                status: 'interrupted',
                endedAt: new Date().toISOString(),
              });
            }
            router.replace('/(tabs)');
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleInterrupt} activeOpacity={0.7}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.keepOpenText}>この画面を開いたままにしてください</Text>
        <View style={styles.closeBtn} />
      </View>

      {/* メインエリア */}
      <View style={styles.main}>
        <Sheep pose="sleep" size={120} />

        {/* タイマー */}
        <View style={styles.timerBlock}>
          <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
          {bgmActive && (
            <Text style={styles.bgmLabel}>♪ BGM再生中</Text>
          )}
        </View>
      </View>

      {/* 下部: 中断ボタン */}
      <View style={styles.bottom}>
        <TouchableOpacity style={styles.stopBtn} onPress={handleInterrupt} activeOpacity={0.7}>
          <Text style={styles.stopBtnText}>中断する</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.napBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  keepOpenText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.82)',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
  },
  timerBlock: {
    alignItems: 'center',
    gap: 10,
  },
  timerText: {
    fontSize: 76,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  bgmLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '500',
  },
  bottom: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  stopBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtnText: {
    fontSize: 14,
    color: Colors.ink,
    fontWeight: '700',
  },
});
