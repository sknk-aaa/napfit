import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { useThemedStyles } from '@/src/theme/ThemeProvider';
import { type ThemeColors } from '@/src/theme/colors';
import { useT } from '@/src/i18n';
import Sheep from '@/src/components/Sheep';

type SheepPose = 'smile' | 'sleep' | 'pillow' | 'lie' | 'alert' | 'roll' | 'read';

const SHEEP = {
  fresh: require('@/assets/images/sheep/fresh.png'),
  normal: require('@/assets/images/sheep/normal.png'),
  sluggish: require('@/assets/images/sheep/sluggish.png'),
};

const STEP_META: { pose: SheepPose; accentImages?: ImageSourcePropType[] }[] = [
  { pose: 'smile' },
  { pose: 'sleep' },
  { pose: 'alert', accentImages: [SHEEP.fresh, SHEEP.normal, SHEEP.sluggish] },
  { pose: 'read' },
];

export default function OnboardingScreen() {
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  const [step, setStep] = useState(0);
  const meta = STEP_META[step];
  const text = t.onboarding.steps[step];
  const isLast = step === STEP_META.length - 1;

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
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>{t.onboarding.skip}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        <Sheep pose={meta.pose} size={140} />

        <View style={styles.textBlock}>
          <Text style={styles.title}>{text.title}</Text>
          <Text style={styles.body}>{text.body}</Text>
          {meta.accentImages ? (
            <View style={styles.accentSheepRow}>
              {meta.accentImages.map((img, i) => (
                <Image key={i} source={img} style={styles.accentSheep} resizeMode="contain" />
              ))}
            </View>
          ) : text.accent ? (
            <View style={styles.accentBadge}>
              <Text style={styles.accentText}>{text.accent}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.dots}>
        {STEP_META.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.nextBtnText}>{isLast ? t.onboarding.start : t.onboarding.next}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    skipBtn: { alignSelf: 'flex-end', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
    skipText: { fontSize: 13, color: c.ink3, fontWeight: '500' },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 36 },
    textBlock: { alignItems: 'center', gap: 12 },
    title: { fontSize: 24, fontWeight: '800', color: c.ink, textAlign: 'center', letterSpacing: -0.3 },
    body: { fontSize: 15, color: c.ink2, textAlign: 'center', lineHeight: 24 },
    accentBadge: { backgroundColor: c.primarySoft, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, marginTop: 4 },
    accentText: { fontSize: 18, fontWeight: '700', color: c.primary, letterSpacing: 1 },
    accentSheepRow: { flexDirection: 'row', gap: 16, marginTop: 4, alignItems: 'center' },
    accentSheep: { width: 52, height: 52 },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 16 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.ink4 },
    dotActive: { width: 20, backgroundColor: c.primary },
    bottom: { paddingHorizontal: 24, paddingBottom: 16 },
    nextBtn: {
      height: 54,
      borderRadius: 16,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 18,
      elevation: 6,
    },
    nextBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.2 },
  });
