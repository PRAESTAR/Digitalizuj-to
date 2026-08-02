import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { SITE_URL, skCanonical, absoluteUrl } from '@/lib/seo';

/**
 * Verejná metodika — E-E-A-T kotva webu.
 *
 * SEO audit označil chýbajúcu metodickú stránku za najhodnotnejší chýbajúci
 * obsah: najbohatšie fakty webu (DII premenné, ODRM váhy, rizikové faktory,
 * ROI základ) žili len v public/llms.txt a na GitHube — teda neviditeľné pre
 * Google. Obsah je prenesený odtiaľ; llms.txt zostáva strojová verzia
 * a release checklist drží obe v synchronizácii.
 *
 * Obsah je zatiaľ po slovensky vo všetkých mutáciách, preto canonical
 * ukazuje na /sk/metodika (viď lib/seo.ts — politika nepreložených rout).
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Metodika merania digitálnej zrelosti — DII a ODRM',
    description:
      'Verejná metodika testu digitálnej zrelosti: 12 premenných Eurostat DII 2025, model ODRM so 6 oblasťami, 14 rizikových faktorov a výpočet úspor. Vrátane obmedzení.',
    alternates: { canonical: skCanonical('/metodika') },
    openGraph: {
      type: 'article',
      url: skCanonical('/metodika'),
      title: 'Metodika merania digitálnej zrelosti — DII a ODRM',
      description:
        'Verejná metodika testu digitálnej zrelosti: Eurostat DII 2025, model ODRM, 14 rizikových faktorov a výpočtový základ úspor — vrátane známych obmedzení.',
      images: ['/sk/opengraph-image'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
      },
    },
  };
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Úvod',
      item: absoluteUrl('/sk'),
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Metodika',
      item: absoluteUrl('/sk/metodika'),
    },
  ],
};

const OUTPUTS = [
  ['DII-Compatible Score', '0–100 (+ prepočet 0–12)', 'Porovnanie s európskym benchmarkom digitálnej intenzity'],
  ['Operational Readiness Score (ORS)', '0–100', 'Reálna prevádzková zrelosť, nie len adopcia nástrojov'],
  ['AI & Automatizácia Readiness', '0–100', 'Prierezová pripravenosť na AI a automatizáciu'],
  ['Technical Debt & Risk Index (TDRI)', '0–100 (vyššie = horšie)', 'Technologický dlh a prevádzkové riziká'],
  ['Business Impact Potential', 'hodiny / MD / EUR ročne', 'Odhad úspor v troch scenároch (konzervatívny, reálny, optimistický)'],
] as const;

const ODRM_AREAS = [
  ['A', 'Procesy a digitalizácia práce', '20 %'],
  ['B', 'Systémy a integrácie', '20 %'],
  ['C', 'Dáta a reporting', '15 %'],
  ['D', 'Infraštruktúra a cloud', '15 %'],
  ['E', 'Bezpečnosť a technologický dlh', '20 %'],
  ['F', 'Governance a ľudia', '10 %'],
] as const;

const LIMITATIONS = [
  'Sektorové a veľkostné mediány ORS sú expertné odhady, nie empirické dáta z vlastného datasetu.',
  'ROI model odhaduje len potenciál úspor — bez investičných nákladov a bez adopčnej krivky. Výstupom je ročný run-rate po plnej implementácii.',
  'Firmy s menej ako 10 zamestnancami nie sú pokryté dátami Eurostat DII.',
  'Dáta sú self-reported, bez nezávislej verifikácie.',
  'DII skóre je aproximácia: plochý priemer označených otázok, nie per-indikátorová agregácia podľa oficiálnej metodiky Eurostatu.',
] as const;

export default async function MethodologyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="max-w-3xl mx-auto px-4 pt-16 pb-12 sm:pt-12">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1d1d1f] mb-4 tracking-tight">
            Metodika merania digitálnej zrelosti — DII a ODRM
          </h1>
          <p className="text-[#6e6e73] text-base sm:text-lg leading-relaxed">
            Skóre, ktoré nevie vysvetliť svoj vznik, je marketing. Táto stránka
            zverejňuje celý výpočtový model digitalizuj.to — premenné, váhy,
            rizikové faktory aj známe obmedzenia — aby bol každý výsledok
            spätne rozložiteľný na odpovede a pravidlá.
          </p>
        </header>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#1d1d1f] mb-4">
            Čo nástroj meria
          </h2>
          <p className="text-sm text-[#6e6e73] leading-relaxed mb-4">
            Používateľ si vyberie jednu z dvoch diagnostík: indikatívnu
            (15 otázok, 5–7 minút) alebo komplexnú (43–49 otázok podľa vetvy
            adaptívneho branchingu, 15–20 minút — 6 hodnotených modulov A–F
            plus úvodné, ROI a DII otázky). Pri hodnotiacich otázkach je
            možnosť „Neviem", ktorá sa do skóre nezapočítava. Výstupom je
            päť nezávislých ukazovateľov:
          </p>
          <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 text-left text-[#86868b]">
                  <th className="px-4 py-3 font-semibold">Výstup</th>
                  <th className="px-4 py-3 font-semibold">Rozsah</th>
                  <th className="px-4 py-3 font-semibold">Čo hovorí</th>
                </tr>
              </thead>
              <tbody>
                {OUTPUTS.map(([name, range, meaning]) => (
                  <tr key={name} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3 font-semibold text-[#1d1d1f]">{name}</td>
                    <td className="px-4 py-3 text-[#6e6e73] whitespace-nowrap">{range}</td>
                    <td className="px-4 py-3 text-[#6e6e73]">{meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#1d1d1f] mb-4">DII vrstva</h2>
          <div className="space-y-4 text-sm text-[#6e6e73] leading-relaxed">
            <p>
              DII vrstva mapuje 12 premenných Digital Intensity Indexu
              Eurostatu (dataset{' '}
              <a
                href="https://ec.europa.eu/eurostat/databrowser/view/isoc_e_dii/default/table"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0068d6] hover:text-[#004a99] underline decoration-dotted underline-offset-2"
              >
                isoc_e_dii
              </a>
              , verzia 3, prieskum 2025) na granulárne skóre. Eurostat strieda
              sady premenných v dvojročnej rotácii (prieskum 2024 = verzia 4,
              prieskum 2025 = verzia 3, líši sa 7 z 12 premenných), preto sú
              benchmark dáta aj otázky ukotvené na jednu verziu a jeden
              prieskumný rok.
            </p>
            <p>
              Referenčné hodnoty: rozdelenie podnikov podľa pásiem digitálnej
              intenzity je pre Slovensko 41,6 / 32,0 / 20,4 / 6,0 %, pre
              Česko 28,5 / 30,6 / 28,9 / 12,1 % a pre EÚ-27
              27,9 / 34,5 / 27,5 / 10,1 %; odvodené mediány SK 4,3, ČR 5,6
              a EÚ 5,4 (Eurostat ISOC_E_DII, prieskum 2025). KPI Digitálnej
              dekády — podiel MSP so základnou digitálnou intenzitou:
              Slovensko 57,1 %, Česko 70,5 %, EÚ 71,4 %, cieľ 90 % do roku
              2030. Voľba jazykovej mutácie určuje domáci benchmark:
              slovenčina porovnáva so SK, čeština s ČR, anglická (EÚ)
              mutácia s priemerom EÚ-27.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#1d1d1f] mb-4">
            ODRM vrstva — šesť oblastí prevádzkovej zrelosti
          </h2>
          <p className="text-sm text-[#6e6e73] leading-relaxed mb-4">
            Operational Digital Readiness Model meria prevádzkovú zrelosť
            s pevnými váhami — adopcia nástroja sa nerovná zrelosti:
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {ODRM_AREAS.map(([letter, name, weight]) => (
              <div
                key={letter}
                className="flex items-center gap-4 rounded-2xl bg-white border border-black/5 px-5 py-4"
              >
                <span className="w-10 h-10 shrink-0 rounded-xl bg-[#1d1d1f]/8 text-[#1d1d1f] flex items-center justify-center font-bold">
                  {letter}
                </span>
                <span className="text-sm text-[#1d1d1f] font-medium flex-1">{name}</span>
                <span className="text-sm font-mono text-[#86868b]">{weight}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#1d1d1f] mb-4">
            Riziká a odhad úspor
          </h2>
          <div className="space-y-4 text-sm text-[#6e6e73] leading-relaxed">
            <p>
              Index rizík pracuje so 14 rizikovými faktormi (RF01–RF14)
              vrátane nepripravenosti na povinnú elektronickú fakturáciu
              a na NIS2. ROI model počíta s hodinovou cenou práce 30,8 €/h
              (Eurostat lc_lci_lev 2025, NACE J — Informácie a komunikácia);
              dotazník sa na mzdové údaje zámerne nepýta.
            </p>
            <p>
              Do metodiky a odporúčaní je premietnutý regulačný kontext
              2025–2027: NIS2 a zákon č. 366/2024 Z. z. o kybernetickej
              bezpečnosti, povinná B2B elektronická fakturácia v SR od
              1. 1. 2027 (Peppol, norma EN 16931) a nariadenie EÚ 2024/1689
              (AI Act).
            </p>
            <p>
              Metodické princípy: skóre musí byť spätne rozložiteľné na
              jednotlivé odpovede a pravidlá (explainability); adopcia
              nástroja sa nerovná zrelosti; technologický dlh je samostatná
              dimenzia, nie zľava zo skóre; odhad dopadu má zverejnený
              výpočtový model.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#1d1d1f] mb-4">
            Známe obmedzenia
          </h2>
          <p className="text-sm text-[#6e6e73] leading-relaxed mb-4">
            Uvádzame ich explicitne, pretože ovplyvňujú interpretáciu
            výsledkov:
          </p>
          <ul className="space-y-2">
            {LIMITATIONS.map((item) => (
              <li
                key={item}
                className="flex gap-3 text-sm text-[#6e6e73] leading-relaxed"
              >
                <span aria-hidden="true" className="text-[#86868b] shrink-0 mt-0.5">
                  —
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <div className="rounded-2xl bg-white border border-black/5 p-6 text-sm text-[#6e6e73] leading-relaxed">
          Referenčnú vzorku 50 anonymizovaných profilov nájdete na stránke{' '}
          <Link
            href="/peers"
            className="text-[#0068d6] hover:text-[#004a99] underline decoration-dotted underline-offset-2"
          >
            benchmark digitálnej zrelosti
          </Link>
          ; históriu zmien metodiky a scoringu eviduje{' '}
          <Link
            href="/changelog"
            className="text-[#0068d6] hover:text-[#004a99] underline decoration-dotted underline-offset-2"
          >
            changelog
          </Link>
          . Primárny zdroj benchmark dát:{' '}
          <a
            href="https://ec.europa.eu/eurostat/databrowser/view/isoc_e_dii/default/table"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0068d6] hover:text-[#004a99] underline decoration-dotted underline-offset-2"
          >
            Eurostat — Digital Intensity Index (isoc_e_dii)
          </a>
          , prieskum 2025.
        </div>
      </div>
    </div>
  );
}
