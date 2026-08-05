import { describe, expect, test } from 'vitest';
import { generateResultId, uuidV7, isValidHash, formatHashGroups } from './resultHash';

describe('uuidV7', () => {
  test('má tvar UUID s verziou 7 a variantom RFC 4122', () => {
    const uuid = uuidV7();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  test('prvých 48 bitov nesie aktuálny čas v ms', () => {
    const before = Date.now();
    const ms = parseInt(uuidV7().replace(/-/g, '').slice(0, 12), 16);
    const after = Date.now();
    expect(ms).toBeGreaterThanOrEqual(before);
    expect(ms).toBeLessThanOrEqual(after);
  });

  test('je chronologicky zoraditeľný — to je celý dôvod jeho existencie', async () => {
    const first = uuidV7();
    await new Promise((r) => setTimeout(r, 3));
    const second = uuidV7();
    // Porovnanie reťazcov stačí: hex timestamp je v prvých znakoch a je
    // zľava doplnený, takže lexikografické poradie = chronologické.
    expect(second > first).toBe(true);
  });
});

describe('generateResultId', () => {
  test('hash má 64 hex znakov (SHA-256)', async () => {
    const { hash } = await generateResultId();
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  test('vracia aj UUIDv7, z ktorého hash vznikol', async () => {
    const { uuid } = await generateResultId();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-/);
  });

  test('dva po sebe idúce identifikátory sa líšia', async () => {
    const a = await generateResultId();
    const b = await generateResultId();
    expect(a.hash).not.toBe(b.hash);
    expect(a.uuid).not.toBe(b.uuid);
  });

  test('hash NIE JE odvoditeľný z času — SHA-256 časovú zložku ničí', async () => {
    // Poistka proti návratu k „zoraditeľnému" hashu v URL: keby sa hash
    // prestal hashovať, začínal by časovou pečiatkou a susedné by mali
    // rovnaký prefix.
    const a = await generateResultId();
    const b = await generateResultId();
    expect(a.hash.slice(0, 8)).not.toBe(b.hash.slice(0, 8));
  });
});

describe('isValidHash', () => {
  test('prijme nový 64-znakový formát', () => {
    expect(isValidHash('7b2a9f14e3d04b8fa6c5e21890bd3f1672c84a51eb094c73d9e261f8405a3b2e')).toBe(true);
  });

  test('prijme staršie formáty — zdieľané odkazy musia žiť ďalej', () => {
    expect(isValidHash('9TYsoQ7rxsjHpTpf')).toBe(true); // 16 base62
    expect(isValidHash('NWSnp98v6xWq66oK')).toBe(true); // ukážkový profil
    expect(isValidHash('a1b2c3d4e5f6')).toBe(true); // 12 hex
  });

  test('odmietne nezmysly a sentinel generickej stránky', () => {
    expect(isValidHash('view')).toBe(false);
    expect(isValidHash('')).toBe(false);
    expect(isValidHash('../../etc/passwd')).toBe(false);
    expect(isValidHash('7b2a9f14e3d04b8fa6c5e21890bd3f16')).toBe(false); // 32 hex
  });
});

describe('formatHashGroups', () => {
  test('64-znakový hash delí po 8 (osem skupín)', () => {
    const groups = formatHashGroups('7b2a9f14e3d04b8fa6c5e21890bd3f1672c84a51eb094c73d9e261f8405a3b2e');
    expect(groups).toHaveLength(8);
    expect(groups[0]).toBe('7b2a9f14');
    expect(groups.join('')).toHaveLength(64);
  });

  test('kratšie staršie hashe zostávajú po 4', () => {
    expect(formatHashGroups('9TYsoQ7rxsjHpTpf')).toEqual(['9TYs', 'oQ7r', 'xsjH', 'pTpf']);
  });
});
