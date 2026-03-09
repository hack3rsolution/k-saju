import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { t } = useTranslation('common');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#1a0a2e', borderTopColor: '#2d1854' },
        tabBarActiveTintColor: '#a78bfa',
        tabBarInactiveTintColor: '#5b4d7e',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.today'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sunny" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chart"
        options={{
          title: t('tabs.myChart'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="fortune"
        options={{
          title: t('tabs.fortune'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="star" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="relationships"
        options={{
          title: t('tabs.relations'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: t('tabs.journal'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="face"
        options={{
          title: t('face.title'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="scan-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
