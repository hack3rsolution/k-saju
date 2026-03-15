const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo including pnpm virtual store
config.watchFolders = [monorepoRoot];

// Resolve modules from both mobile and monorepo root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Follow pnpm symlinks into virtual store
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// Block nested react-native copies that live inside other packages' node_modules.
// @expo/metro-runtime ships its own react-native which causes
// "Unable to resolve module ../LogBox/LogBox" because Metro picks the wrong copy.
config.resolver.blockList = /node_modules\/@expo\/metro-runtime\/node_modules\/react-native\/.*/;

// ─── pnpm monorepo dedup fix ─────────────────────────────────────────────────
// Root package.json has react-native@0.74.5 while apps/mobile has 0.74.0.
// pnpm node-linker=hoisted creates separate copies for each version, and
// packages like @react-navigation/* / react-native-screens each get their own
// nested copy under their node_modules/.  Every copy instantiates a new
// MessageQueue and writes it to global.__fbBatchedBridge, overwriting the
// previous one.  The native side then finds 0 callable JS modules (n=0) and
// cannot call AppRegistry.runApplication → blank screen.
//
// Fix: force ALL require('react-native') calls to resolve to the canonical
// apps/mobile copy (0.74.0, same version the iOS Pods were compiled against).
const canonicalRN = path.resolve(projectRoot, 'node_modules/react-native');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'react-native' ||
    (moduleName.startsWith('react-native/') && !moduleName.startsWith('react-native-'))
  ) {
    // Redirect to canonical copy by pretending the import originated from
    // within that package — this makes Metro's standard resolver pick it up
    // without bypassing extension/directory resolution.
    return context.resolveRequest(
      { ...context, originModulePath: path.join(canonicalRN, '_entry.js') },
      moduleName,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};
// ─────────────────────────────────────────────────────────────────────────────

module.exports = config;
