/**
 * react-native.config.js — Monorepo autolinking 경로 지정
 *
 * pnpm node-linker=hoisted 환경에서 일부 패키지가 monorepo root node_modules/에
 * 설치되어 Expo/RN autolinking이 탐지하지 못하는 문제를 해결한다.
 *
 * iOS: Podfile에 명시적 pod 경로 추가 (withIosDeploymentTarget.js)
 * Android: 이 파일로 native_modules.gradle의 autolinking 경로 지정
 */
const path = require('path');

module.exports = {
  dependencies: {
    '@react-native-async-storage/async-storage': {
      root: path.resolve(__dirname, '../../node_modules/@react-native-async-storage/async-storage'),
    },
  },
};
