import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import QuizSelector from '@/components/quiz/QuizSelector';
import HeroResultCard from '@/components/ui/HeroResultCard';
import PointerAurora from '@/components/ui/PointerAurora';
import { SITE_URL, LOCALE_META, type Locale } from '@/lib/seo';

/** Počet FAQ položiek — musí sedieť s kľúčmi faq.q1..qN v messages/*.json. */
const FAQ_COUNT = 7;

/**
 * FAQ schéma sa stavia z TÝCH ISTÝCH prekladových kľúčov ako viditeľná FAQ
 * sekcia nižšie. To je podmienka Google: obsah FAQPage markup-u musí byť na
 * stránke reálne viditeľný (pôvodne tu bol len skrytý JSON-LD — riziko
 * manuálnej penalizácie a nula rankovateľného textu). Zhoda je garantovaná
 * konštrukciou, nie disciplínou.
 */
function buildFaqSchema(
  locale: Locale,
  t: (key: string) => string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SITE_URL}/${locale}#faq`,
    inLanguage: LOCALE_META[locale].htmlLang,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    mainEntity: Array.from({ length: FAQ_COUNT }, (_, i) => ({
      '@type': 'Question',
      name: t(`faq.q${i + 1}`),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t(`faq.a${i + 1}`),
      },
    })),
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const faqSchema = buildFaqSchema(locale as Locale, t);

  return (
    /* `isolate` robí z obalu stacking context, inak by vrstvy so záporným
       z-indexom spadli až za jeho vlastné pozadie a neboli by vidieť. */
    <div className="relative isolate page-wash">
      {/* Aurora bloby — dekorácia hornej časti. Sedia na úrovni celej stránky,
          nie v hero sekcii: keď boli vnútri hero a maskované na jeho výšku,
          farba končila presne na hranici sekcie a spolu s krokom pozadia to
          stránku opticky rozpolilo. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 overflow-hidden pointer-events-none page-aurora-fade"
      >
        <div className="aurora-blob aurora-blob-a w-[40rem] h-[40rem] bg-[#0a84ff]/[0.08] -top-40 -left-32" />
        <div className="aurora-blob aurora-blob-b w-[34rem] h-[34rem] bg-[#bf5af2]/[0.08] top-0 -right-32" />
        {/* Posunutý nižšie, nech farba presahuje cez hranicu hero sekcie. */}
        <div className="aurora-blob aurora-blob-c w-[28rem] h-[28rem] bg-[#ff375f]/[0.05] top-[26rem] left-1/3" />
      </div>

      {/* Stopa kurzora — samostatná vrstva, BEZ masky, aby fungovala na celej
          stránke. `fixed` zámerne: kurzor je ukotvený vo viewporte, takže
          plátno stačí veľkosti okna. Na celú výšku stránky by pri dpr 2 išlo
          o desiatky MB pamäte navyše. */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <PointerAurora />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Hero */}
      <section className="hero-timeline relative overflow-hidden text-[#1d1d1f]">
        <div className="site-container relative pt-20 pb-20 md:pt-28 md:pb-24">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-14 lg:gap-10 items-center">
            {/* Copy column */}
            <div className="animate-fade-in-up">
              <p className="text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-[#6e6e73] mb-5">
                {t('hero.eyebrow')}
              </p>
              <h1 className="text-[clamp(2.75rem,3vw+2rem,4.5rem)] font-bold tracking-[-0.03em] leading-[1.05] mb-6 text-[#1d1d1f]">
                {t('hero.titleLead')}<br />
                <span className="text-gradient-aurora">{t('hero.titleAccent')}</span> {t('hero.titleTail')}
              </h1>
              <p className="text-lg md:text-xl text-[#6e6e73] max-w-lg leading-relaxed mb-10">
{t('hero.subtitle')}
              </p>

              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mb-14">
                <a
                  href="#quizzes"
                  className="btn-apple-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold text-base"
                >
                  {t('hero.ctaPrimary')}
                </a>
                <a
                  href="#what-you-get"
                  className="inline-flex items-center gap-1.5 text-[#0068d6] font-medium hover:text-[#004a99] transition-colors group"
                >
                  {t('hero.ctaSecondary')}
                  <span className="transition-transform group-hover:translate-y-0.5" aria-hidden="true">&darr;</span>
                </a>
              </div>

              {/* Spec strip — čo zákazník reálne dostane */}
              {/* Hodnoty z prekladov — kľúče hero.spec* existovali od začiatku
                  i18n, ale sedeli tu natvrdo po slovensky (mŕtve kľúče).
                  specDiiValue je navyše per trh: SK „vs. EÚ & SK",
                  CZ „vs. EU & ČR", EÚ „vs. EU average". */}
              <dl className="flex flex-wrap gap-x-10 gap-y-5 pt-8 border-t border-black/10">
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-[#86868b] mb-1">{t('hero.specDii')}</dt>
                  <dd className="text-sm font-semibold text-[#1d1d1f]">{t('hero.specDiiValue')}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-[#86868b] mb-1">{t('hero.specRisk')}</dt>
                  <dd className="text-sm font-semibold text-[#1d1d1f]">{t('hero.specRiskValue')}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-[#86868b] mb-1">{t('hero.specImpact')}</dt>
                  <dd className="text-sm font-semibold text-[#1d1d1f]">{t('hero.specImpactValue')}</dd>
                </div>
              </dl>
            </div>

            {/* Ukazkova vysledkova karta — ziva (striedaju sa vzorky) a pri
                skrolovani sa roztrhne na 5 pasov aj s textom. */}
            <HeroResultCard />
          </div>
        </div>
      </section>

      {/* Quiz selector */}
      <section id="quizzes" className="site-container py-20">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-3xl font-bold text-[#1d1d1f] mb-3">
            {t('quizSelector.heading')}
          </h2>
          <p className="text-[#6e6e73]">
            {t('quizSelector.subheading')}
          </p>
        </div>
        <QuizSelector />
      </section>

      {/* What you get */}
      {/* Bez vlastného bg-white: pozadie stránky je v tomto mieste už čistá
          biela (gradient ju dosiahne na 1200 px, sekcia začína na ~1426 px),
          takže vizuálne je to zhodné — ale nepriehľadná výplň by prekryla
          stopu kurzora, ktorá leží na -z-10. */}
      <section id="what-you-get" className="py-20">
        <div className="site-container">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#1d1d1f] mb-3">
              {t('whatYouGet.heading')}
            </h2>
            <p className="text-[#6e6e73]">{t('whatYouGet.subheading')}</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 stagger-children">
            <div className="text-center p-8 rounded-3xl bg-white border border-black/5 hover-lift cursor-default">
              <div className="w-16 h-16 rounded-2xl bg-[#1d1d1f]/8 text-[#1d1d1f] flex items-center justify-center mx-auto mb-5 text-2xl font-bold">
                6
              </div>
              <h3 className="font-bold text-[#1d1d1f] mb-2 text-lg">
                {t('whatYouGet.radarTitle')}
              </h3>
              <p className="text-sm text-[#6e6e73] leading-relaxed">
                Procesy, systémy, dáta, infraštruktúra, bezpečnosť, governance — vizuálny prehľad po 6 osiach.
              </p>
            </div>
            <div className="text-center p-8 rounded-3xl bg-white border border-black/5 hover-lift cursor-default">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto mb-5 text-2xl font-bold">
                !
              </div>
              <h3 className="font-bold text-[#1d1d1f] mb-2 text-lg">
                Risk Index
              </h3>
              <p className="text-sm text-[#6e6e73] leading-relaxed">
                Samostatný index technologického dlhu. Kritické riziká nezmiznú v celkovom skóre.
              </p>
            </div>
            <div className="text-center p-8 rounded-3xl bg-white border border-black/5 hover-lift cursor-default">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-5 text-2xl font-bold">
                &euro;
              </div>
              <h3 className="font-bold text-[#1d1d1f] mb-2 text-lg">
                Business Impact
              </h3>
              <p className="text-sm text-[#6e6e73] leading-relaxed">
                Transparentný odhad ročných úspor s rozpadom na procesy, scenáre a audit trail.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ — viditeľná sekcia, z ktorej sa stavia aj FAQPage JSON-LD.
          <details>/<summary>: sémantické, indexovateľné (obsah v collapsed
          <details> Google normálne indexuje), bez JavaScriptu. */}
      <section id="faq" className="site-container py-16">
        <h2 className="text-3xl font-bold text-[#1d1d1f] mb-8 text-center">
          {t('faq.heading')}
        </h2>
        <div className="space-y-3">
          {Array.from({ length: FAQ_COUNT }, (_, i) => (
            <details
              key={i}
              className="group rounded-2xl bg-white border border-black/5 px-6 py-4 open:shadow-sm transition-shadow"
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-[#1d1d1f] min-h-11">
                {t(`faq.q${i + 1}`)}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-[#86868b] transition-transform group-open:rotate-45 text-xl leading-none"
                >
                  +
                </span>
              </summary>
              <p className="pt-3 text-sm text-[#6e6e73] leading-relaxed">
                {t(`faq.a${i + 1}`)}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Methodology note */}
      <section className="site-container py-16">
        <div className="relative p-8 rounded-3xl bg-white border border-black/5 shadow-sm overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#0068d6]/20" />
          <h3 className="font-bold text-[#1d1d1f] mb-3 text-lg">
            {t('methodology.heading')}
          </h3>
          {/* Indexovateľný intro odsek — nesie cieľové frázy (test digitálnej
              zrelosti, úroveň digitalizácie, benchmark, úspory), ktoré sa
              inak na stránke nevyskytovali v súvislom texte. */}
          <p className="text-sm text-[#6e6e73] leading-relaxed mb-3">
            {t('methodology.intro')}
          </p>
          <p className="text-sm text-[#6e6e73] leading-relaxed">
            Hodnotenie stojí na dvoch vrstvách: <strong className="text-[#1d1d1f]">DII-Compatible Layer</strong> (benchmark voči
            EU Digital Intensity Index) a <strong className="text-[#1d1d1f]">Operational Digital Readiness Model</strong> (reálna
            prevádzkovo-digitálna zrelosť). Otázky sú adaptívne — prispôsobujú sa vašim odpovediam
            (<strong className="text-[#1d1d1f]">Adaptívny model DAP</strong>). Každé skóre je auditovateľné
            a spätne rozložiteľné.
          </p>
          <p className="mt-3">
            <Link
              href="/metodika"
              className="inline-flex items-center min-h-11 text-sm font-medium text-[#0068d6] hover:text-[#004a99] transition-colors"
            >
              {t('methodology.fullLink')} &rarr;
            </Link>
          </p>
          <div className="flex items-center gap-6 mt-5 text-xs text-[#86868b] flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#0068d6]" /> DII Eurostat</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#0068d6]" /> ODRM Model</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0068d6]" />
              Adaptívny model DAP
              <span className="font-mono text-[10px] text-[#d2d2d7] ml-1">
                &middot; build{' '}
                <a
                  href={`https://github.com/PRAESTAR/digitalizuj/commit/${process.env.NEXT_PUBLIC_MODEL_COMMIT_HASH || 'main'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#0068d6] transition-colors underline decoration-dotted underline-offset-2"
                  title="Posledný build modelu (config/model, data, engines)"
                >
                  {process.env.NEXT_PUBLIC_MODEL_COMMIT_HASH || 'dev'}
                </a>
              </span>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
