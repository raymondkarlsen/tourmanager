/* Delt sesonginfo: kort oppsummering av det virkelige Tour de France og
   trøyevinnere per år. Brukes av både sesong-for-sesong.html og sesongen.html
   slik at tekst og tagger holdes synkronisert på tvers av sidene. */

/* Kort oppsummering av det virkelige Tour de France det aktuelle året. */
const AARSOPPSUMMERING = {
  2026: `Tadej Pogačar tok en historisk femte sammenlagtseier og føyde seg inn
    på lista over legender som Merckx og Hinault. Denne gangen var det Remco
    Evenepoel som måtte ta til takke med andreplassen, mens unggutten Isaac del
    Toro imponerte stort og snappet både 3. plass og ungdomstrøya i sin debut.
    Kampen om klatretrøya ble en real duell mellom Richard Carapaz og Valentin
    Paret-Peintre, og Mathieu van der Poel stakk til slutt alene av gårde og tok
    en spektakulær etappeseier på Champs-Élysées. Norske øyeblikk manglet det
    heller ikke på: Søren Wærenskjold vant en spurt, og Torstein Træen fikk til
    og med gå noen dager i den gule trøya.`,
  2014: `Vincenzo Nibali dominerte etter at både Chris Froome og Alberto
    Contador måtte bryte i kjølvannet av velt. Italieneren vant fire etapper
    og kjørte inn til en overlegen sammenlagtseier med over sju minutter.
    Med det ble Nibali en av de svært få som har vunnet alle tre
    Grand Tour-rittene.`,
  2015: `Chris Froome tok sin andre sammenlagtseier og holdt unna for Nairo
    Quintana, som tettet forspranget i fjellene mot slutten. Froome sikret
    seg også klatretrøya. Rittet ble preget av dopingmistanke og et fiendtlig
    publikum, og på et tidspunkt fikk Froome kastet urin på seg.`,
  2016: `Chris Froome vant sin tredje Tour med full kontroll i både tempo og
    fjell. Etappen opp Mont Ventoux ble legendarisk da Froome måtte løpe et
    stykke til fots etter en velt i kaoset blant tilskuerne. Team Sky styrte
    rittet fra start til mål.`,
  2017: `Chris Froome vant for fjerde gang, men dette var en av de jevneste
    utgavene på lenge. Bare 54 sekunder skilte ned til Rigoberto Urán på
    2. plass, og hele pallen var tettpakket. Froome vant uten å ta en eneste
    etappe, men var jevnest av alle.`,
  2018: `Geraint Thomas steg ut av rollen som hjelperytter og vant sin første
    Tour. Waliseren tok to strake fjelletapper i Alpene og kontrollerte
    resten av veien. Lagkameraten Chris Froome endte på 3. plass, og Team Sky
    vant nok en gang.`,
  2019: `Egan Bernal ble den første colombianske vinneren og den yngste på
    over 100 år, bare 22 år gammel. Han overtok den gule trøya fra Julian
    Alaphilippe, som hadde ledet overraskende lenge. Dramatisk vær med ras og
    hagl gjorde at flere avgjørende fjelletapper ble kortet ned eller stoppet.`,
  2020: `I en av de mest dramatiske avslutningene noensinne snudde Tadej
    Pogačar hele rittet på den nest siste etappen. Den 21 år gamle slovenaren
    knuste landsmannen Primož Roglič på tempoetappen opp La Planche des
    Belles Filles. Dermed ble Pogačar den yngste etterkrigsvinneren.`,
  2021: `Tadej Pogačar fulgte opp med en knusende seier og ledet rittet fra
    åttende etappe. Han vant sammenlagt med over fem minutter og tok i tillegg
    både klatretrøya og ungdomstrøya. Mark Cavendish tangerte Eddy Merckx'
    rekord med sin 34. etappeseier.`,
  2022: `Jonas Vingegaard brøt Pogačars herredømme etter et avgjørende angrep
    på Col du Granon, der slovenaren sprakk fullstendig. Dansken bekreftet
    seieren med sterk kjøring i Pyreneene. Dette markerte starten på en av
    tidenes største rivaliseringer.`,
  2023: `Jonas Vingegaard forsvarte tittelen og distanserte Pogačar for alvor
    på tempoetappen på 16. etappe. Duellen mellom de to stjernene fenget
    publikum gjennom hele rittet. Til slutt ble avstanden ned til Pogačar stor.`,
  2024: `Tadej Pogačar tok tilbake tronen med en av de mest dominerende
    sesongene på mange år. Han fullførte den sjeldne dobbelen ved å vinne både
    Giro d'Italia og Tour de France samme år. Med seks etappeseire satte han
    en definitiv stopper for Vingegaards regjeringstid, og rittet endte i Nice
    på grunn av OL i Paris.`,
  2025: `Tadej Pogačar sikret sin fjerde sammenlagtseier med suveren kjøring i
    høyfjellet, blant annet på Hautacam og Peyragudes. Jonas Vingegaard ble
    nummer to, mens Florian Lipowitz overrasket stort med 3. plass. Ben Healy
    nektet å sitte stille i feltet og kastet seg inn i angrep etter angrep –
    iherdigheten ga ham noen dager i gul trøye. Jonas Abrahamsen sørget for
    norsk jubel da han holdt unna fra et langt brudd i Toulouse, mens Wout van
    Aert satte punktum ved å stikke alene i pøsregnet på avslutningen i Paris,
    over de splitter nye stigningene på Montmartre.`,
};

/* Trøyevinnere per år, vist som egne tagger under oppsummeringen.
   type styrer fargen på trøyeikonet. */
const AARSTROYER = {
  2026: [
    { type: "gul",   troye: "Gul trøye",    rytter: "Tadej Pogačar" },
    { type: "gronn", troye: "Poengtrøya",   rytter: "Mads Pedersen" },
    { type: "prikk", troye: "Klatretrøya",  rytter: "Richard Carapaz" },
    { type: "hvit",  troye: "Ungdomstrøya", rytter: "Isaac del Toro" },
  ],
  2025: [
    { type: "gul",   troye: "Gul trøye",    rytter: "Tadej Pogačar" },
    { type: "gronn", troye: "Poengtrøya",   rytter: "Jonathan Milan" },
    { type: "prikk", troye: "Klatretrøya",  rytter: "Tadej Pogačar" },
    { type: "hvit",  troye: "Ungdomstrøya", rytter: "Florian Lipowitz" },
  ],
};

/* Lite sykkeltrøye-ikon i riktig farge for hver trøyetype. */
function troyeIkon(type) {
  const kropp = { gul: "#f6c700", gronn: "#16a34a", hvit: "#ffffff", prikk: "#ffffff" };
  const prikker = type === "prikk"
    ? `<g fill="#e2001a"><circle cx="9.5" cy="11" r="1"/><circle cx="14.5" cy="11" r="1"/>
       <circle cx="12" cy="14" r="1"/><circle cx="9.5" cy="17" r="1"/><circle cx="14.5" cy="17" r="1"/></g>`
    : "";
  return `<svg class="troyesvg" viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
    <path d="M9 3 L4 5 L2 9 L5.2 11 L6.2 10 L6.2 21 L17.8 21 L17.8 10 L18.8 11 L22 9 L20 5 L15 3
      C15 4.8 9 4.8 9 3 Z" fill="${kropp[type]}" stroke="rgba(0,0,0,.35)" stroke-width="0.8"
      stroke-linejoin="round"/>${prikker}</svg>`;
}

/* Trøyevinnere som tagger/etiketter. */
function troyeTagger(tagger) {
  return `<div class="troyetagger">` + tagger.map(t =>
    `<span class="troyetag">${troyeIkon(t.type)}<b>${t.troye}</b>` +
    `<span class="troyerytter">${t.rytter}</span></span>`).join("") + `</div>`;
}
