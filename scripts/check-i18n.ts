#!/usr/bin/env npx ts-node
/**
 * check-i18n.ts
 * Detects hardcoded English strings in JSX/TSX files that should use t() calls.
 *
 * Usage: yarn check:i18n
 *        npx tsx scripts/check-i18n.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

// ─── Configuration ────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '../apps/mobile');

/** Glob patterns to scan */
const SCAN_PATTERNS = [
  'app/**/*.tsx',
  'src/components/**/*.tsx',
  'src/screens/**/*.tsx',
];

/** Directories/files to skip */
const IGNORE_PATTERNS = [
  'node_modules',
  '.expo',
  'dist',
  '__tests__',
  '__mocks__',
  '*.test.tsx',
  '*.spec.tsx',
];

/**
 * Patterns that indicate a hardcoded UI string inside JSX.
 * Each regex matches a line that likely contains a user-visible English string.
 */
const VIOLATION_PATTERNS: Array<{ re: RegExp; label: string }> = [
  // <Text>Some English text</Text>  or  <Text style={...}>Some English</Text>
  {
    re: /<Text[^>]*>\s*([A-Z][a-zA-Z ,'!?.\-–—]{4,})\s*<\/Text>/,
    label: '<Text> hardcoded string',
  },
  // title="Some English"  placeholder="Some English"  label="Some English"
  {
    re: /(?:title|placeholder|label|subtitle|description|hint|message|buttonText|headerTitle|emptyTitle|emptyDesc)\s*=\s*"([A-Z][a-zA-Z ,'!?.\-–—]{4,})"/,
    label: 'prop="hardcoded string"',
  },
  // {condition && 'Some English text'}  or  {'Some English text'}
  {
    re: /\{[^}]*'([A-Z][a-zA-Z ,'!?.\-–—]{4,})'\s*\}/,
    label: "{'hardcoded string'} in JSX expression",
  },
  // >{`Some English text`}<
  {
    re: />\s*`([A-Z][a-zA-Z ]{4,})`\s*</,
    label: '>`hardcoded template literal`< in JSX',
  },
];

/**
 * Lines to skip even if they match a violation pattern.
 * Covers legitimate uses: comments, imports, type annotations, test strings, non-UI constants.
 */
const SKIP_LINE_PATTERNS: RegExp[] = [
  /^\s*\/\//,         // comment line
  /^\s*\*/,           // JSDoc line
  /import\s+/,        // import statement
  /console\.(log|warn|error)/,  // console output
  /t\(/,              // already wrapped in t()
  /i18n\./,           // i18n direct call
  /LANGUAGE_NAMES/,   // constant definition
  /K-Saju/,           // brand name — intentional
  /'[a-z][\w-]+'/,    // lowercase key string (likely an i18n key or prop name)
  /testID=/,          // test selectors
  /accessibilityLabel.*=[^"]*t\(/, // already using t()
];

// ─── Scanner ──────────────────────────────────────────────────────────────────

interface Violation {
  file: string;
  line: number;
  col: number;
  text: string;
  label: string;
}

function scanFile(filePath: string): Violation[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const violations: Violation[] = [];
  const relPath = path.relative(ROOT, filePath);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip if line matches any skip pattern
    if (SKIP_LINE_PATTERNS.some((re) => re.test(line))) continue;

    for (const { re, label } of VIOLATION_PATTERNS) {
      const match = re.exec(line);
      if (match) {
        violations.push({
          file: relPath,
          line: i + 1,
          col: match.index + 1,
          text: match[1] ?? match[0],
          label,
        });
        break; // one violation per line is enough
      }
    }
  }

  return violations;
}

function collectFiles(): string[] {
  const files: string[] = [];
  for (const pattern of SCAN_PATTERNS) {
    const matches = glob.sync(pattern, {
      cwd: ROOT,
      absolute: true,
      ignore: IGNORE_PATTERNS,
    });
    files.push(...matches);
  }
  // Deduplicate
  return [...new Set(files)];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const files = collectFiles();
  console.log(`\nScanning ${files.length} files for hardcoded English strings…\n`);

  const allViolations: Violation[] = [];

  for (const file of files) {
    const violations = scanFile(file);
    allViolations.push(...violations);
  }

  if (allViolations.length === 0) {
    console.log('✅  No hardcoded English strings found. All clear!\n');
    process.exit(0);
  }

  // Group by file
  const byFile = new Map<string, Violation[]>();
  for (const v of allViolations) {
    if (!byFile.has(v.file)) byFile.set(v.file, []);
    byFile.get(v.file)!.push(v);
  }

  console.log(`❌  Found ${allViolations.length} potential hardcoded string(s) in ${byFile.size} file(s):\n`);

  for (const [file, violations] of byFile) {
    console.log(`  📄 ${file}`);
    for (const v of violations) {
      console.log(`      L${v.line}:${v.col}  [${v.label}]`);
      console.log(`      → "${v.text}"`);
    }
    console.log();
  }

  console.log('Fix: wrap strings with t() from useTranslation(\'common\').');
  console.log('See CLAUDE.md §i18n 키 네이밍 컨벤션 for key naming rules.\n');

  process.exit(1);
}

main();
