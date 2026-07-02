# Tourmanager

Nettsiden for Tourmanager-konkurransen vår — fire gutter/menn/gubber som har
kjempet om heder og ære siden 2014.

Siden er bygget som rene HTML/CSS/JS-filer på GitHub Pages, og alle tall
hentes automatisk fra et Google Sheet. Etter hver etappe legges poengene
inn i regnearket, og hele siden oppdaterer seg selv.

## Struktur

| Fil/mappe | Hva |
|---|---|
| `index.html` | Forsiden |
| `gul-troye.html` m.fl. | Undersidene (én HTML-fil per side) |
| `css/style.css` | Alt design: farger, typografi, bokser, tabeller |
| `js/config.js` | Lenkene til Google Sheets-dataene og faste innstillinger |
| `assets/` | Logo og bilder |

## Datakilden

Ett Google Sheet med to faner, publisert som CSV:

- **sesonger**: `aar, person, lagnavn, poeng` — én rad per person per år
- **etapper**: `aar, etappe, person, poeng` — føres løpende under touren

Alt annet (maratonpoeng, gule trøyer, sammenlagtlister, statistikk og
grafer) regnes ut av nettsiden selv.
