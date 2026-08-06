-- ============================================================================
-- Migrácia 2026-08-05 — politika vetvenia pri „Neviem" a explicitný režim
-- skórovania.
--
-- 1) `branching_rules.on_unknown`
--    Odpoveď „Neviem" dovtedy obchádzala VŠETKY branching pravidlá vrátane
--    skipov, takže respondent, ktorý priznal nevedomosť, dostal najviac
--    otázok — napr. pri type infraštruktúry sa mu nepreskočila ani serverová,
--    ani cloudová vetva. Pravidlo si teraz samo určuje, čo sa má vtedy stať.
--    `apply` znamená „vykonaj akciu, ako keby podmienka platila" — NIE
--    „vyhodnoť podmienku nad prázdnou hodnotou": pri single_choice je hodnota
--    prázdny reťazec (nezabralo by nikdy), pri multi_select prázdne pole
--    (`selected_count <= 1` by zabralo náhodou).
--    Rizikové príznaky sa pri „Neviem" nepriznávajú ani s `apply` —
--    nevedomosť nie je dôkaz o probléme.
--
-- 2) `questions.scoring_mode`
--    Invertované skórovanie sa detegovalo podľa výskytu slova „Invertované"
--    v `scoring_note`, čo je prozaická poznámka pre ľudí a v DB obyčajný TEXT.
--    Preformulovanie alebo preklad tej vety by ticho prepli otázku na
--    štandardné sčítanie záporných hodnôt, teda skóre 0 pre všetkých.
--
-- Spustenie:
--   mysql -h db.r6.websupport.sk -u digitalizuj -p Digitalizuj \
--     < db/migrations/2026-08-05-branching-on-unknown.sql
-- ============================================================================

ALTER TABLE branching_rules
  ADD COLUMN on_unknown ENUM('ignore','apply') NOT NULL DEFAULT 'ignore'
  AFTER reason;

ALTER TABLE questions
  ADD COLUMN scoring_mode ENUM('standard','inverted') NOT NULL DEFAULT 'standard'
  AFTER scoring_note;

-- cx_A05 je jediná invertovaná otázka v banke (možnosti majú záporné skóre).
UPDATE questions SET scoring_mode = 'inverted' WHERE id = 'cx_A05';
