/**
 * ETL: data/questionBank.json + RF definície zo scoringConfig.ts → MariaDB.
 *
 * Spustenie:  DB_PASS='...' node scripts/db/import.mjs
 * (DB_HOST/DB_USER/DB_NAME majú defaulty na websupport `digitalizacia`.)
 *
 * Zásady:
 *  - IDEMPOTENTNÉ: najprv aplikuje db/schema.sql (DROP + CREATE), potom
 *    importuje. Obsahová databáza sa dá kedykoľvek postaviť nanovo z JSON,
 *    kým je JSON zdrojom pravdy; po prepnutí zdroja pravdy na DB sa tento
 *    skript stane jednorazovou históriou.
 *  - ŽIADNA TICHÁ STRATA DÁT: neznámy kľúč na otázke/pravidle/možnosti
 *    zhodí import. Ak sa do JSON pridá pole, musí sa najprv pridať sem
 *    a do schémy.
 *  - ŠTRUKTÚRA = PRAVDA: podmienka pravidla sa parsuje na operátor +
 *    operandy a REGENERUJE späť na string; nezhoda s originálom zhodí
 *    import. Kompilácia potom číta surový string, takže bajtová vernosť
 *    nezávisí od parsera.
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(ROOT, 'package.json'));
const mysql = require('mysql2/promise');

const QUESTION_KEYS = new Set([
  'id', 'category', 'dimension', 'question_sk', 'question_type', 'weight',
  'options', 'max_score', 'scoring_note', 'scoring_mode', 'branching_rules', 'evidence_type',
  'anchor_low_sk', 'anchor_high_sk', 'likert_ors_rationale',
  'maps_to_score', 'maps_to_risk', 'maps_to_roi_model', 'tooltip',
  'allow_unknown', 'scale', 'scale_rationale',
]);
const RULE_KEYS = new Set(['condition', 'action', 'target', 'reason', 'on_unknown']);
const OPTION_KEYS = new Set(['value', 'label', 'score']);

/**
 * Typy otázok, ktoré pozná DB schéma (ENUM `questions.question_type`).
 *
 * Kontroluje sa tu, lebo MariaDB v neprísnom režime neznámu hodnotu ENUM-u
 * NEODMIETNE — uloží prázdny reťazec. Otázka potom v databáze existuje bez
 * typu, import prejde bez chyby a rozbije sa až najbližší publish. Presne to
 * sa stalo pri zavedení `likert_11` 6. 8. 2026.
 */
const ALLOWED_TYPES = new Set(['single_choice', 'multi_select', 'likert_11']);

function assertKeys(obj, allowed, ctx) {
  for (const k of Object.keys(obj)) {
    if (!allowed.has(k)) throw new Error(`Neznámy kľúč "${k}" na ${ctx} — doplň schému a import, inak by sa dáta ticho stratili.`);
  }
}

/** Parsovanie podmienky na štruktúru + regenerácia (formáty overené na dátach). */
export function parseCondition(raw) {
  let m;
  if ((m = raw.match(/^selected_count <= (\d+)$/)))
    return { operator: 'count_lte', operands: [m[1]] };
  if ((m = raw.match(/^!selected\.includes\('([^']+)'\)$/)))
    return { operator: 'none_includes', operands: [m[1]] };
  if ((m = raw.match(/^value != '([^']+)'$/)))
    return { operator: 'not_equals', operands: [m[1]] };
  const parts = raw.split(' || ');
  const vals = parts.map((p) => { const mm = p.match(/^value == '([^']+)'$/); return mm && mm[1]; });
  if (vals.every(Boolean))
    return { operator: vals.length === 1 ? 'equals' : 'any_of', operands: vals };
  throw new Error(`Nerozpoznaná podmienka: |${raw}|`);
}

export function regenerateCondition({ operator, operands }) {
  switch (operator) {
    case 'count_lte': return `selected_count <= ${operands[0]}`;
    case 'none_includes': return `!selected.includes('${operands[0]}')`;
    case 'not_equals': return `value != '${operands[0]}'`;
    case 'equals':
    case 'any_of': return operands.map((v) => `value == '${v}'`).join(' || ');
    default: throw new Error(`Neznámy operátor ${operator}`);
  }
}

async function main() {
  const bank = JSON.parse(readFileSync(path.join(ROOT, 'data/questionBank.json'), 'utf8'));
  const scoringSrc = readFileSync(path.join(ROOT, 'data/scoringConfig.ts'), 'utf8');

  // RF definície regexom — scoringConfig je TS modul, nejde require-nuť z .mjs.
  const rfs = [...scoringSrc.matchAll(/\{ id: '(RF\d+)', name: '([^']*)', maxPenalty: (\d+), severity: '(\w+)' as const \}/g)]
    .map((m) => ({ id: m[1], name: m[2], maxPenalty: Number(m[3]), severity: m[4] }));
  if (rfs.length !== 14) throw new Error(`Očakávaných 14 RF, nájdených ${rfs.length} — zmenil sa formát scoringConfig.ts?`);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'db.r6.websupport.sk',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'L76bIIPR',
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'digitalizacia',
    charset: 'utf8mb4',
    multipleStatements: true,
  });
  console.log('Pripojené. Aplikujem schému…');
  await conn.query(readFileSync(path.join(ROOT, 'db/schema.sql'), 'utf8'));

  const t0 = Date.now();
  await conn.query('INSERT INTO model_info (id, version, model_name, last_updated) VALUES (1, ?, ?, ?)',
    [bank.version, bank.model_name, bank.last_updated]);

  await conn.query('INSERT INTO risk_factors (id, name, max_penalty, severity) VALUES ?',
    [rfs.map((r) => [r.id, r.name, r.maxPenalty, r.severity])]);

  await conn.query('INSERT INTO quizzes (code, json_id, name, description, max_questions) VALUES ?', [[
    ['indicative', bank.indicative_quiz.id, bank.indicative_quiz.name, bank.indicative_quiz.description, bank.indicative_quiz.max_questions],
    ['complex', bank.complex_quiz.id, bank.complex_quiz.name, bank.complex_quiz.description, null],
  ]]);

  const moduleIds = {};
  for (const [i, m] of bank.complex_quiz.modules.entries()) {
    const [res] = await conn.query('INSERT INTO modules (quiz_code, code, name, category, position) VALUES (?,?,?,?,?)',
      ['complex', m.id, m.name, m.category, i]);
    moduleIds[m.id] = res.insertId;
  }

  let nQ = 0, nOpt = 0, nRule = 0;
  async function importQuestion(q, quizCode, moduleId, position) {
    assertKeys(q, QUESTION_KEYS, `otázke ${q.id}`);
    if (!ALLOWED_TYPES.has(q.question_type)) {
      throw new Error(
        `${q.id}: typ "${q.question_type}" nie je v ENUM-e questions.question_type — ` +
        'doplň ho do db/schema.sql aj sem, inak ho MariaDB uloží ako prázdny reťazec bez chyby.'
      );
    }
    await conn.query(
      `INSERT INTO questions (id, quiz_code, module_id, position, category, dimension, question_type,
         weight, max_score, evidence_type, allow_unknown, scale, scale_rationale, scoring_note,
         anchor_low_sk, anchor_high_sk, likert_ors_rationale)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [q.id, quizCode, moduleId, position, q.category, q.dimension, q.question_type,
        q.weight, q.max_score ?? null, q.evidence_type, q.allow_unknown ? 1 : 0,
        q.scale ?? null, q.scale_rationale ?? null, q.scoring_note ?? null,
        q.anchor_low_sk ?? null, q.anchor_high_sk ?? null, q.likert_ors_rationale ?? null]);
    await conn.query('INSERT INTO question_i18n (question_id, locale, text, tooltip) VALUES (?,?,?,?)',
      [q.id, 'sk', q.question_sk, q.tooltip]);

    for (const [i, o] of q.options.entries()) {
      assertKeys(o, OPTION_KEYS, `možnosti ${q.id}[${i}]`);
      const [res] = await conn.query('INSERT INTO options (question_id, position, value, score) VALUES (?,?,?,?)',
        [q.id, i, o.value, o.score]);
      await conn.query('INSERT INTO option_i18n (option_id, locale, label) VALUES (?,?,?)', [res.insertId, 'sk', o.label]);
      nOpt++;
    }
    for (const [mapTable, arr, col] of [
      ['question_score_map', q.maps_to_score, 'tag'],
      ['question_risk_map', q.maps_to_risk, 'rf_id'],
      ['question_roi_map', q.maps_to_roi_model, 'tag'],
    ]) {
      if (arr.length) await conn.query(`INSERT INTO ${mapTable} (question_id, position, ${col}) VALUES ?`,
        [arr.map((v, i) => [q.id, i, v])]);
    }
    nQ++;
  }

  // Pravidlá až PO všetkých otázkach — FK na cieľové otázky vyžaduje ich existenciu.
  async function importRules(q) {
    for (const [i, r] of (q.branching_rules || []).entries()) {
      assertKeys(r, RULE_KEYS, `pravidle ${q.id}[${i}]`);
      const parsed = parseCondition(r.condition);
      const regen = regenerateCondition(parsed);
      if (regen !== r.condition)
        throw new Error(`Regenerácia podmienky nesedí na ${q.id}[${i}]:\n  orig: |${r.condition}|\n  regen:|${regen}|`);
      const targets = Array.isArray(r.target) ? r.target : [r.target];
      const [res] = await conn.query(
        'INSERT INTO branching_rules (question_id, position, condition_raw, operator, action, reason, target_is_array) VALUES (?,?,?,?,?,?,?)',
        [q.id, i, r.condition, parsed.operator, r.action, r.reason, Array.isArray(r.target) ? 1 : 0]);
      await conn.query('INSERT INTO rule_condition_operands (rule_id, position, value) VALUES ?',
        [parsed.operands.map((v, j) => [res.insertId, j, v])]);
      await conn.query('INSERT INTO rule_targets (rule_id, position, target_question_id, target_rf_id) VALUES ?',
        [targets.map((t, j) => [res.insertId, j, r.action === 'skip' ? t : null, r.action === 'flag_risk' ? t : null])]);
      nRule++;
    }
  }

  for (const [i, q] of bank.indicative_quiz.questions.entries()) await importQuestion(q, 'indicative', null, i);
  for (const m of bank.complex_quiz.modules)
    for (const [i, q] of m.questions.entries()) await importQuestion(q, 'complex', moduleIds[m.id], i);
  for (const q of bank.indicative_quiz.questions) await importRules(q);
  for (const m of bank.complex_quiz.modules) for (const q of m.questions) await importRules(q);

  console.log(`Import hotový za ${Math.round((Date.now() - t0) / 1000)}s: ${nQ} otázok, ${nOpt} možností, ${nRule} pravidiel, ${rfs.length} RF.`);
  await conn.end();
}

main().catch((e) => { console.error('IMPORT ZLYHAL: ' + e.message); process.exit(1); });
