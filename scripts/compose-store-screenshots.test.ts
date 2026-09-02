import { Buffer } from 'node:buffer';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = process.cwd();
const MANIFEST_PATH = join(ROOT, 'docs/marketing/v1.0.0/screenshot-frames.json');
const SCRIPT = join(ROOT, 'scripts/compose-store-screenshots.mjs');
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

type Frame = {
  device: 'iphone' | 'ipad';
  source: string;
  dest: string;
  headline?: string;
  cropTop?: number;
};

type Manifest = {
  layout?: string;
  frames: Frame[];
  devices: Record<string, { width: number; height: number }>;
  colors: Record<string, string>;
  font: { family: string; woff2Url: string };
};

function loadManifest(): Manifest {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;
}

function wordCount(headline: string): number {
  return headline.trim().split(/\s+/).filter(Boolean).length;
}

describe('screenshot-frames manifest', () => {
  const manifest = loadManifest();

  it('lists 5 iPhone and 5 iPad frames at Apple pixel sizes', () => {
    const iphone = manifest.frames.filter(f => f.device === 'iphone');
    const ipad = manifest.frames.filter(f => f.device === 'ipad');
    expect(iphone).toHaveLength(5);
    expect(ipad).toHaveLength(5);
    expect(manifest.devices.iphone).toEqual({ width: 1320, height: 2868 });
    expect(manifest.devices.ipad).toEqual({ width: 2064, height: 2752 });
  });

  it('uses 2–5 word headlines except the lockup frame', () => {
    const iphoneDest = manifest.frames.filter(f => f.device === 'iphone').map(f => f.dest);
    expect(iphoneDest).toEqual([
      'iphone-69-01-hero.png',
      'iphone-69-02-auth.png',
      'iphone-69-03-feed.png',
      'iphone-69-04-onboarding.png',
      'iphone-69-05-settings.png',
    ]);
    for (const frame of manifest.frames) {
      const isLockup = frame.dest.includes('-settings.');
      if (isLockup) {
        expect(frame.headline).toBeFalsy();
        expect(frame.cropTop ?? 0).toBe(0);
        continue;
      }
      const n = wordCount(frame.headline ?? '');
      expect(n).toBeGreaterThanOrEqual(2);
      expect(n).toBeLessThanOrEqual(5);
    }
  });

  it('is a bleed overlay with an opaque copy band, not a letterboxed bezel', () => {
    expect(manifest.layout).toBe('bleed-overlay');
    expect(manifest.colors.background).toBe('#1E0C02');
    expect(manifest.colors.headline).toBe('#E8A04A');
    expect(manifest.font.family).toBe('Fraunces');
    const src = readFileSync(SCRIPT, 'utf8');
    expect(src).toMatch(/copy-band/);
    expect(src).toMatch(/object-fit:cover/);
    expect(src).toMatch(/object-position:top center/);
    expect(src).not.toMatch(/class="veil"/);
    expect(src).not.toMatch(/class="device"/);
    expect(src).not.toMatch(/class="wordmark"/);
    expect(src).not.toMatch(/font-family:Inter/);
    expect(src).not.toMatch(/linear-gradient\(180deg/);
  });
});

describe('compose-store-screenshots', () => {
  it('--check verifies composed outputs exist at the right dimensions', () => {
    const out = execFileSync('node', [SCRIPT, '--check'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    expect(out).toMatch(/OK 10 composed PNGs/);
  });

  it('refuses a raw PNG that is not the Apple pixel size', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fork-frames-'));
    try {
      const rawDir = join(dir, 'app-store-screenshots', 'raw');
      mkdirSync(rawDir, { recursive: true });
      writeFileSync(join(rawDir, 'iphone-69-01-hero.png'), PNG_1X1);
      const manifest = {
        version: '1.0.0',
        rawDir: 'app-store-screenshots/raw',
        outDir: 'app-store-screenshots',
        layout: 'bleed-overlay',
        colors: { background: '#1E0C02', headline: '#E8A04A' },
        font: {
          family: 'Fraunces',
          woff2Url: 'https://example.invalid/fraunces.woff2',
        },
        devices: {
          iphone: { width: 1320, height: 2868 },
          ipad: { width: 2064, height: 2752 },
        },
        frames: [
          {
            device: 'iphone',
            source: 'iphone-69-01-hero.png',
            dest: 'iphone-69-01-hero.png',
            headline: 'Your product in frame',
          },
        ],
      };
      const manifestPath = join(dir, 'screenshot-frames.json');
      writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      expect(existsSync(join(dir, 'app-store-screenshots', 'iphone-69-01-hero.png'))).toBe(false);

      try {
        execFileSync('node', [SCRIPT, '--manifest', manifestPath], {
          cwd: ROOT,
          encoding: 'utf8',
        });
        throw new Error('expected compose to refuse the 1×1 PNG');
      }
      catch (err) {
        const error = err as { status?: number; stdout?: string; stderr?: string; message?: string };
        expect(error.status).toBe(1);
        const text = `${error.stdout ?? ''}${error.stderr ?? ''}${error.message ?? ''}`;
        expect(text).toMatch(/1×1/);
        expect(text).toMatch(/1320×2868/);
      }
    }
    finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
