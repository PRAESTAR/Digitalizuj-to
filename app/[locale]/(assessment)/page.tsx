import { getTranslations, setRequestLocale } from 'next-intl/server';
import QuizSelector from '@/components/quiz/QuizSelector';
import HeroResultCard from '@/components/ui/HeroResultCard';
import PointerAurora from '@/components/ui/PointerAurora';

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Čo je digitálna zrelosť firmy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Digitálna zrelosť je miera, do akej firma využíva digitálne nástroje a procesy na zefektívnenie prevádzky, rozhodovania a zákazníckej skúsenosti. Meria sa na niekoľkých osiach: procesy, systémy, dáta, infraštruktúra, bezpečnosť a governance.',
      },
    },
    {
      '@type': 'Question',
      name: 'Ako funguje hodnotenie na digitalizuj.to?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Vyplníte adaptívny dotazník (15 otázok pre rýchly screening alebo 43–49 pre komplexnú diagnostiku). Na základe odpovedí dostanete DII-Compatible skóre, Operational Readiness skóre, AI & Automatizácia Readiness, Technical Debt & Risk Index a Business Impact Potential s odhadom úspor v hodinách, MD a EUR.',
      },
    },
    {
      '@type': 'Question',
      name: 'Čo je DII (Digital Intensity Index)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'DII je oficiálny ukazovateľ digitálnej intenzity firiem, ktorý zbiera Eurostat naprieč EÚ. Skóruje adopciu 12 digitálnych technológií a pomáha porovnávať firmy voči EU benchmarku.',
      },
    },
    {
      '@type': 'Question',
      name: 'Odosielajú sa moje odpovede niekam?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Nie. Všetky dáta sa spracovávajú lokálne vo vašom prehliadači. Žiadne odpovede, výsledky ani identifikačné údaje sa neodosielajú na server.',
      },
    },
    {
      '@type': 'Question',
      name: 'Koľko trvá hodnotenie?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Indikatívny kvíz trvá 5–7 minút (15 otázok). Komplexná diagnostika trvá 15–20 minút (43–49 otázok s adaptívnym branchingom).',
      },
    },
  ],
};

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Hero */}
      <section className="hero-timeline relative overflow-hidden bg-[#fbfbfd] text-[#1d1d1f]">
        {/* Soft pastel wash — very low-opacity, no dark glow. Masked fade-out
            at the bottom so it dissolves into the next section instead of
            being hard-clipped at the section boundary. */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none aurora-wash-fade">
          <div className="aurora-blob aurora-blob-a w-[40rem] h-[40rem] bg-[#0a84ff]/[0.08] -top-40 -left-32" />
          <div className="aurora-blob aurora-blob-b w-[34rem] h-[34rem] bg-[#bf5af2]/[0.08] top-0 -right-32" />
          <div className="aurora-blob aurora-blob-c w-[28rem] h-[28rem] bg-[#ff375f]/[0.05] -bottom-40 left-1/3" />
          {/* Svetelná stopa za kurzorom. Zámerne vnútri tejto vrstvy, aby ju
              dole orezal ten istý mask fade ako statické bloby — inak by na
              hranici sekcie vznikol ostrý šev, ktorý sme už raz odstraňovali. */}
          <PointerAurora />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-20 md:pt-28 md:pb-24">
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
              <dl className="flex flex-wrap gap-x-10 gap-y-5 pt-8 border-t border-black/10">
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-[#86868b] mb-1">DII skóre</dt>
                  <dd className="text-sm font-semibold text-[#1d1d1f]">0&ndash;100 vs. EÚ &amp; SK</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-[#86868b] mb-1">Risk Index</dt>
                  <dd className="text-sm font-semibold text-[#1d1d1f]">technologický dlh</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-[#86868b] mb-1">Business Impact</dt>
                  <dd className="text-sm font-semibold text-[#1d1d1f]">odhad úspor v &euro;</dd>
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
      <section id="quizzes" className="max-w-6xl mx-auto px-4 py-20">
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
      <section id="what-you-get" className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4">
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

      {/* Methodology note */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="relative p-8 rounded-3xl bg-white border border-black/5 shadow-sm overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#0068d6]/20" />
          <h3 className="font-bold text-[#1d1d1f] mb-3 text-lg">
            {t('methodology.heading')}
          </h3>
          <p className="text-sm text-[#6e6e73] leading-relaxed">
            Hodnotenie stojí na dvoch vrstvách: <strong className="text-[#1d1d1f]">DII-Compatible Layer</strong> (benchmark voči
            EU Digital Intensity Index) a <strong className="text-[#1d1d1f]">Operational Digital Readiness Model</strong> (reálna
            prevádzkovo-digitálna zrelosť). Otázky sú adaptívne — prispôsobujú sa vašim odpovediam
            (<strong className="text-[#1d1d1f]">Adaptívny model DAP</strong>). Každé skóre je auditovateľné
            a spätne rozložiteľné.
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
