/**
 * Pregeneruje `config/model/scoringConfig.json` z `data/scoringConfig.ts`.
 *
 * Zrkadlo bolo dovtedy udržiavané ručne a rozišlo sa: chýbalo v ňom 20
 * exportov (celá TDRI vrstva, ROI pásma, prahy AI aj scenárov) a štyri kľúče
 * mali iné názvy než v kóde. Nikto to nekontroloval, hoci README ho označoval
 * ako „editovateľný: ÁNO" — kto tam zmenil prah, nezmenil nič.
 *
 * Spustenie:  npm run config:sync
 * Kontrola:   beží automaticky v `npm run build` (validate-model.mjs #14)
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { loadScoringConfig, toMirror, MIRROR_PATH } from './model-config.mjs';

const mod = await loadScoringConfig();
const mirror = toMirror(mod);
const json = JSON.stringify(mirror, null, 2) + '\n';

let previous = null;
try { previous = readFileSync(MIRROR_PATH, 'utf8'); } catch { /* prvý beh */ }

writeFileSync(MIRROR_PATH, json);

const keys = Object.keys(mirror).filter((k) => !k.startsWith('_'));
console.log(`config/model/scoringConfig.json: ${keys.length} kľúčov`);
console.log(previous === json ? 'bez zmeny' : 'PREGENEROVANÉ');
