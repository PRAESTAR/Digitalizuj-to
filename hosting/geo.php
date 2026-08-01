<?php
/**
 * Krajina návštevníka pre ponuku jazyka — same-origin endpoint.
 *
 * Zdroj: CF-IPCountry hlavička (pred hostingom sedí Cloudflare a určuje
 * krajinu SKUTOČNÉHO návštevníka). Websupportové GEOIP_COUNTRY_CODE /
 * WS_GEO_COUNTRY geolokujú len IP Cloudflare edge-u (overené sondou:
 * návšteva zo SK mala CF=SK, ale WS GeoIP=CZ podľa pražského edge-u),
 * preto sú až fallback pre prípad, že by CF z cesty zmizol.
 *
 * Nič sa neukladá ani neposiela tretím stranám — endpoint len prečíta
 * hlavičku požiadavky a vráti dvojpísmenový kód. Same-origin, takže
 * neprelamuje CSP connect-src 'self'.
 *
 * Nasadenie: docroot/geo.php (mimo Next buildu — nahráva sa samostatne,
 * FORCE_ALL deploy ho neprepíše, lebo nie je v out/).
 */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
// Krajina sa pre používateľa nemení — krátka privátna cache šetrí požiadavky
// pri navigácii, ale nezalepí zmenu siete nadlho.
header('Cache-Control: private, max-age=3600');

$country = $_SERVER['HTTP_CF_IPCOUNTRY']
  ?? $_SERVER['HTTP_WS_GEO_COUNTRY']
  ?? $_SERVER['GEOIP_COUNTRY_CODE']
  ?? null;

$country = is_string($country) && preg_match('/^[A-Z]{2}$/', strtoupper($country))
  ? strtoupper($country)
  : null;

echo json_encode(['country' => $country]);
