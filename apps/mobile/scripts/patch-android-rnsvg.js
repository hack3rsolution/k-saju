#!/usr/bin/env node
/**
 * patch-android-rnsvg.js — postinstall script
 *
 * Applies two patches that pnpm's patch system fails to apply in
 * node-linker=hoisted mode:
 *
 * Patch 1 (Android): react-native-svg@15.x accesses package-private fields of
 * MatrixMathHelper.MatrixDecompositionContext in react-native@0.74.x.
 * Makes those fields public so Android compiles.
 *
 * Patch 2 (iOS): React-jsinspector.podspec missing "DEFINES_MODULE" => "YES"
 * causes "ExpoModulesCore depends upon React-jsinspector, which does not define
 * modules" CocoaPods error when running pod install.
 *
 * Run automatically via `postinstall` in package.json.
 */

const fs = require('fs');
const path = require('path');

const RN_LOCAL = path.resolve(__dirname, '../node_modules/react-native');
const RN_ROOT  = path.resolve(__dirname, '../../../node_modules/react-native');

// ── Patch 1: MatrixMathHelper fields → public ────────────────────────────────

const MATRIX_REL = 'ReactAndroid/src/main/java/com/facebook/react/uimanager/MatrixMathHelper.java';
const MATRIX_PATTERN = /^(\s+)(double\[\])\s+(perspective|scale|skew|translation|rotationDegrees)\s*=/gm;

for (const base of [RN_LOCAL, RN_ROOT]) {
  const target = path.join(base, MATRIX_REL);
  if (!fs.existsSync(target)) continue;
  let src = fs.readFileSync(target, 'utf8');
  if (src.includes('public double[] perspective')) continue; // already patched
  const next = src.replace(MATRIX_PATTERN, '$1public $2 $3 =');
  if (next !== src) {
    fs.writeFileSync(target, next);
    console.log(`[postinstall] MatrixMathHelper patched: ${target}`);
  }
}

// ── Patch 2: React-jsinspector.podspec → DEFINES_MODULE ─────────────────────

const PODSPEC_REL = 'ReactCommon/jsinspector-modern/React-jsinspector.podspec';
const PODSPEC_OLD = '"CLANG_CXX_LANGUAGE_STANDARD" => "c++20"';
const PODSPEC_NEW = '"CLANG_CXX_LANGUAGE_STANDARD" => "c++20",\n                               "DEFINES_MODULE" => "YES"';

for (const base of [RN_LOCAL, RN_ROOT]) {
  const target = path.join(base, PODSPEC_REL);
  if (!fs.existsSync(target)) continue;
  let src = fs.readFileSync(target, 'utf8');
  if (src.includes('"DEFINES_MODULE" => "YES"')) continue; // already patched
  const next = src.replace(PODSPEC_OLD, PODSPEC_NEW);
  if (next !== src) {
    fs.writeFileSync(target, next);
    console.log(`[postinstall] React-jsinspector.podspec patched: ${target}`);
  }
}
