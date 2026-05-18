import { Stack } from 'expo-router';

export default function NapLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="active" />
      <Stack.Screen name="wake" />
    </Stack>
  );
}
