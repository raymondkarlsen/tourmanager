/* ==========================================================================
   Tourmanager — datamotoren
   Henter dataene fra Google Sheets (via lenkene i config.js) og regner ut
   alt siden trenger: rangeringer, maratonpoeng, gule trøyer, sammenlagt-
   lister og hele funfacts-batteriet.

   Brukes slik fra en side:

     hentTourdata().then(data => { ... bygg siden med data ... });

   Objektet som kommer tilbake er beskrevet nederst i filen.
   ========================================================================== */

/* ---- CSV-lesing ---------------------------------------------------------- */

/** Deler opp én CSV-linje, med støtte for felter i anførselstegn
    (som kan inneholde komma — f.eks. lagnavn fra spilleverandøren). */
function parseCsvLinje(linje) {
  const felter = [];
  let felt = "", iAnfoersel = false;
  for (let i = 0; i < linje.length; i++) {
    const tegn = linje[i];
    if (iAnfoersel) {
      if (tegn === '"') {
        if (linje[i + 1] === '"') { felt += '"'; i++; }
        else iAnfoersel = false;
      } else felt += tegn;
    } else if (tegn === '"') {
      iAnfoersel = true;
    } else if (tegn === ",") {
      felter.push(felt); felt = "";
    } else felt += tegn;
  }
  felter.push(felt);
  return felter.map(f => f.trim());
}

/** Henter en CSV-fil og gjør den om til en liste med objekter,
    der kolonnenavnene i første rad blir nøkler. */
async function hentCsv(url) {
  const svar = await fetch(url);
  if (!svar.ok) throw new Error("Klarte ikke hente data: " + url);
  const tekst = await svar.text();

  const linjer = tekst.trim().split(/\r?\n/);
  const kolonner = parseCsvLinje(linjer[0]);

  return linjer.slice(1)
    .filter(linje => linje.trim() !== "")
    .map(linje => {
      const felter = parseCsvLinje(linje);
      const rad = {};
      kolonner.forEach((navn, i) => { rad[navn] = felter[i] ?? ""; });
      return rad;
    });
}

/** Gjør en tekstverdi om til heltall, eller null hvis den er tom. */
function tilTall(verdi) {
  if (verdi === undefined || verdi === null || verdi === "") return null;
  const n = parseInt(String(verdi).replace(/\s/g, ""), 10);
  return isNaN(n) ? null : n;
}

/** Formaterer 16616 som "16 616" (norsk tusenskille). */
function formatTall(n) {
  if (n === null || n === undefined) return "";
  return n.toLocaleString("nb-NO").replace(/,/g, " ");
}

/* ---- Hovedfunksjonen ------------------------------------------------------ */

async function hentTourdata() {
  const hentinger = [
    hentCsv(KONFIG.sesongerCsv),
    hentCsv(KONFIG.etapperCsv),
  ];
  // Rytterstatistikken er valgfri — hentes bare hvis lenken er satt
  if (KONFIG.ryttereCsv) hentinger.push(hentCsv(KONFIG.ryttereCsv));

  const [sesongRader, etappeRader, rytterRader] = await Promise.all(hentinger);

  /* ---- 0. Rytterstatistikk fra spilleverandøren, gruppert per år -------
     Kolonnene bestemmes av det som står i regnearket — siden viser dem
     som de er, så formatet kan variere fritt fra år til år. */
  const ryttere = {};
  for (const rad of (rytterRader || [])) {
    const aar = tilTall(rad.aar);
    if (!aar) continue;
    ryttere[aar] = ryttere[aar] || [];
    ryttere[aar].push(rad);
  }

  /* ---- 1. Organiser sesongdataene per år -------------------------------- */

  // aarsdata: { 2014: { Tony: {lagnavn, poeng}, ... }, ... }
  const aarsdata = {};
  for (const rad of sesongRader) {
    const aar = tilTall(rad.aar);
    if (!aar) continue;
    aarsdata[aar] = aarsdata[aar] || {};
    aarsdata[aar][rad.person] = {
      lagnavn: rad.lagnavn || "",
      poeng: tilTall(rad.poeng),
    };
  }

  /* ---- 2. Organiser etappedataene per år -------------------------------- */

  // etappedata: { 2026: [ {etappe: 1, type: "Fjell", poeng: {Tony: 442, ...}}, ... ] }
  // Kolonnen "type" (Flat, Kupert, Fjell, Tempo, Lagtempo) er valgfri —
  // det holder at den er fylt ut på én av radene for hver etappe.
  const etappedata = {};
  const etappetyper = {};
  for (const rad of etappeRader) {
    const aar = tilTall(rad.aar);
    const etappe = tilTall(rad.etappe);
    const poeng = tilTall(rad.poeng);
    if (!aar || !etappe || poeng === null) continue;
    etappedata[aar] = etappedata[aar] || {};
    etappedata[aar][etappe] = etappedata[aar][etappe] || {};
    etappedata[aar][etappe][rad.person] = poeng;
    if (rad.type) {
      etappetyper[aar] = etappetyper[aar] || {};
      etappetyper[aar][etappe] = rad.type;
    }
  }
  // Gjør om til sortert liste per år
  for (const aar of Object.keys(etappedata)) {
    etappedata[aar] = Object.keys(etappedata[aar])
      .map(nr => ({
        etappe: Number(nr),
        type: etappetyper[aar]?.[nr] || null,
        poeng: etappedata[aar][nr],
      }))
      .sort((a, b) => a.etappe - b.etappe);
  }

  /* ---- 3. Skill ferdige sesonger fra pågående ---------------------------
     En sesong regnes som ferdig når alle deltakerne har en poengsum
     større enn 0 i sesonger-fanen. Året som ligger inne med 0 (2026 før
     og under touren) behandles som pågående, og løpende totaler hentes
     da fra etappe-fanen i stedet. */

  const sesonger = [];   // ferdige sesonger, eldste først
  let paagaaende = null; // årets sesong, hvis den finnes

  const alleAar = Object.keys(aarsdata).map(Number).sort((a, b) => a - b);

  for (const aar of alleAar) {
    const personerIAaret = Object.keys(aarsdata[aar]);
    const ferdig = personerIAaret.length >= KONFIG.personer.length &&
      personerIAaret.every(p => (aarsdata[aar][p].poeng ?? 0) > 0);

    if (ferdig) {
      sesonger.push(byggSesong(aar, aarsdata[aar]));
    } else {
      // Pågående: regn løpende totaler fra etappene
      const totaler = {};
      for (const p of KONFIG.personer) totaler[p] = 0;
      for (const e of (etappedata[aar] || [])) {
        for (const p of Object.keys(e.poeng)) totaler[p] += e.poeng[p];
      }
      const resultater = KONFIG.personer
        .map(p => ({
          person: p,
          lagnavn: aarsdata[aar][p]?.lagnavn || "",
          poeng: totaler[p],
        }))
        .sort((a, b) => b.poeng - a.poeng);
      resultater.forEach((r, i) => { r.plass = i + 1; });

      paagaaende = {
        aar,
        antallEtapper: (etappedata[aar] || []).length,
        etapper: etappedata[aar] || [],
        resultater,
        leder: resultater[0]?.poeng > 0 ? resultater[0].person : null,
      };
    }
  }

  /** Bygger et ferdig sesongobjekt med rangering og maratonpoeng. */
  function byggSesong(aar, data) {
    const resultater = Object.keys(data)
      .map(p => ({ person: p, lagnavn: data[p].lagnavn, poeng: data[p].poeng }))
      .sort((a, b) => b.poeng - a.poeng);
    const vinnerpoeng = resultater[0].poeng;
    resultater.forEach((r, i) => {
      r.plass = i + 1;
      r.maratonpoeng = KONFIG.maratonPoeng[i] ?? 0;
      r.prosentAvVinner = Math.round((r.poeng / vinnerpoeng) * 1000) / 10;
    });
    return { aar, resultater, vinner: resultater[0].person };
  }

  /* ---- 4. Sammenlagttabellene -------------------------------------------- */

  const totalpoeng = {};      // totalpoeng gjennom alle tider
  const maratonpoeng = {};    // maratontabellen sammenlagt
  const guleTroyer = {};      // { person: [år, år, ...] }
  for (const p of KONFIG.personer) {
    totalpoeng[p] = 0; maratonpoeng[p] = 0; guleTroyer[p] = [];
  }

  // Akkumulert utvikling år for år (til grafene)
  const akkumulertMaraton = []; // [{aar, Tony: 20, Jørgen: 40, ...}, ...]
  const akkumulertPoeng = [];

  for (const s of sesonger) {
    for (const r of s.resultater) {
      totalpoeng[r.person] += r.poeng;
      maratonpoeng[r.person] += r.maratonpoeng;
    }
    guleTroyer[s.vinner].push(s.aar);

    const mRad = { aar: s.aar }, pRad = { aar: s.aar };
    for (const p of KONFIG.personer) {
      mRad[p] = maratonpoeng[p];
      pRad[p] = totalpoeng[p];
    }
    akkumulertMaraton.push(mRad);
    akkumulertPoeng.push(pRad);
  }

  /** Hjelper: lager en sortert liste [{person, verdi}] av et oppslagsobjekt. */
  const somListe = obj => KONFIG.personer
    .map(p => ({ person: p, verdi: obj[p] }))
    .sort((a, b) => b.verdi - a.verdi);

  /* ---- 5. Funfacts -------------------------------------------------------- */

  const topp2 = {}, topp3 = {};
  for (const p of KONFIG.personer) { topp2[p] = 0; topp3[p] = 0; }
  for (const s of sesonger) {
    for (const r of s.resultater) {
      if (r.plass <= 2) topp2[r.person]++;
      if (r.plass <= 3) topp3[r.person]++;
    }
  }

  // Flest seire på rad
  const seierrekker = {};
  for (const p of KONFIG.personer) seierrekker[p] = 0;
  let forrigeVinner = null, rekke = 0;
  for (const s of sesonger) {
    rekke = (s.vinner === forrigeVinner) ? rekke + 1 : 1;
    seierrekker[s.vinner] = Math.max(seierrekker[s.vinner], rekke);
    forrigeVinner = s.vinner;
  }

  // Seiersmarginer (1. mot 2. plass)
  const marginer = sesonger.map(s => ({
    aar: s.aar,
    vinner: s.resultater[0].person,
    nummerTo: s.resultater[1].person,
    diff: s.resultater[0].poeng - s.resultater[1].poeng,
  }));

  // Avstand 1. til 3. plass (jevneste topp 3)
  const topp3Avstand = sesonger.map(s => ({
    aar: s.aar,
    vinner: s.resultater[0].person,
    treer: s.resultater[2].person,
    diff: s.resultater[0].poeng - s.resultater[2].poeng,
  }));

  // Minste differanse mellom to naboplasseringer (1-2, 2-3, 3-4)
  const naboDiffer = [];
  for (const s of sesonger) {
    for (let i = 0; i < s.resultater.length - 1; i++) {
      naboDiffer.push({
        aar: s.aar,
        personA: s.resultater[i].person,
        personB: s.resultater[i + 1].person,
        plasser: `${i + 1}. og ${i + 2}. plass`,
        diff: s.resultater[i].poeng - s.resultater[i + 1].poeng,
      });
    }
  }
  naboDiffer.sort((a, b) => a.diff - b.diff);

  // Avstand fra 1. til 4. plass (tetteste og løseste felt)
  const spredning = sesonger.map(s => ({
    aar: s.aar,
    foerst: s.resultater[0].person,
    sist: s.resultater[s.resultater.length - 1].person,
    diff: s.resultater[0].poeng - s.resultater[s.resultater.length - 1].poeng,
    prosent: Math.round((s.resultater[s.resultater.length - 1].poeng /
      s.resultater[0].poeng) * 1000) / 10,
  }));

  // Flest poeng i én sesong / uten å vinne
  const allePrestasjoner = [];
  for (const s of sesonger) {
    for (const r of s.resultater) {
      allePrestasjoner.push({
        aar: s.aar, person: r.person, poeng: r.poeng, plass: r.plass,
      });
    }
  }
  allePrestasjoner.sort((a, b) => b.poeng - a.poeng);

  /* ---- 6. Pakk alt sammen ------------------------------------------------- */

  return {
    // Grunnlaget
    personer: KONFIG.personer,
    farger: KONFIG.farger,
    sesonger,                 // ferdige sesonger, eldste først
    paagaaende,               // årets sesong (eller null utenom tour-tid)
    etapper: etappedata,      // etappedata per år, for alle år som har det
    ryttere,                  // rytterstatistikk fra spilleverandøren, per år

    // Sammenlagt
    totalpoeng: somListe(totalpoeng),
    maratontabellen: somListe(maratonpoeng),
    guleTroyer: KONFIG.personer
      .map(p => ({ person: p, antall: guleTroyer[p].length, aarene: guleTroyer[p] }))
      .sort((a, b) => b.antall - a.antall),
    regjerendeMester: sesonger.length
      ? sesonger[sesonger.length - 1].vinner : null,

    // Til grafene
    akkumulertMaraton,
    akkumulertPoeng,

    // Funfacts
    funfacts: {
      topp2: somListe(topp2),
      topp3: somListe(topp3),
      seierrekker: somListe(seierrekker),
      suverenesteSeire: [...marginer].sort((a, b) => b.diff - a.diff),
      knepnesteSeire: [...marginer].sort((a, b) => a.diff - b.diff),
      jevnesteTopp3: [...topp3Avstand].sort((a, b) => a.diff - b.diff),
      minsteDifferanser: naboDiffer,
      kortestSpredning: [...spredning].sort((a, b) => a.diff - b.diff),
      stoerstSpredning: [...spredning].sort((a, b) => b.diff - a.diff),
      flestPoengISesong: allePrestasjoner.slice(0, 10),
      flestPoengUtenSeier: allePrestasjoner
        .filter(x => x.plass > 1).slice(0, 10),
    },
  };
}

/* ==========================================================================
   Ikoner
   Felles ikonbibliotek for menyen og forsidekortene. Nøkkelen er sidens
   filnavn; størrelsen kan velges (menyen bruker 18, kortene større).
   ========================================================================== */
function tourIkon(side, px = 18) {
  const strek = `width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" ` +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true"';
  const IKONER = {
    "gul-troye.html":         // trøye
      `<svg ${strek}><path d="M8.5 4 4 6.5l2 3.5 2-1V20h8v-11l2 1 2-3.5L15.5 4a5 5 0 0 1-7 0Z"/></svg>`,
    "maratontabellen.html":   // seierspall
      `<svg ${strek}><rect x="9" y="7" width="6" height="13"/><rect x="3" y="12" width="6" height="8"/><rect x="15" y="15" width="6" height="5"/></svg>`,
    "poengtabellen.html":     // myntstabel
      `<svg ${strek}><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>`,
    "statistikk.html":        // søylediagram
      `<svg ${strek}><path d="M5 20v-6M11 20V5M17 20v-9M3 20h18"/></svg>`,
    "sesong-for-sesong.html": // kalender
      `<svg ${strek}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`,
  };
  return IKONER[side] || "";
}

/* ==========================================================================
   Meny-oppsett
   Kjøres på alle sider (siden alle laster motor.js):
   1. Legger et ikon foran hver menylenke
   2. Markerer siden man står på
   3. Lager hamburger-knappen for små skjermer (styrt av style.css)
   ========================================================================== */
if (typeof document !== "undefined") {
  const meny = document.querySelector(".meny");
  const nav = meny ? meny.querySelector("nav") : null;
  if (meny && nav) {

    /* ---- Hvilken side står vi på? ----
       Detaljsiden (sesongen.html) hører hjemme under Sesong for sesong. */
    let side = location.pathname.split("/").pop() || "index.html";
    if (side === "sesongen.html") side = "sesong-for-sesong.html";

    for (const lenke of nav.querySelectorAll("a")) {
      const maal = lenke.getAttribute("href");
      const ikon = tourIkon(maal);
      if (ikon) lenke.innerHTML = ikon + "<span>" + lenke.textContent + "</span>";
      if (maal === side) {
        lenke.classList.add("aktiv");
        lenke.setAttribute("aria-current", "page");
      }
    }

    /* ---- Hamburger-knappen for mobil ---- */
    const knapp = document.createElement("button");
    knapp.className = "menyknapp";
    knapp.setAttribute("aria-label", "Meny");
    knapp.setAttribute("aria-expanded", "false");
    knapp.innerHTML = "<span></span><span></span><span></span>";
    knapp.addEventListener("click", () => {
      const aapen = meny.classList.toggle("aapen");
      knapp.setAttribute("aria-expanded", String(aapen));
    });
    meny.insertBefore(knapp, nav);
  }
}

/* ==========================================================================
   Datastrukturen som hentTourdata() leverer:

   {
     personer, farger,
     sesonger: [ { aar, vinner, resultater: [
         { person, lagnavn, poeng, plass, maratonpoeng, prosentAvVinner } ] } ],
     paagaaende: { aar, antallEtapper, etapper, resultater, leder } | null,
     totalpoeng / maratontabellen: [ { person, verdi } ],
     guleTroyer: [ { person, antall, aarene } ],
     regjerendeMester,
     akkumulertMaraton / akkumulertPoeng: [ { aar, Tony, Jørgen, ... } ],
     funfacts: { topp2, topp3, seierrekker, suverenesteSeire, knepnesteSeire,
                 jevnesteTopp3, minsteDifferanser, kortestSpredning,
                 stoerstSpredning, flestPoengISesong, flestPoengUtenSeier }
   }
   ========================================================================== */
