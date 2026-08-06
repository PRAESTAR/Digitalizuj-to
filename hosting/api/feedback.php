<?php
/**
 * Spätná väzba k výsledku (NPS) — škála 0–10.
 *
 * Zapisuje sa k EXISTUJÚCEMU riadku výsledku, nie do vlastnej tabuľky, aby
 * sa dala spätná väzba porovnať so skóre, ktoré ju vyvolalo. Riadok je aj
 * tak anonymný (bez IČO a kontaktu), takže sa tým nič o firme neodhaľuje.
 *
 * AUTORIZÁCIA: znalosť hashu — rovnaký model ako čítanie a výmaz. Kto vie
 * výsledok zobraziť, smie k nemu pripojiť hodnotenie.
 *
 * Hodnotenie sa dá prepísať (respondent si to môže rozmyslieť), ale len kým
 * je riadok v databáze; po výmaze výsledku zaniká aj hodnotenie.
 *
 * Nasadenie: docroot/api/feedback.php
 * Volanie:   POST /api/feedback.php   {"hash":"…","score":8}
 * Odpoveď:   {"ok":true,"stored":true}
 *            {"ok":true,"stored":false,"reason":"not_found"}
 *            {"ok":false,"reason":"…"}
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

/** Telo je jeden krátky JSON — čokoľvek väčšie je pokus o niečo iné. */
const MAX_BODY_BYTES = 4096;

function fail(string $reason, int $status = 400): never {
  http_response_code($status);
  echo json_encode(['ok' => false, 'reason' => $reason]);
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  fail('method_not_allowed', 405);
}

$raw = file_get_contents('php://input', false, null, 0, MAX_BODY_BYTES + 1);
if (!is_string($raw) || strlen($raw) > MAX_BODY_BYTES) {
  fail('payload_too_large', 413);
}

$body = json_decode($raw, true);
if (!is_array($body)) {
  fail('bad_request');
}

$hash = isset($body['hash']) && is_string($body['hash']) ? $body['hash'] : '';
if (!preg_match('/^[0-9a-f]{64}$/', $hash)) {
  fail('bad_hash');
}

// Nula je PLATNÁ odpoveď („vôbec by som neodporučil"), nie chýbajúca hodnota —
// preto sa kontroluje typ a rozsah, nie pravdivosť.
if (!isset($body['score']) || !is_int($body['score']) || $body['score'] < 0 || $body['score'] > 10) {
  fail('bad_score');
}
$score = $body['score'];

$config = require __DIR__ . '/../../app-config/db.php';

try {
  $pdo = new PDO(
    sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_port'], $config['db_name']),
    $config['db_user'],
    $config['db_pass'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
  );

  $stmt = $pdo->prepare(
    'UPDATE assessment_results SET nps_score = ?, nps_at = UTC_TIMESTAMP() WHERE hash = ? LIMIT 1'
  );
  $stmt->execute([$score, $hash]);

  // rowCount() vráti 0 aj vtedy, keď sa uložila TÁ ISTÁ hodnota — pre
  // volajúceho je to úspech, nie chyba, takže sa existencia overuje zvlášť.
  if ($stmt->rowCount() > 0) {
    echo json_encode(['ok' => true, 'stored' => true]);
    exit;
  }

  $check = $pdo->prepare('SELECT 1 FROM assessment_results WHERE hash = ? LIMIT 1');
  $check->execute([$hash]);
  echo json_encode($check->fetchColumn()
    ? ['ok' => true, 'stored' => true, 'reason' => 'unchanged']
    : ['ok' => true, 'stored' => false, 'reason' => 'not_found']);
} catch (PDOException $e) {
  error_log('feedback: ' . $e->getMessage());
  fail('server_error', 500);
}
