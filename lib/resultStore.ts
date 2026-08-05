import type { PeerSnapshot, ResultSnapshot, Respondent, Answer, AssessmentType } from '@/types';

/**
 * Serverové úložisko výsledkov.
 *
 * Do 5. 8. 2026 výsledok nikam neodchádzal — žil len v `localStorage`, takže
 * permanentný odkaz aj QR kód fungovali výlučne na tom istom zariadení.
 * Odteraz sa plné znenie ukladá do MariaDB cez PHP endpointy (hosting/api),
 * čím sa dá výsledok zobraziť aj neskôr a inde.
 *
 * localStorage zostáva ako prvá vrstva: je okamžitý a funguje aj vtedy, keď
 * zápis na server zlyhá. Server je druhá vrstva a jediná, ktorá prežije
 * vymazanie prehliadača alebo prechod na iné zariadenie.
 */

const SAVE_ENDPOINT = '/api/result-save.php';
const LOAD_ENDPOINT = '/api/result.php';

interface SaveInput {
  hash: string;
  uuid: string;
  result: ResultSnapshot;
  respondent: Respondent;
  answers: Answer[];
  quizType: AssessmentType;
  locale: string;
  completedAt?: string;
}

/**
 * Odošle výsledok na server. Chyby sa zámerne prehĺtajú a len logujú:
 * zlyhaný zápis nesmie používateľovi rozbiť zobrazenie výsledku, ktorý už
 * má vypočítaný a uložený lokálne. Vracia true, keď server zápis potvrdil.
 */
export async function saveResultToServer(input: SaveInput): Promise<boolean> {
  try {
    const res = await fetch(SAVE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hash: input.hash,
        uuid: input.uuid,
        quizType: input.quizType,
        locale: input.locale,
        completedAt: input.completedAt,
        sector: input.respondent.sector || 'other',
        sizeBand: input.respondent.employeeCountBand || 'small',
        country: 'SK',
        modelVersion: input.result.modelVersion?.scoringConfigVersion,
        // Denormalizované skóre pre výpisy v administrácii — server ich
        // neprepočítava, berie ich odtiaľto.
        scores: {
          diiScore100: input.result.dii.score100,
          diiScore12: input.result.dii.score12,
          diiMeasured: input.result.dii.measuredIndicators,
          orsScore: input.result.ors.scorePenalized ?? input.result.ors.score,
          tdriScore: input.result.tdri.score,
          aiScore: input.result.aiReadiness.score,
          businessImpactEur: input.result.businessImpact.financialImpact.eurPerYear.mid,
        },
        result: input.result,
        answers: input.answers,
        respondent: input.respondent,
      }),
      // Zápis nemá nič spoločné s prihlásením — nech neposiela cookies.
      credentials: 'omit',
      keepalive: true,
    });
    if (!res.ok) return false;
    const data: unknown = await res.json();
    return typeof data === 'object' && data !== null && (data as { ok?: boolean }).ok === true;
  } catch {
    // Offline, blokovaný request, chýbajúci endpoint v dev režime — výsledok
    // je aj tak v localStorage, takže používateľ o nič nepríde.
    return false;
  }
}

/**
 * Načíta uložený výsledok podľa hashu. Vracia anonymizovaný snapshot (to isté,
 * čo stránka /r/{hash} zobrazovala doteraz) alebo null, keď taký výsledok
 * neexistuje. Odpovede po otázkach server touto cestou nevydáva.
 */
export async function loadResultFromServer(hash: string): Promise<PeerSnapshot | null> {
  try {
    const res = await fetch(`${LOAD_ENDPOINT}?hash=${encodeURIComponent(hash)}`, {
      credentials: 'omit',
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (typeof data !== 'object' || data === null) return null;
    const snapshot = (data as { snapshot?: unknown }).snapshot;
    if (typeof snapshot !== 'object' || snapshot === null) return null;

    const s = snapshot as PeerSnapshot & { orsCategories: PeerSnapshot['orsCategories'] | null };
    // Kategórie môžu chýbať (starší záznam) — typ ich vyžaduje, tak doplníme
    // šesticu nemeraných namiesto toho, aby komponenty padli na undefined.
    return {
      ...s,
      orsCategories: s.orsCategories ?? {
        procesy: null, systemy: null, data: null,
        infra: null, security: null, governance: null,
      },
    };
  } catch {
    return null;
  }
}
