# Changelog

Všetky významné zmeny v projekte digitalizuj.to sú dokumentované v tomto súbore.

Formát vychádza z [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) a projekt používa [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-08-05

### Šesť chýb opravených; ROI prestalo prisľubovať viac, než vychádza (8. 8. 2026)

- **Hodinová sadzba je odteraz podľa odvetvia.** Na všetky odvetvia sa dovtedy
  používalo 30,8 €/h z NACE J — z najlepšie plateného odvetvia v datasete.
  Zdôvodnenie znelo, že automatizované procesy zastrešuje IT tím; to neobstálo,
  lebo ušetrený čas vzniká tam, kde sa proces vykonáva. **Gastro má 13,0 €/h,
  takže odhad úspory bol nadhodnotený 2,4-násobne** a po oprave klesol o 58 %.
  Sedem z ôsmich odvetví kleslo o 21–58 %. Ušetrené hodiny sa nemenia — mení sa
  ich ocenenie. Zdroj: Eurostat `lc_lci_lev` 2025, SK, celková cena práce
  vrátane odvodov.
- **Celá trieda odporúčaní sa počítala a nikdy nezobrazila.** Stredné riziká
  (`riskMitigations`) mali podľa enginu stáť v roadmape pred strategickými
  iniciatívami — komponent ich ignoroval a renderoval len iniciatívy. Roadmapa
  sa odteraz vykresľuje tak, ako ju engine zostavil.
- **Odpoveď sa dá opraviť.** Doteraz boli odpovede append-only: preklep alebo
  zle prečítaná otázka ostali vo výsledku natrvalo. Pribudol medzistav medzi
  poslednou odpoveďou a výsledkom, v ktorom sa dá vrátiť späť. Stav sa po
  oprave **prehrá od začiatku**, takže vetvenie, rizikové príznaky aj profil
  firmy sa vrátia presne tam, kde by boli pri čerstvom vyplnení.
- **Rozpory v odpovediach sa ponúknu na opravu.** Keď firma uvedie, že
  fakturáciu má plne automatizovanú, a zároveň ju označí za prevažne ručný
  proces, nástroj sa raz spýta, či to tak naozaj je. Bez prahu, bez hodnotenia
  a bez vplyvu na výsledok — odpovede berieme tak, ako ich dá.
- **Lievik opustenia kvízu sa merať nebude.** Nástroj počas kvízu sľubuje, že
  odpovede zostávajú v prehliadači; posielať v tom momente čokoľvek tretej
  strane by ten sľub podkopalo — a je to práve sľub, ktorý drží ochotu
  odpovedať pravdivo o vlastnej bezpečnosti.
- **Dve chyby v kontrolách:** validátor nekontroloval šablóny odporúčaní
  k rizikovým faktorom, hoci ich dokumentácia označovala za kontrolované;
  a dokončenie kvízu obchádzalo vetvu, ktorá naň bola určená.

### Tri otvorené metodické body rozhodnuté — všetky tri zamietnutím (7. 8. 2026)

Spoločný menovateľ nebol „chýbajú dáta", ale **chýba väzba** — a správnou
operáciou bolo tvrdenie odstrániť, nie doplniť odhad.

- **Payback a pásma nákladov: zamietnuté.** `roiEngine` nikdy nevidí výstup
  `recommendationEngine` — úspora sa počíta z ručných procesov, zrelosti,
  veľkosti a objemu fakturácie, nie zo zoznamu odporúčaní. Veta „ak tieto
  zmeny stoja menej než X, vrátia sa" by nevymyslela číslo, ale **vzťah, ktorý
  model nepočíta**, a taký sa nedá poctivo označiť ani ako expertný odhad.
  Karta Business Impact odteraz hovorí priamo, čo číslo je a čo nie je.
- **Z odporúčaní zmizli odznaky „Dopad: n/5" a „Úsilie: n/5".** `impact`
  a `effort` sú interné poradové parametre bez deklarovanej jednotky — nie sú
  to človekodni ani nič overiteľné. Zobrazené vyzerali ako meranie. „Dopad"
  bol navyše natvrdo po slovensky, takže ho český aj anglický používateľ videl
  v slovenčine. Poradie odporúčaní sa nemení; mení sa len to, čo je vidieť.
- **Zber odpovedí po položkách: nebude.** Ani opt-in, ani telemetriou, ani
  externým pilotom. **`pilotCriteria` sa zmazali, nie nahradili** — šesť prahov
  nečítal žiadny engine a nahradiť ich novými by bolo premenovanie vady.
  Dôvody, prečo Cronbachova alfa nesmie byť *prijímacím prahom*, sú
  v METHODOLOGY §13.2 ako argument: závisí od počtu položiek (α = 0,80 žiada
  r̄ = 0,571 pri troch položkách, ale len 0,235 pri trinástich — a kategórie
  tohto modelu majú od 1 do 13), vysoká alfa by tu znamenala redundantný
  dotazník, a vetvenie robí chýbanie odpovedí nenáhodným. Alfa **nie je
  zakázaná metrika** — OECD/JRC ju pre kompozitné indikátory používa ako
  diagnostiku; neobstojí ako prah.
- **Reverse-keyed položky: zamietnuté natrvalo, kvôli formátu banky.** Banka má
  77 položiek a formát súhlas–nesúhlas sa v nej nevyskytuje ani raz —
  acquiescence bias je definovaný práve preň a odporúčaným liekom je nahradiť
  ho konštruktovo špecifickými možnosťami, čo banka už má. Reverse položka by
  teda zaviedla vadu, aby sa dala merať.
- **Vecné jadro toho bodu prechádza inam:** deterministická kontrola rozporov
  nad už existujúcimi dvojicami odpovedí („fakturácia je plne automatizovaná"
  + „fakturáciu robíme prevažne ručne"). Bez novej otázky, bez prahu, ako
  neblokujúca ponuka opravy — nie ako obvinenie z nepozornosti.
- **Popri tom sa našli tri chyby:** `riskMitigations` sa počítajú a nikdy
  nezobrazia; `COMPLETE_QUIZ` je v normálnom toku nedosiahnuteľná; a
  dokumentácia sľubovala payback v „budúcich rozšíreniach", kým iná sekcia
  toho istého súboru ho odmietala. Všetky tri sú v checkliste.

### Skórovanie prestalo trestať firmy za to, že sú malé (7. 8. 2026)

- **Dve otázky merali počet zamestnancov, nie zrelosť.** `cx_DII04` („Máte vo
  firme ICT špecialistov?") a `cx_B05` („Kto spravuje vaše IT systémy?") majú
  vrchné možnosti, ktoré opisujú štruktúru — dedikovaný IT tím s viacerými
  rolami, interný IT plus externý dodávateľ s SLA. Päťčlenná firma ich
  nedosiahne ani pri najlepšom vedení. Dostala teda menej bodov za rozhodnutie,
  ktoré nikdy neurobila. Najlepšou dosiahnuteľnou praxou pri tejto veľkosti JE
  stály externý dodávateľ so zmluvou.
- **Riešenie: veľkostné kotvy** (`size_anchors`). Pre pásmo sa vyhlási najvyššia
  dosiahnuteľná možnosť a rebríček sa prepočíta tak, aby znamenala plný počet
  bodov. **Nula zostáva nulou** — „nikto to nerieši" nie je vlastnosť veľkosti,
  preto sa násobí, nie posúva. Zásah je úzky: dve otázky, tri stropy.
- **Odchýlka je jednosmerná.** Firma, ktorá strop svojho pásma prekročí, dostane
  plný počet bodov vďaka orezaniu. Chybne nízky odhad stropu teda nikomu
  neuberie, nanajvýš je štedrý — a to je jediné, čo túto zmenu drží v medziach,
  lebo kalibračné dáta neexistujú.
- **Zmeraný dopad:** mikrofirmy +0,51 bodu priemerne (max +1,40), malé firmy
  +0,08 (max +0,30), stredné a veľké nula. V 12 000 testovaných kombináciách
  skóre **ani raz nekleslo**. Nálepka zrelosti sa mikrofirme posunie v 4,2 %
  prípadov — rovnaký rád ako pri zmene váh kategórií o ±5 p. b.
- **Dve tvrdenia z pôvodného zadania neobstáli.** `cx_DII04` mala podľa neho
  znižovať aj DII skóre — nemá ako, zo sady v3/2025 je explicitne vylúčená
  (ICT špecialisti sú premenná v4). A `cx_F01`/`ind_13` kotvu nepotrebujú:
  ich vrchná možnosť je pre mikrofirmu dosiahnuteľná, nedosiahnuteľná je až tá
  v strede rebríčka a diera v strede nikoho nezastropuje. Zostáva tam problém
  formulácie („konateľ **popri iných povinnostiach**" platí v štvorčlennej firme
  o každom), ktorý sa rieši textom v MariaDB, nie skórovaním.
- **Otázka na veľkosť firmy sa pridávať nemusela** — `cx_02` aj `ind_02`
  v banke sú, sú povinné a už poháňajú vetvenie NIS2 aj benchmark.
- **Fence vo validátore (#17).** Kotva sa nedá dať na otázku sýtiacu DII
  (premenné Eurostatu sú binárne fakty), na `multi_select` (žiadny rebríček),
  bez zdôvodnenia, na maximum otázky, ani tak, aby strop klesal s veľkosťou
  firmy. Overené negatívnym testom na siedmich poruchách.
- **Replay test odhalil chybu, ktorá tam bola od zavedenia audit trailu.** Krok
  `level` niesol zaokrúhlené penalizované skóre, kým engine úroveň počíta
  z nezaokrúhleného — pri hodnote tesne nad prahom pásma dal rozklad o stupeň
  nižšiu nálepku, než akú ukazovala karta. Kotvy skóre len posunuli na hranicu,
  kde sa to prejaví.
- **Publish z databázy by bol vypol invertované skórovanie `cx_A05`** — teda
  skóre 0 pre všetkých respondentov. Cesta banka → MariaDB → banka strácala
  `scoring_mode` (import ho vôbec neukladal), `anchor_low_sk`, `anchor_high_sk`
  aj `likert_ors_rationale`. Do produkcie sa to nedostalo, lebo publish z DB
  medzitým nebežal. Zoznam stĺpcov je odteraz odvodený z jednej mapy a stráži
  ho test `scripts/db/roundtrip.test.ts`.

### Reliabilita a ročné kotvy: nástroje namiesto čakania (6. 8. 2026)

- **Pilotné kritériá popisujú štúdiu, ktorú systém spustiť nevie.** Štyri
  zo šiestich (`cronbachAlphaMin`, `itemDiscriminationMin`,
  `unknownAnswerRateMax`, `completionRateMin`) potrebujú odpovede po
  položkách alebo počet nedokončených kvízov — ani jedno sa neukladá.
  Je to dôsledok správneho rozhodnutia neuchovávať odpovede, ale znamená to,
  že **čakanie na 200 respondentov samo osebe nepomôže**; potrebné je
  rozhodnutie o zbere. METHODOLOGY §13 to hovorí rovno a ponúka tri cesty
  (opt-in pilot, agregovaná telemetria, externý pilot) s ich cenou.
- **`npm run pilot:readiness`** počíta to, čo z agregátov spočítať ide:
  korelácie ORS↔DII a ORS↔TDRI, **medzikategóriové korelácie A–F** a NPS.
  Tie medzikategóriové sú najcennejšie — odpovedajú, či šesť ODRM oblastí
  meria šesť rôznych vecí, alebo sa duplikujú, a na to odpovede po položkách
  netreba.
- **`npm run data:freshness`** stráži dve ročné kotvy: Eurostat `isoc_e_dii`
  (december) a hodinovú cenu práce (marec). Pri každej vypíše konkrétny
  zoznam krokov, takže decembrová aktualizácia nebude archeológia.
  **Zámerne nesťahuje dáta** — benchmark, ktorý sa zmení sám bez diffu, je
  horší než zastaraný.

### Deploy, váhy a Turnstile brána (6. 8. 2026)

- **Nasadzovací skript je v repozitári a overuje certifikát.** Dovtedy žil len
  v dočasnom adresári — jediná kópia, ktorá by so zmazaním priečinka zmizla —
  a pripájal sa s vypnutou kontrolou certifikátu s poznámkou, že „cert hosting
  nepokrýva". **Certifikát je pritom platný Let's Encrypt** pre
  `*.r6.websupport.sk`; nesedelo len meno, lebo sa skript pripájal na alias
  `ftp.magors.net`. Pripojenie na `ftp.r6.websupport.sk` (tá istá IP) prejde
  **plnou verifikáciou bez jedinej výnimky** — vypnutá kontrola nikdy nebola
  potrebná, len otvárala nahrávanie celej produkcie vrátane `.htaccess`
  a PHP endpointov útoku uprostred spojenia. Nasadenie beží cez `npm run deploy`.
- **Váhy kategórií majú doloženú citlivosť.** Nový `npm run weights:sensitivity`
  posunie každú váhu o ±5 p. b., zvyšné renormalizuje a prepočíta ORS nad
  2 000 kombináciami odpovedí. Výsledok nie je celkom pohodlný: **skóre je
  robustné** (priemerná zmena 0,37–0,86 bodu), ale **maturity level sa
  preklopí v 3–8 % prípadov** — pri kategórii E v jednom z dvanástich. Najviac
  viditeľný výstup je teda ten najkrehkejší; rozdiel jednej úrovne medzi dvoma
  firmami nie je spoľahlivý signál. Metodika to hovorí rovno (§12.2) spolu
  s porovnaním voči CMMI, Acatech, IMPULS a DREAMY a s **protokolom pre ďalšiu
  revíziu váh** (Delphi, nezávislé priradenie, zaznamenaný rozptyl). Verzia
  schémy váh je pri rozklade skóre.
- **Turnstile brána prestala kaskádovať render.** Reset fázy sa presunul
  z efektu do renderu (dokumentovaný vzor „úprava stavu pri zmene propu").
  Predtým sa po znovuotvorení brány najprv vykreslila stará fáza — napríklad
  `error` z predchádzajúceho pokusu — a až potom `loading`. Kľúč resetu je
  zámerne zhodný so závislosťami efektu, takže sa spúšťa presne v tých
  situáciách ako predtým.

### Karta a graf prestali hlásiť dve rôzne čísla (6. 8. 2026)

- **Ročný dopad ignoroval nábeh.** Karta hlásila ustálený run-rate ako
  „€/rok", kým graf na tej istej obrazovke ukazoval v 12. mesiaci o **8–33 %
  menej** — pri konzervatívnom scenári 66,7 %. Dve rôzne čísla pre tú istú vec
  a to väčšie bolo tučným písmom. Pribudlo `firstYearEur`, ktoré sa berie
  **presne z bodu grafu za 12. mesiac**, nie z vlastného výpočtu, takže sa
  rozísť nemôžu. Popisky sú rozlíšené: „Ročný dopad (po nábehu)" a „Z toho
  prvých 12 mesiacov".
- **„Opportunity gap" prestal tvrdiť porovnanie, ktoré sa nepočítalo.** Text
  znel „Výrazný priestor na zlepšenie **oproti priemeru**", ale číslo je
  `(1 − zrelosť/4) × 100` — vzdialenosť od najvyššej úrovne procesnej
  zrelosti, do ktorej žiadny benchmark nevstupuje. Formulácia teraz hovorí,
  čo naozaj meria, a priznáva, z čoho vzniká. Test stráži, aby sa slovo
  „priemer" do tých textov nevrátilo.

### Mikrofirmy sa prestali porovnávať s populáciou, kam nepatria (6. 8. 2026)

- **Eurostat `isoc_e_dii` zbiera podniky od 10 zamestnancov.** Firma s 1–9
  ľuďmi dostávala DII percentil voči rozdeleniu, v ktorom žiadna firma jej
  veľkosti nie je — a keďže to porovnanie nesie značku „meraná distribúcia",
  pôsobilo **dôveryhodnejšie** než expertné odhady vedľa neho, hoci pre ňu
  platí najmenej. Porovnania voči krajine a EÚ teraz pre mikrofirmy nesú
  výhradu priamo pod kartou.
- **Percentil sa počíta ďalej.** Skryť ho by bolo horšie — mikrofirma by
  prišla o jedinú orientáciu, ktorú má. Výhrada vysvetľuje, ako ho čítať.
- **Sektorové a veľkostné porovnania výhradu nedostali.** Sú to expertné
  odhady, ktoré pásmo mikro zámerne pokrývajú; pridať k nim tú istú vetu by
  bol šum, nie presnosť.

### Audit trail sa dá overiť, nie len prečítať (6. 8. 2026)

- **„Každé skóre je auditovateľné a spätne rozložiteľné"** stojí na homepage,
  v metodike aj v štruktúrovaných dátach pre Google. Pod tým tvrdením bola
  tabuľka surových odpovedí: bolo z nej vidieť, ČO respondent odpovedal, ale
  nie AKO z toho vzniklo číslo. Nový rozklad ukazuje aritmetiku — vážený
  priemer v každej oblasti, zloženie do ORS s renormalizovaným menovateľom,
  bezpečnostnú penaltu, porovnanie s prahom pásma a extrapoláciu DII vrátane
  stavu všetkých 12 indikátorov.
- **Replay test v CI** skóre **prepočíta výhradne z krokov trailu** — nesiaha
  na engine ani na banku — a porovná s výstupom enginu na 300 deterministických
  kombináciách odpovedí. Tvrdenie je odteraz doložené, nie deklarované.
- **Test našiel chybu hneď pri prvom behu.** Kroky pôvodne niesli
  **zaokrúhlené** vstupy, takže z rozkladu pôvodné číslo nevyšlo — odchýlka
  0,06 bodu pri ORS a 0,0522 pri penalte. Rozklad, z ktorého nevyjde pôvodné
  číslo, je horší než žiadny: tvrdí niečo, čo neplatí. Kroky teraz nesú
  nezaokrúhlené hodnoty a násobok penalty šesť desatinných miest, lebo sa
  uplatňuje na skóre rádovo 100.
- **Obmedzenia sú priznané v UI.** Na permanentnom odkaze `/r/{hash}` rozklad
  nie je a byť nemôže — odpovede po otázkach sa na server neukladajú. To je
  cena za to, že sa najcitlivejšia časť dát neuchováva, a je napísaná priamo
  pod rozkladom, nie schovaná v dokumentácii.

### Dokumentácia prestala klamať o sebe (6. 8. 2026)

- **Štyri špecifikácie existovali v dvoch rozídených kópiách.**
  `config/model/` je balík pre editorov modelu — ľudí, ktorí do TypeScriptu
  nevidia. Kópie sa udržiavali ručne a `SCORING_SPEC.md` sa rozišla
  o **355 riadkov**: opisovala model **spred 4. 8. 2026** — plochý priemer DII,
  `pureBinary`, nemerané skóre fabrikované na nulu. Teda presne to správanie,
  ktoré scoring v1.5 odstránil. Kópie sa odteraz generujú
  (`npm run docs:sync`) a build kontroluje zhodu (validátor #15).
- **Dekoratívne verzie dokumentov nahradila overiteľná pečiatka.** Každý spec
  mal vlastné číslo (1.1-MVP, 2.0, 2.1…), ktoré nikto spoľahlivo nezvyšoval —
  všetky boli z júla, hoci sa dokumenty odvtedy viackrát prepísali. Číslo,
  ktoré vyzerá autoritatívne a drží ho ruka, je horšie než žiadne: čitateľ mu
  verí. Namiesto neho je pečiatka **„Platí pre"** s verziami zdrojov, ktoré
  dokument opisuje — a tie validátor overuje (#16). Revízia modelu bez
  prečítania dokumentácie odteraz zhodí build.
- **Nový `MODEL_VERSIONS.md`** — história zmien modelu s dopadom na
  **porovnateľnosť** výsledkov (zachovaná / posunutá / prerušená). `CHANGELOG`
  popisuje funkcie pre používateľa; toto je otázka, ktorú si kladie človek
  pozerajúci neskôr na dáta: sú výsledky spred zmeny ešte porovnateľné?

### Scoring parametre v konfigurácii, nie v kóde (6. 8. 2026)

- **Posledné natvrdo písané prahy sú v configu.** Pásma DII na škále 0–12
  (3/6/9), počet indikátorov (12), prahy spoľahlivosti DII (≥10 / ≥6 meraných),
  hranica `medium` pri podiele „Neviem" (0,25) a minimum odpovedí pre
  spoľahlivosť AI indexu (2). Pri prechode DII na v4 (prieskum december 2026)
  sa nebude musieť prehľadávať engine.
- **Zrkadlo configu bolo tichá fikcia.** `config/model/scoringConfig.json`
  README označoval ako „editovateľný: ÁNO", ale **runtime ho nečíta** a bolo
  rozídené: chýbalo v ňom 20 exportov (celá TDRI vrstva, ROI pásma, prahy AI
  aj scenárov) a štyri kľúče mali iné názvy než v kóde. Nikto to
  nekontroloval. Kto tam zmenil prah, nezmenil nič. Odteraz sa **generuje**
  z `data/scoringConfig.ts` (`npm run config:sync`, 26 kľúčov namiesto 15)
  a build kontroluje zhodu — validátor #14, overený negatívnym testom.
  README aj SCORING_SPEC to hovoria rovno.
- **Štyri chyby lintra, ktoré prechádzali buildom, sú preč.** Dve boli reálne:
  - `AssessmentContext` prepisoval **modulovú premennú počas renderu**
    (`activeMarket`). React smie render zahodiť alebo zopakovať, ale zápis
    prežije — hodnota potom pochádza z renderu, ktorý sa nikdy nezobrazil,
    a dva providery si ju prepisujú navzájom. Trh sa odteraz odovzdáva
    v payloade akcie, globálna premenná zmizla.
  - `TurnstileGate` zapisoval do **refu počas renderu**; aktualizácia je
    v efekte, takže ref vždy zodpovedá tomu, čo je naozaj na obrazovke.
  Zvyšné dve sú vedomé výnimky s odôvodnením priamo v kóde: synchrónny
  CookieYes skript (s `async` by merací kód mohol vystreliť pred súhlasom —
  regresia voči GDPR) a reset fázy v Turnstile bráne, ktorej stavový automat
  sa v tomto prostredí nedá odskúšať. Druhá je vedená ako bod v checkliste.

### Referenčná vzorka priznáva, čím je (6. 8. 2026)

- **Vzorka tvrdila pokrytie, ktoré nástroj nevie dosiahnuť.** Všetkých 50
  profilov malo `diiMeasured: 12`, hoci komplexný kvíz pokrýva najviac **10**
  z 12 indikátorov DII a indikatívny **8**. Vzorka teda nikdy nevznikla
  z modelu. Dôsledok bol vidieť priamo vo výsledku: respondent mal „7/12 ·
  odhad z 10 meraných" a vedľa toho porovnávaciu skupinu s plným pokrytím —
  vlastný výsledok tak pôsobil neistejšie než referencia, čo je artefakt
  vzorky, nie zistenie o firme. Každý profil má odteraz dvojicu
  (merané, splnené), ktorá je reálne dosiahnuteľná, a `diiScore12` je z nej
  prepočítané tým istým vzorcom ako v engine. **Kalibrovaná distribúcia sa
  zachovala presne** — 11 profilov zodpovedá indikatívnej vetve (8/12),
  39 komplexnej (10/12) a žiadna hodnota skóre sa meniť nemusela.
- **Texty prestali vzorku vydávať za merané firmy.** „Anonymizované výsledky
  firiem" a „žiadne identifikačné údaje firiem" sa čítajú tak, že existujú
  reálne podniky, ktorých totožnosť chránime. Žiadne neexistujú. Panel pri
  výsledku, stránka `/peers` aj snapshot na `/r/{hash}` teraz hovoria
  o **modelovanej referenčnej vzorke** kalibrovanej na Eurostat DII 2025,
  ktorá slúži na orientáciu, kým nepribudne dosť reálnych hodnotení.
  (Dlhý popis na `/peers` to priznával už predtým — viditeľné texty nie.)
- **Test to stráži do budúcna.** `data/peerData.test.ts` počíta skutočné
  pokrytie priamo z otázkovej banky, takže sa rozbije aj vtedy, keď sa
  pokrytie zmení revíziou otázok a vzorka za ním zaostane.

### Škála 0–10, zámer investovať a spätná väzba (6. 8. 2026)

- **Nový typ otázky `likert_11`** — škála 0–10 s textovými kotvami. Prešiel som
  všetkých 75 otázok a **ani jedna nie je vhodná na konverziu**: každá bodovaná
  otázka v banke má behaviorálne ukotvené možnosti („Máme zdokumentovaný postup
  obnovy"), a to je jej hlavná prednosť — dve firmy s rovnakou praxou vyberú
  rovnakú možnosť. Holé číslo taký referenčný bod nemá. Typ je preto
  **vyhradený pre subjektívny úsudok o budúcnosti** a obmedzenie vynucuje
  validátor (kontrola #13), nie len dokumentácia: inak by sa z neho stal lenivý
  default a banka by sa zosunula z doloženej evidencie na pocitový dotazník.
- **Zámer investovať** (`ind_16_intent`, `cx_F07_intent`) — jediné miesto, kde
  je 0–10 lepšia než ukotvené možnosti, lebo meraná vec **sama je** subjektívna
  pravdepodobnosť. Banka dovtedy merala schopnosť všade a ochotu nikde.
  Zámerne **mimo ORS** (váha 0): skóre hovorí o súčasnom stave a ochota
  investovať ho nemení.
- **ROI má dve brány namiesto jednej.** Optimistický scenár sa dovtedy púšťal
  podľa governance skóre, ktoré slúžilo ako zástupný ukazovateľ pripravenosti
  aj vôle. To bola tichá chyba: governance je kapacita, nie vôľa — firma
  s výbornou organizáciou a nulovou chuťou investovať nezrealizuje nič a
  scenár dostávala. Platí **prísnejšia z brán**, nie priemer: silná stránka by
  inak kryla slabú, hoci úsporu obmedzuje práve tá slabá. Text dôvodu ukazuje
  na tú bránu, ktorá scenár naozaj obmedzila.
- **Hodnotenie testu (0–10) po výsledku** — prvý spätnoväzbový kanál, ktorý
  produkt má. Ukladá sa k existujúcemu riadku výsledku, nie do vlastnej
  tabuľky, aby sa dalo porovnať so skóre, ktoré ho vyvolalo. Odosiela sa hneď
  po kliknutí, bez potvrdzovacieho tlačidla.
- **Opravená tichá strata dát v importe.** `questions.question_type` je ENUM
  a MariaDB v neprísnom režime neznámu hodnotu **neodmietne — uloží prázdny
  reťazec**. Obe nové otázky tak pri prvom importe skončili v databáze bez
  typu, import zbehol bez chyby a rozbil by sa až najbližší publish. ENUM je
  rozšírený a import si zoznam povolených typov odteraz kontroluje sám.
  Overené negatívnym testom.
- **Dĺžka kvízov:** indikatívny 18 → 19, komplexný 57 → 58 otázok.

### Presnosť výpočtu (6. 8. 2026)

- **Zaokrúhľuje sa až zobrazenie.** ORS prechádzal tromi zaokrúhleniami za
  sebou — skóre kategórie na desatinu, z tých zaokrúhlených vážený priemer,
  ten znova, a až z neho maturity level. Drift bol malý (do 0,12 bodu), ale na
  hranici pásma rozhodujúci: v **27 zo 4 000** kombinácií odpovedí dal inú
  nálepku než presná matematika. Z plnej presnosti sa odteraz počíta agregácia,
  prah aj násobok bezpečnostnej penalizácie (pri kategórii E tesne pod 30
  rozhodovala desatina o tom, či penalta vôbec nastúpi), maturity level aj
  konfidenčné pásmo. Zvyškový rozdiel je 0,05 bodu — polovica kroku zobrazenia,
  teda teoretické minimum. Stráži to test, ktorý drží presnú referenčnú
  implementáciu vedľa enginu.
- **Sémantika pásiem maturity je zdokumentovaná a otestovaná.** Porovnáva sa
  ostrým `>`, takže prah patrí do nižšieho pásma: skóre 40,0 je level 1, nie 2.
  Dalo sa to prečítať oboma smermi a hodnota presne na prahu je práve tá,
  o ktorú sa vedú spory.
- **Zrelosť procesov mimo domény 0–4 sa už nepočíta.** `parseInt` prijal aj
  `9` — taká hodnota neskončila chybou, ale tichým nezmyslom: firma na
  „úrovni 9" spadla na fallback 0,65 (teda úroveň 1), dostala rizikovosť
  „nízke" a medzeru 0 %. Neplatná hodnota je odteraz to isté ako chýbajúca,
  `maturityLevel` je `number | null` a volajúci to musí riešiť. Predpoklad
  sa priznáva disclaimerom a stropom dôveryhodnosti, rovnako ako neuvedená
  veľkosť firmy.
- **`getMaturityLevel` odstránená.** Nemala jediného volajúceho a jej návratová
  hodnota −1 nebola platnou úrovňou, takže `manualShareFromMaturity[-1]` by
  dal `undefined`.

### Revízia otázkovej banky 1.6 a konfidenčné pásma (6. 8. 2026)

- **Šesť dvojhlavňových otázok rozdelených na dvanásť.** Pýtali sa na dve veci
  naraz — „počítače a mobily", „výpadok alebo strata dát", „nákupy, faktúry,
  dovolenky" — takže firma, ktorá mala jedno vyriešené a druhé nie, si musela
  vybrať, čo zamlčí. Váhy sa **delia, nie zdvojujú**: súčet oboch polovíc sa
  rovná pôvodnej váhe, inak by téma v priemere kategórie zosilnela dvojnásobne.
  Stráži to test. Rizikové príznaky išli na tú polovicu, ktorá ich dokladá —
  `ind_11` predtým flagovala chýbajúce zálohy aj chýbajúci BC/DR plán z jednej
  odpovede, teraz zálohová polovica flaguje RF02 a prevádzková RF09.
- **Tri nové otázky.** Banka merala zálohy, MFA aj aktualizácie, ale nikde sa
  nepýtala, **čím sú počítače chránené** a **či o tom ľudia niečo vedia** —
  pritom phishing a ransomware sú u malých firiem najčastejší vstupný bod.
  Pribudla otázka na ochranu koncových staníc (flaguje RF11 len pri úplnej
  absencii ochrany) a na bezpečnostné školenia (zámerne **bez** rizikového
  príznaku: medzi 14 faktormi žiadny o povedomí nie je a zavedenie nového by
  prepočítalo menovateľ TDRI, teda zmenilo rizikové skóre všetkým doterajším
  výsledkom). Tretia otázka dopĺňa manuálne procesy do **indikatívnej vetvy** —
  dovtedy indikatívne ROI vždy počítalo z benchmarkových defaultov, takže dve
  firmy s desaťnásobne odlišnou mierou ručnej práce dostali rovnaký odhad.
- **Rola respondenta ako premenná** — len v komplexnom kvíze. Kto dotazník
  vypĺňa, systematicky posúva odpovede: majiteľ pozná procesy a preceňuje stav
  IT, správca naopak. Meta otázka s váhou 0, do skóre nevstupuje.
- **Dĺžka kvízov:** indikatívny 15 → 18 otázok, komplexný 50 → 57. Rola sa do
  indikatívneho zámerne nepridala — je to vstup do lievika a jeho dĺžka
  rozhoduje o tom, koľko ľudí diagnostiku vôbec dokončí. Test stráži strop 20.
- **Reverse-keyed položky odložené do P2.** Ich účel je detekcia acquiescence
  bias a straightlingu, čo sa dá vyhodnotiť až pri 100+ hodnoteniach — teda na
  rovnakom horizonte ako Cronbachova alfa. Dovtedy by sa platilo dlhším kvízom
  a mätúcimi formuláciami bez akéhokoľvek výnosu.
- **Konfidenčné pásma.** 18-otázkový a 51-otázkový výsledok vyzerali rovnako
  isto. Nie je to interval spoľahlivosti — ten by vyžadoval pilotné dáta, ktoré
  neexistujú — ale **deterministický rozsah z toho, čo dotazník nezistil**. Pri
  DII je to logická hranica: nemeraný indikátor môže byť splnený aj nesplnený,
  takže skutočný počet leží medzi „všetky nemerané nesplnené" a „všetky
  splnené". Pri ORS je to citlivosť na jednu odpoveď: kategória meraná jedinou
  otázkou sa pohne o celý stupeň škály, kategória so šiestimi o zlomok. Rozsah
  sa v UI ukáže len vtedy, keď je širší než bod.

- **Opravy z nezávislej kontroly revízie.** Adversariálna kontrola v piatich
  optikách našla šesť vecí, ktoré by inak išli live:
  - **Penalizované ORS padalo mimo vlastného rozsahu.** Karta vypisuje skóre po
    bezpečnostnej penalizácii, pásmo sa počítalo z nepenalizovaného — firma so
    slabou bezpečnosťou videla „28/100" a hneď pod tým „Rozsah 35–46". Pásmo
    prejde odteraz tou istou penaltou ako bod; stráži to test nad reálnou bankou.
  - **„Žiadny ručný proces" znamenalo vyšší odhad úspor.** Odpoveď „všetko máme
    digitalizované" sa filtrovala na prázdny zoznam, nerozoznateľný od
    nezodpovedanej otázky, takže ROI spadlo na tri **predpokladané** procesy:
    3 203 €/rok oproti 1 940 € pre firmu, ktorá jeden ručný proces priznala.
    Monotónnosť bola obrátená. Nerozpoznaná hodnota naďalej spúšťa defaulty —
    to je rozbité mapovanie, nie neexistujúca ručná práca.
  - **Ochrana koncových staníc prestala flagovať RF11.** Faktor sa volá „Žiadne
    logovanie/monitoring" a jeho odporúčanie znie „Zapnite logovanie" — firma
    s proaktívnym monitoringom, ale bez antivírusu by dostala radu, ktorá jej
    medzeru nerieši. Vysvetlenie v poli `reason` sa navyše pri `flag_risk`
    zahadzuje. Rovnaký dôvod ako pri školeniach: vhodný faktor neexistuje.
  - **Rozdelenie ind_11 stratilo riziko pri viacdňovom výpadku.** Pôvodná otázka
    flagovala RF09 aj pri „stáli by sme dni/týždne"; po rozdelení zostalo
    pravidlo len na najhoršej možnosti, takže riziko prepadlo z potvrdeného
    (6,3 b) na odvodené (2,2 b). Pravidlo je späť.
  - **Web sľuboval 15-otázkový kvíz.** Počty v pätnástich reťazcoch (výber kvízu,
    FAQ — ktorá ide aj do štruktúrovaných dát pre Google, SEO popisy, metodika,
    popisy kvízov v banke) zostali na starých hodnotách. Dorovnané na 18 / 49–57
    vrátane odhadov trvania.
  - **Rozsah DII karty sa dal čítať ako body.** Veľké číslo je `score100`, pásmo
    je v indikátoroch 0–12 — spoločný text „Rozsah 4–8" pod „48/100" zvádzal.
    Obe pásma majú odteraz jednotku v texte.

### Retencia a výmaz výsledkov (6. 8. 2026)

- **Uložené výsledky sa mažú po 24 mesiacoch.** Dovtedy nič staré záznamy
  neodstraňovalo — dáta by tam zostali, kým by ich niekto ručne nezmazal, a
  text o súkromí by sľuboval niečo, čo sa technicky nedialo. Hosting nemá
  cron ani zapnuté MariaDB EVENT, takže mazanie visí na zápise: každý uložený
  výsledok odstráni dávku prezretých riadkov. Znamená to, že bez prevádzky sa
  nemaže nič — lehota je **najviac** 24 mesiacov od posledného zápisu, nie
  presne 24. Prune beží až po odoslaní odpovede a vo vlastnom `try`, aby
  zlyhanie údržby nikdy nezhodilo uloženie výsledku, ktorý používateľ práve
  dokončil.
- **Výsledok sa dá zmazať.** Predtým neexistovala žiadna cesta — ani pre
  používateľa, ani pre prevádzkovateľa okrem ručného zásahu v databáze —
  takže právo na výmaz sa nedalo uplatniť. Nový endpoint
  `api/result-delete.php` a tlačidlo na oboch miestach, kde používateľ hash
  vidí: pri permanentnom odkaze hneď po kvíze a na stránke `/r/{hash}`.
  Maže obe kópie naraz, serverovú aj tú v prehliadači; lokálnu až po tom, čo
  server výmaz potvrdí, aby sa nestratil prístup k záznamu, ktorý ďalej žije.
  Autorizáciou je znalosť hashu — rovnaký model ako pri čítaní. Vedomý
  dôsledok: komu odkaz prepošlete, ten výsledok môže aj zmazať. Silnejšia
  autorizácia by znamenala účty a prihlasovanie, čo je pre anonymnú
  diagnostiku horší kompromis než toto riziko.
- **Texty hovoria obe veci.** FAQ (ide aj do štruktúrovaných dát pre Google),
  upozornenie v kvíze aj panel o súkromí pri odkaze dopĺňajú lehotu a možnosť
  výmazu v sk/cs/en. Dovtedy opisovali len to, ČO sa ukladá — nie ako dlho a
  ako sa toho zbaviť.

### Ukladanie a zdieľanie výsledkov (5. 8. 2026)

- **Výsledky sa ukladajú na server.** Do tohto dátumu výsledok neopustil
  prehliadač, takže permanentný odkaz aj QR kód fungovali len na tom jednom
  zariadení. Nová tabuľka `assessment_results` v MariaDB drží **len agregáty**
  — vypočítané skóre, firmografiu a odvodené odporúčania. **Odpovede po
  jednotlivých otázkach sa neukladajú:** boli určené pre administráciu, tá bola
  zrušená, takže by sa najcitlivejšia časť dát uchovávala bez účelu.
  `localStorage` zostáva ako prvá, okamžitá vrstva. Zápis ide cez
  `api/result-save.php` (strop 512 kB, kontrola tvaru hashu aj UUID, 20 zápisov
  z IP za hodinu, idempotencia), čítanie cez `api/result.php`. Uložený
  záznam neobsahuje ani IČO, ani kontakt — z odkazu sa firma identifikovať
  nedá.
- **Zmena sľubu o súkromí.** Web na štyroch miestach tvrdil, že sa nič
  neodosiela na server (vrátane FAQ, ktorá šla aj do štruktúrovaných dát pre
  Google). Texty sú prepísané v sk/en/cs tak, aby zodpovedali skutočnosti:
  odpovede zostávajú v prehliadači, na server ide len výsledné skóre pod
  náhodným kódom. Retenčná lehota a spôsob výmazu zatiaľ **chýbajú** —
  automatické mazanie nie je nastavené.
- **Permanentné odkazy prestali vracať 404.** Statický export vie vyrobiť
  stránku len pre vopred známe hashe, takže vlastný výsledok návštevníka
  končil na chybovej stránke skôr, než sa stihol spustiť komponent, ktorý ho
  číta. Export teraz vyrába generickú stránku `/{jazyk}/r/view.html` a
  `.htaccess` na ňu neznáme hashe interne prepisuje.
- **Nový formát identifikátora** — 64 hex znakov, SHA-256 z UUIDv7 a náhodnej
  soli. UUIDv7 sa ukladá vedľa hashu ako chronologický zoraďovací kľúč; do URL
  ide len hash, z ktorého sa čas ani poradie odvodiť nedá. Staršie formáty
  zostávajú platné.

### Presnosť modelu — P1 opravy (5. 8. 2026)

- **Inverzia penált v TDRI.** Závažnosť sa počítala dvakrát, takže potvrdené
  stredné riziko skórovalo **nižšie** než to isté riziko iba odvodené z
  nízkeho skóre — priznanie problému sa oplatilo menej než dohad a zlepšenie
  odpovede vedelo index rizika zvýšiť. Teraz sa násobí len sila dôkazu.
- **Škála TDRI má dosiahnuteľných 100** (predtým ~93, takže pásmo „kritické
  61–100" bolo fakticky 61–93). Menovateľ sa počíta z definícií, nie z literálu.
- **Percentil DII už nemá posun o tretinu pásma.** Firma presne na mediáne
  videla na jednej karte „odchýlka 0,0" vedľa percentilu 55; teraz je percentil
  inverziou mediánu a platí, že medián = 50. percentil.
- **Porovnanie podľa veľkosti firmy** (`diiVsSize`, `orsVsSize`) a voči
  domácemu trhu (`orsVsCountry`). Veľkosť sa dovtedy zbierala, odovzdávala do
  enginu a tam zahadzovala — päťčlenná firma sa porovnávala s rovnakým
  mediánom ako dvestočlenná.
- **ROI reaguje na zbierané vstupy.** Objem fakturácie prebíja benchmarkovú
  frekvenciu, počet administratívcov funguje ako strop kapacity. Dve firmy s
  desaťnásobne odlišným objemom faktúr dostávali dovtedy identické číslo.
- **Sklad, servis a nákup sa konečne počítajú** — ich hodnoty sa volali inak
  než benchmarky, takže sa odfiltrovali a nahradili defaultmi.
- **Optimistický scenár sa skrýva** pri nízkej alebo nezmeranej organizačnej
  pripravenosti (a pri neuvedenej veľkosti firmy). Predtým sa k nemu len
  pridával disclaimer, ktorý číslo nijako nekrotil.
- **Benchmark dáta majú jeden zdroj pravdy** a build ich stráži. Drift bol
  reálny: editovateľná kópia nemala celý blok ČR, hoci runtime s ním počítal.
- **Priznaný pôvod referenčných hodnôt** — karty sú rozdelené na merané
  Eurostat dáta a expertné odhady; sektorové a veľkostné mediány dovtedy
  vyzerali rovnako dôveryhodne ako meraná distribúcia.

### Kvíz a meranie — P1 opravy (5. 8. 2026)

- **„Neviem" prestalo obchádzať vetvenie.** Odpoveď „Neviem" preskočila
  vyhodnotenie všetkých branching pravidiel, takže respondent, ktorý priznal
  nevedomosť, dostal **najviac** otázok — pri type infraštruktúry sa mu
  nepreskočila serverová ani cloudová vetva. Každé pravidlo si teraz politiku
  určuje samo poľom `on_unknown` (`ignore` / `apply`). `apply` znamená
  „vykonaj akciu", nie „vyhodnoť podmienku nad prázdnou hodnotou" — inak by sa
  jednovýberové a viacvýberové otázky správali rôzne. Rizikový príznak sa pri
  „Neviem" nepriznáva ani s `apply`: nevedomosť nie je dôkaz o probléme.
- **Preskočené otázky sa už nerátajú proti respondentovi.** Spoľahlivosť
  kategórie sa počítala z počtu *všetkých* otázok kategórie, takže adaptívny
  kvíz sám znižoval dôveryhodnosť vlastného výsledku — firma, ktorá odpovedala
  na všetko, čo dostala, mohla mať `low`, lebo jej vetvenie polovicu otázok
  odfiltrovalo. Menovateľom je odteraz to, čo sa reálne spýtalo. Preskočené
  otázky sa zapisujú s príznakom a dôvodom, takže sa dá odlíšiť „Neviem" od
  „nikdy sme sa nespýtali"; ukazovateľ postupu ich už nepočíta ani do
  čitateľa, ani do menovateľa.
- **Invertované skórovanie je explicitné pole**, nie slovo v poznámke.
  `cx_A05` (koľko procesov robíte ručne) sa rozpoznávala podľa výskytu slova
  „Invertované" v prozaickom komentári pre ľudí. Preklad alebo preformulovanie
  tej vety by otázku ticho prepli na štandardný súčet záporných hodnôt, teda
  skóre 0 pre všetkých. Nové `scoring_mode` je v banke, DB schéme aj importe.
- **Build kontroluje branching podmienky.** Preklep v podmienke sa dovtedy
  prejavil jediným spôsobom: pravidlo mlčky nikdy nezabralo. Kontrola #12
  overuje, že podmienka je pre parser zrozumiteľná, sedí s typom otázky
  (`value` vs. `selected`) a odkazuje na hodnotu, ktorú otázka ponúka.

### Ostatné

- **Reklamný slot** nesie skutočnú kreatívu s meraním zobrazení aj kliknutí
  (dovtedy sa merali len kliknutia, takže sa nedal počítať CTR).
- **Jednotná šírka obsahu** naprieč celým webom vrátane kvízu a pätičky.
- **Ikony odstránené** (5. 8. 2026) — favicon aj generovaná PNG ikona, kým
  nevznikne nová vizuálna identita. Dôsledok: PWA je dovtedy neinštalovateľná.
- **Meranie prepnuté** na GA4 property `G-VY93FHZ43M`.
> Podrobná história jednotlivých krokov žije v git logu; sem patrí
> konsolidovaný obraz toho, čo verzia 1 prináša.

### Metodika a model

- **Dvojvrstvový model merania** — DII-Compatible Layer (12 premenných
  Eurostat DII, dataset `isoc_e_dii` verzia 3, prieskum 2025) + Operational
  Digital Readiness Model so 6 váženými oblasťami A–F (20/20/15/15/20/10 %).
  Benchmark SK 41,6/32,0/20,4/6,0 % vs EÚ-27 27,9/34,5/27,5/10,1 %.
- **Per-indikátorová DII agregácia (scoring v1.5)** — mapovanie otázok na
  12 indikátorov v3/2025 s odôvodnenými prahmi (`data/diiIndicators.json`),
  striktné vylúčenie otázok mimo v3, extrapolovaný `score12` s priznaným
  pokrytím (komplexný kvíz 10/12, indikatívny 8/12) a 12-riadkový audit
  trail indikátorov vo výsledku.
- **Nezmerané ≠ nula (scoring v1.5)** — nemeraná ODRM kategória má `null`
  skóre a do ORS nevstupuje (renormalizácia váh cez merané kategórie —
  koniec fantómového stropu pri preskočených kategóriách); odporúčania a
  ROI disclaimer sa nespúšťajú nad nemeranými dátami; peer snapshoty v2
  (`schemaVersion: 2`) ukladajú N/A ako `null` a staršie v1 snapshoty sa
  zobrazujú s poznámkou o staršej metodike.
- **Otázková banka v1.5** — 65 otázok s adaptívnym branchingom (15 alebo
  43–49 podľa vetvy), kontext 2026: NIS2 a zákon č. 366/2024 Z. z., povinná
  B2B e-fakturácia od 1. 1. 2027 (Peppol, EN 16931), AI Act. Normalizácia
  35 ad-hoc škál na deklarované (`scale` + zdôvodnenie odchýlok).
- **14 rizikových faktorov (RF01–RF14)** a Technical Debt & Risk Index ako
  samostatná dimenzia — kritické riziká nemiznú v priemernom skóre. K tomu
  prierezový AI & Automatizácia Readiness index.
- **Business Impact ako tri krivky** — konzervatívny/reálny/optimistický
  scenár s ramp-up 9/6/3 mesiacov na 24-mesačnom horizonte. Hodinová cena
  práce 30,8 €/h (Eurostat `lc_lci_lev` 2025, NACE J), dotazník sa na mzdy
  nepýta.
- **Validátor modelu v builde** — 12 tried integritných kontrol (vrátane
  úplnosti a vyhodnotiteľnosti DII mapovania, zrkadlenia benchmarkov,
  referenčnej integrity a zrozumiteľnosti branching podmienok); pri prvom
  behu odhalil odpojený rizikový faktor RF08.

### Výsledky a zdieľanie

- Automatický **QR kód + permanentný odkaz** hneď po dokončení kvízu:
  16-znakový base62 hash, `/r/[hash]` s anonymizovaným snapshotom; plný
  výsledok zostáva len v prehliadači používateľa.
- Výsledkový dashboard: DII vs. EÚ a SK, radar 6 oblastí, risk panel,
  business impact s audit trailom, prioritizovaná roadmapa v 3 fázach.
  Benchmark tabuľka 50 anonymizovaných profilov na `/peers`.

### Dizajn a UX

- Apple-style vizuálny jazyk naprieč webom; aurora pozadie so spojitým
  gradientom (žiadny šev medzi sekciami) a svetelná stopa za kurzorom
  (kométa + guľôčka presne na kurzore) na celej úvodnej stránke.
- Živá výsledková karta: strieda 4 ukážkové profily a pri skrolovaní sa
  roztrhne na 5 zvislých pásov aj s textom — CSS scroll-driven animácia
  na kompozítore, `prefers-reduced-motion` rešpektované.
- Mobile-first: kartové zoznamy namiesto tabuliek, 44 px dotykové plochy
  (WCAG 2.2), ovládač veľkosti textu 100/125/150 % na desktope.

### Viacjazyčnosť

- Tri trhy — Slovensko, Česko a EÚ: voľba vlajky určuje jazyk AJ referenčné
  čísla (sk→SK benchmark, cs→ČR benchmark s Eurostat DII 2025 dátami ČR —
  medián 5,6, tesne nad priemerom EÚ; EÚ vlajka→angličtina + priemer EÚ-27).
  Routy pod `/{locale}`, inline SVG vlajky, negociácia koreňa podľa
  Accept-Language.
- UI chrome preložený vo všetkých komponentoch (232 kľúčov/jazyk, overená
  parita); `Intl` formátovanie odvodené od jazyka. Obsahová vrstva (texty
  otázok, odporúčania) sa prekladá v ďalšom kroku cez databázu.

- **Ponuka jazyka podľa krajiny návštevníka** — GeoIP hostingu
  (Cloudflare CF-IPCountry) cez same-origin ; nenásilný banner
  v cieľovom jazyku namiesto tvrdého redirectu (geo redirecty rozbíjajú
  SEO aj cache). Manuálna voľba jazyka (vlajky alebo banner) sa pamätá
  rok v cookie a koreňová negociácia ju číta pred Accept-Language.

### SEO a viditeľnosť

- Self-canonical každej mutácie s preloženými metadátami, plný hreflang
  cluster + x-default, sitemap so 4 jazykmi homepage; nepreložené
  podstránky canonicalizujú na `/sk` verziu (poctivý signál duplicity).
- Viditeľné FAQ (7 otázok vrátane e-fakturácie a NIS2) stavané z tých
  istých kľúčov ako FAQPage schéma; nová verejná stránka `/sk/metodika`.
- AI vyhľadávače: `llms.txt`, explicitné povolenia crawlerov, JSON-LD graf
  s lokalizovaným `inLanguage`.
- Core Web Vitals: variabilný font (3 preloady namiesto 13), immutable
  cache statických assetov, recharts mimo homepage bundle.

### Databáza a správa obsahu

- Otázková banka v **MariaDB 11.4** — 13 tabuliek s referenčnou integritou;
  podmienky vetvenia surovo aj štruktúrovane; i18n stĺpce pripravené na
  preklad obsahu.
- **Publish s integritnou bránou**: phpMyAdmin → `publish.php` (SQL kontroly
  odmietnu nekonzistentný model) → verziovaný artefakt `/model/v{N}.json`.
  Kompilát hĺbkovo zhodný s pôvodným JSON; PHP a Node kompilátory bajtovo
  identické (SHA-256).
- `npm run model:pull` — artefakt → repo s validáciou a rollbackom.

### Hosting a nasadenie

- Statický export (`output: 'export'`, 231 stránok) pre Apache/PHP
  webhosting; `.htaccess` preberá bezpečnostné hlavičky (CSP, HSTS…),
  legacy 301, jazykovú negociáciu s `Vary` a mapovanie čistých URL.
- Staging `app.magors.net` s `X-Robots-Tag: noindex` počas prípravy;
  FTPS deploy s resume; bajtovo overená zhoda nasadenia s buildom.
- **Produkčná doména `matpex.sk` spustená (3. 8. 2026)** — nový FTP účet aj
  nová databáza `Digitalizuj` (rotované prihlasovacie údaje aj publish
  token); pôvodný docroot niesol aktívny WordPress, ktorý bol pred
  nasadením appky odstránený. Staging noindex blok sa na produkcii
  nepoužíva, canonicaly mieria priamo na `matpex.sk`.
- **Cloudflare Turnstile pred spustením kvízu** — výzva sa overuje SERVEROVO
  (PHP → siteverify), takže samotný klientsky callback bránu neotvorí. Token
  je jednorazový, viazaný na akciu aj na hostname. Pred zdieľaným výsledkom
  (`/r/<hash>`) je widget tiež, ale vedome len ako UX prvok, nie ochrana:
  tie stránky sú statické súbory a ten istý anonymizovaný dataset verejne
  stojí na `/peers`. Na botov slúži WAF v Cloudflare, nie táto výzva.
- Značka rozlíšená: `digitalizuj.to` je marketingový názov nástroja,
  `MATPEX SK` je spoločnosť, ktorá za projektom stojí — premietnuté do
  štruktúrovaných dát (Organization vs. WebApplication) aj do názvu karty
  prehliadača.
- **Meranie návštevnosti (GA4) so súhlasom vopred** — Google Analytics 4 sa
  načíta až po udelení súhlasu; bez neho na Google neodíde ani IP adresa.
  Rozhodnutie je meraný záver, nie opatrnosť: v režime „denied" by pingy
  odchádzali, ale do reportov by sa dostali výlučne cez behaviorálne
  modelovanie od 1 000 súhlasiacich používateľov denne — prah pre web tejto
  veľkosti nedosiahnuteľný, čiže dáta von a reporty prázdne. Preklik na
  spodný reklamný banner sa meria ako `select_promotion`.
- Súkromie ako architektúra: odpovede sa nikdy neodosielajú na server,
  DB drží len obsah modelu. Meranie návštevnosti (GA4) sa načíta až po
  udelení súhlasu — dovtedy na Google neodchádza nič, ani IP adresa;
  obsah odpovedí sa nemeria nikdy.

### Kvalita a testy

- Vitest v projekte — prvých 16 jednotkových testov (roiEngine) vrátane
  opravy miešania hodnôt `ind_05` do manuálnych procesov.
- Bezpečnostný a výkonový audit; multi-agentové revízie dizajnu, otázkovej
  banky aj SEO s adversariálnou verifikáciou nálezov.

### Známe obmedzenia

- Benchmark hodnoty pre sektor/veľkosť firmy a Operational Readiness mediány sú expertné odhady, nie empirické dáta z vlastného datasetu.
- ROI model odhaduje len potenciál úspor (bez investičných nákladov, bez adopčnej krivky) — výstup je ročný run-rate po plnej implementácii.
- Mikrofirmy (< 10 zamestnancov) nie sú pokryté Eurostat DII dátami.
- Self-reported dáta bez nezávislej verifikácie.
- DII skóre je aproximácia (plochý priemer označených otázok), nie per-indikátorová agregácia podľa oficiálnej Eurostat metodiky — podrobnosti v `SCORING_SPEC.md` §2.
- CS/EN mutácie majú preložené rozhranie, obsahové podstránky zatiaľ po slovensky. ROI hodinová sadzba je zatiaľ jednotná (SK NACE J 30,8 €/h) — per-trh sadzby sú v pláne (ČR 2025: 34,9 €/h už zresearchované).
- Ďalšie otvorené položky sledované v `IMPROVEMENT_CHECKLIST.md`.

### Technológie

Next.js 16 (App Router, statický export) · React 19 · TypeScript 5 · Tailwind CSS 4 · Recharts 3 · next-intl · React Context + `useReducer` · Vitest · MariaDB 11.4 (obsah modelu; publish cez PHP 8) · Apache 2.4 + `.htaccess` — výpočty bežia plne client-side, odpovede neopúšťajú prehliadač.
