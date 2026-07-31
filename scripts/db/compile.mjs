/**
 * Kompilácia modelu z MariaDB späť do tvaru data/questionBank.json.
 *
 * Spustenie:  DB_PASS='...' node scripts/db/compile.mjs [--check]
 *   --check  porovná kompilát hĺbkovo s data/questionBank.json a skončí
 *            nenulovo pri akejkoľvek odchýlke (akceptačný test migrácie).
 *
 * Toto je referenčná implementácia kompilácie — publish.php na hostingu
 * robí to isté v PHP a jeho výstup sa pri nasadzovaní porovnáva checksumom
 * s týmto skriptom, aby sa dve implementácie nemohli rozísť.
 *
 * Poradie kľúčov otázky je deterministické (overené: v JSON existujú presne
 * 4 varianty, dané prítomnosťou polí): id, category, dimension, question_sk,
 * question_type, weight, options, [max_score], [scoring_note],
 * branching_rules, evidence_type, maps_to_score, maps_to_risk,
 * maps_to_roi_model, tooltip, allow_unknown, [scale], [scale_rationale].
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(ROOT, 'package.json'));
const mysql = require('mysql2/promise');

export async function buildModel(conn, locale = 'sk') {
  const q = async (sql, params = []) => (await conn.query(sql, params))[0];

  const [info] = await q('SELECT version, model_name, last_updated FROM model_info WHERE id = 1');
  const quizzes = Object.fromEntries((await q('SELECT * FROM quizzes')).map((r) => [r.code, r]));
  const modules = await q('SELECT * FROM modules ORDER BY position');
  const questions = await q(
    `SELECT qs.*, qi.text AS q_text, qi.tooltip AS q_tooltip
       FROM questions qs
       JOIN question_i18n qi ON qi.question_id = qs.id AND qi.locale = ?
      ORDER BY qs.position`, [locale]);
  const options = await q(
    `SELECT o.*, oi.label FROM options o
       JOIN option_i18n oi ON oi.option_id = o.id AND oi.locale = ?
      ORDER BY o.question_id, o.position`, [locale]);
  const scoreMap = await q('SELECT * FROM question_score_map ORDER BY question_id, position');
  const riskMap = await q('SELECT * FROM question_risk_map ORDER BY question_id, position');
  const roiMap = await q('SELECT * FROM question_roi_map ORDER BY question_id, position');
  const rules = await q('SELECT * FROM branching_rules ORDER BY question_id, position');
  const targets = await q('SELECT * FROM rule_targets ORDER BY rule_id, position');

  const by = (rows, key) => {
    const m = new Map();
    for (const r of rows) { if (!m.has(r[key])) m.set(r[key], []); m.get(r[key]).push(r); }
    return m;
  };
  const optsBy = by(options, 'question_id');
  const scoreBy = by(scoreMap, 'question_id');
  const riskBy = by(riskMap, 'question_id');
  const roiBy = by(roiMap, 'question_id');
  const rulesBy = by(rules, 'question_id');
  const targetsBy = by(targets, 'rule_id');

  function buildQuestion(r) {
    const out = {
      id: r.id,
      category: r.category,
      dimension: r.dimension,
      question_sk: r.q_text,
      question_type: r.question_type,
      weight: Number(r.weight),
      options: (optsBy.get(r.id) || []).map((o) => ({ value: o.value, label: o.label, score: o.score })),
    };
    if (r.max_score !== null) out.max_score = r.max_score;
    if (r.scoring_note !== null) out.scoring_note = r.scoring_note;
    out.branching_rules = (rulesBy.get(r.id) || []).map((rule) => {
      const t = (targetsBy.get(rule.id) || []).map((x) => x.target_question_id ?? x.target_rf_id);
      return {
        condition: rule.condition_raw,
        action: rule.action,
        target: rule.target_is_array ? t : t[0],
        reason: rule.reason,
      };
    });
    out.evidence_type = r.evidence_type;
    out.maps_to_score = (scoreBy.get(r.id) || []).map((x) => x.tag);
    out.maps_to_risk = (riskBy.get(r.id) || []).map((x) => x.rf_id);
    out.maps_to_roi_model = (roiBy.get(r.id) || []).map((x) => x.tag);
    out.tooltip = r.q_tooltip;
    out.allow_unknown = !!r.allow_unknown;
    if (r.scale !== null) out.scale = r.scale;
    if (r.scale_rationale !== null) out.scale_rationale = r.scale_rationale;
    return out;
  }

  const ind = quizzes.indicative;
  const cx = quizzes.complex;
  return {
    version: info.version,
    model_name: info.model_name,
    last_updated: info.last_updated,
    indicative_quiz: {
      id: ind.json_id,
      name: ind.name,
      description: ind.description,
      max_questions: ind.max_questions,
      questions: questions.filter((r) => r.quiz_code === 'indicative').map(buildQuestion),
    },
    complex_quiz: {
      id: cx.json_id,
      name: cx.name,
      description: cx.description,
      modules: modules.map((m) => ({
        id: m.code,
        name: m.name,
        category: m.category,
        questions: questions.filter((r) => r.module_id === m.id).map(buildQuestion),
      })),
    },
  };
}

/** Hĺbkové porovnanie s výpisom ciest rozdielov (max `limit`). */
export function deepDiff(a, b, pathStr = '$', diffs = [], limit = 20) {
  if (diffs.length >= limit) return diffs;
  if (a === b) return diffs;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') {
    diffs.push(`${pathStr}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
    return diffs;
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (!(k in a)) { diffs.push(`${pathStr}.${k}: chýba v A`); continue; }
    if (!(k in b)) { diffs.push(`${pathStr}.${k}: chýba v B`); continue; }
    deepDiff(a[k], b[k], `${pathStr}.${k}`, diffs, limit);
    if (diffs.length >= limit) break;
  }
  return diffs;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'db.r6.websupport.sk',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'L76bIIPR',
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'digitalizacia',
    charset: 'utf8mb4',
  });
  const model = await buildModel(conn);
  await conn.end();

  const outDir = path.join(ROOT, '.model-build');
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'compiled.json');
  writeFileSync(outPath, JSON.stringify(model, null, 2) + '\n', 'utf8');
  console.log('Kompilát: ' + outPath);

  if (process.argv.includes('--check')) {
    const orig = JSON.parse(readFileSync(path.join(ROOT, 'data/questionBank.json'), 'utf8'));
    const diffs = deepDiff(orig, model);
    if (diffs.length) {
      console.error('ROZDIELY voči data/questionBank.json (' + diffs.length + '+):');
      diffs.forEach((d) => console.error('  ' + d));
      process.exit(1);
    }
    console.log('CHECK OK: kompilát je hĺbkovo zhodný s data/questionBank.json.');
  }
}
