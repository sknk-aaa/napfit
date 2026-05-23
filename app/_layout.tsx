import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

import { setupNotificationHandler } from '@/src/notifications/schedule';
import { loadProStatus } from '@/src/pro/gate';
import { initRevenueCat } from '@/src/pro/revenuecat';
import { isPro } from '@/src/pro/revenuecat';
import { setProActive } from '@/src/pro/gate';

setupNotificationHandler();

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (!loaded) return;

    (async () => {
      try {
        await loadProStatus();
        await initRevenueCat();
        const proActive = await isPro();
        setProActive(proActive);
      } catch {}

      try {
        const onboarded = await AsyncStorage.getItem('app:onboarding_completed');
        if (onboarded !== 'true') {
          setAppReady(true);
          await SplashScreen.hideAsync();
          router.replace('/onboarding');
          return;
        }
      } catch {}

      setAppReady(true);
      await SplashScreen.hideAsync();
    })();
  }, [loaded]);

  if (!loaded || !appReady) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="nap" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <Stack.Screen name="analytics" options={{ headerShown: false }} />
      <Stack.Screen name="pro-modal" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
    </Stack>
  );
}
