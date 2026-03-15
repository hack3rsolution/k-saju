/**
 * Config plugin: iOS deployment target 영구 적용
 *
 * prebuild --clean 이후 Podfile이 재생성되어도
 * platform :ios fallback을 '14.0'으로 고정한다.
 *
 * app.json의 expo.ios.deploymentTarget: "14.0" 이 1차 설정이며,
 * 이 플러그인은 Podfile 레벨에서 이중으로 보장한다.
 *
 * NOTE: use_modular_headers! 전역 적용은 ExpoModulesCore Swift 모듈
 * (_DarwinFoundation3) 충돌을 유발하므로 사용하지 않는다.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withIosDeploymentTarget(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      if (!fs.existsSync(podfilePath)) return cfg;

      let contents = fs.readFileSync(podfilePath, 'utf8');

      // Ensure fallback is 14.0 (in case deploymentTarget is missing from app.json)
      contents = contents.replace(
        /platform :ios, podfile_properties\['ios\.deploymentTarget'\] \|\| '[^']+'/,
        "platform :ios, podfile_properties['ios.deploymentTarget'] || '14.0'"
      );

      fs.writeFileSync(podfilePath, contents, 'utf8');
      return cfg;
    },
  ]);
};
