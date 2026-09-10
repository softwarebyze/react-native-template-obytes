import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCRIPT = join(process.cwd(), 'scripts/sync-from-template.mjs');

function write(file: string, contents: string) {
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, contents);
}

describe('sync-from-template', () => {
  let fromDir: string;
  let toDir: string;

  beforeEach(() => {
    fromDir = mkdtempSync(join(tmpdir(), 'template-from-'));
    toDir = mkdtempSync(join(tmpdir(), 'template-to-'));
  });

  afterEach(() => {
    rmSync(fromDir, { recursive: true, force: true });
    rmSync(toDir, { recursive: true, force: true });
  });

  it('deletes previously owned files that left the template and keeps app-owned files', () => {
    const previousManifest = [
      'owned:',
      '  - .template-owned.yml',
      '  - .github/workflows/keep.yml',
      '  - .github/workflows/obsolete.yml',
      '  - scripts/helper.mjs',
      'app_owned:',
      '  - src/features/**',
      '',
    ].join('\n');

    write(join(toDir, '.template-owned.yml'), previousManifest);
    write(join(toDir, '.github/workflows/keep.yml'), 'name: keep-old\n');
    write(join(toDir, '.github/workflows/obsolete.yml'), 'name: obsolete\n');
    write(join(toDir, 'scripts/helper.mjs'), 'export const helper = 1;\n');
    write(join(toDir, 'src/features/feed/screen.tsx'), 'export const appOwned = true;\n');
    write(join(toDir, 'README.md'), 'app readme\n');

    const nextManifest = [
      'owned:',
      '  - .template-owned.yml',
      '  - .github/workflows/keep.yml',
      '  - scripts/helper.mjs',
      'app_owned:',
      '  - src/features/**',
      '',
    ].join('\n');

    write(join(fromDir, '.template-owned.yml'), nextManifest);
    write(join(fromDir, '.github/workflows/keep.yml'), 'name: keep-new\n');
    write(join(fromDir, 'scripts/helper.mjs'), 'export const helper = 2;\n');
    write(join(fromDir, 'src/features/feed/screen.tsx'), 'export const shouldNotCopy = true;\n');

    const output = execFileSync(
      'node',
      [SCRIPT, '--from', fromDir, '--to', toDir, '--skip-pins'],
      { encoding: 'utf8' },
    );

    expect(output).toContain('Removed 1 obsolete template-owned files');
    expect(readFileSync(join(toDir, '.github/workflows/keep.yml'), 'utf8')).toBe(
      'name: keep-new\n',
    );
    expect(readFileSync(join(toDir, 'scripts/helper.mjs'), 'utf8')).toBe(
      'export const helper = 2;\n',
    );
    expect(() => readFileSync(join(toDir, '.github/workflows/obsolete.yml'))).toThrow();
    expect(readFileSync(join(toDir, 'src/features/feed/screen.tsx'), 'utf8')).toBe(
      'export const appOwned = true;\n',
    );
    expect(readFileSync(join(toDir, 'README.md'), 'utf8')).toBe('app readme\n');
  });
});
