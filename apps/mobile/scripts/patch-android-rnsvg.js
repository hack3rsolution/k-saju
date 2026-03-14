#!/usr/bin/env node
/**
 * patch-android-rnsvg.js — postinstall script
 *
 * react-native-svg@15.x accesses package-private fields of
 * MatrixMathHelper.MatrixDecompositionContext in react-native@0.74.x.
 * This script makes those fields public so Android can compile.
 *
 * Run automatically via `postinstall` in package.json.
 */

const fs = require('fs');
const path = require('path');

const TARGETS = [
  // Workspace-local RN copy
  path.resolve(__dirname, '../node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/uimanager/MatrixMathHelper.java'),
  // Hoisted root copy
  path.resolve(__dirname, '../../../node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/uimanager/MatrixMathHelper.java'),
];

const PATTERN = /^(\s+)(double\[\])\s+(perspective|scale|skew|translation|rotationDegrees)\s*=/gm;
const REPLACEMENT = '$1public $2 $3 =';

let patched = 0;
for (const target of TARGETS) {
  if (!fs.existsSync(target)) continue;
  let src = fs.readFileSync(target, 'utf8');
  // Only patch if not already public (avoid double-patch)
  if (src.includes('public double[] perspective')) { patched++; continue; }
  const next = src.replace(PATTERN, REPLACEMENT);
  if (next !== src) {
    fs.writeFileSync(target, next);
    console.log(`[patch-android-rnsvg] patched: ${target}`);
    patched++;
  }
}

if (patched === 0) {
  console.log('[patch-android-rnsvg] no files found to patch (skipping)');
}
