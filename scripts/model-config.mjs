/**
 * Načítanie `data/scoringConfig.ts` z obyčajného Node skriptu.
 *
 * Zdrojom pravdy scoring parametrov je TypeScript — dáva typovú kontrolu a
 * niektoré hodnoty sú odvodené výpočtom (napr. `tdriMaxPenaltySum`). Aby sa
 * dali čítať aj z validátora a zo synchronizácie zrkadla, prekladá sa súbor
 * v pamäti cez `typescript`, ktorý je už závislosťou projektu — žiadny tsx
 * ani ďalší nástroj netreba.
 *
 * Type-only import na prvom riadku (`import type`) transpiler zahodí, takže
 * modul po preklade nemá žiadne závislosti a dá sa načítať priamo.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, 'package.json'));
const ts = require('typescript');

/** Kľúče, ktoré do zrkadla nepatria — sú to odvodené alebo interné hodnoty. */
const DERIVED = new Set([
  // Súčet maxPenalty všetkých faktorov; počíta sa z riskFactorDefinitions,
  // takže v zrkadle by bol duplicitou, ktorá sa môže rozísť.
  'tdriMaxPenaltySum',
]);

export async function loadScoringConfig() {
  const src = readFileSync(path.join(ROOT, 'data/scoringConfig.ts'), 'utf8');
  const { outputText } = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: false,
    },
  });
  const url = 'data:text/javascript;base64,' + Buffer.from(outputText, 'utf8').toString('base64');
  return import(url);
}

/**
 * Tvar zrkadla `config/model/scoringConfig.json`.
 *
 * Zrkadlo je **generovaný pohľad**, nie vstup — runtime ho nečíta. Slúži
 * editorom modelu na to, aby videli platné hodnoty bez čítania TypeScriptu.
 * Preto sa negeneruje selektívne: čo je v TS, je aj tu, inak sa opäť rozíde.
 */
export function toMirror(mod) {
  const out = {
    _comment:
      'GENEROVANÝ SÚBOR — needituj. Zdrojom pravdy je data/scoringConfig.ts; ' +
      'tento pohľad z neho vyrába `npm run config:sync` a build ho kontroluje ' +
      '(validate-model.mjs #14). Ručná zmena tu NEZMENÍ správanie aplikácie.',
    _generatedFrom: 'data/scoringConfig.ts',
  };
  for (const [key, value] of Object.entries(mod)) {
    if (DERIVED.has(key)) continue;
    if (typeof value === 'function') continue;
    out[key] = value;
  }
  return out;
}

export const MIRROR_PATH = path.join(ROOT, 'config/model/scoringConfig.json');
