/**
 * Stable URL-safe identifier for a result.
 *
 * Identifikátor je kanonické id pod /r/{hash}. Používa sa na:
 * - vyhľadanie peer snapshotu v public tabuľke PEER_DATA
 * - vyhľadanie vlastného výsledku používateľa v localStorage
 *
 * Formát: **64 hex znakov = SHA-256 z UUIDv7 + 32 náhodných bajtov.**
 *
 * Prečo dva kroky:
 * - **UUIDv7** nesie v prvých 48 bitoch čas vzniku, takže záznamy sa dajú
 *   v databáze chronologicky radiť bez ďalšieho stĺpca. Ukladá sa preto
 *   vedľa hashu (viď StoredResult.uuid) a bude z neho zoraďovací kľúč, keď
 *   výsledky začnú žiť na serveri.
 * - **SHA-256 s náhodnou soľou** je až to, čo ide do URL. Výstup je
 *   rovnomerne náhodných 256 bitov, takže z verejného odkazu sa nedá
 *   odvodiť čas vzniku ani poradie a odkaz sa nedá uhádnuť.
 *
 * POZOR na rozšírený omyl: samotný hash NIE JE chronologicky zoraditeľný —
 * SHA-256 časovú informáciu zámerne ničí. Zoraďovanie umožňuje uložený
 * UUIDv7, nie reťazec v URL. Mať oboje naraz v jednom čísle nejde.
 *
 * V URL a v localStorage kľúči sa používa vždy bez oddeľovačov; skupiny sú
 * čisto vec zobrazenia (viď formatHashGroups).
 */

/** Nový formát: 64 hex znakov (SHA-256). */
const HASH_RE = /^[0-9a-f]{64}$/;

/**
 * Staršie formáty — odkazy vygenerované pred zmenou musia naďalej fungovať
 * (žijú v localStorage, v už zdieľaných URL a v 50 ukážkových profiloch
 * PEER_DATA, ktoré sú stále na 16-znakovom base62).
 */
const LEGACY_BASE62_RE = /^[A-Za-z0-9]{16}$/;
const LEGACY_HEX_RE = /^[0-9a-f]{12}$/;

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

/**
 * UUID verzie 7 (RFC 9562): 48 bitov unixového času v ms, 4 bity verzie,
 * 2 bity variantu, zvyšok náhoda. Prehliadače ho zatiaľ natívne negenerujú
 * (`crypto.randomUUID` vyrába v4 bez časovej zložky), preto vlastná
 * implementácia.
 */
export function uuidV7(): string {
  const bytes = new Uint8Array(16);
  randomBytes(bytes);

  const ms = Date.now();
  // 48-bitový timestamp do prvých 6 bajtov (big-endian). Math.floor(ms / 2**32)
  // namiesto bitového posunu: >>> pracuje s 32 bitmi a horné bity by odrezal.
  bytes[0] = Math.floor(ms / 2 ** 40) & 0xff;
  bytes[1] = Math.floor(ms / 2 ** 32) & 0xff;
  bytes[2] = (ms >>> 24) & 0xff;
  bytes[3] = (ms >>> 16) & 0xff;
  bytes[4] = (ms >>> 8) & 0xff;
  bytes[5] = ms & 0xff;

  bytes[6] = (bytes[6] & 0x0f) | 0x70; // verzia 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC 4122

  const h = toHex(bytes);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function randomBytes(target: Uint8Array): void {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(target);
    return;
  }
  // Fallback pre prostredia bez WebCrypto (nekryptografický — viď dokumentácia).
  for (let i = 0; i < target.length; i++) target[i] = Math.floor(Math.random() * 256);
}

export interface ResultId {
  /** 64 hex znakov — to, čo ide do URL a QR kódu. */
  hash: string;
  /** UUIDv7, z ktorého hash vznikol — zoraďovací kľúč pre budúcu DB. */
  uuid: string;
}

/**
 * Vyrobí nový identifikátor výsledku. Asynchrónne, lebo `crypto.subtle`
 * inak než cez Promise nepočíta.
 */
export async function generateResultId(): Promise<ResultId> {
  const uuid = uuidV7();

  const salt = new Uint8Array(32);
  randomBytes(salt);

  const uuidBytes = new TextEncoder().encode(uuid);
  const input = new Uint8Array(uuidBytes.length + salt.length);
  input.set(uuidBytes, 0);
  input.set(salt, uuidBytes.length);

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', input);
    return { hash: toHex(new Uint8Array(digest)), uuid };
  }

  // Bez SubtleCrypto (napr. stránka doručená cez http) sa hashovať nedá.
  // Soľ samotná má 256 bitov entropie, takže tvar aj nepredvídateľnosť
  // odkazu zostávajú rovnaké — chýba len samotné hashovanie.
  return { hash: toHex(salt), uuid };
}

/** Validate hash format — nový 64-znakový aj oba staršie tvary. */
export function isValidHash(hash: string): boolean {
  return HASH_RE.test(hash) || LEGACY_BASE62_RE.test(hash) || LEGACY_HEX_RE.test(hash);
}

/**
 * Rozdelí hash na skupiny pre zobrazenie. 64-znakový hash po 8 (osem skupín,
 * ktoré sa rozumne zalomia), staršie kratšie tvary po 4 ako doteraz.
 */
export function formatHashGroups(hash: string): string[] {
  const size = hash.length > 32 ? 8 : 4;
  return hash.match(new RegExp(`.{1,${size}}`, 'g')) ?? [hash];
}

const STORAGE_PREFIX = 'digitalizuj.result.';
const INDEX_KEY = 'digitalizuj.results.index';

interface StoredResult {
  hash: string;
  createdAt: string;
  /** UUIDv7, z ktorého hash vznikol — chronologický kľúč pre budúcu DB. */
  uuid?: string;
  // Anything serializable. We store the same shape as PeerSnapshot
  // plus optional respondent (which may include sector/sizeBand the user
  // entered themselves).
  payload: unknown;
}

/** Persist the user's own result keyed by hash. Browser-only. */
export function saveResultToStorage(hash: string, payload: unknown, uuid?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const entry: StoredResult = {
      hash,
      createdAt: new Date().toISOString(),
      uuid,
      payload,
    };
    localStorage.setItem(STORAGE_PREFIX + hash, JSON.stringify(entry));

    const index: string[] = JSON.parse(localStorage.getItem(INDEX_KEY) ?? '[]');
    if (!index.includes(hash)) {
      index.push(hash);
      localStorage.setItem(INDEX_KEY, JSON.stringify(index));
    }
  } catch {
    // Quota exceeded or storage disabled — silently ignore.
  }
}

export function loadResultFromStorage(hash: string): StoredResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + hash);
    return raw ? (JSON.parse(raw) as StoredResult) : null;
  } catch {
    return null;
  }
}
