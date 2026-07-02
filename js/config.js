/* Tourmanager — konfigurasjon
   Her bor lenkene til Google Sheets-dataene. Hvis regnearket publiseres på
   nytt og får nye lenker, er dette eneste sted de må oppdateres. */

const KONFIG = {
  // Publiseringslenke til sesonger-fanen (aar, person, lagnavn, poeng)
  sesongerCsv:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTgDssd8EOFK4qai4Isl6FjeGk_Oebq1puvBfi_aUaaA99K0XOsAI30KAPgLzF55gjvcOy5bmcKzTRY/pub?output=csv",

  // Publiseringslenke til etapper-fanen (aar, etappe, person, poeng)
  etapperCsv:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTgDssd8EOFK4qai4Isl6FjeGk_Oebq1puvBfi_aUaaA99K0XOsAI30KAPgLzF55gjvcOy5bmcKzTRY/pub?gid=148988752&single=true&output=csv",

  // Poeng for plassering i en sesong: 1., 2., 3., 4. plass
  maratonPoeng: [40, 30, 20, 10],

  // Deltakerne, i fast rekkefølge for tabeller og grafer
  personer: ["Tony", "Jørgen", "Alex", "Raymond"],

  // Farger per person (samme som i dagens grafer)
  farger: {
    Tony: "#d62728",
    "Jørgen": "#1a1a1a",
    Alex: "#1f77b4",
    Raymond: "#2ca02c",
  },
};
