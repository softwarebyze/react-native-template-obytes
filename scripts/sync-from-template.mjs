#!/usr/bin/env node
/**
 * Copy template-owned globs from a checkout of softwarebyze/react-native-template-obytes
 * onto this generated app. Never overwrites app-owned paths or entire package.json.
 *
 *   node scripts/sync-from-template.mjs --from /tmp/template --to .
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function parseArgs(argv) {
  const args = { from: '', to: process.cwd(), applyPins: true };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--from') args.from = path.resolve(argv[++i]);
    else if (argv[i] === '--to') args.to = path.resolve(argv[++i]);
    else if (argv[i] === '--skip-pins') args.applyPins = false;
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  if (!args.from) throw new Error('Missing --from <template-checkout>');
  return args;
}

function parseList(yaml, key) {
  const lines = yaml.split(/\r?\n/);
  const items = [];
  let inKey = false;
  for (const line of lines) {
    if (/^[a-zA-Z0-9_]+:\s*$/.test(line)) {
      inKey = line.startsWith(`${key}:`);
      continue;
    }
    if (inKey) {
      const m = line.match(/^\s+-\s+(.+)$/);
      if (m) items.push(m[1].trim());
      else if (line.trim() === '' || line.trim().startsWith('#')) continue;
      else inKey = false;
    }
  }
  return items;
}

function walkFiles(root) {
  const out = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === '.git' || ent.name === 'node_modules') continue;
        stack.push(abs);
      } else if (ent.isFile()) {
        out.push(path.relative(root, abs).split(path.sep).join('/'));
      }
    }
  }
  return out;
}

function globToRegExp(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const re = escaped
    .replace(/\*\*/g, ':::GLOBSTAR:::')
    .replace(/\*/g, '[^/]*')
    .replace(/:::GLOBSTAR:::/g, '.*');
  return new RegExp(`^${re}$`);
}

function matchesAny(rel, patterns) {
  return patterns.some((p) => globToRegExp(p).test(rel));
}

function copyOwned(fromDir, toDir, owned, appOwned) {
  const files = walkFiles(fromDir);
  const copied = [];
  for (const rel of files) {
    if (!matchesAny(rel, owned)) continue;
    if (matchesAny(rel, appOwned)) continue;
    const dest = path.join(toDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(fromDir, rel), dest);
    copied.push(rel);
  }
  return copied;
}

function applyPins(toDir) {
  const pinsPath = path.join(toDir, '.template-pins.json');
  const pkgPath = path.join(toDir, 'package.json');
  if (!fs.existsSync(pinsPath) || !fs.existsSync(pkgPath)) return false;
  const pins = JSON.parse(fs.readFileSync(pinsPath, 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const packages = pins.packages || {};
  let changed = false;
  for (const [name, version] of Object.entries(packages)) {
    if (pkg.dependencies && Object.prototype.hasOwnProperty.call(pkg.dependencies, name)) {
      if (pkg.dependencies[name] !== version) {
        pkg.dependencies[name] = version;
        changed = true;
      }
    }
    if (pkg.devDependencies && Object.prototype.hasOwnProperty.call(pkg.devDependencies, name)) {
      if (pkg.devDependencies[name] !== version) {
        pkg.devDependencies[name] = version;
        changed = true;
      }
    }
  }
  if (!changed) return false;
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log('Updated pinned Expo-related versions in package.json (name/scripts untouched)');
  execSync('npx expo install --fix', { cwd: toDir, stdio: 'inherit' });
  return true;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifestPath = path.join(args.from, '.template-owned.yml');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing ${manifestPath}`);
  }
  const yaml = fs.readFileSync(manifestPath, 'utf8');
  const owned = parseList(yaml, 'owned');
  const appOwned = parseList(yaml, 'app_owned');
  if (!owned.length) throw new Error('No owned globs in .template-owned.yml');
  const copied = copyOwned(args.from, args.to, owned, appOwned);
  console.log(`Copied ${copied.length} template-owned files`);
  if (args.applyPins) applyPins(args.to);
}

try {
  main();
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
