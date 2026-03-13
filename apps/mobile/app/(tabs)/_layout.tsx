import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  TodayIcon,
  MyChartIcon,
  FortuneIcon,
  RelationsIcon,
  JournalIcon,
  CalendarIcon,
} from '../../src/components/icons';

const ACTIVE_COLOR = '#C9A84C';
const INACTIVE_COLOR = '#C9A84C59'; // 골드 35% opacity

export default function TabsLayout() {
  const { t } = useTranslation('common');
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a0a2e',
          borderTopColor: '#2d1854',
          paddingBottom: 6,
        },
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.today'),
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', gap: 3 }}>
              <TodayIcon color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} size={24} />
              {focused && (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: ACTIVE_COLOR }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chart"
        options={{
          title: t('tabs.myChart'),
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', gap: 3 }}>
              <MyChartIcon color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} size={24} />
              {focused && (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: ACTIVE_COLOR }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="fortune"
        options={{
          title: t('tabs.fortune'),
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', gap: 3 }}>
              <FortuneIcon color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} size={24} />
              {focused && (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: ACTIVE_COLOR }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="relationships"
        options={{
          title: t('tabs.relations'),
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', gap: 3 }}>
              <RelationsIcon color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} size={24} />
              {focused && (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: ACTIVE_COLOR }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: t('tabs.journal'),
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', gap: 3 }}>
              <JournalIcon color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} size={24} />
              {focused && (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: ACTIVE_COLOR }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('tabs.calendar'),
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', gap: 3 }}>
              <CalendarIcon color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} size={24} />
              {focused && (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: ACTIVE_COLOR }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          // Accessible via the gear icon in the home screen header; hide from tab bar
          href: null,
        }}
      />
    </Tabs>
  );
}
