// Leonida Platinum Roadmap — the entry program (Node 22, standard library only).
// It hands the guide in: it copies this repository's app/ (the offline guide and
// tracker) and screenshots/ (the three renders) into the output directory and
// writes /output/dossier.json with the vendored make.fun library, so the judge
// reads the screenshots and the source outline. The program runs twice and must
// write identical bytes both times, so it does nothing time- or order-dependent:
// files are copied in directory order and the dossier is built from the copied
// files, not from the clock.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function fail(message: string): never {
  console.error('main.ts: ' + message);
  process.exit(1);
}

function checkInputs(): void {
  const appDir = join(repoRoot, 'app');
  const indexFile = join(appDir, 'index.html');
  const dataFile = join(appDir, 'data', 'trophies.json');
  if (!existsSync(indexFile)) fail('app/index.html is missing');
  if (!existsSync(dataFile)) fail('app/data/trophies.json is missing');
  const shotsDir = join(repoRoot, 'screenshots');
  if (!existsSync(shotsDir)) fail('screenshots/ is missing');
  const shots = readdirSync(shotsDir).filter((name) => !name.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) fail('expected 3 or 4 screenshots, found ' + shots.length);
  for (const name of shots) {
    const size = statSync(join(shotsDir, name)).size;
    if (size > 262144) fail('screenshot ' + name + ' is over 256 KiB');
  }
}

function handIn(): void {
  checkInputs();
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  const dossierPath = join(outputDir, 'dossier.json');
  writeFileSync(dossierPath, dossier);
  const dossierBytes = statSync(dossierPath).size;
  if (dossierBytes > 1572864) fail('dossier.json is over the 1.5 MiB cap');
  console.log('handed in: app/ + screenshots/ + dossier.json (' + dossierBytes + ' bytes) in ' + outputDir);
}

handIn();
