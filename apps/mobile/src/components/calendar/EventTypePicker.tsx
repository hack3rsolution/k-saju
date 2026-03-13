import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import type { EventType } from '../../types/calendar'

const EVENT_CONFIG = [
  { type: 'wedding'   as EventType, label: '결혼', emoji: '💍', premiumOnly: false },
  { type: 'moving'    as EventType, label: '이사', emoji: '🏠', premiumOnly: true  },
  { type: 'contract'  as EventType, label: '계약', emoji: '📝', premiumOnly: true  },
  { type: 'interview' as EventType, label: '면접', emoji: '💼', premiumOnly: true  },
] as const

interface Props {
  selected: EventType
  onSelect: (type: EventType) => void
  isPremium?: boolean
  onUpgradePress?: () => void
}

export function EventTypePicker({ selected, onSelect, isPremium = false, onUpgradePress }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.container}
    >
      {EVENT_CONFIG.map(({ type, label, emoji, premiumOnly }) => {
        const locked = premiumOnly && !isPremium
        const active = selected === type
        return (
          <TouchableOpacity
            key={type}
            style={[styles.tab, active && styles.activeTab, locked && styles.lockedTab]}
            onPress={() => {
              if (locked) {
                onUpgradePress?.()
              } else {
                onSelect(type)
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={[styles.label, active && styles.activeLabel]}>
              {label}
            </Text>
            {locked && <Text style={styles.lockIcon}>🔒</Text>}
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollView:  { height: 52, flexGrow: 0 },
  container:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  tab:         { flexDirection: 'row', alignItems: 'center', height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: '#F5F0FF', gap: 4, borderWidth: 1.5, borderColor: 'transparent' },
  activeTab:   { backgroundColor: '#EDE9FE', borderColor: '#7C3AED' },
  lockedTab:   { opacity: 0.6 },
  emoji:       { fontSize: 15 },
  label:       { fontSize: 13, color: '#374151', fontWeight: '500' },
  activeLabel: { color: '#7C3AED', fontWeight: '700' },
  lockIcon:    { fontSize: 10 },
})
