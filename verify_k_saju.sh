#!/usr/bin/env bash
set -e

echo "🔍 Verifying k-saju monorepo..."

PASS() { echo "✅ $1"; }
FAIL() { echo "❌ $1"; exit 1; }

# 0) 기본 툴 체크
command -v pnpm >/dev/null || FAIL "pnpm not found (run: corepack enable)"
command -v node >/dev/null || FAIL "node not found"
PASS "Tooling present (node, pnpm)"

# 1) 필수 파일/디렉터리 존재
must_exist=(
  "package.json"
  "pnpm-workspace.yaml"
  "tsconfig.json"
  "turbo.json"
  ".gitignore"
  "README.md"
  "apps/web/package.json"
  "apps/web/src/app/layout.tsx"
  "apps/web/src/app/page.tsx"
  "apps/mobile/package.json"
  "apps/mobile/App.tsx"
  "packages/ui/package.json"
  "packages/ui/src/components/Button.tsx"
  "packages/ui/src/components/Input.tsx"
  "packages/ui/src/index.ts"
  "packages/api/package.json"
  "packages/api/src/client.ts"
  "packages/api/src/index.ts"
  "packages/api/src/types.ts"
  "scripts/setup.sh"
  "scripts/build.sh"
  "scripts/deploy.sh"
)

for f in "${must_exist[@]}"; do
  [ -e "$f" ] || FAIL "Missing: $f"
done
PASS "All required files exist"

# 2) pnpm-workspace.yaml 내용 확인
grep -q 'apps/\*' pnpm-workspace.yaml || FAIL "pnpm-workspace.yaml missing apps/*"
grep -q 'packages/\*' pnpm-workspace.yaml || FAIL "pnpm-workspace.yaml missing packages/*"
PASS "pnpm-workspace.yaml OK"

# 3) 루트 package.json 워크스페이스 스크립트 확인
jq -e '.workspaces|index("apps/*")' package.json >/dev/null || FAIL "root package.json workspaces missing apps/*"
jq -e '.workspaces|index("packages/*")' package.json >/dev/null || FAIL "root package.json workspaces missing packages/*"
jq -e '.scripts.dev' package.json >/dev/null || FAIL "root scripts.dev missing"
jq -e '.devDependencies.turbo' package.json >/dev/null || FAIL "turbo not listed in devDependencies"
PASS "root package.json OK"

# 4) TS path alias 확인
grep -q '"@k-saju/ui"' tsconfig.json || FAIL "tsconfig.json missing @k-saju/ui path"
grep -q '"@k-saju/api"' tsconfig.json || FAIL "tsconfig.json missing @k-saju/api path"
PASS "tsconfig paths OK"

# 5) 패키지간 의존성/빌드
echo "📦 Installing..."
pnpm install

echo "🏗️ Building shared packages..."
pnpm --filter @k-saju/ui build
pnpm --filter @k-saju/api build
PASS "Shared packages build OK"

# 6) Web dev 빌드 검증(타입체크/빌드)
echo "🧪 Type-checking web..."
pnpm --filter web run type-check
echo "🏗️ Building web..."
pnpm --filter web build
PASS "web type-check/build OK"

# 7) 모바일 기본 의존 확인 (Expo 버전 표기만 체크)
jq -e '.dependencies.expo' apps/mobile/package.json >/dev/null || FAIL "mobile/package.json missing expo dependency"
PASS "mobile package.json basic deps OK"

echo "🎉 Verification PASSED. Repository structure matches the intended scaffold."
