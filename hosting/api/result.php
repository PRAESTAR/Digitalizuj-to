<?php
/**
 * Načítanie uloženého výsledku pre stránku /r/{hash}.
 *
 * Vďaka tomuto endpointu funguje permanentný odkaz aj QR kód na inom
 * zariadení, než na akom bol kvíz vyplnený — dovtedy výsledok existoval
 * len v localStorage toho jedného prehliadača.
 *
 * ZÁMERNE NEVRACIA VŠETKO. V databáze je uložené plné znenie vrátane
 * odpovedí po otázkach, ale kto má odkaz, dostane len anonymizovaný
 * snapshot so súhrnnými skóre — presne to, čo stránka /r/{hash}
 * zobrazovala doteraz. Odpovede sú pre administráciu, nie pre každého,
 * kto dostane odkaz preposlaný ďalej.
 *
 * Nasadenie: docroot/api/result.php
 * Volanie:   GET /api/result.php?hash=…
 * Odpoveď:   {"ok":true,"snapshot":{…}}  |  {"ok":false,"reason":"not_found"}
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
// Odkaz je nemenný, ale výsledok sa dá teoreticky prepísať novým publishom
// modelu — krátka cache šetrí databázu bez rizika, že sa zasekne stará verzia.
header('Cache-Control: private, max-age=300');

function fail(string $reason, int $status = 400): never {
  http_response_code($status);
  echo json_encode(['ok' => false, 'reason' => $reason]);
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
  fail('method_not_allowed', 405);
}

$hash = isset($_GET['hash']) && is_string($_GET['hash']) ? $_GET['hash'] : '';
// Len nový 64-znakový formát — staršie odkazy (16 base62, 12 hex) vznikli
// v čase, keď sa na server neukladalo nič, takže v databáze nemôžu byť.
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

  $stmt = $pdo->prepare(
    'SELECT hash, completed_at, sector, size_band, country,
            dii_score100, dii_score12, dii_measured, ors_score, tdri_score,
            business_impact_eur, result_json
       FROM assessment_results
      WHERE hash = ?
      LIMIT 1'
  );
  $stmt->execute([$hash]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$row) {
    fail('not_found', 404);
  }

  // Kategóriové skóre sa berú z plného výsledku — v samostatných stĺpcoch nie sú.
  $result = json_decode((string) $row['result_json'], true);
  $categories = [];
  if (is_array($result) && isset($result['ors']['categories']) && is_array($result['ors']['categories'])) {
    $map = ['A' => 'procesy', 'B' => 'systemy', 'C' => 'data', 'D' => 'infra', 'E' => 'security', 'F' => 'governance'];
    foreach ($map as $key => $name) {
      $score = $result['ors']['categories'][$key]['score'] ?? null;
      $categories[$name] = is_numeric($score) ? (int) round((float) $score) : null;
    }
  }

  $num = static fn ($v): ?int => is_numeric($v) ? (int) round((float) $v) : null;

  echo json_encode([
    'ok' => true,
    'snapshot' => [
      'hash' => $row['hash'],
      'schemaVersion' => 2,
      'sector' => $row['sector'] ?? 'other',
      'sizeBand' => $row['size_band'] ?? 'small',
      'country' => $row['country'] ?? 'SK',
      'diiScore100' => $num($row['dii_score100']),
      'diiScore12' => $num($row['dii_score12']),
      'diiMeasured' => $num($row['dii_measured']),
      'orsScore' => $num($row['ors_score']),
      'tdriScore' => $num($row['tdri_score']) ?? 0,
      'businessImpactEur' => $num($row['business_impact_eur']) ?? 0,
      'completedAt' => $row['completed_at'] !== null
        ? gmdate('c', strtotime((string) $row['completed_at']))
        : gmdate('c'),
      'orsCategories' => $categories !== [] ? $categories : null,
    ],
  ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (PDOException $e) {
  error_log('result: ' . $e->getMessage());
  fail('server_error', 500);
}
