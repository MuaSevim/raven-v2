const fs = require('fs');
const path = require('path');

// Some packages (e.g. expo-image-picker) reference:
//   "extends": "expo-module-scripts/tsconfig.base"
// But newer expo-module-scripts ships it as tsconfig.base.json.
// Create a compatible file if it's missing.

const baseDir = path.join(__dirname, '..', 'node_modules', 'expo-module-scripts');
const src = path.join(baseDir, 'tsconfig.base.json');
const dest = path.join(baseDir, 'tsconfig.base');

const patchExtendsToJson = (tsconfigPath) => {
  if (!fs.existsSync(tsconfigPath)) return;
  const raw = fs.readFileSync(tsconfigPath, 'utf8');
  const from = '"extends": "expo-module-scripts/tsconfig.base"';
  const to = '"extends": "expo-module-scripts/tsconfig.base.json"';
  if (raw.includes(from) && !raw.includes(to)) {
    fs.writeFileSync(tsconfigPath, raw.replace(from, to));
    // eslint-disable-next-line no-console
    console.log(`Patched extends in ${path.relative(process.cwd(), tsconfigPath)}`);
  }
};

const patchExpoTsconfigs = (nodeModulesDir) => {
  if (!fs.existsSync(nodeModulesDir)) return;

  const queue = [nodeModulesDir];
  while (queue.length) {
    const dir = queue.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isFile() && entry.name === 'tsconfig.json') {
        patchExtendsToJson(fullPath);
        continue;
      }

      if (!entry.isDirectory()) continue;

      // Only traverse Expo-related packages to keep this fast.
      // This also catches nested node_modules inside Expo packages.
      const isExpoDir =
        entry.name === 'node_modules' ||
        entry.name.startsWith('expo') ||
        entry.name.startsWith('@expo');

      if (isExpoDir) {
        queue.push(fullPath);
      }
    }
  }
};

try {
  if (!fs.existsSync(baseDir)) {
    process.exit(0);
  }

  if (!fs.existsSync(src)) {
    process.exit(0);
  }

  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
    // eslint-disable-next-line no-console
    console.log('Created expo-module-scripts/tsconfig.base for compatibility');
  }

  // Some packages still reference the non-.json form; patch all Expo-related tsconfigs.
  patchExpoTsconfigs(path.join(__dirname, '..', 'node_modules'));
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('Skipping expo-module-scripts tsconfig compatibility fix:', e);
}
