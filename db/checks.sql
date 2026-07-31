-- ============================================================================
-- Integritné kontroly modelu — SQL verzia scripts/validate-model.mjs.
--
-- Triedy 1 a 4 (branching cieľ / RF musí existovať) sú vynútené FK v schéme
-- a trieda 6 (scale_rationale pri neštandardnej škále) CHECK constraintom —
-- tie sa už porušiť nedajú. Trieda 7 (drift zrkadla) zanikla: zdroj pravdy
-- je jeden. Zostávajú dotazové kontroly; každý dotaz vracia CHYBNÉ riadky,
-- takže prázdny výsledok = kontrola prešla. publish.php ich spúšťa všetky
-- a odmietne publikovať, ak niektorá niečo vráti.
-- ============================================================================

-- [2] skip cieľ musí byť v poradí ZA zdrojovou otázkou (inak sa pravidlo
--     nikdy nespustí — engine skáče len dopredu). Poradie: indikatívny kvíz
--     podľa position; komplexný podľa (position modulu, position otázky).
SELECT br.question_id AS zdroj, rt.target_question_id AS ciel,
       'skip ciel je v poradi pred zdrojom' AS chyba
  FROM branching_rules br
  JOIN rule_targets rt ON rt.rule_id = br.id AND rt.target_question_id IS NOT NULL
  JOIN questions src ON src.id = br.question_id
  JOIN questions tgt ON tgt.id = rt.target_question_id
  LEFT JOIN modules ms ON ms.id = src.module_id
  LEFT JOIN modules mt ON mt.id = tgt.module_id
 WHERE src.quiz_code <> tgt.quiz_code
    OR COALESCE(mt.position, 0) < COALESCE(ms.position, 0)
    OR (COALESCE(mt.position, 0) = COALESCE(ms.position, 0) AND tgt.position <= src.position);

-- [3] mŕtvy rizikový faktor: definovaný, ale žiadne flag_risk pravidlo ho
--     nespúšťa. (Presne takto sa kedysi našiel odpojený RF08.)
SELECT rf.id, rf.name, 'ziadne flag_risk pravidlo' AS chyba
  FROM risk_factors rf
  LEFT JOIN rule_targets rt ON rt.target_rf_id = rf.id
 WHERE rt.id IS NULL;

-- [5a] scale='linear-N' musí mať presne N možností.
SELECT q.id, q.scale, COUNT(o.id) AS poctov_moznosti,
       'pocet moznosti nesedi so scale' AS chyba
  FROM questions q
  JOIN options o ON o.question_id = q.id
 WHERE q.scale LIKE 'linear-%'
 GROUP BY q.id, q.scale
HAVING COUNT(o.id) <> CAST(SUBSTRING(q.scale, 8) AS INT);

-- [5b] scale='linear-N' musí mať lineárne bodovanie 0..100 podľa pozície:
--      score na pozícii i = ROUND(i * 100 / (N-1)).
SELECT q.id, o.position, o.score,
       ROUND(o.position * 100 / (CAST(SUBSTRING(q.scale, 8) AS INT) - 1)) AS ocakavane,
       'nelinearne bodovanie pri linear skale' AS chyba
  FROM questions q
  JOIN options o ON o.question_id = q.id
 WHERE q.scale LIKE 'linear-%'
   AND o.score <> ROUND(o.position * 100 / (CAST(SUBSTRING(q.scale, 8) AS INT) - 1));

-- [8] (nová, v JSON ére nemožná) operand podmienky equals/any_of/none_includes
--     musí byť skutočnou hodnotou niektorej možnosti zdrojovej otázky —
--     preklep v hodnote by inak pravidlo ticho umŕtvil.
SELECT br.question_id, rco.value, 'operand nie je hodnotou ziadnej moznosti' AS chyba
  FROM branching_rules br
  JOIN rule_condition_operands rco ON rco.rule_id = br.id
 WHERE br.operator IN ('equals', 'any_of', 'not_equals', 'none_includes')
   AND NOT EXISTS (
     SELECT 1 FROM options o
      WHERE o.question_id = br.question_id AND o.value = rco.value
   );

-- [9] (nová) single_choice bez scale — v JSON ére trieda "chýba scale".
SELECT q.id, 'single_choice bez scale' AS chyba
  FROM questions q
 WHERE q.question_type = 'single_choice' AND q.scale IS NULL;
