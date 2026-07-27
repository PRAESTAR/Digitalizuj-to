import type { MetadataRoute } from 'next';

const siteUrl = 'https://digitalizuj.to';

/**
 * Jediné Disallow je /api/ — všetko ostatné rieši meta `noindex`.
 *
 * SEO audit odhalil, že pôvodné pravidlá '/results' a '/r/' boli po i18n
 * migrácii MŔTVE: skutočné adresy žijú pod jazykovým prefixom
 * (/sk/results, /sk/r/...), takže bezprefixové pravidlá nikdy nič
 * nematchli a ~200 /r/[hash] stránok bolo crawlovateľných v rozpore
 * s deklarovaným zámerom súboru.
 *
 * Namiesto opravy na wildcard ('/*&#47;r/') je zámerná politika
 * crawlable + noindex: crawler zablokovanú stránku nestiahne, takže jej
 * meta `noindex` nikdy neuvidí — a URL sa môže zaindexovať „naslepo"
 * (len z odkazov). Povolený crawl + noindex je spoľahlivý spôsob, ako
 * stránky držať mimo indexu; /quiz, /results aj /r/[hash] ho nesú
 * a v sitemape nie sú.
 */
const DISALLOW = ['/api/'];

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
    // `host` zámerne chýba: je to zaniknutá Yandex direktíva, ktorú ostatné
    // vyhľadávače ignorujú; kanonický host deklarujú canonical/hreflang tagy.
  };
}
