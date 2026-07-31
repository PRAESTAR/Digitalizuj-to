/**
 * model:pull — stiahne publikovaný kompilát z hostingu do repa.
 *
 * Tok obsahu po migrácii na DB:
 *   phpMyAdmin (editácia) → /admin/publish.php (kontroly + kompilácia)
 *   → /model/current.json → TENTO SKRIPT → data/questionBank.json
 *   + config/model/questionBank.json → git commit → build → FTP deploy.
 *
 * Git zostáva nasadzovacím zdrojom pravdy (auditovateľné, reverzibilné);
 * DB je editačným zdrojom pravdy. Tento skript je most medzi nimi.
 *
 * Bezpečnosť: pred zápisom sa artefakt zvaliduje tým istým validátorom,
 * ktorý beží v builde (scripts/validate-model.mjs) — poškodený publish sa
 * do repa nedostane. Pri zlyhaní sa pôvodné súbory nezmenia.
 *
 * Spustenie:  npm run model:pull   (alebo node scripts/db/pull.mjs [URL])
 */
import { readFileSync, writeFileSync, copyFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const URL = process.argv[2] || 'https://app.magors.net/model/current.json';
const TARGETS = [
  path.join(ROOT, 'data/questionBank.json'),
  path.join(ROOT, 'config/model/questionBank.json'),
];

const res = await fetch(URL, { cache: 'no-store' });
if (!res.ok) { console.error(`Stiahnutie zlyhalo: ${res.status} ${URL}`); process.exit(1); }
const model = await res.json();
const pretty = JSON.stringify(model, null, 2) + '\n';
console.log(`Stiahnuté: ${URL} (${model.version}, aktualizované ${model.last_updated})`);

// zálohy pre prípad zlyhania validácie
const backups = TARGETS.map((t) => { const b = t + '.bak'; copyFileSync(t, b); return b; });
try {
  for (const t of TARGETS) writeFileSync(t, pretty, 'utf8');
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/validate-model.mjs')], {
    cwd: ROOT, stdio: 'inherit',
  });
  // Porovnanie SÉMANTICKÉ (parse → stringify), nie bajtové — pracovná kópia
  // môže mať CRLF konce riadkov a bajtové porovnanie by hlásilo falošné zmeny.
  const changed = JSON.stringify(JSON.parse(readFileSync(TARGETS[0], 'utf8')))
    !== JSON.stringify(JSON.parse(readFileSync(backups[0], 'utf8')));
  backups.forEach((b) => unlinkSync(b));
  console.log(changed
    ? 'model:pull hotový — obsah sa zmenil, skontroluj git diff a commitni.'
    : 'model:pull hotový — obsah zhodný s repo verziou, žiadna obsahová zmena.');
} catch (e) {
  console.error('VALIDÁCIA ZLYHALA — vraciam pôvodné súbory.');
  backups.forEach((b, i) => { copyFileSync(b, TARGETS[i]); unlinkSync(b); });
  process.exit(1);
}
