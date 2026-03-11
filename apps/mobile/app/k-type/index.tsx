/**
 * app/k-type/index.tsx — K-Type 딥링크 진입점
 *
 * 딥링크: ksaju://k-type?share={userId}
 *
 * - share 파라미터가 있으면 compare 화면으로 리다이렉트
 * - share 파라미터가 없으면 (tabs)/k-type 탭으로 이동
 * - 비로그인 시 login으로 이동 (compare는 인증 필요)
 */
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { T } from '../../src/theme/tokens';

export default function KTypeIndex() {
  const { share } = useLocalSearchParams<{ share?: string }>();
  const { session } = useAuthStore();

  useEffect(() => {
    if (share) {
      // 딥링크 공유: ksaju://k-type?share=xxx → compare 화면
      if (!session) {
        // 비로그인 시 로그인 후 compare로 돌아오도록 login 이동
        router.replace('/(auth)/login');
      } else {
        router.replace({ pathname: '/k-type/compare', params: { share } });
      }
    } else {
      // share 파라미터 없음: k-type 탭으로 이동 (M3에서 생성)
      router.replace('/(tabs)/home');
    }
  }, [share, session]);

  return (
    <View style={{ flex: 1, backgroundColor: T.bg.base, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={T.primary.DEFAULT} />
    </View>
  );
}
