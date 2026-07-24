'use client';

import { useRouter } from 'next/navigation';
import { useAssessment } from '@/context/AssessmentContext';
import type { AssessmentType } from '@/types';
import QuizSelector from '@/components/quiz/QuizSelector';

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
        text: 'Vyplníte adaptívny dotazník (15 otázok pre rýchly screening alebo 45+ pre komplexnú diagnostiku). Na základe odpovedí dostanete DII-Compatible skóre, Operational Readiness skóre, AI & Automatizácia Readiness, Technical Debt & Risk Index a Business Impact Potential s odhadom úspor v hodinách, MD a EUR.',
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
        text: 'Indikatívny kvíz trvá 5–7 minút (15 otázok). Komplexná diagnostika trvá 15–20 minút (45+ otázok s adaptívnym branchingom).',
      },
    },
  ],
};

export default function Home() {
  const router = useRouter();
  const { startQuiz } = useAssessment();

  const handleSelect = (type: AssessmentType) => {
    startQuiz(type);
    router.push('/quiz');
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#fbfbfd] text-[#1d1d1f]">
        {/* Soft fade from the dark nav bar into the light hero — avoids a hard cut edge */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#1d1d1f]/[0.06] to-transparent pointer-events-none" />
        {/* Soft pastel wash — very low-opacity, no dark glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="aurora-blob aurora-blob-a w-[40rem] h-[40rem] bg-[#0a84ff]/[0.08] -top-40 -left-32" />
          <div className="aurora-blob aurora-blob-b w-[34rem] h-[34rem] bg-[#bf5af2]/[0.08] top-0 -right-32" />
          <div className="aurora-blob aurora-blob-c w-[28rem] h-[28rem] bg-[#ff375f]/[0.05] -bottom-40 left-1/3" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-14 pb-20 md:pt-20 md:pb-24">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-14 lg:gap-10 items-center">
            {/* Copy column */}
            <div className="animate-fade-in-up">
              <p className="text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-[#6e6e73] mb-5">
                Adaptívny model DAP &middot; Eurostat DII benchmark
              </p>
              <h1 className="text-[clamp(2.75rem,3vw+2rem,4.5rem)] font-bold tracking-[-0.03em] leading-[1.05] mb-6 text-[#1d1d1f]">
                Ako digitálne<br />
                <span className="text-gradient-aurora">zrelá</span> je vaša firma?
              </h1>
              <p className="text-lg md:text-xl text-[#6e6e73] max-w-lg leading-relaxed mb-10">
                Zmerajte úroveň digitalizácie, odhaľte skryté riziká a získajte
                prioritizované odporúčania — pripravení na éru umelej inteligencie.
              </p>

              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mb-14">
                <a
                  href="#quizzes"
                  className="btn-apple-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold text-base"
                >
                  Začať diagnostiku
                </a>
                <a
                  href="#what-you-get"
                  className="inline-flex items-center gap-1.5 text-[#0068d6] font-medium hover:text-[#004a99] transition-colors group"
                >
                  Čo presne dostanete
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

            {/* Floating results preview card */}
            <div className="hidden lg:block relative animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <div className="absolute -inset-10 bg-gradient-to-br from-[#0a84ff]/10 via-[#bf5af2]/[0.06] to-transparent blur-3xl rounded-[3rem]" />
              <div className="relative rounded-[28px] bg-white border border-black/5 shadow-[0_40px_100px_-24px_rgba(10,132,255,0.25)] p-7 rotate-[1.5deg] hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[11px] uppercase tracking-wider text-[#86868b]">Vaša výsledková karta</span>
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    naživo v prehliadači
                  </span>
                </div>

                <div className="flex items-end justify-between mb-7">
                  <div>
                    <div className="text-5xl font-bold tracking-tight text-[#1d1d1f]">
                      78<span className="text-[#86868b] text-2xl">/100</span>
                    </div>
                    <div className="text-sm text-[#6e6e73] mt-1">Operačná zrelosť</div>
                  </div>
                  <svg width="92" height="92" viewBox="0 0 96 96" className="opacity-90" aria-hidden="true">
                    <polygon points="48,10 82,30 82,66 48,86 14,66 14,30" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
                    <polygon points="48,24 68,36 66,60 48,74 26,58 24,34" fill="url(#heroRadarFill)" fillOpacity="0.25" stroke="#0a84ff" strokeWidth="1.5" />
                    <defs>
                      <linearGradient id="heroRadarFill" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#0a84ff" />
                        <stop offset="100%" stopColor="#bf5af2" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-5 border-t border-black/10 text-center">
                  <div>
                    <div className="text-lg font-semibold text-[#1d1d1f]">7<span className="text-[#86868b] text-xs">/12</span></div>
                    <div className="text-[10px] uppercase tracking-wide text-[#86868b] mt-0.5">DII skóre</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-amber-600">Stredné</div>
                    <div className="text-[10px] uppercase tracking-wide text-[#86868b] mt-0.5">Riziko</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-emerald-600">14,4k &euro;</div>
                    <div className="text-[10px] uppercase tracking-wide text-[#86868b] mt-0.5">Úspora/rok</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quiz selector */}
      <section id="quizzes" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Vyberte si diagnostiku
          </h2>
          <p className="text-slate-500">
            Rýchly screening alebo hlbšia analýza — záleží na vás
          </p>
        </div>
        <QuizSelector onSelect={handleSelect} />
      </section>

      {/* What you get */}
      <section id="what-you-get" className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Čo získate
            </h2>
            <p className="text-slate-500">Komplexný pohľad na vašu digitálnu zrelosť</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 stagger-children">
            <div className="group text-center p-8 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 hover-lift cursor-default">
              <div className="w-16 h-16 rounded-2xl bg-gradient-card-blue text-white flex items-center justify-center mx-auto mb-5 text-2xl font-black group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
                6
              </div>
              <h3 className="font-bold text-slate-800 mb-2 text-lg">
                Radarový profil
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Procesy, systémy, dáta, infraštruktúra, bezpečnosť, governance — vizuálny prehľad po 6 osiach.
              </p>
            </div>
            <div className="group text-center p-8 rounded-3xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 hover-lift cursor-default">
              <div className="w-16 h-16 rounded-2xl bg-gradient-card-red text-white flex items-center justify-center mx-auto mb-5 text-2xl font-black group-hover:scale-110 transition-transform shadow-lg shadow-red-500/30">
                !
              </div>
              <h3 className="font-bold text-slate-800 mb-2 text-lg">
                Risk Index
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Samostatný index technologického dlhu. Kritické riziká nezmiznú v celkovom skóre.
              </p>
            </div>
            <div className="group text-center p-8 rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 hover-lift cursor-default">
              <div className="w-16 h-16 rounded-2xl bg-gradient-card-green text-white flex items-center justify-center mx-auto mb-5 text-2xl font-black group-hover:scale-110 transition-transform shadow-lg shadow-green-500/30">
                &euro;
              </div>
              <h3 className="font-bold text-slate-800 mb-2 text-lg">
                Business Impact
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Transparentný odhad ročných úspor s rozpadom na procesy, scenáre a audit trail.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology note */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="relative p-8 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-card-blue" />
          <h3 className="font-bold text-slate-800 mb-3 text-lg">
            O metodike
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Hodnotenie stojí na dvoch vrstvách: <strong>DII-Compatible Layer</strong> (benchmark voči
            EU Digital Intensity Index) a <strong>Operational Digital Readiness Model</strong> (reálna
            prevádzkovo-digitálna zrelosť). Otázky sú adaptívne — prispôsobujú sa vašim odpovediam
            (<strong>Adaptívny model DAP</strong>). Každé skóre je auditovateľné
            a spätne rozložiteľné.
          </p>
          <div className="flex items-center gap-6 mt-5 text-xs text-slate-400 flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> DII Eurostat</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" /> ODRM Model</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Adaptívny model DAP
              <span className="font-mono text-[10px] text-slate-300 ml-1">
                &middot; build{' '}
                <a
                  href={`https://github.com/PRAESTAR/digitalizuj/commit/${process.env.NEXT_PUBLIC_MODEL_COMMIT_HASH || 'main'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-400 transition-colors underline decoration-dotted underline-offset-2"
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
