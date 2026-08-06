-- ============================================================================
-- Migrácia 2026-08-06 — škála 0–10 (typ `likert_11`) a spätná väzba (NPS)
--
-- 1) `questions.anchor_low_sk` / `anchor_high_sk`
--    Kotvy krajných bodov škály. Bez nich je pásik 0–10 len číselník bez
--    významu — respondent nevie, ktorý koniec je „dobrý". Validátor ich pri
--    type `likert_11` vyžaduje.
--
-- 2) `questions.likert_ors_rationale`
--    Subjektívna škála smie sýtiť ORS len s písomným zdôvodnením. Zvyšok
--    banky stojí na behaviorálne ukotvených možnostiach, ktoré dvom firmám
--    s rovnakou praxou dajú rovnakú odpoveď; holé číslo taký referenčný bod
--    nemá. Bez tejto brzdy by sa z typu časom stal lenivý default.
--
-- 3) `assessment_results.nps_score` / `nps_at`
--    Odporúčanie testu na škále 0–10, vypĺňané až PO zobrazení výsledku.
--    Ukladá sa k existujúcemu riadku výsledku (nie do vlastnej tabuľky),
--    aby sa dala spätná väzba porovnať so skóre, ktoré ju vyvolalo.
--    NULL = respondent sa nevyjadril; nula je platná odpoveď, takže sa
--    od nevyplneného musí dať odlíšiť.
--
-- Spustenie:
--   mysql -h db.r6.websupport.sk -u digitalizuj -p Digitalizuj \
--     < db/migrations/2026-08-06-likert-scale.sql
--
-- Pozn.: `questions` sa pri každom `scripts/db/import.mjs` DROPne a postaví
-- nanovo zo schémy, takže body 1 a 2 sú tam už zahrnuté. Táto migrácia je
-- pre prípad, že sa DB aktualizuje bez plného reimportu. Bod 3 sa NEDROPuje
-- a musí prejsť týmto ALTER-om — `assessment_results` drží živé dáta.
-- ============================================================================

-- POZOR na ENUM: MariaDB v neprísnom režime neznámu hodnotu NEODMIETNE —
-- uloží prázdny reťazec. Pri prvom importe otázok `likert_11` sa presne to
-- stalo: obe otázky skončili v DB s `question_type = ''` a import zbehol bez
-- chyby. Rozšírenie ENUM-u je preto povinný krok pri každom novom type, a
-- import si to od 6. 8. 2026 kontroluje aj sám (ALLOWED_TYPES).
ALTER TABLE questions
  MODIFY COLUMN question_type ENUM('single_choice','multi_select','likert_11') NOT NULL,
  ADD COLUMN anchor_low_sk        VARCHAR(80) NULL AFTER scale_rationale,
  ADD COLUMN anchor_high_sk       VARCHAR(80) NULL AFTER anchor_low_sk,
  ADD COLUMN likert_ors_rationale TEXT        NULL AFTER anchor_high_sk;

ALTER TABLE assessment_results
  ADD COLUMN nps_score TINYINT UNSIGNED NULL AFTER business_impact_eur,
  ADD COLUMN nps_at    DATETIME         NULL AFTER nps_score,
  ADD CONSTRAINT chk_nps_range CHECK (nps_score IS NULL OR nps_score BETWEEN 0 AND 10);
