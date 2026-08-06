<?php
/**
 * Uloženie výsledku diagnostiky.
 *
 * Volá sa z prehliadača hneď po tom, ako sa vygeneruje permanentný hash.
 * Uloží AGREGÁTY výsledku (vypočítané skóre, firmografiu, odvodené
 * odporúčania), takže sa dá zobraziť neskôr aj na inom zariadení.
 *
 * ODPOVEDE PO OTÁZKACH SA NEUKLADAJÚ (rozhodnutie 5. 8. 2026). Boli tu pre
 * pripravovanú administráciu; tá bola zrušená, takže by sa najcitlivejšia
 * časť dát uchovávala bez účelu. Klient ich už neposiela a tento endpoint
 * ich zahadzuje aj vtedy, keď v tele prídu — stĺpec `answers_json` zostáva
 * v schéme prázdny, aby sa dal zápis obnoviť bez migrácie, ak sa
 * administrácia vráti (vtedy ale treba vyriešiť aj právny základ).
 *
 * Nasadenie: docroot/api/result-save.php
 * Konfigurácia žije NAD docrootom (../../app-config/db.php →
 * /matpex.sk/app-config/db.php), takže ju webserver nikdy neservíruje.
 *
 * Volanie:  POST /api/result-save.php   {"hash":"…","uuid":"…","result":{…},…}
 * Odpoveď:  {"ok":true,"stored":true}  |  {"ok":true,"stored":false,"reason":"duplicate"}
 *           {"ok":false,"reason":"…"}
 *
 * TOTO JE VEREJNÝ ZÁPISOVÝ ENDPOINT — čokoľvek odtiaľto ide do databázy musí
 * prejsť kontrolou tvaru aj množstva. Preto: strop veľkosti tela, presný tvar
 * hashu a UUID, whitelist skalárnych polí a limit počtu zápisov z jednej IP
 * za hodinu. Obsah JSON blobov sa neinterpretuje, ukladá sa tak, ako prišiel.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

/** 512 kB stačí aj na komplexný kvíz s odporúčaniami a odpoveďami. */
const MAX_BODY_BYTES = 524288;
/** Koľko výsledkov smie z jednej IP pribudnúť za hodinu. */
const MAX_PER_IP_HOUR = 20;
/**
 * Retenčná lehota. Po nej sa výsledok zmaže — permanentný odkaz prestane
 * fungovať a vráti to isté, čo neexistujúci hash. Hosting nemá cron, takže
 * mazanie visí na zápise: pri každom uloženom výsledku sa odstráni dávka
 * prezretých riadkov. To znamená, že bez prevádzky sa nemaže nič — lehota
 * je teda „najviac 24 mesiacov od posledného zápisu", nie presne 24.
 * Alternatíva (MariaDB EVENT) je na zdieľanom hostingu spravidla vypnutá.
 */
const RETENTION_MONTHS = 24;
/** Strop jednej dávky, aby prune nikdy nezdržal odpoveď používateľovi. */
const PRUNE_BATCH = 200;

function fail(string $reason, int $status = 400): never {
  http_response_code($status);
  echo json_encode(['ok' => false, 'reason' => $reason]);
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  fail('method_not_allowed', 405);
}

$declared = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($declared > MAX_BODY_BYTES) {
  fail('payload_too_large', 413);
}

$raw = file_get_contents('php://input', false, null, 0, MAX_BODY_BYTES + 1);
if (!is_string($raw) || strlen($raw) > MAX_BODY_BYTES) {
  fail('payload_too_large', 413);
}

$body = json_decode($raw, true);
if (!is_array($body)) {
  fail('bad_request');
}

// --- tvar identifikátorov ----------------------------------------------------
$hash = isset($body['hash']) && is_string($body['hash']) ? $body['hash'] : '';
$uuid = isset($body['uuid']) && is_string($body['uuid']) ? $body['uuid'] : '';

if (!preg_match('/^[0-9a-f]{64}$/', $hash)) {
  fail('bad_hash');
}
// Verzia 7 a variant RFC 4122 — nie hocijaké UUID.
if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/', $uuid)) {
  fail('bad_uuid');
}

if (!isset($body['result']) || !is_array($body['result'])) {
  fail('missing_result');
}

$config = require __DIR__ . '/../../app-config/db.php';

/** Skalárne pole z tela, orezané na dĺžku stĺpca; null keď chýba. */
function str_field(array $body, string $key, int $max): ?string {
  if (!isset($body[$key]) || !is_string($body[$key]) || $body[$key] === '') return null;
  return mb_substr($body[$key], 0, $max);
}

/** Číslo alebo null — prázdny reťazec ani „nemerané" sa nesmú stať nulou. */
function num_field(array $src, string $key): ?float {
  if (!isset($src[$key]) || !is_numeric($src[$key])) return null;
  return (float) $src[$key];
}

$quizType = str_field($body, 'quizType', 16) ?? 'complex';
if (!in_array($quizType, ['indicative', 'complex'], true)) {
  fail('bad_quiz_type');
}
$locale = str_field($body, 'locale', 2) ?? 'sk';
if (!in_array($locale, ['sk', 'cs', 'en'], true)) {
  $locale = 'sk';
}

$scores = isset($body['scores']) && is_array($body['scores']) ? $body['scores'] : [];

$completedAt = str_field($body, 'completedAt', 32);
$completedAtSql = null;
if ($completedAt !== null) {
  $ts = strtotime($completedAt);
  if ($ts !== false) $completedAtSql = gmdate('Y-m-d H:i:s', $ts);
}

// IP sa neukladá surová — na počítanie zápisov za hodinu stačí jej hash,
// a hash nie je osobný údaj v zmysle priamej identifikácie.
$ipSalt = isset($config['ip_salt']) && is_string($config['ip_salt']) ? $config['ip_salt'] : 'matpex';
$ipHash = hash('sha256', $ipSalt . '|' . ($_SERVER['REMOTE_ADDR'] ?? ''));
$userAgent = mb_substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255);

try {
  $pdo = new PDO(
    sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_port'], $config['db_name']),
    $config['db_user'],
    $config['db_pass'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
  );

  $limit = $pdo->prepare(
    'SELECT COUNT(*) FROM assessment_results WHERE ip_hash = ? AND created_at > (NOW() - INTERVAL 1 HOUR)'
  );
  $limit->execute([$ipHash]);
  if ((int) $limit->fetchColumn() >= MAX_PER_IP_HOUR) {
    fail('rate_limited', 429);
  }

  $stmt = $pdo->prepare(
    'INSERT INTO assessment_results
       (uuid, hash, completed_at, quiz_type, locale, sector, size_band, country,
        dii_score100, dii_score12, dii_measured, ors_score, tdri_score, ai_score,
        business_impact_eur, model_version, result_json, answers_json,
        respondent_json, ip_hash, user_agent)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
  );

  $stmt->execute([
    $uuid,
    $hash,
    $completedAtSql,
    $quizType,
    $locale,
    str_field($body, 'sector', 64),
    str_field($body, 'sizeBand', 16),
    str_field($body, 'country', 2) ?? 'SK',
    num_field($scores, 'diiScore100'),
    num_field($scores, 'diiScore12'),
    num_field($scores, 'diiMeasured'),
    num_field($scores, 'orsScore'),
    num_field($scores, 'tdriScore'),
    num_field($scores, 'aiScore'),
    num_field($scores, 'businessImpactEur'),
    str_field($body, 'modelVersion', 64),
    json_encode($body['result'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    // Zámerne vždy NULL — odpovede po otázkach sa neukladajú (viď hlavička).
    null,
    isset($body['respondent']) ? json_encode($body['respondent'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
    $ipHash,
    $userAgent,
  ]);

  echo json_encode(['ok' => true, 'stored' => true]);

  // Prune AŽ PO odoslaní odpovede a vo vlastnom try — zlyhanie údržby nesmie
  // zhodiť uloženie výsledku, ktorý používateľ práve dokončil.
  if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
  }
  try {
    $prune = $pdo->prepare(
      'DELETE FROM assessment_results
        WHERE created_at < (NOW() - INTERVAL ' . RETENTION_MONTHS . ' MONTH)
        LIMIT ' . PRUNE_BATCH
    );
    $prune->execute();
    $removed = $prune->rowCount();
    if ($removed > 0) {
      error_log(sprintf('result-save: retencia zmazala %d zaznamov', $removed));
    }
  } catch (PDOException $e) {
    error_log('result-save/prune: ' . $e->getMessage());
  }
} catch (PDOException $e) {
  // 23000 = porušenie unique kľúča. Opakované odoslanie toho istého výsledku
  // (obnovenie stránky, druhý tab) nie je chyba — výsledok už uložený je.
  if ($e->getCode() === '23000') {
    echo json_encode(['ok' => true, 'stored' => false, 'reason' => 'duplicate']);
    exit;
  }
  // Detail chyby sa von neposiela — mohol by prezradiť štruktúru databázy.
  error_log('result-save: ' . $e->getMessage());
  fail('server_error', 500);
}
