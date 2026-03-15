/**
 * withAndroidNodePath — Expo config plugin
 *
 * 문제 1: settings.gradle의 Groovy Process.execute()가 Gradle 프로세스 환경에서
 *         Homebrew PATH(/opt/homebrew/bin)를 상속하지 않아 `node`를 찾지 못함.
 *         → includeBuild 경로 resolve 실패 → com.facebook.react.settings 미등록
 *         → "Plugin [id: 'com.facebook.react.settings'] was not found" (line 13)
 *
 * 문제 2: expo prebuild가 생성하는 gradle.properties에 org.gradle.java.home 누락.
 *         시스템 기본 Java (25)로 Gradle 실행 → Gradle 8.8 미지원
 *         → "Unsupported class file major version 69"
 *
 * 해결:
 *   1) settings.gradle의 "node" 명령을 절대 경로로 교체
 *   2) gradle.properties에 org.gradle.java.home=Java 17 경로 추가
 *
 * app.json plugins에 등록하면 expo prebuild 시 자동 적용됨.
 */

const { withSettingsGradle, withDangerousMod } = require('@expo/config-plugins');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── node 절대 경로 탐색 ────────────────────────────────────────────────────

function resolveNodePath() {
  try {
    const p = execSync('which node', { encoding: 'utf8' }).trim();
    if (p) return p;
  } catch (_) {}

  const candidates = [
    '/opt/homebrew/bin/node',   // macOS Apple Silicon Homebrew
    '/usr/local/bin/node',      // macOS Intel Homebrew / nvm default
    '/usr/bin/node',            // Linux system
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return 'node';
}

// ── Java 17 홈 경로 탐색 ──────────────────────────────────────────────────

function resolveJava17Home() {
  const candidates = [
    '/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home', // macOS Homebrew
    '/opt/homebrew/opt/openjdk@17',                                    // macOS Homebrew alt
    '/usr/local/opt/openjdk@17',                                       // macOS Intel Homebrew
    '/usr/lib/jvm/java-17-openjdk-amd64',                              // Linux Debian/Ubuntu
    '/usr/lib/jvm/java-17-openjdk',                                    // Linux RPM
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'bin', 'java'))) return c;
  }
  // JAVA_HOME 환경변수에 17이 포함되면 사용
  const javaHome = process.env.JAVA_HOME || '';
  if (javaHome && javaHome.includes('17') && fs.existsSync(path.join(javaHome, 'bin', 'java'))) {
    return javaHome;
  }
  return null;
}

// ── Config Plugin ─────────────────────────────────────────────────────────

function withNodePathInSettings(config) {
  return withSettingsGradle(config, (config) => {
    const nodePath = resolveNodePath();

    if (nodePath === 'node') {
      console.warn('[withAndroidNodePath] node 절대 경로를 찾지 못했습니다. 빌드 실패 가능.');
      return config;
    }

    console.log(`[withAndroidNodePath] node 경로: ${nodePath}`);

    config.modResults.contents = config.modResults.contents
      .replace(/\["node",/g, `["${nodePath}",`)
      .replace(/commandLine\("node",/g, `commandLine("${nodePath}",`)
      // RN 0.74.x에서 com.facebook.react.settings 플러그인은 react-settings-plugin(로컬)이 제공.
      // Expo prebuild 템플릿은 reactNativePatch <= 3 조건으로 올바르게 포함하나,
      // 이전 패치가 이 조건을 < 0(항상 false)으로 바꿔 플러그인 미포함 → 빌드 실패.
      // 안전장치: 조건이 < 0으로 잘못 설정된 경우 <= 3으로 복원.
      .replace(
        'reactNativeMinor == 74 && reactNativePatch < 0',
        'reactNativeMinor == 74 && reactNativePatch <= 3',
      );

    return config;
  });
}

function withJava17InGradleProperties(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const java17Home = resolveJava17Home();
      if (!java17Home) {
        console.warn('[withAndroidNodePath] Java 17 경로를 찾지 못했습니다. gradle.properties 수정 스킵.');
        return config;
      }

      console.log(`[withAndroidNodePath] Java 17 홈: ${java17Home}`);

      const gradlePropsPath = path.join(
        config.modRequest.platformProjectRoot,
        'gradle.properties',
      );

      let contents = fs.readFileSync(gradlePropsPath, 'utf8');

      // 이미 설정되어 있으면 덮어쓰기, 없으면 append
      const javaHomeLine = `org.gradle.java.home=${java17Home}`;
      if (contents.includes('org.gradle.java.home=')) {
        contents = contents.replace(/org\.gradle\.java\.home=.*/g, javaHomeLine);
      } else {
        contents += `\n# Java 17 고정 (Gradle 8.8은 Java 25 미지원)\n${javaHomeLine}\n`;
      }

      fs.writeFileSync(gradlePropsPath, contents);
      return config;
    },
  ]);
}

module.exports = function withAndroidNodePath(config) {
  config = withNodePathInSettings(config);
  config = withJava17InGradleProperties(config);
  return config;
};
