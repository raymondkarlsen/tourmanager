# Tourmanager

Nettsiden for Tourmanager-konkurransen — fire gutter/menn/gubber som har
kjempet om heder og ære siden 2014, én gang i året når Tour de France
sparkes i gang.

Siden er bygget som rene HTML/CSS/JS-filer på GitHub Pages, uten
rammeverk eller byggeverktøy. Alle tall hentes automatisk fra et Google
Sheet, så etter hver etappe holder det å føre inn poengene i regnearket —
resten regner og tegner siden selv.

Live: https://tdf.raymondkarlsen.no

## Slik henger det sammen

**Datakilden er ett Google Sheet** med tre faner, hver publisert som CSV:

- **sesonger** (`aar, person, lagnavn, poeng`) — én rad per person per år.
  Fylles kun for *ferdigspilte* sesonger. Inneværende år står med 0 til
  touren er over.
- **etapper** (`aar, etappe, person, poeng, type`) — føres løpende under
  touren. `type` er terreng (Flat, Kupert, Fjell, Tempo, Lagtempo) og gir
  et lite ikon på sesongsiden.
- **ryttere** — rå rytterstatistikk fra spilleverandøren, valgfri, én fane
  med `aar` + kolonnene slik de kommer.

Alt annet — maratonpoeng (40/30/20/10 etter plassering), gule trøyer,
sammenlagtlister, all statistikk og alle grafer — regnes ut i nettleseren
fra disse dataene. Legger man inn en ny sesong eller etappe, oppdaterer
hele siden seg selv.

Lenkene til de publiserte CSV-ene ligger i `js/config.js`. Endres
regnearket eller publiseres det på nytt, er det eneste stedet lenkene må
oppdateres.

## Filstruktur

| Fil / mappe | Hva |
|---|---|
| `index.html` | Forsiden — mesterboks, kort, og live-ticker under touren |
| `gul-troye.html` | Gule trøyer, genererte trøye-ikoner per vinner |
| `maratontabellen.html` | Maratontabellen med tabell og utviklingsgraf |
| `poengtabellen.html` | Poengtabellen med heatmap, linjegraf og spredningsplott |
| `statistikk.html` | Funfacts — topplister og rekorder, alt utregnet |
| `sesong-for-sesong.html` | Alle sesongene, én tabell per år |
| `sesongen.html` | Detaljside per sesong (`?aar=2026`) — resultater, etappegrafer, rytterdump og tourmanager.no-statistikk |
| `css/style.css` | Alt design: farger, typografi, bokser, tabeller, meny, mobil |
| `js/config.js` | CSV-lenker og faste innstillinger (personer, farger, poeng) |
| `js/motor.js` | Datamotoren: henter CSV, regner ut alt, bygger menyen |
| `data/tourmanager-2026.json` | Ferdig rytterstatistikk, oppdateres av en bot |
| `scripts/hent-tourmanager.py` | Henter og beregner tourmanager.no-statistikk |
| `.github/workflows/hent-statistikk.yml` | Kjører skriptet daglig kl. 06 |
| `assets/` | Logo og bilder |

## Datamotoren (`js/motor.js`)

Hjernen på siden. Lastes av alle sidene og gjør tre ting:

1. Henter de tre CSV-ene og regner ut hele datamodellen — rangeringer,
   maratonpoeng, gule trøyer, sammenlagt, akkumulerte kurver og funfacts.
2. Skiller ferdigspilte sesonger fra en pågående (touren som er i gang):
   under touren hentes løpende stilling fra etappe-fanen, og året telles
   ikke med i maraton/trøyer før det er ferdig.
3. Bygger menyen med ikoner og markerer aktiv side.

Funksjonen `hentTourdata()` returnerer ett objekt med alt siden trenger;
strukturen er dokumentert nederst i fila.

## Tourmanager.no-statistikk

Sesongsiden viser rytterstatistikk fra tourmanager.no — en hyllest til
spillet konkurransen bygger på. Dataene gjelder *alle* ryttere og spillere
der, ikke de fire lagene våre.

En GitHub Action (`hent-statistikk.yml`) kjører hver morgen kl. 06 norsk
tid, henter fra tourmanager.no sitt API (server-til-server, så CORS ikke er
et problem), regner ut oppsummeringer per etappe (toppscorere, best verdi,
kategorikonger m.m.) og committer resultatet til `data/tourmanager-2026.json`.
Siden leser den ferdige fila fra eget domene.

Action-en kan også kjøres manuelt fra Actions-fanen. Den krever «Read and
write permissions» under Settings -> Actions -> General.

## Vedlikehold gjennom sesongen

Etter hver etappe: åpne regnearket, legg til fire rader i **etapper**-fanen
med poeng og terrengtype. Ferdig — siden oppdateres av seg selv.

Når touren er over: før sluttresultatet inn i **sesonger**-fanen (fire
poengsummer), så flytter året fra «pågår» til ferdig sesong overalt.

## Merknad om cache

GitHub Pages og nettlesere cacher aggressivt. Ser man ikke en endring etter
commit + deploy, er det nesten alltid cache — sjekk raskt i inkognito, eller
tving frisk deploy med en liten commit.
