-- ============================================================================
-- Migrácia 2026-08-05 — ukladanie výsledkov diagnostiky na server.
--
-- Do tejto chvíle sa výsledky nikam neposielali: žili len v pamäti prehliadača
-- a v localStorage návštevníka. Dôsledok bol, že permanentný odkaz aj QR kód
-- fungovali výlučne na tom istom zariadení a administrácia nemala čo zobraziť.
--
-- POZOR — zmena povahy dát: tabuľka obsahuje vypočítaný výsledok.
-- Stĺpec `answers_json` zostáva ZÁMERNE PRÁZDNY: odpovede po otázkach sa
-- od 5. 8. 2026 neukladajú (boli tu pre zrušenú administráciu, takže by sa
-- najcitlivejšia časť dát uchovávala bez účelu). Stĺpec sa nechal v schéme,
-- aby sa dal zápis obnoviť bez migrácie, ak preň vznikne účel a právny základ.
--
-- Ukladanie výsledku je zmena oproti pôvodnému sľubu „nič sa neodosiela na
-- server", takže texty na webe (FAQ, poznámka v kvíze, panel zdieľania) boli
-- v rovnakom kroku upravené. Retenčná lehota je vecou prevádzkovateľa —
-- technicky nie je nastavené automatické mazanie.
--
-- Spustenie:
--   mysql -h db.r6.websupport.sk -u digitalizuj -p Digitalizuj \
--     < db/migrations/2026-08-05-assessment-results.sql
-- ============================================================================

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
