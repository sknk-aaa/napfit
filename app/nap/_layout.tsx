import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function NapLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="active" />
        <Stack.Screen name="wake" />
      </Stack>
    </SafeAreaProvider>
  );
}
