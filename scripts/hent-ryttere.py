#!/usr/bin/env python3
"""
Henter rytteroversikten (navn, rolle, lag, pris og totalpoeng) fra
tourmanager.no sitt API og lagrer den til data/ryttere-2026.json.

Dette er samme datagrunnlag som «Statistikk om rytterne» på nettsiden bygger
på for tidligere år (som ellers kommer fra ryttere-fanen i regnearket). For
2026 finnes ikke tallene i regnearket, så vi henter dem direkte fra spill-
leverandøren i stedet.

API-et eksponerer bare totalpoeng per rytter — ikke split i spurt/klatre/mål —
så oversikten for 2026 har én poengkolonne, i motsetning til 2025.

Kilder:
  GET /tournaments/<id>/players        → rytterstall (navn, rolle, lag, pris)
  GET /tournaments/<id>/player-points  → { playerId: totalpoeng }
"""
import json
import datetime
import urllib.request

API = "https://vm-fantasyapi-production.up.railway.app"
TURNERING = "9b6d66c3-7350-41f2-8e4e-76d39fba0a49"
UTFIL = "data/ryttere-2026.json"

# Oversetter API-ets posisjonskoder til de samme rolleordene som brukes i
# regnearket (og dermed vises likt som for tidligere år).
ROLLER = {
    "CAPTAIN": "captain",
    "CLIMBER": "climber",
    "SPRINTER": "sprinter",
    "DOMESTIQUE": "support",
    "TIME_TRIALIST": "tempo",
    "YOUNG_RIDER": "youth",
    "SPORT_DIRECTOR": "manager",
}


def hent(url):
    req = urllib.request.Request(url, headers={"User-Agent": "tdf-raymondkarlsen-stats"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def mill(cents):
    """Øre → millioner med én desimal (11800000 → 11.8)."""
    return round((cents or 0) / 1_000_000, 1)


def main():
    spillere = hent(f"{API}/tournaments/{TURNERING}/players")
    poeng = hent(f"{API}/tournaments/{TURNERING}/player-points")

    rader = []
    for s in spillere:
        priser = s.get("prices") or []
        rader.append({
            "navn": s["name"],
            "rolle": ROLLER.get(s["position"], s["position"]),
            "lag": (s.get("team") or {}).get("name", ""),
            "pris": mill(priser[0]["priceCents"] if priser else 0),
            "poeng": poeng.get(s["id"], 0) or 0,
        })

    rader.sort(key=lambda r: r["poeng"], reverse=True)

    ut = {
        "aar": 2026,
        "oppdatert": datetime.datetime.now(datetime.timezone.utc)
        .strftime("%Y-%m-%d %H:%M UTC"),
        "kilde": "tourmanager.no",
        "ryttere": rader,
    }

    with open(UTFIL, "w", encoding="utf-8") as f:
        json.dump(ut, f, ensure_ascii=False, indent=2)
    print(f"Skrev {len(rader)} ryttere til {UTFIL}")


if __name__ == "__main__":
    main()
