/**
 * Config plugin: iOS 빌드 영구 패치
 *
 * prebuild --clean 이후 Podfile이 재생성되어도 아래 두 가지를 보장한다:
 *
 * 1. platform :ios fallback을 '14.0'으로 고정
 *    (expo-build-properties가 1차 설정, 이 플러그인이 2차 안전망)
 *
 * 2. RNCAsyncStorage pod 명시적 경로 주입
 *    pnpm hoisted monorepo 환경에서 @react-native-async-storage/async-storage가
 *    루트 node_modules/에 설치되어 Expo 자동링킹이 탐지하지 못하는 문제 해결.
 *    → 미적용 시 런타임 "NativeModule: AsyncStorage is null" 에러 발생
 *
 * NOTE: use_modular_headers! 전역 적용은 ExpoModulesCore Swift 모듈
 * (_DarwinFoundation3) 충돌을 유발하므로 사용하지 않는다.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const ASYNC_STORAGE_POD = `
  # pnpm hoisted monorepo: @react-native-async-storage is at monorepo root node_modules/,
  # not apps/mobile/node_modules/, so Expo autolinking cannot find it automatically.
  # Explicit path is required to prevent "NativeModule: AsyncStorage is null" at runtime.
  pod 'RNCAsyncStorage',
    :path => '../../../node_modules/@react-native-async-storage/async-storage'
`;

module.exports = function withIosDeploymentTarget(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      if (!fs.existsSync(podfilePath)) return cfg;

      let contents = fs.readFileSync(podfilePath, 'utf8');

      // 1) Ensure platform :ios fallback is 14.0
      contents = contents.replace(
        /platform :ios, podfile_properties\['ios\.deploymentTarget'\] \|\| '[^']+'/,
        "platform :ios, podfile_properties['ios.deploymentTarget'] || '14.0'"
      );

      // 2) Inject RNCAsyncStorage pod if not already present
      if (!contents.includes('RNCAsyncStorage')) {
        // Insert after "config = use_native_modules!" line
        contents = contents.replace(
          /(config = use_native_modules!)/,
          `$1\n${ASYNC_STORAGE_POD}`
        );
      }

      fs.writeFileSync(podfilePath, contents, 'utf8');
      return cfg;
    },
  ]);
};
