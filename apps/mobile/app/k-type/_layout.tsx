import { Stack } from 'expo-router';

export default function KTypeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle:           { backgroundColor: '#1a0a2e' },
        headerTintColor:       '#e9d5ff',
        headerTitleStyle:      { fontWeight: '700' },
        contentStyle:          { backgroundColor: '#0d0016' },
      }}
    />
  );
}
