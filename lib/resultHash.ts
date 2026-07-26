/**
 * Stable URL-safe hash for a result.
 *
 * The hash is the canonical id under /r/{hash}. It is used both for:
 * - looking up a peer snapshot in the public PEER_DATA table
 * - looking up the user's own private result in localStorage
 *
 * Formát: 16 znakov base62 (veľké aj malé písmená + číslice), zobrazovaných
 * v štyroch skupinách po 4 — napr. Rzd7 JM0B wV0U 6znB. Vyzerá to ako bežný
 * API token a je to 62^16 ≈ 95 bitov entropie, teda výrazne viac než
 * predchádzajúcich 12 hex znakov (48 bitov).
 *
 * Vedomý kompromis: rozlišovanie veľkosti písmen a znaky ako 0/O alebo l/1
 * znamenajú, že hash sa zle diktuje po telefóne. Je to zámerné — primárny
 * spôsob zdieľania je QR kód a tlačidlo Kopírovať, nie prepis z papiera.
 *
 * V URL a v localStorage kľúči sa hash používa vždy bez oddeľovačov;
 * skupiny sú čisto vec zobrazenia (viď formatHashGroups).
 */

/** Base62 — veľké aj malé písmená a číslice, ako pri bežnom API tokene. */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const HASH_LENGTH = 16;

/** Nový formát: 16 znakov base62. */
const HASH_RE = /^[A-Za-z0-9]{16}$/;

/**
 * Staršie 12-znakové hex hashe — odkazy vygenerované pred zmenou formátu
 * musia naďalej fungovať (žijú v localStorage a v už zdieľaných URL).
 */
const LEGACY_HASH_RE = /^[0-9a-f]{12}$/;

/**
 * Kryptograficky náhodný 16-znakový hash.
 *
 * 256 NIE JE násobkom 62, takže obyčajné `byte % 62` by nebolo rovnomerné —
 * hodnoty 0–7 (teda A–H) by padali o ~1,6 % častejšie než zvyšok abecedy.
 * Preto odmietame bajty od 248 vyššie (248 = 4 × 62) a ťaháme znova; tým je
 * rozdelenie presne rovnomerné a entropia je plných log2(62) bitov na znak.
 */
export function generateHash(): string {
  const chars: string[] = [];

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const MAX = 248; // najväčší násobok 62, ktorý sa zmestí do bajtu
    while (chars.length < HASH_LENGTH) {
      const batch = new Uint8Array(HASH_LENGTH);
      crypto.getRandomValues(batch);
      for (let i = 0; i < batch.length && chars.length < HASH_LENGTH; i++) {
        if (batch[i] < MAX) chars.push(ALPHABET[batch[i] % 62]);
      }
    }
    return chars.join('');
  }

  // Fallback pre prostredia bez WebCrypto (nekryptografický — viď dokumentácia).
  for (let i = 0; i < HASH_LENGTH; i++) {
    chars.push(ALPHABET[Math.floor(Math.random() * 62)]);
  }
  return chars.join('');
}

/** Validate hash format — nový 16-znakový aj starší 12-znakový hex. */
export function isValidHash(hash: string): boolean {
  return HASH_RE.test(hash) || LEGACY_HASH_RE.test(hash);
}

/**
 * Rozdelí hash na skupiny po 4 znakoch pre zobrazenie (4 × 4 políčka).
 * Staršie 12-znakové hashe vyjdú ako 3 skupiny — to je v poriadku, sú to
 * dobiehajúce odkazy, nie nový formát.
 */
export function formatHashGroups(hash: string): string[] {
  return hash.match(/.{1,4}/g) ?? [hash];
}

const STORAGE_PREFIX = 'digitalizuj.result.';
const INDEX_KEY = 'digitalizuj.results.index';

interface StoredResult {
  hash: string;
  createdAt: string;
  // Anything serializable. We store the same shape as PeerSnapshot
  // plus optional respondent (which may include sector/sizeBand the user
  // entered themselves).
  payload: unknown;
}

/** Persist the user's own result keyed by hash. Browser-only. */
export function saveResultToStorage(hash: string, payload: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    const entry: StoredResult = {
      hash,
      createdAt: new Date().toISOString(),
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
