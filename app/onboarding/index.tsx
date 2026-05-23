import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { Colors } from '@/src/theme/colors';
import Sheep from '@/src/components/Sheep';

const { width } = Dimensions.get('window');

type SheepPose = 'smile' | 'sleep' | 'pillow' | 'lie' | 'alert' | 'roll' | 'read';

type Step = {
  pose: SheepPose;
  title: string;
  body: string;
  accent?: string;
};

const STEPS: Step[] = [
  {
    pose: 'smile',
    title: 'NapFitへようこそ',
    body: '仮眠後の気分を記録するだけで、\nあなたに合う仮眠時間がわかります。',
  },
  {
    pose: 'sleep',
    title: '仮眠時間を選ぼう',
    body: '15分・20分・30分、またはカスタム時間。\nアラームが時間になったら起こします。',
    accent: '15 / 20 / 30 分',
  },
  {
    pose: 'alert',
    title: '起きた感じを記録',
    body: '「すっきり」「普通」「だるい」の\n3択を1タップで。スキップもOK。',
    accent: '😊 / 😐 / 😞',
  },
  {
    pose: 'read',
    title: '最適な時間がわかる',
    body: '記録が5件溜まると、あなたにとって\n一番すっきり起きやすい仮眠時間が表示されます。',
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  async function handleNext() {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    await Notifications.requestPermissionsAsync();
    await AsyncStorage.setItem('app:onboarding_completed', 'true');
    await AsyncStorage.setItem('app:first_launch_at', new Date().toISOString());
    router.replace('/(tabs)');
  }

  function handleSkip() {
    AsyncStorage.setItem('app:onboarding_completed', 'true');
    AsyncStorage.setItem('app:first_launch_at', new Date().toISOString());
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* スキップボタン */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>スキップ</Text>
        </TouchableOpacity>
      )}

      {/* コンテンツ */}
      <View style={styles.content}>
        <Sheep pose={current.pose} size={140} />

        <View style={styles.textBlock}>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.body}>{current.body}</Text>
          {current.accent && (
            <View style={styles.accentBadge}>
              <Text style={styles.accentText}>{current.accent}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ドットインジケーター */}
      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === step && styles.dotActive]}
          />
        ))}
      </View>

      {/* 次へボタン */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextBtnText}>
            {isLast ? 'はじめる' : '次へ'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  skipText: {
    fontSize: 13,
    color: Colors.ink3,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 36,
  },
  textBlock: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.ink,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 15,
    color: Colors.ink2,
    textAlign: 'center',
    lineHeight: 24,
  },
  accentBadge: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
  },
  accentText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.ink4,
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.primary,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  nextBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 6,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
