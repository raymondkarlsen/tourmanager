#!/usr/bin/env python3
"""
Bygger data/lagryttere-<aar>.json: hvilke ryttere som ga hvilke poeng til
hvert av lagene våre (Tony, Jørgen, Alex, Raymond), etappe for etappe.

Datakilden er tourmanager.no sitt fantasy-API. De nødvendige endepunktene
(liga-tabell og hvert lags oppstilling per etappe) krever innlogging, så
rådataene hentes én gang manuelt fra en innlogget nettleser. Deretter gjør
dette skriptet råfila om til en ferdig, liten JSON som nettsiden viser.

--------------------------------------------------------------------------
1) Hent rådata (én gang per sesong)
--------------------------------------------------------------------------
Logg inn på tourmanager.no, åpne nettleserkonsollen (Cmd+Option+I → Console)
og lim inn snutten under. En fil `tm-lag-<aar>.json` lastes ned. Bytt ut
LEAGUE_ID med ID-en fra URL-en til den private ligaen (tourmanager.no/leagues/<id>).

    (async () => {
      const API = "https://vm-fantasyapi-production.up.railway.app";
      const L = "LEAGUE_ID";
      const H = { "Authorization": "Bearer " + localStorage.getItem("token") };
      const get = async (p) => {
        const r = await fetch(API + p, { headers: H, credentials: "include" });
        const b = await r.text();
        if (!r.ok) throw new Error(p + " -> " + r.status + " " + b);
        return JSON.parse(b);
      };
      const leaderboard = await get("/leagues/" + L +
        "/leaderboard?page=1&limit=50&sortBy=total");
      const ids = new Set();
      (function scan(o){
        if (Array.isArray(o)) return o.forEach(scan);
        if (o && typeof o === "object")
          for (const [k,v] of Object.entries(o)) {
            if (k === "squadId" && typeof v === "string") ids.add(v);
            else scan(v);
          }
      })(leaderboard);
      const out = { hentet: new Date().toISOString(), leaderboard, squads: [] };
      for (const id of ids)
        out.squads.push({ id, view: await get("/squad/view/" + id) });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)],
        {type:"application/json"}));
      a.download = "tm-lag-<aar>.json"; a.click();
      console.log("Ferdig. Lag funnet:", ids.size);
    })();

--------------------------------------------------------------------------
2) Bygg nettside-fila
--------------------------------------------------------------------------
    python scripts/bygg-lagryttere.py ~/Downloads/tm-lag-2026.json 2026

Skriver data/lagryttere-2026.json.
"""
import json
import sys
from collections import defaultdict

# Deltakerne slik de heter på nettsiden, i fast rekkefølge.
PERSONER = ["Tony", "Jørgen", "Alex", "Raymond"]

# Fantasy-posisjon → norsk navn (samme oversettelse som statistikk-skriptet).
POSISJON = {
    "CLIMBER": "Klatrer",
    "SPRINTER": "Spurter",
    "YOUNG_RIDER": "Ungdom",
    "TIME_TRIALIST": "Tempo",
    "DOMESTIQUE": "Hjelper",
    "CAPTAIN": "Kaptein",
    "SPORT_DIRECTOR": "Sportsdirektør",
}


def finn_person(manager_navn):
    """Kobler managerens navn til et av deltakernavnene (fornavn-match).
    F.eks. «Alexander Mathiessen» → «Alex», «Jørgen Sørlie» → «Jørgen»."""
    fornavn = (manager_navn or "").strip().split(" ")[0].lower()
    for p in PERSONER:
        pl = p.lower()
        if fornavn.startswith(pl) or pl.startswith(fornavn):
            return p
    return None


def bygg_lag(view):
    """Regner ut rytter- og sportsdirektørbidrag for ett lag."""
    # Poeng per (etappe, rytter) slik de talte for dette laget.
    poeng = defaultdict(dict)  # roundId -> {playerId: poeng}
    for x in view["playerStagePoints"]:
        poeng[x["roundId"]][x["playerId"]] = x["points"]

    total = defaultdict(int)
    navn, posisjon, lagkode = {}, {}, {}
    per_etappe = defaultdict(list)  # playerId -> [[etappeNr, poeng], ...]

    for runde in sorted(view["rounds"], key=lambda r: r["number"]):
        nr = runde["number"]
        rid = runde["snapshot"]["roundId"]
        stagepoeng = poeng.get(rid, {})
        # Bare rytterne som faktisk var i oppstillingen teller for laget.
        for slot in runde["snapshot"]["slots"]:
            spiller = slot["player"]
            pid = spiller["id"]
            p = stagepoeng.get(pid, 0)
            total[pid] += p
            navn[pid] = spiller["name"]
            posisjon[pid] = spiller["position"]
            lagkode[pid] = (spiller.get("team") or {}).get("code")
            per_etappe[pid].append([nr, p])

    def rad(pid):
        return {
            "navn": navn[pid],
            "lagkode": lagkode[pid],
            "posisjon": POSISJON.get(posisjon[pid], posisjon[pid]),
            "poeng": total[pid],
            "etapper": len(per_etappe[pid]),
            "perEtappe": per_etappe[pid],
        }

    ryttere, sportsdirektorer = [], []
    for pid in total:
        (sportsdirektorer if posisjon[pid] == "SPORT_DIRECTOR"
         else ryttere).append(rad(pid))

    ryttere.sort(key=lambda r: (-r["poeng"], r["navn"]))
    sportsdirektorer.sort(key=lambda r: (-r["poeng"], r["navn"]))

    return {
        "lagnavn": view["squadName"],
        "manager": view["managerName"],
        "totalPoeng": view["totalPoints"],
        "ryttere": ryttere,
        "sportsdirektorer": sportsdirektorer,
    }


def main():
    if len(sys.argv) != 3:
        print("Bruk: python scripts/bygg-lagryttere.py <raadump.json> <aar>",
              file=sys.stderr)
        sys.exit(1)

    innfil, aar = sys.argv[1], int(sys.argv[2])
    raadata = json.load(open(innfil, encoding="utf-8"))

    lag = {}
    for oppslag in raadata["squads"]:
        view = oppslag["view"]
        person = finn_person(view["managerName"])
        if not person:
            print(f"Fant ingen person for manager «{view['managerName']}» "
                  f"(lag «{view['squadName']}») – hoppes over.", file=sys.stderr)
            continue
        lag[person] = bygg_lag(view)

    ut = {
        "aar": aar,
        "oppdatert": raadata.get("hentet"),
        "kilde": "tourmanager.no",
        "personer": [p for p in PERSONER if p in lag],
        "lag": {p: lag[p] for p in PERSONER if p in lag},
    }

    utfil = f"data/lagryttere-{aar}.json"
    with open(utfil, "w", encoding="utf-8") as f:
        json.dump(ut, f, ensure_ascii=False, indent=2)

    print(f"Skrev {utfil} for {len(lag)} lag:")
    for p in ut["personer"]:
        L = lag[p]
        print(f"  {p:<8} {L['lagnavn']:<20} tot {L['totalPoeng']:>6} "
              f"({len(L['ryttere'])} ryttere, "
              f"{len(L['sportsdirektorer'])} sportsdir.)")


if __name__ == "__main__":
    main()
