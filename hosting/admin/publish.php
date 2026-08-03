<?php
/**
 * digitalizuj.to — publish krok modelu.
 *
 * Skompiluje otázkovú banku z MariaDB do JSON artefaktu v presnom tvare
 * data/questionBank.json, ale AŽ PO prejdení integritných kontrol
 * (admin/checks.sql — SQL verzia scripts/validate-model.mjs). Zapíše
 * model/v{N}.json + model/current.json a verziu zaeviduje v model_versions.
 *
 * Nasadenie: docroot/admin/publish.php + docroot/admin/checks.sql.
 * Konfigurácia s prihlasovacími údajmi žije NAD docrootom
 * (../../app-config/db.php → /matpex.sk/app-config/db.php), takže ju
 * webserver nikdy neservíruje.
 *
 * Volanie:
 *   /admin/publish.php?token=...&dry=1   — len kontroly + kompilácia (nič nezapíše)
 *   /admin/publish.php?token=...         — plný publish
 *   /admin/publish.php?token=...&note=x  — publish s poznámkou vo verzii
 *
 * Referenčná implementácia kompilácie je scripts/db/compile.mjs (Node) —
 * checksumy oboch sa musia zhodovať; overuje sa to pri nasadzovaní zmien.
 */

declare(strict_types=1);

// Hosting má v php.ini prestavenú serialize_precision — float 1.2 potom
// json_encode vypisoval ako 1.1999999999999999555…, čím sa kompilát líšil
// od Node referencie o 1,7 kB čistého šumu. -1 = najkratší okrúhly zápis
// (moderný default), bajtovo zhodný s JSON.stringify.
ini_set('serialize_precision', '-1');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$config = require __DIR__ . '/../../app-config/db.php';

// --- auth -------------------------------------------------------------------
$token = $_GET['token'] ?? '';
if (!is_string($token) || !hash_equals($config['publish_token'], $token)) {
  http_response_code(403);
  echo json_encode(['ok' => false, 'error' => 'unauthorized']);
  exit;
}

$dry = isset($_GET['dry']);
$note = isset($_GET['note']) && is_string($_GET['note']) ? mb_substr($_GET['note'], 0, 255) : null;

try {
  $pdo = new PDO(
    "mysql:host={$config['db_host']};port={$config['db_port']};dbname={$config['db_name']};charset=utf8mb4",
    $config['db_user'],
    $config['db_pass'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
  );

  // --- 1. integritné kontroly ----------------------------------------------
  // checks.sql: každý SELECT vracia CHYBNÉ riadky; čokoľvek nájdené = stop.
  $sql = file_get_contents(__DIR__ . '/checks.sql');
  $sql = preg_replace('/^--.*$/m', '', $sql);
  $violations = [];
  foreach (array_filter(array_map('trim', explode(';', $sql))) as $query) {
    foreach ($pdo->query($query)->fetchAll() as $row) {
      $violations[] = $row;
      if (count($violations) >= 50) break 2;
    }
  }
  if ($violations) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'integrity_checks_failed', 'violations' => $violations],
      JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
  }

  // --- 2. kompilácia (port scripts/db/compile.mjs — rovnaké poradie kľúčov) --
  $model = compile_model($pdo, 'sk');
  $compact = json_encode($model, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  $checksum = hash('sha256', $compact);

  if ($dry) {
    echo json_encode(['ok' => true, 'dry' => true, 'checksum' => $checksum,
      'bytes' => strlen($compact), 'questions' => count_questions($model)]);
    exit;
  }

  // --- 3. zápis artefaktov ---------------------------------------------------
  $version = (int) $pdo->query('SELECT COALESCE(MAX(id), 0) + 1 FROM model_versions')->fetchColumn();
  $label = 'v' . $version;

  $modelDir = dirname(__DIR__) . '/model';
  if (!is_dir($modelDir) && !mkdir($modelDir, 0755, true)) {
    throw new RuntimeException('model/ adresár sa nedá vytvoriť');
  }
  // Najprv verziovaný súbor, potom atomicky current.json (rename) — build,
  // ktorý číta current.json počas publishu, nikdy nedostane polovičný zápis.
  file_put_contents($modelDir . '/' . $label . '.json', $compact);
  $tmp = $modelDir . '/current.json.tmp';
  file_put_contents($tmp, $compact);
  rename($tmp, $modelDir . '/current.json');

  $stmt = $pdo->prepare(
    'INSERT INTO model_versions (version_label, note, compiled_json, checksum, published) VALUES (?, ?, ?, ?, 1)');
  $stmt->execute([$label, $note, $compact, $checksum]);

  echo json_encode(['ok' => true, 'version' => $label, 'checksum' => $checksum,
    'bytes' => strlen($compact), 'questions' => count_questions($model),
    'url' => '/model/current.json']);
} catch (Throwable $e) {
  http_response_code(500);
  // Bez detailov výnimky von — môžu obsahovať SQL/cesty. Detail ide do logu.
  error_log('publish.php: ' . $e->getMessage());
  echo json_encode(['ok' => false, 'error' => 'internal']);
}

// ============================================================================

function count_questions(array $model): int {
  $n = count($model['indicative_quiz']['questions']);
  foreach ($model['complex_quiz']['modules'] as $m) { $n += count($m['questions']); }
  return $n;
}

/** DECIMAL prichádza ako string; JSON musí mať 1, nie 1.0 (zhoda s Node). */
function num(string $s): int|float {
  $f = (float) $s;
  return $f === (float) (int) $f ? (int) $f : $f;
}

function compile_model(PDO $pdo, string $locale): array {
  $all = fn(string $q, array $p = []) => (function () use ($pdo, $q, $p) {
    $s = $pdo->prepare($q); $s->execute($p); return $s->fetchAll();
  })();

  $info = $all('SELECT version, model_name, last_updated FROM model_info WHERE id = 1')[0];
  $quizzes = [];
  foreach ($all('SELECT * FROM quizzes') as $r) { $quizzes[$r['code']] = $r; }
  $modules = $all('SELECT * FROM modules ORDER BY position');
  $questions = $all(
    'SELECT qs.*, qi.text AS q_text, qi.tooltip AS q_tooltip
       FROM questions qs
       JOIN question_i18n qi ON qi.question_id = qs.id AND qi.locale = ?
      ORDER BY qs.position', [$locale]);
  $group = function (array $rows, string $key): array {
    $out = [];
    foreach ($rows as $r) { $out[$r[$key]][] = $r; }
    return $out;
  };
  $opts = $group($all(
    'SELECT o.*, oi.label FROM options o
       JOIN option_i18n oi ON oi.option_id = o.id AND oi.locale = ?
      ORDER BY o.question_id, o.position', [$locale]), 'question_id');
  $scoreMap = $group($all('SELECT * FROM question_score_map ORDER BY question_id, position'), 'question_id');
  $riskMap = $group($all('SELECT * FROM question_risk_map ORDER BY question_id, position'), 'question_id');
  $roiMap = $group($all('SELECT * FROM question_roi_map ORDER BY question_id, position'), 'question_id');
  $rules = $group($all('SELECT * FROM branching_rules ORDER BY question_id, position'), 'question_id');
  $targets = $group($all('SELECT * FROM rule_targets ORDER BY rule_id, position'), 'rule_id');

  $buildQuestion = function (array $r) use ($opts, $scoreMap, $riskMap, $roiMap, $rules, $targets): array {
    $out = [
      'id' => $r['id'],
      'category' => $r['category'],
      'dimension' => $r['dimension'],
      'question_sk' => $r['q_text'],
      'question_type' => $r['question_type'],
      'weight' => num($r['weight']),
      'options' => array_map(
        fn($o) => ['value' => $o['value'], 'label' => $o['label'], 'score' => (int) $o['score']],
        $opts[$r['id']] ?? []),
    ];
    if ($r['max_score'] !== null) { $out['max_score'] = (int) $r['max_score']; }
    if ($r['scoring_note'] !== null) { $out['scoring_note'] = $r['scoring_note']; }
    $out['branching_rules'] = array_map(function ($rule) use ($targets) {
      $t = array_map(
        fn($x) => $x['target_question_id'] ?? $x['target_rf_id'],
        $targets[$rule['id']] ?? []);
      return [
        'condition' => $rule['condition_raw'],
        'action' => $rule['action'],
        'target' => ((int) $rule['target_is_array']) === 1 ? $t : $t[0],
        'reason' => $rule['reason'],
      ];
    }, $rules[$r['id']] ?? []);
    $out['evidence_type'] = $r['evidence_type'];
    $out['maps_to_score'] = array_map(fn($x) => $x['tag'], $scoreMap[$r['id']] ?? []);
    $out['maps_to_risk'] = array_map(fn($x) => $x['rf_id'], $riskMap[$r['id']] ?? []);
    $out['maps_to_roi_model'] = array_map(fn($x) => $x['tag'], $roiMap[$r['id']] ?? []);
    $out['tooltip'] = $r['q_tooltip'];
    $out['allow_unknown'] = ((int) $r['allow_unknown']) === 1;
    if ($r['scale'] !== null) { $out['scale'] = $r['scale']; }
    if ($r['scale_rationale'] !== null) { $out['scale_rationale'] = $r['scale_rationale']; }
    return $out;
  };

  $ind = $quizzes['indicative'];
  $cx = $quizzes['complex'];
  return [
    'version' => $info['version'],
    'model_name' => $info['model_name'],
    'last_updated' => $info['last_updated'],
    'indicative_quiz' => [
      'id' => $ind['json_id'],
      'name' => $ind['name'],
      'description' => $ind['description'],
      'max_questions' => (int) $ind['max_questions'],
      'questions' => array_map($buildQuestion,
        array_values(array_filter($questions, fn($r) => $r['quiz_code'] === 'indicative'))),
    ],
    'complex_quiz' => [
      'id' => $cx['json_id'],
      'name' => $cx['name'],
      'description' => $cx['description'],
      'modules' => array_map(fn($m) => [
        'id' => $m['code'],
        'name' => $m['name'],
        'category' => $m['category'],
        'questions' => array_map($buildQuestion,
          array_values(array_filter($questions, fn($r) => $r['module_id'] === $m['id']))),
      ], $modules),
    ],
  ];
}
