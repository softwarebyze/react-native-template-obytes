#!/usr/bin/env node
/**
 * Dress raw App Store captures as bleed frames: opaque copy band + product zone.
 * Two zones never share pixels. No gradient overlay, bezel, device chrome, or footer.
 *
 *   node scripts/compose-store-screenshots.mjs
 *   node scripts/compose-store-screenshots.mjs --check
 */
import fs from 'node:fs';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_MANIFEST = path.join(ROOT, 'docs/marketing/v1.0.0/screenshot-frames.json');
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

function resolveFont(manifest) {
  const font = manifest.font || {};
  const family = font.family;
  const woff2Url = font.woff2Url;
  if (!family || !woff2Url) {
    throw new Error('Manifest missing font.family / font.woff2Url (theme lives in JSON)');
  }
  const banned = ['Inter', 'Arial', 'Roboto', 'Space Grotesk'];
  if (banned.includes(family)) {
    throw new Error('Display font must not be Inter/Arial/Roboto/Space Grotesk');
  }
  return {
    family,
    woff2Url,
    file: font.file || `${family.toLowerCase().replace(/\s+/g, '-')}-700.woff2`,
    fallback: font.fallback || 'Georgia, "Times New Roman", serif',
  };
}

const LAYOUT = {
  iphone: { overlayPct: 0.28, headlineSize: 196, padX: 64, padTop: 88 },
  ipad: { overlayPct: 0.26, headlineSize: 168, padX: 96, padTop: 72 },
};

function parseArgs(argv) {
  const args = { check: false, manifest: DEFAULT_MANIFEST };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--check') args.check = true;
    else if (argv[i] === '--manifest') args.manifest = path.resolve(argv[++i]);
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return args;
}

export function readPngSize(filePath) {
  const fd = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(24);
  try {
    const n = fs.readSync(fd, buf, 0, 24, 0);
    if (n < 24) throw new Error(`${filePath} is too small to be a PNG`);
  } finally {
    fs.closeSync(fd);
  }
  if (!buf.subarray(0, 8).equals(PNG_SIG)) throw new Error(`${filePath} is not a PNG`);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function loadManifest(manifestPath) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!manifest.devices || !Array.isArray(manifest.frames)) {
    throw new Error(`Invalid manifest: ${manifestPath}`);
  }
  const dir = path.dirname(manifestPath);
  manifest.rawAbs = path.join(dir, manifest.rawDir);
  manifest.outAbs = path.join(dir, manifest.outDir);
  manifest.path = manifestPath;
  return manifest;
}

function assertDevicePixels(manifest, deviceName) {
  const spec = manifest.devices[deviceName];
  if (!spec?.width || !spec?.height) {
    throw new Error(`Manifest missing devices.${deviceName} pixels`);
  }
  return spec;
}

function assertRawSize(filePath, spec, label) {
  const size = readPngSize(filePath);
  if (size.width !== spec.width || size.height !== spec.height) {
    throw new Error(`${label} is ${size.width}×${size.height}, expected ${spec.width}×${spec.height}`);
  }
  return size;
}

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fontDir() {
  return process.env.DISPLAY_FONT_DIR || '/tmp/display-fonts';
}

function fontPath(file) {
  return path.join(fontDir(), file);
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const request = (href) => {
      https.get(href, { headers: { 'User-Agent': 'obytes-fork-compose/1.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          request(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`Font download failed: HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          if (buf.length < 4 || buf.subarray(0, 4).toString() !== 'wOF2') {
            reject(new Error('Font download was not a woff2'));
            return;
          }
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.writeFileSync(dest, buf);
          resolve(dest);
        });
      }).on('error', reject);
    };
    request(url);
  });
}

async function ensureDisplayFont(font) {
  const dest = fontPath(font.file);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) return dest;
  console.log(`  downloading ${font.family} 700 → ${dest}`);
  await downloadFile(font.woff2Url, dest);
  return dest;
}

function fontFaceCss(font) {
  const abs = fontPath(font.file);
  if (!fs.existsSync(abs)) {
    throw new Error(`Missing display font ${abs} — run compose (not --check) first`);
  }
  const b64 = fs.readFileSync(abs).toString('base64');
  return `@font-face{font-family:${font.family};font-style:normal;font-weight:700;src:url(data:font/woff2;base64,${b64}) format("woff2");font-display:block;}`;
}

function layoutFor(device) {
  const layout = LAYOUT[device];
  if (!layout) throw new Error(`No layout for device ${device}`);
  return layout;
}

function frameHtml({ frame, spec, colors, font, dataUrl, overlayPct }) {
  const layout = layoutFor(frame.device);
  const headline = (frame.headline || '').trim();
  const hasCopy = Boolean(headline);
  const copyBandPct = hasCopy ? (overlayPct ?? layout.overlayPct) : 0;
  const copyBandH = Math.round(spec.height * copyBandPct);
  const productH = spec.height - copyBandH;
  const cropTop = Math.min(1, Math.max(0, Number(frame.cropTop) || 0));
  const visibleFrac = Math.max(0.05, 1 - cropTop);
  const imgH = Math.round(productH / visibleFrac);
  const imgTop = -Math.round(imgH * cropTop);
  const field = colors.background || '#111111';
  const headlineColor = colors.headline || '#F5F5F5';
  const stack = `${font.family}, ${font.fallback}`;
  const copy = hasCopy
    ? `<div class="copy-band"><h1>${esc(headline)}</h1></div>`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<style>
${fontFaceCss(font)}
html,body{margin:0;padding:0;width:${spec.width}px;height:${spec.height}px;overflow:hidden;background:${field};}
*{box-sizing:border-box;}
.frame{position:relative;width:${spec.width}px;height:${spec.height}px;overflow:hidden;background:${field};}
.copy-band{
  position:absolute;top:0;left:0;right:0;height:${copyBandH}px;
  background:${field};z-index:2;
  display:flex;align-items:flex-end;justify-content:center;
  padding:${layout.padTop}px ${layout.padX}px ${Math.round(copyBandH * 0.18)}px;
  text-align:center;font-family:${stack};color:${headlineColor};
}
.copy-band h1{
  margin:0;font-family:${stack};font-weight:700;font-size:${layout.headlineSize}px;
  line-height:1.02;letter-spacing:-0.02em;color:${headlineColor};text-wrap:balance;
}
.product{position:absolute;top:${copyBandH}px;left:0;right:0;bottom:0;overflow:hidden;}
.shot{
  position:absolute;left:0;width:100%;top:${imgTop}px;height:${imgH}px;
  object-fit:cover;object-position:top center;display:block;
}
</style>
</head>
<body>
  <div class="frame">
    ${copy}
    <div class="product"><img class="shot" src="${dataUrl}" alt=""/></div>
  </div>
</body>
</html>`;
}

async function launchBrowser() {
  const playwrightPath = process.env.PLAYWRIGHT_CORE
    || '/tmp/pw-store/node_modules/playwright-core/index.mjs';
  const { chromium } = await import(playwrightPath);
  return chromium.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--font-render-hinting=none', '--disable-gpu'],
  });
}

async function composeFrame(page, manifest, frame) {
  const spec = assertDevicePixels(manifest, frame.device);
  const src = path.join(manifest.rawAbs, frame.source);
  const dest = path.join(manifest.outAbs, frame.dest);
  if (!fs.existsSync(src)) throw new Error(`Missing raw screenshot: ${src}`);
  assertRawSize(src, spec, frame.source);
  const dataUrl = `data:image/png;base64,${fs.readFileSync(src).toString('base64')}`;
  const html = frameHtml({
    frame, spec, colors: manifest.colors, font: resolveFont(manifest),
    overlayPct: manifest.overlayPct, dataUrl,
  });
  const htmlPath = path.join(os.tmpdir(), `frame-${frame.dest}.html`);
  fs.writeFileSync(htmlPath, html);
  await page.setViewportSize({ width: spec.width, height: spec.height });
  await page.goto(`file://${htmlPath}`, { waitUntil: 'load', timeout: 60_000 });
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    const img = document.querySelector('img');
    if (img && !img.complete) {
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('frame image failed to load'));
      });
    }
  });
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await page.screenshot({
    path: dest, type: 'png',
    clip: { x: 0, y: 0, width: spec.width, height: spec.height },
    animations: 'disabled', caret: 'hide',
  });
  fs.unlinkSync(htmlPath);
  assertRawSize(dest, spec, frame.dest);
  return dest;
}

function preflightRaws(manifest) {
  for (const frame of manifest.frames) {
    const spec = assertDevicePixels(manifest, frame.device);
    const src = path.join(manifest.rawAbs, frame.source);
    if (!fs.existsSync(src)) throw new Error(`Missing raw screenshot: ${src}`);
    assertRawSize(src, spec, frame.source);
  }
}

async function composeAll(manifest) {
  preflightRaws(manifest);
  await ensureDisplayFont(resolveFont(manifest));
  const browser = await launchBrowser();
  const page = await browser.newPage({ deviceScaleFactor: 1, colorScheme: 'dark' });
  const written = [];
  try {
    for (const frame of manifest.frames) {
      const dest = await composeFrame(page, manifest, frame);
      written.push(dest);
      console.log(`  wrote ${path.relative(ROOT, dest)}`);
    }
  } finally {
    await browser.close();
  }
  return written;
}

function checkOutputs(manifest) {
  const errors = [];
  for (const frame of manifest.frames) {
    const spec = assertDevicePixels(manifest, frame.device);
    const dest = path.join(manifest.outAbs, frame.dest);
    if (!fs.existsSync(dest)) {
      errors.push(`missing ${path.relative(ROOT, dest)}`);
      continue;
    }
    try { assertRawSize(dest, spec, frame.dest); }
    catch (err) { errors.push(err.message); }
  }
  if (errors.length) throw new Error(`--check failed:\n  ${errors.join('\n  ')}`);
  console.log(`OK ${manifest.frames.length} composed PNGs at Apple pixel sizes.`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifest = loadManifest(args.manifest);
  if (args.check) {
    checkOutputs(manifest);
    return;
  }
  console.log(`Composing ${manifest.frames.length} frames from ${path.relative(ROOT, args.manifest)}`);
  await composeAll(manifest);
  checkOutputs(manifest);
  console.log('Done.');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}

export { assertRawSize, checkOutputs, loadManifest, parseArgs, frameHtml };
