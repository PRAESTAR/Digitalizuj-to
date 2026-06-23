/**
 * Stable URL-safe hash for a result.
 *
 * The hash is the canonical id under /r/{hash}. It is used both for:
 * - looking up a peer snapshot in the public PEER_DATA table
 * - looking up the user's own private result in localStorage
 *
 * Hashes are 12 hex chars (~48 bits of entropy) — small enough to read
 * aloud, large enough that brute-forcing through unrelated results is
 * not feasible at this dataset size.
 */

const HEX = '0123456789abcdef';

/** Cryptographically random 12-char hex hash. */
export function generateHash(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(6); // 6 bytes = 12 hex chars
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback for environments without WebCrypto.
  let out = '';
  for (let i = 0; i < 12; i++) out += HEX[Math.floor(Math.random() * 16)];
  return out;
}

/** Validate hash format — 12 hex characters. */
export function isValidHash(hash: string): boolean {
  return /^[0-9a-f]{12}$/.test(hash);
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
