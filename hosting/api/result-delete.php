<?php
/**
 * Výmaz uloženého výsledku na žiadosť používateľa.
 *
 * Bez tohto endpointu neexistovala žiadna cesta, ako záznam odstrániť —
 * ani pre používateľa, ani pre prevádzkovateľa (okrem ručného zásahu v DB).
 * Právo na výmaz sa tým nedalo uplatniť, hoci sa naň v textoch odkazuje.
 *
 * AUTORIZÁCIA: znalosť hashu. Je to 64 hexadecimálnych znakov zo SHA-256,
 * takže ho uhádnuť nemožno a drží ho len ten, komu bol odkaz vydaný alebo
 * preposlaný. Rovnaký model už používa čítanie cez result.php — kto vie
 * výsledok zobraziť, smie ho aj zmazať. Dôsledok je vedomý: komu odkaz
 * prepošlete, ten vám výsledok môže odstrániť. Silnejšia autorizácia by
 * znamenala účty a prihlasovanie, čo je pre anonymnú diagnostiku horší
 * kompromis než toto riziko.
 *
 * Zámerne sa NEROBÍ rate limiting per IP: hash sa brute-forcovať nedá
 * (2^256 možností) a jediné, čo by útočník dosiahol, je séria 404-iek nad
 * indexovaným stĺpcom. Zavádzať kvôli tomu ďalšiu stavovú tabuľku by
 * pridalo viac údajov o návštevníkoch, než koľko by ochránilo.
 *
 * Nasadenie: docroot/api/result-delete.php
 * Volanie:   POST /api/result-delete.php   {"hash":"…"}
 * Odpoveď:   {"ok":true,"deleted":true}
 *            {"ok":true,"deleted":false,"reason":"not_found"}
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
// Len nový 64-znakový formát. Staršie odkazy (16 base62, 12 hex) vznikli
// v čase, keď sa na server neukladalo nič — mazať pod nimi nie je čo.
if (!preg_match('/^[0-9a-f]{64}$/', $hash)) {
  fail('bad_hash');
}

$config = require __DIR__ . '/../../app-config/db.php';

try {
  $pdo = new PDO(
    sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_port'], $config['db_name']),
    $config['db_user'],
    $config['db_pass'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
  );

  $stmt = $pdo->prepare('DELETE FROM assessment_results WHERE hash = ? LIMIT 1');
  $stmt->execute([$hash]);
  $deleted = $stmt->rowCount() > 0;

  // Do logu ide len fakt, že k výmazu došlo — bez hashu. Uchovávať čokoľvek,
  // čím sa dá zmazaný záznam spätne identifikovať, by výmaz poprelo.
  if ($deleted) {
    error_log('result-delete: zaznam zmazany na ziadost');
  }

  echo json_encode($deleted
    ? ['ok' => true, 'deleted' => true]
    : ['ok' => true, 'deleted' => false, 'reason' => 'not_found']);
} catch (PDOException $e) {
  error_log('result-delete: ' . $e->getMessage());
  fail('server_error', 500);
}
