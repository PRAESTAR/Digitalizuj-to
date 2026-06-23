# Pokyny na editovanie matice otazok (questionBank.json)

> Verzia: 1.0-MVP
> Posledna aktualizacia: 2026-04-09

---

## 1. Prehlad struktury

Subor `questionBank.json` obsahuje vsetky otazky pre oba rezimy diagnostiky:
- **Indikativny kviz** (`assessment_type: "indicative"`) — max 15 otazok, rychly screening
- **Komplexny kviz** (`assessment_type: "complex"`) — 30-45 otazok, hlbsia diagnostika

Kazda otazka je objekt v poli `questions` a ma presne definovanu strukturu.

---

## 2. Struktura jednej otazky

```json
{
  "id": "ind_01",
  "assessment_type": "indicative",
  "module": null,
  "text": "Text otazky v slovencine",
  "tooltip": "Volitelny vysvetlujuci text (zobrazi sa ako hint pri otazke)",
  "type": "single_choice",
  "options": [
    { "value": "option_a", "label": "Popis moznosti A", "score": 0 },
    { "value": "option_b", "label": "Popis moznosti B", "score": 50 },
    { "value": "option_c", "label": "Popis moznosti C", "score": 100 }
  ],
  "weight": 1.0,
  "maps_to_score": "category_A",
  "maps_to_dii": null,
  "maps_to_risk": null,
  "maps_to_roi_variable": null,
  "branching": null,
  "allow_unknown": true
}
```

---

## 3. Popis kazdeho pola

### 3.1 Povinne polia

| Pole | Typ | Popis | Mozno menit? |
|------|-----|-------|-------------|
| `id` | string | Unikatny identifikator otazky | **NIE** — meni sa len pri pridavani novej otazky |
| `assessment_type` | string | `"indicative"` alebo `"complex"` | **NIE** — urcuje do ktoreho kvizu otazka patri |
| `module` | string/null | Modul v komplexnom kvize (`"A"` az `"F"`) alebo `null` | **NIE** |
| `text` | string | Slovensky text otazky | **ANO** — hlavny ucel editovania |
| `type` | string | Typ otazky (pozri sekciu 4) | **OPATRNE** — zmena typu meni logiku |
| `options` | array | Pole moznosti s `value`, `label`, `score` | **ANO** — hlavny ucel editovania |
| `weight` | number | Vaha otazky v ramci kategorie (default 1.0) | **ANO** — ovplyvnuje scoring |
| `maps_to_score` | string | Na ktore skore otazka prispeva | **OPATRNE** — meni scoring logiku |
| `allow_unknown` | boolean | Ci je dostupna moznost "Neviem" | **ANO** |

### 3.2 Volitelne polia

| Pole | Typ | Popis |
|------|-----|-------|
| `tooltip` | string/null | Vysvetlujuci text k otazke (zobrazuje sa ako hint) |
| `maps_to_dii` | string/null | DII indikator (`"DII1"` az `"DII12"`) |
| `maps_to_risk` | string/null | Risk faktor (`"RF01"` az `"RF12"`) |
| `maps_to_roi_variable` | string/null | ROI premenna (`"employee_count"`, `"hourly_cost"`, atd.) |
| `branching` | object/null | Pravidla pre preskocenie/zahrnutie otazok |

---

## 4. Podporovane typy otazok

| Typ | Popis | Kolko opcii? |
|-----|-------|-------------|
| `single_choice` | Vyber jednej moznosti | 2-6 |
| `multi_select` | Vyber viacerych moznosti | 3-10 |

> **POZOR:** Typ `numeric_bands` NIE JE implementovany v UI. Nepouzivat. Ak potrebujete ciselne pasma, pouzite `single_choice` s pasmami ako options.

---

## 5. Scoring — pravidla pre `score` hodnoty

### 5.1 Zakladne pravidla

- **Score je cislo 0-100** pre kazdu option
- **0** = najhorsia moznost / najnizsia uroven
- **100** = najlepsia moznost / najvyssia uroven
- **Medzistupne** distribuujte rovnomerne (napr. 0, 25, 50, 75, 100 pre 5 opcii)

### 5.2 Typicke rozlozenia

**5-stupnova maturity scala (najcastejsia):**
```json
{ "score": 0 }    // Level 0 — Ad hoc
{ "score": 25 }   // Level 1 — Ciastocna
{ "score": 50 }   // Level 2 — Standardizovane
{ "score": 75 }   // Level 3 — Automatizovane
{ "score": 100 }  // Level 4 — Optimalizovane
```

**4-stupnova:**
```json
{ "score": 0 }    // Ziadne
{ "score": 33 }   // Zakladne
{ "score": 66 }   // Pokrocile
{ "score": 100 }  // Plne
```

**3-stupnova:**
```json
{ "score": 0 }    // Nie
{ "score": 50 }   // Ciastocne
{ "score": 100 }  // Ano
```

**Binarna (ano/nie):**
```json
{ "score": 0 }    // Nie
{ "score": 100 }  // Ano
```

### 5.3 Multi-select scoring

Pre `multi_select` otazky:
- Kazda opcia ma svoj `score`
- Celkove skore = sucet oznacenych / maximalne mozne × 100
- Nastavte `score` tak, aby sucet vsetkych opcii dal max mozne skore (napr. 20 + 20 + 20 + 20 + 20 = 100)

---

## 6. maps_to_score — kam otazka prispeva

Mozne hodnoty:

| Hodnota | Vyznam |
|---------|--------|
| `"category_A"` | Procesy a digitalizacia prace |
| `"category_B"` | Systemy a integracie |
| `"category_C"` | Data a reporting |
| `"category_D"` | Infrastruktura a cloud |
| `"category_E"` | Bezpecnost a technologicky dlh |
| `"category_F"` | Governance a ludia |
| `"dii"` | Iba DII skore (neprispieva do kategorie) |
| `"roi_input"` | Iba vstup pre ROI model (neprispieva do skore) |
| `"meta"` | Metadatova otazka (sektor, velkost) — ziadne skore |

---

## 7. maps_to_dii — DII indikatory

Ak otazka mapuje na DII indikator, nastavte:

| Hodnota | DII indikator |
|---------|---------------|
| `"DII1"` | Internet >= 30 Mbps |
| `"DII2"` | ICT specialisti |
| `"DII3"` | Vzdialeny pristup |
| `"DII4"` | Digitalne zrucnosti |
| `"DII5"` | Webstranka s funkciami |
| `"DII6"` | Socialne siete |
| `"DII7"` | Cloud sluzby |
| `"DII8"` | E-faktury |
| `"DII9"` | E-commerce existuje |
| `"DII10"` | E-commerce > 1% obratu |
| `"DII11"` | AI technologie |
| `"DII12"` | Big data analyzy |

---

## 8. maps_to_risk — Risk faktory (TDRI)

| Hodnota | Risk faktor | Severity |
|---------|-------------|----------|
| `"RF01"` | Out-of-support core OS/DB | Critical |
| `"RF02"` | Chybajuce zalohy core dat | Critical |
| `"RF03"` | Zalohy existuju, ale netestovane | High |
| `"RF04"` | Chybajuci patch management | Critical |
| `"RF05"` | Absencia MFA | Critical |
| `"RF06"` | Single point of failure (infra) | High |
| `"RF07"` | Single point of failure (ludia) | High |
| `"RF08"` | Nezdokumentovane systemy | Medium |
| `"RF09"` | Ziadny BC/DR plan | High |
| `"RF10"` | Ziadny asset inventory | Medium |
| `"RF11"` | Ziadne logovanie/monitoring | Medium |
| `"RF12"` | Out-of-support aplikacie (nie core) | Medium |

---

## 9. Branching pravidla

Branching umoznuje preskocit alebo zahnut otazky podla predchadzajucich odpovedi.

### 9.1 Struktura branching objektu

```json
"branching": {
  "skip_if": {
    "question_id": "cx_B01",
    "value": ["one_system"]
  },
  "include_if": {
    "question_id": "cx_D02",
    "value": ["onprem", "hybrid"]
  },
  "flag_risk": {
    "question_id": "cx_E01",
    "value": ["none"],
    "risk_factor": "RF05"
  }
}
```

### 9.2 Typy pravidiel

| Pravidlo | Efekt |
|----------|-------|
| `skip_if` | Otazka sa preskoci ak podmienka je splnena |
| `include_if` | Otazka sa zobrazi IBA ak podmienka je splnena |
| `flag_risk` | Ak podmienka je splnena, aktivuje sa risk faktor |

### 9.3 Pravidla pre editovanie branchingu

- `question_id` musi odkazovat na otazku ktora **predchadza** v poradi
- `value` je pole moznych hodnot (aspon jedna musi matchovat)
- Nepouzivajte cyklicke zavislosti (A zavisi na B ktore zavisi na A)
- Testujte branching logiku — nespravne pravidla mozu preskocit dolezite otazky

---

## 10. Konvencie pre ID otazok

### 10.1 Indikativny kviz

Format: `ind_XX` kde XX je poradove cislo (01-15)

### 10.2 Komplexny kviz

Format: `cx_[MODUL]XX[variant]`

Priklady:
- `cx_A01` — prva otazka modulu A
- `cx_B03` — tretia otazka modulu B
- `cx_DII02b` — druhy variant DII otazky 02
- `cx_ROI01` — ROI vstupna otazka

### 10.3 Pravidla pre ID

- **NEMENIT existujuce ID** — kód na ne odkazuje
- Pri pridavani novej otazky pouzite nasledujuce volne cislo
- ID musi byt unikatne v celom subore
- Pouzivajte iba male pismena, cisla a podtrznik

---

## 11. Ako pridat novu otazku

1. Skopirujte existujucu otazku podobneho typu
2. Zmente `id` na nasledujuce volne cislo
3. Upravte `text`, `tooltip`, `options`
4. Nastavte spravne `maps_to_score`, `maps_to_dii`, `maps_to_risk`
5. Ak treba, pridajte `branching`
6. Overte ze `score` hodnoty su logicke (0 = najhorsie, 100 = najlepsie)
7. Overte ze `assessment_type` a `module` su spravne

---

## 12. Ako odstranit otazku

> **POZOR:** Odstranenie otazky moze rozbit branching pravidla inych otazok!

1. Najdite vsetky otazky ktore referencuju jej `id` v `branching`
2. Upravte alebo odstranite tieto branching pravidla
3. Odstranite otazku
4. Overte ze scoring stale pokryva vsetky kategorie a DII indikatory

---

## 13. Validacne pravidla (checklist pred importom)

Pred importovanim upravenej matice overte:

- [ ] Vsetky `id` su unikatne
- [ ] Kazda otazka ma platny `type` (`single_choice` alebo `multi_select`)
- [ ] Kazda otazka ma aspon 2 `options`
- [ ] Kazda option ma `value`, `label` a `score`
- [ ] `score` hodnoty su cisla 0-100
- [ ] `maps_to_score` je platna hodnota (pozri sekciu 6)
- [ ] Branching `question_id` odkazuje na existujucu otazku
- [ ] Branching `value` obsahuje hodnoty ktore existuju v referencovanej otazke
- [ ] Indikativny kviz ma 10-15 otazok
- [ ] Komplexny kviz pokryva vsetky moduly (A-F)
- [ ] Vsetky 12 DII indikatorov su pokryte aspon 1 otazkou
- [ ] JSON je validny (ziadne chybajuce ciarky, zatvorky, uvodzovky)

---

## 14. Tipy

- **Jazyk:** Vsetky texty su v slovencine, bez diakritiky v hodnotach (`value`), s diakritikou v `label` a `text`
- **Tooltip:** Pouzivajte pre zlozitejsie otazky. Pomaha respondentovi pochopit co presne sa pytame.
- **Konzistencia:** Udrzujte rovnaky styl formulacie otazok (napr. vzdy formalne „vy")
- **Pocet opcii:** 3-5 opcii je idealne. Viac ako 6 je neprehladne.
- **Score distribucua:** Idealne rovanomerne (0, 25, 50, 75, 100). Nerovnomerne len ak je logicky dovod.
