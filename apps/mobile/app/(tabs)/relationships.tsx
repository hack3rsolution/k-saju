/**
 * Relationships Tab Screen — issue #20
 *
 * Relationship Map dashboard:
 *  - Card list with name, type, and 🟢🟡🔴 status
 *  - "+" FAB to add a new relationship (AddRelationshipModal)
 *  - Tap a card → RelationshipDetailSheet (score, monthly flow, element chart)
 */
import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRelationships } from '../../src/hooks/useRelationships';
import { RelationshipCard } from '../../src/components/RelationshipCard';
import { AddRelationshipModal } from '../../src/components/AddRelationshipModal';
import { RelationshipDetailSheet } from '../../src/components/RelationshipDetailSheet';
import { useEntitlementStore } from '../../src/store/entitlementStore';
import type { Relationship, RelationshipFortuneData } from '../../src/types/relationship';

export default function RelationshipsScreen() {
  const { isPremium, addons } = useEntitlementStore();
  const hasAccess = isPremium || addons.deepCompatibility;

  const {
    relationships,
    loading,
    fortuneLoading,
    error,
    list,
    add,
    remove,
    getFortune,
  } = useRelationships();

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [addVisible,    setAddVisible]    = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selected,      setSelected]      = useState<Relationship | null>(null);
  const [fortune,       setFortune]       = useState<RelationshipFortuneData | null>(null);
  const [fortuneError,  setFortuneError]  = useState<string | null>(null);

  // ── Load on mount ────────────────────────────────────────────────────────────
  useEffect(() => { list(); }, [list]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAdd = useCallback(
    async (input: Parameters<typeof add>[0]) => {
      const ok = await add(input);
      if (ok) setAddVisible(false);
    },
    [add],
  );

  const handleCardPress = useCallback((rel: Relationship) => {
    setSelected(rel);
    setFortune(null);
    setFortuneError(null);
    setDetailVisible(true);
  }, []);

  const handleLoadFortune = useCallback(async () => {
    if (!selected) return;
    setFortuneError(null);
    const data = await getFortune(selected);
    if (!data) {
      setFortuneError(error ?? 'Failed to load');
    } else {
      setFortune(data);
    }
  }, [selected, getFortune, error]);

  const handleDelete = useCallback(async (id: string) => {
    await remove(id);
  }, [remove]);

  // ── Paywall gate ─────────────────────────────────────────────────────────────

  if (!hasAccess) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Relationship Map</Text>
          <Text style={styles.subtitle}>관계 지도 · 人脈運</Text>
          <View style={styles.lockedCard}>
            <Text style={styles.lockedIcon}>💞</Text>
            <Text style={styles.lockedTitle}>Premium Feature</Text>
            <Text style={styles.lockedDesc}>
              See compatibility scores, monthly energy flows, and five-element synergy for everyone in your life.
            </Text>
            <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/paywall')}>
              <Text style={styles.upgradeBtnText}>Unlock Relationship Map →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ── Main UI ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={list} tintColor="#a78bfa" />}
      >
        {/* Header */}
        <Text style={styles.title}>Relationship Map</Text>
        <Text style={styles.subtitle}>관계 지도 · {new Date().toLocaleString('en', { month: 'long', year: 'numeric' })}</Text>

        {/* Error banner */}
        {error && error !== 'premium_required' && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Empty state */}
        {!loading && relationships.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>💞</Text>
            <Text style={styles.emptyTitle}>No relationships yet</Text>
            <Text style={styles.emptyDesc}>
              Tap the + button to add a partner, friend, or family member and see your cosmic compatibility.
            </Text>
          </View>
        )}

        {/* Relationship cards */}
        {relationships.map((rel) => (
          <RelationshipCard
            key={rel.id}
            relationship={rel}
            onPress={() => handleCardPress(rel)}
            onDelete={() => handleDelete(rel.id)}
          />
        ))}

        {/* Loading shimmer */}
        {loading && relationships.length === 0 && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#a78bfa" size="large" />
            <Text style={styles.loadingText}>Loading relationships…</Text>
          </View>
        )}
      </ScrollView>

      {/* FAB — add relationship */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setAddVisible(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add modal */}
      <AddRelationshipModal
        visible={addVisible}
        loading={loading}
        onClose={() => setAddVisible(false)}
        onSubmit={handleAdd}
      />

      {/* Detail sheet */}
      <RelationshipDetailSheet
        visible={detailVisible}
        relationship={selected}
        fortune={fortune}
        loading={fortuneLoading}
        error={fortuneError}
        onClose={() => { setDetailVisible(false); setSelected(null); }}
        onLoadFortune={handleLoadFortune}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e' },
  scroll:    { flex: 1 },
  content:   { padding: 24, paddingTop: 60, paddingBottom: 100 },
  title:     { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 2 },
  subtitle:  { fontSize: 13, color: '#9d8fbe', marginBottom: 24 },

  errorBanner: { backgroundColor: '#ef444422', borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText:   { color: '#f87171', fontSize: 13, textAlign: 'center' },

  emptyBox:  { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle:{ color: '#fff', fontWeight: '700', fontSize: 18, marginBottom: 8 },
  emptyDesc: { color: '#9d8fbe', fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: 280 },

  loadingBox:  { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: '#9d8fbe', fontSize: 14 },

  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#7c3aed',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },

  lockedCard:  {
    backgroundColor: '#2d1854', borderRadius: 20, padding: 28,
    alignItems: 'center', marginTop: 16,
  },
  lockedIcon:  { fontSize: 48, marginBottom: 12 },
  lockedTitle: { color: '#fff', fontWeight: '700', fontSize: 20, marginBottom: 8 },
  lockedDesc:  { color: '#9d8fbe', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  upgradeBtn:  { backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
