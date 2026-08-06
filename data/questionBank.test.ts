import { describe, expect, test } from 'vitest';
import bank from './questionBank.json';
import { riskFactorDefinitions } from './scoringConfig';
import type { Question } from '@/types';

/**
 * Invarianty otázkovej banky, ktoré validátor v builde nekontroluje, lebo
 * vyžadujú znalosť histórie modelu — najmä to, že rozdelenie dvojhlavňových
 * otázok (6. 8. 2026) nezmenilo váhu kategórie. Rozdelenie malo respondentovi
 * umožniť odpovedať pravdivo, nie prevážiť kategóriu: ak by obe polovice
 * dostali pôvodnú váhu, téma by v priemere kategórie zosilnela dvojnásobne.
 */

interface Module { questions: Question[] }

const indicative = bank.indicative_quiz.questions as unknown as Question[];
const complex = (bank.complex_quiz.modules as unknown as Module[]).flatMap((m) => m.questions);
const all = [...indicative, ...complex];

const byId = (id: string): Question => {
  const q = all.find((x) => x.id === id);
  if (!q) throw new Error(`otázka ${id} v banke nie je`);
  return q;
};

/** Súčet váh pôvodných otázok pred rozdelením — zdroj: banka v1.5. */
const WEIGHTS_BEFORE: Record<string, number> = {
  ind_03: 1.5, ind_11: 1.3, cx_A04: 1, cx_B04: 1.2, cx_E06: 1, cx_D07: 0.6,
};

describe('rozdelenie dvojhlavňových otázok zachovalo váhu', () => {
  test.each([
    ['ind_03', 'ind_03b'],
    ['ind_11', 'ind_11b'],
    ['cx_A04', 'cx_A04b'],
    ['cx_B04', 'cx_B04b'],
    ['cx_E06', 'cx_E06b'],
    ['cx_D07', 'cx_D07b'],
  ])('%s + %s = pôvodná váha', (keptId, newId) => {
    const sum = byId(keptId).weight + byId(newId).weight;
    // Plávajúca desatinná aritmetika: 0.35 + 0.25 nie je presne 0.6.
    expect(sum).toBeCloseTo(WEIGHTS_BEFORE[keptId], 10);
  });

  test('obe polovice sýtia tú istú ORS kategóriu', () => {
    for (const [kept, added] of [['ind_03', 'ind_03b'], ['ind_11', 'ind_11b'],
      ['cx_A04', 'cx_A04b'], ['cx_B04', 'cx_B04b'], ['cx_E06', 'cx_E06b'], ['cx_D07', 'cx_D07b']]) {
      expect(byId(added).maps_to_score).toEqual(byId(kept).maps_to_score);
    }
  });
});

describe('ID, ktoré engine číta natvrdo, sa nesmú stratiť', () => {
  // roiEngine.ts pracuje s týmito ID priamo. Premenovanie by ROI ticho
  // rozbilo — bez chyby, len s tichým návratom na benchmarkové defaulty.
  test.each(['ind_02', 'ind_03', 'cx_02', 'cx_A01', 'cx_A05', 'cx_ROI02', 'cx_ROI03', 'ind_03c_manual'])(
    '%s je v banke',
    (id) => { expect(() => byId(id)).not.toThrow(); }
  );

  test('ind_03 má naďalej číselné hodnoty — roiEngine ich parsuje cez parseInt', () => {
    for (const o of byId('ind_03').options ?? []) {
      expect(Number.isNaN(parseInt(o.value, 10))).toBe(false);
    }
  });

  test('ind_03c_manual používa tie isté hodnoty ako cx_A05 — benchmarky procesov ich hľadajú podľa nich', () => {
    const values = (q: Question) => (q.options ?? []).map((o) => o.value).sort();
    expect(values(byId('ind_03c_manual'))).toEqual(values(byId('cx_A05')));
  });
});

describe('nové otázky', () => {
  test('rola respondenta je len v komplexnom kvíze a do skóre nevstupuje', () => {
    expect(indicative.some((q) => q.id === 'cx_04_role')).toBe(false);
    const role = byId('cx_04_role');
    expect(role.weight).toBe(0);
    expect(role.maps_to_score).toEqual([]);
  });

  test('bezpečnostné povedomie zámerne neflaguje riziko — taký faktor neexistuje', () => {
    // Zaviesť nový RF by prepočítalo menovateľ TDRI, teda zmenilo rizikové
    // skóre všetkým doterajším výsledkom. Test stráži, aby sa faktor
    // nepridal potichu bez rozhodnutia o tom prepočte.
    expect(byId('cx_E10_awareness').branching_rules).toEqual([]);
  });

  test('každý flag_risk cieľ je definovaný rizikový faktor', () => {
    const known = new Set(riskFactorDefinitions.map((r) => r.id));
    for (const q of all) {
      for (const rule of q.branching_rules ?? []) {
        if (rule.action !== 'flag_risk') continue;
        for (const target of ([] as string[]).concat(rule.target)) {
          expect(known.has(target), `${q.id} → ${target}`).toBe(true);
        }
      }
    }
  });
});

describe('škála 0–10 je vyhradená pre subjektívny úsudok', () => {
  // Zvyšok banky stojí na behaviorálne ukotvených možnostiach — tie dajú dvom
  // firmám s rovnakou praxou rovnakú odpoveď. Holé číslo taký referenčný bod
  // nemá, takže na merateľný stav je HORŠIE než ukotvená možnosť. Validátor to
  // stráži pri builde, tento test aj v CI bez validátora.
  const likert = all.filter((q) => q.question_type === 'likert_11');

  test('existuje aspoň jedna a všetky sú self_assessment', () => {
    expect(likert.length).toBeGreaterThan(0);
    for (const q of likert) expect(q.evidence_type).toBe('self_assessment');
  });

  test('má presne 11 stupňov s lineárnym bodovaním 0…100', () => {
    for (const q of likert) {
      const scores = (q.options ?? []).map((o) => o.score);
      expect(scores).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    }
  });

  test('nikdy nesýti DII — premenné Eurostatu sú binárne fakty', () => {
    for (const q of likert) expect(q.maps_to_score).not.toContain('dii');
  });

  test('zámer investovať je mimo ORS — skóre hovorí o stave, nie o ochote', () => {
    for (const id of ['ind_16_intent', 'cx_F07_intent']) {
      const q = byId(id);
      expect(q.weight).toBe(0);
      expect(q.maps_to_score).toEqual([]);
      expect(q.maps_to_roi_model).toContain('investment_intent');
    }
  });
});

describe('dĺžka kvízov', () => {
  // Indikatívny kvíz je vstup do lievika — jeho dĺžka rozhoduje o tom,
  // koľko ľudí diagnostiku vôbec dokončí. Strop je vedomé rozhodnutie,
  // nie technický limit.
  test('indikatívny kvíz nepresiahne 20 otázok', () => {
    expect(indicative.length).toBeLessThanOrEqual(20);
    expect(bank.indicative_quiz.max_questions).toBe(indicative.length);
  });
});
