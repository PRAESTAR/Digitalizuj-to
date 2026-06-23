# digitalizuj.to — Recommendation Rules

> Verzia: 1.0-MVP  
> Dátum: 2026-04-08

---

## 1. Princíp generovania odporúčaní

Odporúčania sú generované na základe:
1. **Skóre kategórií** — najslabšie kategórie = najväčšie príležitosti.
2. **Risk faktorov** — kritické riziká = najurgentnejšie akcie.
3. **ROI potenciálu** — procesy s najväčším potenciálom úspor.
4. **Quick win logiky** — čo prinesie rýchly výsledok s nízkym úsilím.

---

## 2. Kategorizácia odporúčaní

### 2.1 Typy

| Typ | Popis | Horizont |
|-----|-------|----------|
| `critical_risk` | Okamžitá akcia — bezpečnostné/prevádzkové riziko | 0–3 mesiace |
| `quick_win` | Nízke úsilie, rýchly viditeľný výsledok | 0–3 mesiace |
| `strategic` | Väčšia iniciatíva s vyšším dopadom | 3–12 mesiacov |
| `long_term` | Transformačné zmeny | 12+ mesiacov |

### 2.2 Prioritizácia

```
priority_score = urgency × impact × (1 / effort)

Kde:
  urgency: 1-5 (5 = okamžité, 1 = môže počkať)
  impact: 1-5 (5 = zásadný dopad, 1 = marginálny)
  effort: 1-5 (1 = minimálne úsilie, 5 = veľký projekt)
```

---

## 3. Pravidlá pre Critical Risk odporúčania

Tieto sa generujú automaticky na základe TDRI risk faktorov:

| Trigger | Odporúčanie | Urgency | Impact |
|---------|-------------|---------|--------|
| RF01: Out-of-support OS/DB | "Naplánujte migráciu z [systém] na podporovanú verziu. Systém mimo podpory nedostáva bezpečnostné záplaty." | 5 | 5 |
| RF02: Chýbajúce zálohy | "Okamžite nasaďte zálohovanie kritických dát s off-site kópiou. Bez záloh je vaša firma existenčne ohrozená." | 5 | 5 |
| RF03: Netestované zálohy | "Naplánujte test obnovy zo zálohy. Zálohy bez testovania sú nespoľahlivé." | 4 | 4 |
| RF04: Chýbajúci patching | "Zaveďte pravidelný patch management. Neaktualizované systémy sú ľahký cieľ útočníkov." | 5 | 4 |
| RF05: Absencia MFA | "Nasaďte MFA na všetkých kritických systémoch (e-mail, VPN, admin). Je to najefektívnejšia bezpečnostná investícia." | 5 | 5 |
| RF06: Single point of failure (infra) | "Identifikujte a eliminujte single point of failure vo vašej infraštruktúre." | 4 | 4 |
| RF07: Key person dependency | "Zdokumentujte kritické znalosti a cross-trainujte tím. Závislosť na jednom človeku je prevádzkové riziko." | 4 | 4 |
| RF09: Žiadny BC/DR | "Vytvorte aspoň základný BC/DR plán a otestujte ho." | 4 | 4 |

---

## 4. Pravidlá pre Quick Win odporúčania

Generované na základe kategóriových skóre a odpovedí:

| Podmienka | Odporúčanie | Impact | Effort |
|-----------|-------------|--------|--------|
| A < 40 && approval_workflow == "email" | "Digitalizujte schvaľovacie procesy — jednoduchý workflow nástroj môže ušetriť hodiny týždenne." | 3 | 2 |
| A < 50 && invoicing == "manual" | "Automatizujte fakturáciu — prepojte objednávky s účtovným systémom." | 4 | 2 |
| B < 40 && integration == "none" | "Prepojte najpoužívanejšie systémy — aj jednoduchý connector zníži ručný prepis." | 3 | 2 |
| C < 30 | "Nastavte automatizované reporty z existujúcich systémov — nemusíte kupovať BI, stačí využiť čo máte." | 3 | 1 |
| D < 40 && remote == "no" | "Umožnite vzdialený prístup — VPN alebo cloud nástroje zvýšia flexibilitu." | 3 | 2 |
| E < 40 && mfa == "none" | "Nasaďte MFA — je to rýchle, lacné a zásadne zvýši bezpečnosť." | 5 | 1 |
| F < 30 && ownership == "nobody" | "Určite zodpovednú osobu za IT a digitalizáciu. Bez ownership sa nič neudeje." | 3 | 1 |

---

## 5. Pravidlá pre Strategic odporúčania

| Podmienka | Odporúčanie | Horizont |
|-----------|-------------|----------|
| A < 50 && employee_count > 20 | "Implementujte ERP alebo integrovaný podnikový systém pre riadenie procesov." | 3–12 mes. |
| B < 50 && systems_count > 3 | "Vytvorte integračnú stratégiu — definujte source of truth a prepojte systémy." | 3–12 mes. |
| C < 50 && employee_count > 30 | "Nasaďte BI nástroj pre data-driven rozhodovanie." | 6–12 mes. |
| D < 40 && infra == "onprem" | "Pripravte migračný plán do cloudu alebo hybrid modelu." | 6–12 mes. |
| E < 50 | "Vypracujte bezpečnostnú stratégiu vrátane policy, incident response a pravidelného auditu." | 3–12 mes. |
| F < 40 | "Vytvorte digitalizačnú roadmapu s prioritami, rozpočtom a KPI." | 3–6 mes. |

---

## 6. Pravidlá pre Long-term odporúčania

| Podmienka | Odporúčanie | Horizont |
|-----------|-------------|----------|
| ORS > 60 && ai_usage == "none" | "Zvážte pilotné nasadenie AI pre automatizáciu repetitívnych úloh." | 12+ mes. |
| A > 60 && C < 40 | "Investujte do dátovej platformy — máte dobré procesy, ale nevyužívate dáta." | 12+ mes. |
| Celkový ORS > 70 | "Zvážte digitálnu transformáciu business modelu — máte dostatočnú základňu." | 12+ mes. |

---

## 7. Roadmapa odporúčaní

Výstup vždy obsahuje roadmapu v troch horizontoch:

### 0–3 mesiace (Okamžité akcie)
- Všetky critical_risk odporúčania.
- Top 3 quick wins (podľa priority_score).

### 3–12 mesiacov (Strategické iniciatívy)
- Top 3 strategic odporúčania.
- Risk mitigácie strednej priority.

### 12+ mesiacov (Transformácia)
- Long-term odporúčania.
- Príležitosti nadstavby.

---

## 8. Formát odporúčania

Každé odporúčanie obsahuje:

```json
{
  "id": "rec_001",
  "type": "critical_risk",
  "category": "E",
  "title": "Nasaďte MFA na kritických systémoch",
  "description": "Viacfaktorové overenie je najefektívnejší spôsob ochrany pred neoprávneným prístupom. Nasaďte ho minimálne na e-mail, VPN a admin rozhrania.",
  "urgency": 5,
  "impact": 5,
  "effort": 1,
  "priority_score": 25.0,
  "horizon": "0-3 months",
  "triggered_by": ["RF05"],
  "source_answers": ["cx_E01"],
  "expected_outcome": "Zníženie rizika neoprávneného prístupu o ~80 %",
  "benchmark_note": "93 % firiem s vysokou digitálnou intenzitou má MFA nasadené."
}
```

---

## 9. Silné stránky

Okrem slabín a odporúčaní výstup identifikuje aj silné stránky:

| Podmienka | Silná stránka |
|-----------|---------------|
| Kategória ≥ 70 | "Kategória [X] je nad priemerom — firma má silnú základňu v tejto oblasti." |
| TDRI < 15 | "Nízky technologický dlh — firma má dobre riadenú infraštruktúru." |
| DII > 75 | "Vysoká digitálna intenzita — firma aktívne využíva digitálne nástroje." |
