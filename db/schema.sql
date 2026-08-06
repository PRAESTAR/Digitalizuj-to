-- ============================================================================
-- digitalizuj.to — schéma otázkovej banky (MariaDB 11.4, DB `digitalizacia`)
--
-- Zdroj pravdy pre OBSAH modelu (otázky, možnosti, vetvenie, mapovania).
-- Obsah modelu (otázky) je oddelený od výsledkov diagnostiky: výsledky žijú
-- v tabuľke assessment_results (viď db/migrations/2026-08-05-assessment-results.sql),
-- ktorá vznikla až 5. 8. 2026. Dovtedy sa výsledky na server neposielali vôbec.
--
-- Návrhové rozhodnutia:
--  * utf8mb4 explicitne na každej tabuľke — server má default charset
--    `binary`, slovenská diakritika by sa bez toho rozsypala.
--  * FK integrita nahrádza triedy 1, 3 a 4 z scripts/validate-model.mjs
--    (branching cieľ musí existovať; RF musí byť definovaný). Zvyšné triedy
--    kontroluje publish krok cez SQL dotazy (db/checks.sql).
--  * Podmienky vetvenia sú uložené DVAKRÁT: surový string (condition_raw,
--    zdroj pravdy pre kompiláciu — garantuje bajtovú vernosť voči
--    questionBank.json) + štruktúrovane (operator + operandy, pre budúce
--    editačné UI a validáciu). Import ZLYHÁ, ak sa regenerovaný string
--    nezhoduje so surovým — štruktúra sa nemôže rozísť s pravdou.
--  * Stĺpce ako evidence_type či maps_to_roi_model engine dnes nečíta
--    (mŕtve polia podľa extrakcie), ale kompilát musí byť zhodný s dnešným
--    JSON — preto sa ukladajú tiež. Ich osud rieši samostatná úloha.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS rule_condition_operands;
DROP TABLE IF EXISTS rule_targets;
DROP TABLE IF EXISTS branching_rules;
DROP TABLE IF EXISTS question_score_map;
DROP TABLE IF EXISTS question_risk_map;
DROP TABLE IF EXISTS question_roi_map;
DROP TABLE IF EXISTS option_i18n;
DROP TABLE IF EXISTS options;
DROP TABLE IF EXISTS question_i18n;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS modules;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS risk_factors;
DROP TABLE IF EXISTS model_info;
DROP TABLE IF EXISTS model_versions;

SET FOREIGN_KEY_CHECKS = 1;

-- Jediný riadok s metadátami modelu (version, model_name, last_updated).
CREATE TABLE model_info (
  id            TINYINT      NOT NULL PRIMARY KEY CHECK (id = 1),
  version       VARCHAR(20)  NOT NULL,
  model_name    VARCHAR(120) NOT NULL,
  last_updated  VARCHAR(10)  NOT NULL  -- ISO dátum ako v JSON (string, nie DATE — bajtová vernosť)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quizzes (
  code          VARCHAR(20)  NOT NULL PRIMARY KEY,  -- 'indicative' | 'complex'
  json_id       VARCHAR(40)  NOT NULL,              -- id pole v JSON
  name          VARCHAR(120) NOT NULL,
  description   TEXT         NOT NULL,
  max_questions INT          NULL                   -- len indicative
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE modules (
  id        INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  quiz_code VARCHAR(20)  NOT NULL,
  code      VARCHAR(30)  NOT NULL,   -- 'module_A', 'module_DII'…
  name      VARCHAR(120) NOT NULL,
  category  VARCHAR(20)  NOT NULL,   -- 'A'..'F' | 'meta' | 'dii'
  position  INT          NOT NULL,
  UNIQUE KEY uq_module_code (code),
  CONSTRAINT fk_module_quiz FOREIGN KEY (quiz_code) REFERENCES quizzes(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE risk_factors (
  id          VARCHAR(5)   NOT NULL PRIMARY KEY,  -- 'RF01'…'RF14'
  name        VARCHAR(160) NOT NULL,
  max_penalty INT          NOT NULL,
  severity    ENUM('critical','high','medium') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE questions (
  id              VARCHAR(40)  NOT NULL PRIMARY KEY,  -- 'ind_05', 'cx_A01'…
  quiz_code       VARCHAR(20)  NOT NULL,
  module_id       INT          NULL,                  -- NULL = indikatívny kvíz (bez modulov)
  position        INT          NOT NULL,              -- poradie v rámci kvízu/modulu
  category        VARCHAR(20)  NOT NULL,
  dimension       VARCHAR(80)  NOT NULL,
  question_type   ENUM('single_choice','multi_select') NOT NULL,
  weight          DECIMAL(4,2) NOT NULL,
  max_score       INT          NULL,                  -- len multi_select
  evidence_type   VARCHAR(40)  NOT NULL,
  allow_unknown   TINYINT(1)   NOT NULL,
  scale           VARCHAR(20)  NULL,                  -- len single_choice
  scale_rationale TEXT         NULL,
  scoring_note    TEXT         NULL,                  -- prozaická poznámka pre autora, nie signál pre engine
  -- Explicitný režim skórovania. Predtým sa invertovanie detegovalo podľa
  -- výskytu slova „Invertované" v scoring_note — preklad tej vety by ticho
  -- prepol otázku na štandardný výpočet, teda skóre 0 pre všetkých.
  scoring_mode    ENUM('standard','inverted') NOT NULL DEFAULT 'standard',
  CONSTRAINT fk_q_quiz   FOREIGN KEY (quiz_code) REFERENCES quizzes(code),
  CONSTRAINT fk_q_module FOREIGN KEY (module_id) REFERENCES modules(id),
  -- trieda 6 validátora: neštandardná škála musí mať zdôvodnenie
  CONSTRAINT chk_scale_rationale CHECK (
    scale NOT IN ('categorical','descending','custom') OR scale_rationale IS NOT NULL
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Texty otázok per jazyk. 'sk' je povinný (zdrojový); cs/de/en pribudnú
-- s prekladom obsahu — kompilácia per jazyk je potom SELECT s fallbackom.
CREATE TABLE question_i18n (
  question_id VARCHAR(40) NOT NULL,
  locale      VARCHAR(5)  NOT NULL,   -- 'sk','cs','de','en'
  text        TEXT        NOT NULL,
  tooltip     TEXT        NULL,
  PRIMARY KEY (question_id, locale),
  CONSTRAINT fk_qi_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE options (
  id          INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  question_id VARCHAR(40) NOT NULL,
  position    INT         NOT NULL,
  value       VARCHAR(60) NOT NULL,
  score       INT         NOT NULL,   -- záporné = invertované multi_select (cx_A05)
  UNIQUE KEY uq_opt (question_id, value),
  CONSTRAINT fk_opt_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE option_i18n (
  option_id INT        NOT NULL,
  locale    VARCHAR(5) NOT NULL,
  label     TEXT       NOT NULL,
  PRIMARY KEY (option_id, locale),
  CONSTRAINT fk_oi_option FOREIGN KEY (option_id) REFERENCES options(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- maps_to_score / maps_to_risk / maps_to_roi_model — poradie polí sa drží,
-- kompilát ich musí vrátiť v pôvodnom poradí.
CREATE TABLE question_score_map (
  question_id VARCHAR(40) NOT NULL,
  position    INT         NOT NULL,
  tag         VARCHAR(40) NOT NULL,
  PRIMARY KEY (question_id, position),
  CONSTRAINT fk_qsm_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE question_risk_map (
  question_id VARCHAR(40) NOT NULL,
  position    INT         NOT NULL,
  rf_id       VARCHAR(5)  NOT NULL,
  PRIMARY KEY (question_id, position),
  CONSTRAINT fk_qrm_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_qrm_rf       FOREIGN KEY (rf_id)       REFERENCES risk_factors(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE question_roi_map (
  question_id VARCHAR(40) NOT NULL,
  position    INT         NOT NULL,
  tag         VARCHAR(60) NOT NULL,
  PRIMARY KEY (question_id, position),
  CONSTRAINT fk_qrom_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE branching_rules (
  id              INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  question_id     VARCHAR(40) NOT NULL,
  position        INT         NOT NULL,   -- poradie pravidiel na otázke
  condition_raw   TEXT        NOT NULL,   -- presný string z JSON — zdroj pravdy kompilácie
  operator        ENUM('equals','not_equals','any_of','none_includes','count_lte') NOT NULL,
  action          ENUM('skip','flag_risk') NOT NULL,
  reason          TEXT        NOT NULL,
  -- 'apply' = pri odpovedi Neviem vykonaj akciu, ako keby podmienka platila.
  -- Bez toho Neviem obchadzalo vsetky pravidla a respondent dostal najviac otazok.
  on_unknown      ENUM('ignore','apply') NOT NULL DEFAULT 'ignore',
  target_is_array TINYINT(1)  NOT NULL,   -- JSON má target ako string ALEBO pole — kompilát to musí vrátiť rovnako
  CONSTRAINT fk_br_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Operandy štruktúrovanej podmienky (hodnoty option value / číslo pre count_lte).
CREATE TABLE rule_condition_operands (
  rule_id  INT         NOT NULL,
  position INT         NOT NULL,
  value    VARCHAR(60) NOT NULL,
  PRIMARY KEY (rule_id, position),
  CONSTRAINT fk_rco_rule FOREIGN KEY (rule_id) REFERENCES branching_rules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ciele pravidla: otázka (skip) ALEBO rizikový faktor (flag_risk).
-- CHECK vynucuje práve jeden typ; FK vynucujú existenciu cieľa —
-- trieda 1 a 4 validátora sa tým stáva neporušiteľnou už na úrovni dát.
CREATE TABLE rule_targets (
  id                 INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  rule_id            INT         NOT NULL,
  position           INT         NOT NULL,
  target_question_id VARCHAR(40) NULL,
  target_rf_id       VARCHAR(5)  NULL,
  CONSTRAINT fk_rt_rule     FOREIGN KEY (rule_id)            REFERENCES branching_rules(id) ON DELETE CASCADE,
  CONSTRAINT fk_rt_question FOREIGN KEY (target_question_id) REFERENCES questions(id),
  CONSTRAINT fk_rt_rf       FOREIGN KEY (target_rf_id)       REFERENCES risk_factors(id),
  CONSTRAINT chk_rt_one CHECK (
    (target_question_id IS NULL) <> (target_rf_id IS NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verziované kompiláty — audit trail publish krokov.
CREATE TABLE model_versions (
  id            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  version_label VARCHAR(40)  NOT NULL,
  note          VARCHAR(255) NULL,
  compiled_json LONGTEXT     NOT NULL,
  checksum      CHAR(64)     NOT NULL,  -- SHA-256 kompilátu
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published     TINYINT(1)   NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Výsledky diagnostiky — plné znenie vrátane odpovedí (od 2026-08-05).
-- Kanonická definícia je v db/migrations/2026-08-05-assessment-results.sql.
CREATE TABLE IF NOT EXISTS assessment_results (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  -- UUIDv7: prvých 48 bitov je čas vzniku, takže je chronologicky zoraditeľné
  -- bez ďalšieho stĺpca. Do URL sa NEDÁVA (odhalilo by čas a poradie).
  uuid                CHAR(36)     NOT NULL,
  -- Verejný identifikátor v /r/{hash} — SHA-256, teda 64 hex znakov.
  -- Z hashu sa čas ani poradie odvodiť nedá.
  hash                CHAR(64)     NOT NULL,

  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at        DATETIME     NULL,

  -- Denormalizované polia pre výpisy a filtre v administrácii; plná pravda
  -- je v result_json, tieto sa z neho odvodzujú pri zápise.
  quiz_type           VARCHAR(16)  NOT NULL,
  locale              CHAR(2)      NOT NULL DEFAULT 'sk',
  sector              VARCHAR(64)  NULL,
  size_band           VARCHAR(16)  NULL,
  country             CHAR(2)      NOT NULL DEFAULT 'SK',

  -- NULL je platná hodnota: nemerané skóre sa od scoringu v1.5 nefabrikuje
  -- na nulu (viď SCORING_SPEC §2.2 a §3.2).
  dii_score100        DECIMAL(5,1) NULL,
  dii_score12         TINYINT UNSIGNED NULL,
  dii_measured        TINYINT UNSIGNED NULL,
  ors_score           DECIMAL(5,1) NULL,
  tdri_score          DECIMAL(5,1) NULL,
  ai_score            DECIMAL(5,1) NULL,
  business_impact_eur INT          NULL,
  model_version       VARCHAR(64)  NULL,

  -- Plný ResultSnapshot, odpovede po otázkach a firmografia respondenta.
  result_json         LONGTEXT     NOT NULL,
  answers_json        LONGTEXT     NULL,
  respondent_json     TEXT         NULL,

  -- Len na obranu zápisového endpointu proti zaplaveniu. IP sa ukladá
  -- HASHOVANÁ so soľou z konfigu — surová IP je osobný údaj a na počítanie
  -- requestov za hodinu ju netreba.
  ip_hash             CHAR(64)     NULL,
  user_agent          VARCHAR(255) NULL,

  PRIMARY KEY (id),
  -- Zápis je idempotentný: opakované odoslanie toho istého výsledku
  -- (napr. po obnovení stránky) nesmie vyrobiť duplikát.
  UNIQUE KEY uk_result_hash (hash),
  UNIQUE KEY uk_result_uuid (uuid),
  KEY idx_result_created (created_at),
  KEY idx_result_ip_created (ip_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
