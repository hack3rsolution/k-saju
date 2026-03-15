/**
 * react-native.config.js — Monorepo autolinking 경로 지정
 *
 * pnpm node-linker=hoisted 환경에서 react-native-* 패키지들이 monorepo root
 * node_modules/에 hoisting되어 native_modules.gradle autolinking이 탐지 못하는 문제.
 *
 * - expo-* 모듈: useExpoModules()가 별도 처리 → 이 파일 불필요
 * - react-native-* 모듈: native_modules.gradle이 처리 → root 경로 명시 필요
 *
 * iOS: withIosDeploymentTarget.js 플러그인이 Podfile에 명시적 경로 주입
 * Android: 이 파일로 applyNativeModulesAppBuildGradle 경로 지정
 */
const path = require('path');

// monorepo root node_modules/ 절대 경로
// apps/mobile/ → ../../ → k-saju/ (monorepo root)
const root = (pkg) =>
  path.resolve(__dirname, '../../node_modules', pkg);

module.exports = {
  dependencies: {
    '@react-native-async-storage/async-storage': {
      root: root('@react-native-async-storage/async-storage'),
    },
    'react-native-gesture-handler': {
      root: root('react-native-gesture-handler'),
    },
    'react-native-purchases': {
      root: root('react-native-purchases'),
    },
    'react-native-reanimated': {
      root: root('react-native-reanimated'),
    },
    'react-native-safe-area-context': {
      root: root('react-native-safe-area-context'),
    },
    'react-native-screens': {
      root: root('react-native-screens'),
    },
    'react-native-svg': {
      root: root('react-native-svg'),
    },
    'react-native-view-shot': {
      root: root('react-native-view-shot'),
    },
  },
};
