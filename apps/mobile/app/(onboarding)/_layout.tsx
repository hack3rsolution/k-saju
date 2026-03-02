import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="birth-input" />
      <Stack.Screen name="cultural-frame" />
      <Stack.Screen name="result-preview" />
    </Stack>
  );
}
