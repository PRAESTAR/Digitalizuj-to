import type { MetadataRoute } from 'next';

const siteUrl = 'https://digitalizuj.to';

/**
 * Cesty, ktoré nemá zmysel prehľadávať:
 *  - /api/    — žiadny indexovateľný obsah
 *  - /results — stavová stránka; bez dokončeného kvízu nemá obsah
 *  - /r/      — menný priestor zdieľaných výsledkov (hash odkazy)
 *
 * ZMENA oproti pôvodnému stavu — /quiz a /peers už NIE SÚ zakázané:
 *
 *  - /peers je jediná stránka s vlastnými dátami (benchmark tabuľka bez
 *    akýchkoľvek osobných údajov). Kým bola v Disallow, nemohla ju
 *    zaindexovať ani odcitovať žiadna AI vyhľadávacia plocha. Od tejto
 *    zmeny je crawlovateľná aj indexovateľná.
 *
 *  - /quiz je crawlovateľný, ale zostáva `noindex` (viď
 *    app/(assessment)/quiz/layout.tsx — bez rozbehnutého hodnotenia
 *    renderuje len prázdny stav, čo by bola thin page). Disallow bol tu
 *    dokonca kontraproduktívny: crawler zablokovanú stránku nestiahne,
 *    takže `noindex` nikdy neuvidí a URL sa môže zaindexovať „naslepo".
 *    Povolený crawl + noindex je korektná kombinácia. Vstupnou stránkou
 *    nástroja pre vyhľadávače je `/`, ktorá kvíz aj spúšťa.
 *
 * Vedomý kompromis pri /results a /r/: keďže sú blokované v robots.txt,
 * ich meta `noindex` sa k crawlerom nedostane. Je to zámerné — celý menný
 * priestor zdieľaných výsledkov má zostať mimo prehľadávania.
 */
const DISALLOW = ['/api/', '/results', '/r/'];

/**
 * Crawleri a agenti AI vyhľadávačov, ktorým dávame explicitné povolenie.
 *
 * Prečo explicitne, keď `*` už povoľuje všetko: samostatná skupina je
 * jednoznačný, strojovo čitateľný súhlas. Viacero prevádzkovateľov mení
 * default správanie a nechceme, aby o viditeľnosti v AI odpovediach
 * rozhodovala implicitná interpretácia. Zoznam je zároveň dokumentácia
 * toho, koho reálne chceme pustiť.
 *
 * Dôležité rozlíšenie (rozhoduje o citáciách, nie o tréningu):
 *  - OAI-SearchBot / ChatGPT-User → index a on-demand načítanie pre
 *    ChatGPT Search. Blokovanie TÝCHTO znamená vypadnutie z ChatGPT Search.
 *  - GPTBot → tréningový crawler OpenAI; na citácie nemá vplyv.
 *  - ClaudeBot / Claude-SearchBot / Claude-User → Anthropic.
 *  - PerplexityBot / Perplexity-User → index a on-demand fetch Perplexity.
 *  - Google-Extended a Applebot-Extended nie sú crawleri, ale kontrolné
 *    tokeny; ich povolenie dovoľuje použiť obsah v Gemini / Apple
 *    Intelligence odpovediach bez vplyvu na klasické vyhľadávanie.
 *  - CCBot (Common Crawl), meta-externalagent, Amazonbot → ďalšie zdroje,
 *    z ktorých AI systémy čerpajú.
 *
 * Pozor na sémantiku robots.txt: agent s vlastnou skupinou úplne ignoruje
 * skupinu `*`. Preto tu musí byť rovnaký DISALLOW zoznam.
 */
const AI_CRAWLERS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'GPTBot',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'meta-externalagent',
  'Amazonbot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOW,
      },
      {
        userAgent: AI_CRAWLERS,
        allow: '/',
        disallow: DISALLOW,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
