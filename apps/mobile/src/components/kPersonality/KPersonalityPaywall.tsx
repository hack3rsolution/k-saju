/**
 * KPersonalityPaywall — K-Personality 전용 구독 모달
 *
 * paywall.tsx 패턴을 그대로 재사용:
 *   Purchases.getOfferings() → 가격 표시
 *   purchasePackage() → 구독 처리
 *   restorePurchases() → 복원 처리
 */
import { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Purchases, { PACKAGE_TYPE } from 'react-native-purchases';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { purchasePackage, restorePurchases } from '../../lib/purchases';
import { T } from '../../theme/tokens';

// ── 포함 항목 ─────────────────────────────────────────────────────────────────

const FEATURES = [
  '심층 성격 분석 (500자+)',
  '강점 & 성장 영역',
  '직업 적합도 TOP 5',
  '오행 궁합 유형',
  '이달의 에너지 흐름',
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface KPersonalityPaywallProps {
  visible:   boolean;
  onClose:   () => void;
  onSuccess: () => void;
}

// ── KPersonalityPaywall ───────────────────────────────────────────────────────

export function KPersonalityPaywall({ visible, onClose, onSuccess }: KPersonalityPaywallProps) {
  const [offering, setOffering]       = useState<PurchasesOffering | null>(null);
  const [offerLoading, setOfferLoad]  = useState(true);
  const [purchasing, setPurchasing]   = useState<string | null>(null);
  const [restoring, setRestoring]     = useState(false);

  useEffect(() => {
    if (!visible) return;
    setOfferLoad(true);
    async function fetchOfferings() {
      try {
        const offerings = await Purchases.getOfferings();
        setOffering(offerings.current);
      } catch {
        // RC 미설정 또는 네트워크 오류 — 표시만 (구매 불가)
      } finally {
        setOfferLoad(false);
      }
    }
    fetchOfferings();
  }, [visible]);

  const monthlyPkg = offering?.availablePackages.find(
    p => p.packageType === PACKAGE_TYPE.MONTHLY,
  ) ?? null;

  const annualPkg = offering?.availablePackages.find(
    p => p.packageType === PACKAGE_TYPE.ANNUAL,
  ) ?? null;

  async function handlePurchase(pkg: PurchasesPackage | null, label: string) {
    if (!pkg) {
      Alert.alert('Not Available', `${label} is not available right now.`);
      return;
    }
    setPurchasing(pkg.identifier);
    try {
      await purchasePackage(pkg);
      Alert.alert('구독 완료!', 'K-Personality 전체 리포트를 이용할 수 있습니다.', [
        { text: '확인', onPress: onSuccess },
      ]);
    } catch (e: unknown) {
      if ((e as { userCancelled?: boolean })?.userCancelled) return;
      Alert.alert('구독 실패', e instanceof Error ? e.message : '다시 시도해주세요.');
    } finally {
      setPurchasing(null);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    try {
      const info = await restorePurchases();
      const hasActive = Object.keys(info.entitlements.active).length > 0;
      if (hasActive) {
        Alert.alert('복원 완료', '구독이 복원되었습니다.', [
          { text: '확인', onPress: onSuccess },
        ]);
      } else {
        Alert.alert('복원 불가', '복원할 구독이 없습니다.');
      }
    } catch (e: unknown) {
      Alert.alert('복원 실패', e instanceof Error ? e.message : '다시 시도해주세요.');
    } finally {
      setRestoring(false);
    }
  }

  const isBusy = purchasing !== null || restoring;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        {/* 닫기 버튼 */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* 헤더 */}
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.headline}>전체 성격 리포트</Text>
          <Text style={styles.subhead}>오행 기반 심층 분석으로{'\n'}나를 깊이 이해하세요</Text>

          {/* 포함 항목 */}
          <View style={styles.featureList}>
            {FEATURES.map((feat, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{feat}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.existingNote}>기존 프리미엄 구독자는 바로 이용 가능합니다</Text>

          {/* 구독 버튼 */}
          {offerLoading ? (
            <ActivityIndicator size="large" color={T.primary.DEFAULT} style={{ marginTop: T.spacing[4] }} />
          ) : (
            <View style={styles.plans}>
              {/* Annual (highlight) */}
              <TouchableOpacity
                style={[styles.planBtn, styles.planBtnHighlight]}
                onPress={() => handlePurchase(annualPkg, 'Premium Annual')}
                disabled={isBusy}
              >
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>Best Value · Save 50%</Text>
                </View>
                <Text style={styles.planName}>연간 구독</Text>
                <Text style={styles.planPrice}>
                  {annualPkg?.product.priceString ?? '$59.99/yr'}
                </Text>
                {purchasing === annualPkg?.identifier
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.planCta}>구독 시작 →</Text>}
              </TouchableOpacity>

              {/* Monthly */}
              <TouchableOpacity
                style={styles.planBtn}
                onPress={() => handlePurchase(monthlyPkg, 'Premium Monthly')}
                disabled={isBusy}
              >
                <Text style={styles.planName}>월간 구독</Text>
                <Text style={styles.planPrice}>
                  {monthlyPkg?.product.priceString ?? '$9.99/mo'}
                </Text>
                {purchasing === monthlyPkg?.identifier
                  ? <ActivityIndicator size="small" color={T.text.primary} />
                  : <Text style={styles.planCta}>구독 시작 →</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* 복원 */}
          <TouchableOpacity onPress={handleRestore} disabled={isBusy} style={styles.restoreBtn}>
            {restoring
              ? <ActivityIndicator size="small" color={T.text.muted} />
              : <Text style={styles.restoreText}>기존 구독 복원</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg.surface },
  closeBtn: { position: 'absolute', top: T.spacing[4], right: T.spacing[4], zIndex: 10, padding: T.spacing[2] },
  closeTxt: { color: T.text.muted, fontSize: T.fontSize.lg },

  content: {
    padding:       T.spacing[6],
    paddingTop:    T.spacing[10],
    alignItems:    'center',
    gap:           T.spacing[4],
    paddingBottom: T.spacing[10],
  },

  lockIcon: { fontSize: 48 },
  headline: { color: T.text.primary, fontSize: T.fontSize['3xl'], fontWeight: '900', textAlign: 'center' },
  subhead:  { color: T.text.muted, fontSize: T.fontSize.base, textAlign: 'center', lineHeight: 22 },

  featureList: { width: '100%', gap: T.spacing[3], backgroundColor: T.bg.card, borderRadius: T.radius.lg, padding: T.spacing[4] },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: T.spacing[3] },
  featureCheck:{ color: '#22c55e', fontSize: T.fontSize.lg, fontWeight: '700' },
  featureText: { color: T.text.secondary, fontSize: T.fontSize.base, flex: 1 },

  existingNote: { color: T.text.faint, fontSize: T.fontSize.sm, textAlign: 'center' },

  plans:   { width: '100%', gap: T.spacing[3] },
  planBtn: {
    backgroundColor: T.bg.card,
    borderRadius:    T.radius.lg,
    borderWidth:     1,
    borderColor:     T.border.default,
    padding:         T.spacing[5],
    alignItems:      'center',
    gap:             T.spacing[1],
  },
  planBtnHighlight: {
    backgroundColor: T.primary.DEFAULT,
    borderColor:     T.primary.light,
  },
  planBadge: {
    backgroundColor: T.primary.light + '33',
    borderRadius:    T.radius.full,
    paddingHorizontal: T.spacing[3],
    paddingVertical:   T.spacing[1],
    marginBottom:      T.spacing[1],
  },
  planBadgeText: { color: T.primary.lighter, fontSize: T.fontSize.xs, fontWeight: '700' },
  planName:  { color: T.text.primary, fontSize: T.fontSize.md, fontWeight: '700' },
  planPrice: { color: T.text.secondary, fontSize: T.fontSize.lg, fontWeight: '800' },
  planCta:   { color: T.text.primary, fontSize: T.fontSize.sm, marginTop: T.spacing[1] },

  restoreBtn: { paddingVertical: T.spacing[3] },
  restoreText: { color: T.text.muted, fontSize: T.fontSize.sm, textDecoration: 'underline' } as object,
});
