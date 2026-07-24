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
        text: 'Vyplníte adaptívny dotazník (15 otázok pre rýchly screening alebo 45+ pre komplexnú diagnostiku). Na základe odpovedí dostanete DII-Compatible skóre, Operational Readiness skóre, Technical Debt & Risk Index a Business Impact Potential s odhadom úspor v hodinách, MD a EUR.',
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
        text: 'Indikatívny kvíz trvá 5–7 minút (max. 15 otázok). Komplexná diagnostika trvá 15–20 minút (45+ otázok s adaptívnym branchingom).',
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
      <section className="relative overflow-hidden bg-gradient-animated text-white">
        {/* Floating decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-40 right-40 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '0.8s' }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32">
          <div className="text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-sm font-medium mb-8 animate-bounce-in">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Metodické hodnotenie na úrovni informačno-technologického auditu
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight leading-tight">
              Ako digitálne zrelá<br />
              je vaša firma?
            </h1>
            <p className="text-lg md:text-xl font-semibold text-white/90 max-w-2xl mx-auto mb-6" style={{ animationDelay: '0.2s' }}>
              Zmerajte úroveň digitalizácie, identifikujte riziká a získajte
              prioritizované odporúčania na zlepšenie.
              <br />
              Ste pripravený na éru umelej inteligencie?
            </p>
            <p className="text-sm text-white/50 mb-12" style={{ animationDelay: '0.3s' }}>
              Postavené na DII (EU benchmark) a Operational Digital Readiness Model
            </p>

            <div className="flex items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <a href="#quizzes" className="px-8 py-4 bg-white text-indigo-700 rounded-2xl font-bold text-lg hover:bg-white/90 transition-all hover:scale-105 shadow-lg shadow-black/20">
                Začať diagnostiku
              </a>
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute -bottom-px left-0 right-0">
          <svg className="block w-full" viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 73.3C480 67 600 73 720 80C840 87 960 93 1080 90C1200 87 1320 73 1380 66.7L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#ffffff"/>
          </svg>
        </div>
      </section>

      {/* Quiz selector */}
      <section id="quizzes" className="max-w-6xl mx-auto px-4 py-16 -mt-4">
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
      <section className="bg-white py-20">
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
