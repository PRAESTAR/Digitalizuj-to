/**
 * Šablóny odporúčaní k rizikovým faktorom.
 *
 * Dovtedy žili zapečené v tele funkcie v `recommendationEngine.ts`, kam sa
 * validátor nedostal — a bolo to vidieť: RF06 prechádzal cez gate ako top
 * riziko, ale šablónu nemal, takže sa používateľovi zobrazilo riziko bez
 * akejkoľvek akcie. Teraz sú to dáta, ktoré build kontroluje: každý faktor,
 * ktorý sa vie dostať nad prah, musí mať záznam.
 *
 * `category` je ODRM kategória, ktorú náprava zlepší — nie kategória zdrojovej
 * otázky. Predtým mali všetky rizikové odporúčania natvrdo 'E', hoci napríklad
 * náhrada zastaraného servera patrí do infraštruktúry (D) a závislosť na
 * jednom človeku do governance (F).
 */

export interface RiskRecommendationTemplate {
  /** ODRM kategória, ktorú náprava zlepší (A–F). */
  category: string;
  title: string;
  desc: string;
  expectedOutcome: string;
  urgency: number;
  impact: number;
  effort: number;
}

export const riskRecommendations: Record<string, RiskRecommendationTemplate> = {
  RF01: {
    category: 'D',
    title: 'Migrácia z nepodporovaného OS/systému',
    desc: 'Naplánujte migráciu na podporovanú verziu. Systém mimo podpory nedostáva bezpečnostné záplaty a ohrozuje celú infraštruktúru.',
    expectedOutcome: 'Core systémy dostávajú bezpečnostné aktualizácie',
    urgency: 5, impact: 5, effort: 4,
  },
  RF02: {
    category: 'E',
    title: 'Okamžite nasaďte zálohovanie',
    desc: 'Implementujte zálohovanie kritických dát s off-site kópiou. Bez záloh je firma existenčne ohrozená pri akejkoľvek havárii.',
    expectedOutcome: 'Kritické dáta sú obnoviteľné po havárii',
    urgency: 5, impact: 5, effort: 2,
  },
  RF03: {
    category: 'E',
    title: 'Otestujte obnovu zo zálohy',
    desc: 'Naplánujte a vykonajte test obnovy. Zálohy bez testovania sú nespoľahlivé — neviete, či fungujú, kým ich nepotrebujete.',
    expectedOutcome: 'Overená schopnosť obnoviť dáta v známom čase',
    urgency: 4, impact: 5, effort: 2,
  },
  RF04: {
    category: 'E',
    title: 'Zaveďte pravidelný patch management',
    desc: 'Nastavte pravidelný cyklus aktualizácií. Neaktualizované systémy sú najčastejšia príčina bezpečnostných incidentov.',
    expectedOutcome: 'Známe zraniteľnosti sa zaplátajú v definovanom cykle',
    urgency: 5, impact: 4, effort: 2,
  },
  RF05: {
    category: 'E',
    title: 'Nasaďte MFA na kritických systémoch',
    desc: 'Implementujte viacfaktorové overenie minimálne na e-mail, VPN a admin rozhrania. Je to najefektívnejšia bezpečnostná investícia v pomere prínos/náklad.',
    expectedOutcome: 'Ukradnuté heslo samo o sebe nestačí na prístup',
    urgency: 5, impact: 5, effort: 1,
  },
  RF06: {
    category: 'D',
    title: 'Odstráňte jediný bod zlyhania v infraštruktúre',
    desc: 'Systém, na ktorom stojí prevádzka, beží bez pripravenej náhrady. Zabezpečte redundanciu — druhý uzol alebo virtualizovaný failover, replikáciu dát mimo pôvodné miesto a otestovaný postup nábehu. Kým náhrada neexistuje, jeho výpadok zastaví celú firmu, nie len jedno oddelenie.',
    expectedOutcome: 'Výpadok kritického systému nezastaví prevádzku',
    urgency: 4, impact: 5, effort: 3,
  },
  RF07: {
    category: 'F',
    title: 'Eliminujte závislosť na jednom človeku',
    desc: 'Zdokumentujte kritické znalosti a zabezpečte zastupiteľnosť. Závislosť na jednej osobe je prevádzkové riziko, ktoré sa prejaví pri prvej dovolenke alebo odchode.',
    expectedOutcome: 'Kritické systémy vie obslúžiť viac než jeden človek',
    urgency: 4, impact: 4, effort: 3,
  },
  RF08: {
    category: 'B',
    title: 'Definujte source of truth pre kľúčové dáta',
    desc: 'Určte, ktorý systém je pri každej hlavnej entite (zákazník, produkt, faktúra) záväzný, a doplňte pravidlo, ktorým smerom sa dáta prenášajú. Bez toho sa nedá rozhodnúť, ktorý údaj je pri rozpore správny.',
    expectedOutcome: 'Pri rozpore je jasné, ktorý údaj platí',
    urgency: 3, impact: 4, effort: 2,
  },
  RF09: {
    category: 'E',
    title: 'Vytvorte BC/DR plán',
    desc: 'Pripravte aspoň základný plán kontinuity a obnovy po havárii s cieľovým časom obnovy. Otestujte ho, aby ste vedeli, že funguje.',
    expectedOutcome: 'Známy a overený postup pre výpadok',
    urgency: 4, impact: 4, effort: 3,
  },
  RF10: {
    category: 'D',
    title: 'Zaveďte evidenciu zariadení a systémov',
    desc: 'Stačí tabuľka: zariadenie, vlastník, operačný systém, dátum obstarania, plánovaná výmena. Bez prehľadu sa nedá povedať, čo je mimo podpory ani čo treba zálohovať.',
    expectedOutcome: 'Prehľad o tom, čo firma vlastní a v akom je to stave',
    urgency: 3, impact: 3, effort: 1,
  },
  RF11: {
    category: 'E',
    title: 'Zapnite logovanie a monitoring',
    desc: 'Zbierajte logy z kritických systémov a nastavte upozornenia na výpadok či neúspešné prihlásenia. Bez logov sa incident nedá vyšetriť ani spätne rekonštruovať.',
    expectedOutcome: 'Incident je detegovateľný a spätne vyšetriteľný',
    urgency: 3, impact: 3, effort: 2,
  },
  RF12: {
    category: 'D',
    title: 'Vymeňte aplikácie mimo podpory',
    desc: 'Zostavte zoznam aplikácií po konci podpory a naplánujte ich výmenu alebo upgrade. Nejde o core systémy, ale zraniteľnosti sa v nich už neopravujú.',
    expectedOutcome: 'Používané aplikácie dostávajú aktualizácie',
    urgency: 3, impact: 3, effort: 3,
  },
  RF13: {
    category: 'A',
    title: 'Pripravte sa na povinnú e-fakturáciu',
    desc: 'Od 1. 1. 2027 je pre B2B transakcie povinná štruktúrovaná elektronická faktúra (Peppol, norma EN 16931). Overte, či to váš fakturačný systém zvládne, prípadne naplánujte jeho výmenu — termín je zákonný a neposúva sa.',
    expectedOutcome: 'Fakturácia spĺňa požiadavky účinné od 1. 1. 2027',
    urgency: 4, impact: 3, effort: 3,
  },
  RF14: {
    category: 'E',
    title: 'Overte, či sa vás týka NIS2',
    desc: 'Zákon č. 366/2024 Z. z. rozširuje okruh povinných subjektov. Overte si zaradenie podľa sektora a veľkosti, a ak spadáte pod pôsobnosť, zaveďte požadované opatrenia a ohlasovanie incidentov.',
    expectedOutcome: 'Jasno v tom, či a aké povinnosti z NIS2 platia',
    urgency: 4, impact: 3, effort: 3,
  },
};
