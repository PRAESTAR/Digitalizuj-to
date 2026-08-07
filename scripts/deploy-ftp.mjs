/**
 * Nasadenie statického exportu na produkciu (matpex.sk) cez FTPS.
 *
 * Do 6. 8. 2026 tento skript existoval len v dočasnom adresári — jediná kópia,
 * ktorá by so zmazaním priečinka zmizla, a nikto ju nevidel v code review.
 *
 * TLS: overuje sa naplno. Predchádzajúca verzia mala `rejectUnauthorized:
 * false` s poznámkou, že „cert hosting nepokrýva". Certifikát je pritom
 * platný Let's Encrypt pre `*.r6.websupport.sk` — nesedelo len meno, lebo sa
 * skript pripájal na alias `ftp.magors.net`. Pripojenie na
 * `ftp.r6.websupport.sk` (tá istá IP) prejde plnou verifikáciou bez jedinej
 * výnimky. Vypnutá kontrola teda nikdy nebola potrebná; len otvárala
 * nahrávanie celej produkcie vrátane `.htaccess` a PHP endpointov útoku
 * uprostred spojenia.
 *
 * NIČ NEMAŽE. V `/matpex.sk/web` beží živá produkcia — súbory sa len
 * prepisujú. Odstraňovanie nepatrí do nasadzovacieho skriptu.
 *
 * Spustenie:
 *   FTP_PASS='…' npm run deploy            (preskočí súbory rovnakej veľkosti)
 *   FTP_PASS='…' FORCE_ALL=1 npm run deploy
 *
 * FORCE_ALL=1 je prakticky POVINNÉ: porovnáva sa VEĽKOSŤ, nie obsah, takže
 * zmena, ktorá dĺžku súboru nezmenila (napr. iný hash v rovnako dlhom
 * reťazci), by sa ticho preskočila.
 */
import { readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Writable } from 'node:stream';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, 'package.json'));
const { Client } = require('basic-ftp');

/**
 * Meno, ktoré SEDÍ S CERTIFIKÁTOM (`*.r6.websupport.sk`). Alias
 * `ftp.magors.net` ukazuje na tú istú IP, ale v certifikáte nie je — použiť
 * ho znamená buď zlyhanie, alebo vypnutú kontrolu.
 */
const HOST = process.env.FTP_HOST || 'ftp.r6.websupport.sk';
const USER = process.env.FTP_USER || 'code.matpex.sk';
const PASS = process.env.FTP_PASS;
const REMOTE = process.env.FTP_REMOTE || '/matpex.sk/web';
const LOCAL = path.join(ROOT, 'out');

const WORKERS = 3;
const DEADLINE_MS = 15 * 60 * 1000;
const t0 = Date.now();

if (!PASS) {
  console.error('FTP_PASS nie je nastavené — heslo sa zámerne nedrží v repozitári.');
  process.exit(1);
}

const ACCESS = {
  host: HOST,
  user: USER,
  password: PASS,
  secure: true,
  // Explicitne, hoci je to default: je to bezpečnostne nosné nastavenie
  // a nesmie sa stratiť pri budúcej úprave.
  secureOptions: { rejectUnauthorized: true },
};

const isNetErr = (e) => /ECONN|EPIPE|ETIMEDOUT|closed|timeout|disconnect/i.test(String(e && e.message));

async function connect() {
  const c = new Client(30000);
  c.ftp.verbose = false;
  await c.access(ACCESS);
  return c;
}

const files = [];
(function walk(dir, rel) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) walk(path.join(dir, e.name), r);
    else files.push({ rel: r, size: statSync(path.join(dir, e.name)).size });
  }
})(LOCAL, '');

if (files.length === 0) {
  console.error('out/ je prázdny — najprv `STATIC_EXPORT=1 npm run build`.');
  process.exit(1);
}

const dirs = [...new Set(
  files.map((f) => f.rel).filter((r) => r.includes('/')).map((r) => r.slice(0, r.lastIndexOf('/')))
)].sort();
console.log(`Cieľ: ${HOST}${REMOTE} · súborov ${files.length}, adresárov ${dirs.length}`);
console.log(`TLS: plná verifikácia${process.env.FORCE_ALL ? ' · FORCE_ALL' : ' · POZOR: bez FORCE_ALL sa porovnáva veľkosť, nie obsah'}`);

{
  let c = await connect();
  let ops = 0;
  const dirFails = [];
  for (let i = 0; i < dirs.length;) {
    if (Date.now() - t0 > DEADLINE_MS) { console.log(`DEADLINE pri adresároch (index ${i})`); process.exit(3); }
    const d = REMOTE + '/' + dirs[i];
    try {
      // Spojenie sa po ~150 operáciách obnovuje — server ho inak sám zhodí.
      if (++ops % 150 === 0) { c.close(); c = await connect(); }
      await c.ensureDir(d);
      await c.cd('/');
      i++;
    } catch (e) {
      if (isNetErr(e)) {
        try { c.close(); } catch { /* spojenie je aj tak mŕtve */ }
        await new Promise((r) => setTimeout(r, 1000));
        c = await connect();
      } else {
        // ensureDir zlyhá aj vtedy, keď adresár už existuje — overí sa `cd`.
        try { await c.cd(d); await c.cd('/'); }
        catch { dirFails.push(`${dirs[i]} :: ${String(e.message).slice(0, 70)}`); }
        i++;
      }
    }
  }
  c.close();
  if (dirFails.length) {
    console.log(`ADRESÁRE ZLYHALI (${dirFails.length}):`);
    dirFails.slice(0, 10).forEach((x) => console.log('  ' + x));
    if (dirFails.length > files.length / 10) process.exit(4);
  } else {
    console.log('Všetky adresáre OK');
  }
}

let idx = 0, uploaded = 0, skipped = 0, netReconnects = 0;
const failed = [];

async function worker() {
  let c = await connect();
  let ops = 0;
  for (;;) {
    if (Date.now() - t0 > DEADLINE_MS) break;
    const i = idx++;
    if (i >= files.length) break;
    const f = files[i];
    const rp = REMOTE + '/' + f.rel;
    for (;;) {
      try {
        if (++ops % 150 === 0) { c.close(); c = await connect(); }
        const sz = process.env.FORCE_ALL
          ? -1
          : await c.size(rp).catch((e) => { if (isNetErr(e)) throw e; return -1; });
        if (sz === f.size) { skipped++; break; }
        await c.uploadFrom(path.join(LOCAL, f.rel), rp);
        uploaded++;
        if ((uploaded + skipped) % 250 === 0) {
          console.log(`  ${uploaded + skipped}/${files.length} (up ${uploaded}, skip ${skipped}, ${Math.round((Date.now() - t0) / 1000)}s)`);
        }
        break;
      } catch (e) {
        if (isNetErr(e)) {
          netReconnects++;
          try { c.close(); } catch { /* spojenie je aj tak mŕtve */ }
          await new Promise((r) => setTimeout(r, 800));
          try { c = await connect(); } catch { await new Promise((r) => setTimeout(r, 2000)); }
        } else {
          failed.push(`${f.rel} :: ${String(e.message).slice(0, 70)}`);
          break;
        }
      }
    }
  }
  try { c.close(); } catch { /* spojenie je aj tak mŕtve */ }
}

await Promise.all(Array.from({ length: WORKERS }, () => worker()));

const done = uploaded + skipped;
console.log(`KONIEC za ${Math.round((Date.now() - t0) / 1000)}s: up ${uploaded}, skip ${skipped}, fail ${failed.length}, reconnectov ${netReconnects}, spracované ${done}/${files.length}`);
if (failed.length) {
  console.log('ZLYHANÉ (prvých 15):');
  failed.slice(0, 15).forEach((x) => console.log('  ' + x));
}
if (done < files.length || failed.length) process.exit(3);

// Overenie po nasadení: stiahnuť späť a pozrieť, čo tam naozaj je.
{
  const c = await connect();
  const dl = async (p) => {
    const chunks = [];
    await c.downloadTo(new Writable({ write(x, e, cb) { chunks.push(x); cb(); } }), p);
    return Buffer.concat(chunks);
  };
  const html = (await dl(REMOTE + '/sk.html')).toString('utf8');
  const title = (html.match(/<title>([^<]*)<\/title>/) || [, '?'])[1];
  const commit = (html.match(/commit\/([0-9a-f]{7})/) || [, '?'])[1];
  const htaccess = (await dl(REMOTE + '/.htaccess')).toString('utf8');
  c.close();

  console.log(`sk.html: ${html.length} B · title: ${title} · build ${commit}`);
  console.log(`.htaccess: ${htaccess.length} B · staging noindex: ${/noindex/i.test(htaccess) ? 'ÁNO — POZOR, toto je produkcia!' : 'NIE (správne)'}`);
  if (/noindex/i.test(htaccess)) process.exit(5);
}

console.log('DEPLOY KOMPLETNÝ');
