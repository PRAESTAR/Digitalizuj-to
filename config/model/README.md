# digitalizuj.to — Konfigurácia modelu

Tento priečinok obsahuje **všetky konfiguračné súbory** modelu hodnotenia digitálnej zrelosti.

---

## Obsah priečinka

> **Pozn. k .md súborom:** `METHODOLOGY`, `SCORING_SPEC`, `BENCHMARK_SPEC`,
> `ROI_MODEL` a `RECOMMENDATION_RULES` sú **kópie** dokumentov z koreňa
> repozitára — needituj ich tu. Do 6. 8. 2026 sa udržiavali ručne a rozišli
> sa: `SCORING_SPEC.md` o 355 riadkov a opisovala model spred 4. 8. 2026
> (plochý priemer DII, `pureBinary`, nemerané fabrikované na nulu), teda
> správanie, ktoré scoring v1.5 odstránil. Presne tí ľudia, pre ktorých je
> tento priečinok určený, tak čítali opis modelu, ktorý už neexistoval.
> Kópie vyrába `npm run docs:sync` a build kontroluje zhodu (validátor #15).
> `QUESTION_BANK_GUIDE.md` sa naopak píše priamo tu — v koreni nie je.

> **Pozn. k `scoringConfig.json`:** je to **generovaný pohľad** na
> `data/scoringConfig.ts`, nie vstup — runtime ho nečíta. Do 6. 8. 2026 sa
> udržiaval ručne a rozišiel sa: chýbalo v ňom 20 exportov a štyri kľúče mali
> iné názvy než v kóde. Kto tam zmenil prah, nezmenil nič. Regeneruje ho
> `npm run config:sync` a build kontroluje zhodu (validátor #14).
> Scoring parametre sa menia v `data/scoringConfig.ts`.

| Súbor | Účel | Editovateľný? |
|-------|------|---------------|
| `QUESTION_BANK_GUIDE.md` | Pokyny na editovanie matice otázok | Referenčný dokument |
| `questionBank.json` | Matica otázok (indikatívny + komplexný kvíz) | **ÁNO** |
| `scoringConfig.json` | Scoring parametre (váhy, prahy, risk faktory, ROI benchmarky) | **NIE — generovaný** |
| `benchmarkData.json` | Benchmark dáta (krajiny, sektory, veľkosti) | **ÁNO** |
| `METHODOLOGY.md` | Metodika merania (DII + ODRM model) | Referenčný dokument |
| `SCORING_SPEC.md` | Špecifikácia scoringu (výpočty, vzorce) | Referenčný dokument |
| `ROI_MODEL.md` | Model business dopadu (ROI odhady) | Referenčný dokument |
| `BENCHMARK_SPEC.md` | Špecifikácia benchmarkov | Referenčný dokument |
| `RECOMMENDATION_RULES.md` | Pravidlá pre generovanie odporúčaní | Referenčný dokument |

---

## Ako editovať

### Matica otázok (`questionBank.json`)
1. Prečítajte si `QUESTION_BANK_GUIDE.md` — obsahuje podrobné pokyny
2. Otvorte `questionBank.json` v ľubovoľnom JSON editore
3. Upravte texty, options, score hodnoty
4. Pred importom overte validáciu (checklist v guide)

### Scoring parametre (`scoringConfig.json`)
- Váhy kategórií (musia v súčte dať 1.00)
- Maturity prahy a popisky
- Risk faktory s penalizáciami
- ROI benchmarky a hodinové sadzby

### Benchmark dáta (`benchmarkData.json`)
- Krajinné benchmarky (SK, EU27)
- Sektorové benchmarky (8 sektorov)
- Veľkostné benchmarky (4 kategórie)

---

## Dôležité upozornenia

- JSON súbory v tomto priečinku sú **kópiou** zdrojových súborov v `data/` (koreň projektu)
- Po editácii je treba zmeny **preniesť** do zdrojových súborov: `questionBank.json` a `benchmarkData.json` 1:1 kópiou (`data/questionBank.json`, `data/benchmarkData.json` — zhodu vynucuje validátor, build inak spadne), `scoringConfig.json` zatiaľ ručne do `data/scoringConfig.ts`
- `scoringConfig.json` a `benchmarkData.json` sú JSON formát — zdrojové súbory sú TypeScript
- Zmeny v `.md` metodických dokumentoch slúžia na dokumentáciu — neovplyvňujú priamo kód
