# digitalizuj.to — Konfigurácia modelu

Tento priečinok obsahuje **všetky konfiguračné súbory** modelu hodnotenia digitálnej zrelosti.

---

## Obsah priečinka

| Súbor | Účel | Editovateľný? |
|-------|------|---------------|
| `QUESTION_BANK_GUIDE.md` | Pokyny na editovanie matice otázok | Referenčný dokument |
| `questionBank.json` | Matica otázok (indikatívny + komplexný kvíz) | **ÁNO** |
| `scoringConfig.json` | Scoring parametre (váhy, prahy, risk faktory, ROI benchmarky) | **ÁNO** |
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
- Po editácii je treba zmeny **preniesť** do zdrojových súborov: `questionBank.json` 1:1 kópiou, `scoringConfig.json`/`benchmarkData.json` ručne do TS súborov (`data/scoringConfig.ts`, `data/benchmarkData.ts`)
- `scoringConfig.json` a `benchmarkData.json` sú JSON formát — zdrojové súbory sú TypeScript
- Zmeny v `.md` metodických dokumentoch slúžia na dokumentáciu — neovplyvňujú priamo kód
