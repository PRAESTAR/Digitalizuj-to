<?php
/**
 * Overenie Cloudflare Turnstile tokenu.
 *
 * Toto je JEDINÉ miesto, kde sa rozhoduje, či výzva naozaj prešla. Klientsky
 * `callback` v prehliadači nedokazuje nič — dá sa zavolať z konzoly. Platnosť
 * potvrdzuje výlučne Cloudflare pomocou secret kľúča, ktorý má k dispozícii
 * len server.
 *
 * Nasadenie: docroot/api/verify-turnstile.php
 * Secret žije NAD docrootom (../../app-config/turnstile.php → /matpex.sk/
 * app-config/turnstile.php), takže ho webserver nikdy neservíruje.
 *
 * Volanie:  POST /api/verify-turnstile.php   {"token":"…","action":"quiz_start"}
 * Odpoveď:  {"ok":true}  alebo  {"ok":false,"reason":"…"}
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const SITEVERIFY_URL     = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const MAX_TOKEN_LEN      = 2048;   // Cloudflare deklaruje strop dĺžky tokenu
const CONNECT_TIMEOUT    = 5;
const TOTAL_TIMEOUT      = 10;     // token žije 300 s — čakať dlhšie nemá zmysel

/** Hostname, na ktorých smie byť výzva vyriešená — bráni prenosu tokenu z cudzieho webu. */
const ALLOWED_HOSTNAMES  = ['matpex.sk', 'www.matpex.sk'];
/** Jeden token = jedna akcia. Token vyrobený pred kvízom nesmie otvoriť výsledky. */
const ALLOWED_ACTIONS    = ['quiz_start', 'view_result'];

function fail(string $reason, int $status = 403): never {
  http_response_code($status);
  echo json_encode(['ok' => false, 'reason' => $reason]);
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  fail('method_not_allowed', 405);
}

$raw = file_get_contents('php://input');
$body = json_decode(is_string($raw) ? $raw : '', true);
if (!is_array($body)) {
  fail('bad_request', 400);
}

$token  = isset($body['token'])  && is_string($body['token'])  ? $body['token']  : '';
$action = isset($body['action']) && is_string($body['action']) ? $body['action'] : '';

// Prázdny alebo neúmerne dlhý token sa na Cloudflare ani neposiela — je to
// zjavne neplatné a šetrí to jedno sieťové kolo.
if ($token === '' || strlen($token) > MAX_TOKEN_LEN) {
  fail('missing_token', 400);
}
if (!in_array($action, ALLOWED_ACTIONS, true)) {
  fail('unknown_action', 400);
}

$config = require __DIR__ . '/../../app-config/turnstile.php';
$secret = $config['secret'] ?? '';
if (!is_string($secret) || $secret === '' || $secret === 'DOPLN') {
  error_log('verify-turnstile.php: chýba secret v app-config/turnstile.php');
  fail('server_misconfigured', 500);
}

/**
 * idempotency_key sa generuje RAZ na token a použije sa pri oboch pokusoch.
 * Bez neho by opakovanie po sieťovej chybe narazilo na „token already spent"
 * a legitímny človek by dostal zamietnutie, hoci výzvu vyriešil správne.
 * Nové UUID pri každom pokuse by celú ochranu zrušilo.
 */
function uuid4(): string {
  $b = random_bytes(16);
  $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
  $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
}

$fields = [
  'secret'          => $secret,
  'response'        => $token,
  'idempotency_key' => uuid4(),
];

/** cURL nemusí byť na zdieľanom hostingu zapnutý — preto aj stream varianta. */
function post_siteverify(array $fields): ?string {
  $payload = http_build_query($fields);

  if (function_exists('curl_init')) {
    $ch = curl_init(SITEVERIFY_URL);
    curl_setopt_array($ch, [
      CURLOPT_POST           => true,
      CURLOPT_POSTFIELDS     => $payload,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CONNECTTIMEOUT => CONNECT_TIMEOUT,
      CURLOPT_TIMEOUT        => TOTAL_TIMEOUT,
      CURLOPT_SSL_VERIFYPEER => true,
      CURLOPT_SSL_VERIFYHOST => 2,
    ]);
    $out = curl_exec($ch);
    curl_close($ch);
    if (is_string($out) && $out !== '') return $out;
  }

  $ctx = stream_context_create(['http' => [
    'method'        => 'POST',
    'header'        => "Content-Type: application/x-www-form-urlencoded\r\n",
    'content'       => $payload,
    'timeout'       => TOTAL_TIMEOUT,
    'ignore_errors' => true,
  ]]);
  $out = @file_get_contents(SITEVERIFY_URL, false, $ctx);
  return is_string($out) && $out !== '' ? $out : null;
}

$raw = post_siteverify($fields);
if ($raw === null) {
  error_log('verify-turnstile.php: siteverify nedostupné');
  fail('verify_unavailable', 502);
}

$result = json_decode($raw, true);
if (!is_array($result)) {
  error_log('verify-turnstile.php: siteverify vrátilo neplatný JSON');
  fail('verify_unavailable', 502);
}

// Cloudflare vracia HTTP 200 aj pri neúspechu — rozhoduje výlučne pole success.
if (($result['success'] ?? false) !== true) {
  $codes = is_array($result['error-codes'] ?? null) ? implode(',', $result['error-codes']) : '?';
  error_log('verify-turnstile.php: neúspech (' . $codes . ')');
  fail('challenge_failed');
}

// Token vyriešený na cudzom webe sem nesmie prejsť.
$hostname = $result['hostname'] ?? '';
if (!in_array($hostname, ALLOWED_HOSTNAMES, true)) {
  error_log('verify-turnstile.php: cudzí hostname ' . $hostname);
  fail('hostname_mismatch');
}

// Akcia z tokenu sa musí zhodovať s tou, o ktorú klient žiada.
if (($result['action'] ?? '') !== $action) {
  error_log('verify-turnstile.php: nesúhlas akcie');
  fail('action_mismatch');
}

echo json_encode(['ok' => true]);
