import React, { type ReactNode } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import type { EventType } from '../../types/calendar'
import { WeddingIcon, FamilyIcon, ContractIcon, CareerIcon, LockIcon } from '../icons'

const EVENT_CONFIG: { type: EventType; label: string; icon: ReactNode; premiumOnly: boolean }[] = [
  { type: 'wedding',   label: '결혼', icon: <WeddingIcon  color="#374151" size={15} />, premiumOnly: false },
  { type: 'moving',    label: '이사', icon: <FamilyIcon   color="#374151" size={15} />, premiumOnly: true  },
  { type: 'contract',  label: '계약', icon: <ContractIcon color="#374151" size={15} />, premiumOnly: true  },
  { type: 'interview', label: '면접', icon: <CareerIcon   color="#374151" size={15} />, premiumOnly: true  },
]

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
      {EVENT_CONFIG.map(({ type, label, icon, premiumOnly }) => {
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
            <View style={styles.iconWrap}>
              {locked
                ? React.cloneElement(icon as React.ReactElement<{ color: string }>, { color: '#9CA3AF' })
                : active
                ? React.cloneElement(icon as React.ReactElement<{ color: string }>, { color: '#7C3AED' })
                : icon
              }
            </View>
            <Text style={[styles.label, active && styles.activeLabel]}>
              {label}
            </Text>
            {locked && (
              <View style={styles.lockIconWrap}>
                <LockIcon color="#9CA3AF" size={10} />
              </View>
            )}
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
  iconWrap:    { width: 15, height: 15, alignItems: 'center', justifyContent: 'center' },
  label:       { fontSize: 13, color: '#374151', fontWeight: '500' },
  activeLabel: { color: '#7C3AED', fontWeight: '700' },
  lockIconWrap:{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' },
})
