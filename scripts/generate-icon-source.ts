import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = fileURLToPath(new URL('.', import.meta.url));
const outPath = join(scriptDir, '..', 'assets', 'brand', 'icon-source.png');

if (!existsSync(outPath)) {
  console.error('Missing assets/brand/icon-source.png');
  process.exit(1);
}

console.log('Using existing icon source:', outPath);
