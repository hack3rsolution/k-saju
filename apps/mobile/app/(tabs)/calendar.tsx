import { router } from 'expo-router'
import CalendarScreen from '../../src/screens/CalendarScreen'

export default function CalendarTab() {
  return (
    <CalendarScreen
      onUpgradePress={() => router.push('/paywall')}
    />
  )
}
