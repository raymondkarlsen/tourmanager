#!/usr/bin/env python3
"""
Henter rytterstatistikk fra tourmanager.no sitt API og regner ut
oppsummeringer per etappe for TDF-siden.

Kjøres av en GitHub Action én gang i døgnet (kl. 06 norsk tid). Lagrer
ferdig-beregnede oppsummeringer til data/tourmanager-2026.json — ikke
rådata — slik at nettsiden bare trenger å vise resultatet.

Statistikken gjelder enkeltryttere blant alle spillere på tourmanager.no,
og er en hyllest til og supplement til den interne firekampen.
"""
import json
import sys
import datetime
import urllib.request

API = "https://vm-fantasyapi-production.up.railway.app"
TURNERING = "9b6d66c3-7350-41f2-8e4e-76d39fba0a49"
UTFIL = "data/tourmanager-2026.json"

TERRENG = {
    "FLAT": "Flat",
    "HILLY": "Kupert",
    "MOUNTAIN": "Fjell",
    "TEAM_TIME_TRIAL": "Lagtempo",
    "INDIVIDUAL_TIME_TRIAL": "Tempo",
}

KATEGORIER = {
    "CLIMBER": "Klatrer",
    "SPRINTER": "Spurter",
    "YOUNG_RIDER": "Ungdom",
    "TIME_TRIALIST": "Tempo",
    "DOMESTIQUE": "Hjelper",
    "CAPTAIN": "Kaptein",
    "SPORT_DIRECTOR": "Direktør",
}


def hent(url):
    req = urllib.request.Request(url, headers={"User-Agent": "tdf-raymondkarlsen-stats"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def mill(cents):
    """Øre → millioner med én desimal (11800000 → 11.8)."""
    return round(cents / 1_000_000, 1)


def topp(ryttere, nokkel, n=5, filtrer=None):
    rader = [r for r in ryttere if (filtrer is None or filtrer(r))]
    rader.sort(key=nokkel, reverse=True)
    return rader[:n]


def kort(r):
    return {
        "navn": r["name"],
        "lag": r["teamCode"],
        "poeng": r["roundPoints"],
        "pris": mill(r["priceCents"]),
        "eid": round(r["squadOwnershipPct"], 1),
    }


def beregn_etappe(runde, ryttere):
    spilte = [r for r in ryttere if r.get("roundPlayed") and r["priceCents"] > 0]
    if not spilte:
        return None

    def per_mill(r):
        return r["roundPoints"] / (r["priceCents"] / 1_000_000)

    beste_kjop = topp(spilte, per_mill, 5, lambda r: r["roundPoints"] > 0)

    dyre = sorted(
        [r for r in spilte if r["priceCents"] > 8_000_000],
        key=lambda r: r["roundPoints"],
    )

    kategorikonger = []
    for kode, navn in KATEGORIER.items():
        i_kat = [r for r in spilte if r["position"] == kode]
        if i_kat:
            best = max(i_kat, key=lambda r: r["roundPoints"])
            kategorikonger.append({"kategori": navn, **kort(best)})

    return {
        "nummer": runde["number"],
        "terreng": TERRENG.get(runde["stageType"], runde["stageType"]),
        "fra": runde["startCity"],
        "til": runde["finishCity"],
        "distanse": runde["distanceKm"],
        "toppscorere": [kort(r) for r in topp(spilte, lambda r: r["roundPoints"])],
        "beste_kjop": [
            {**kort(r), "perMill": round(per_mill(r), 1)} for r in beste_kjop
        ],
        "luksusfeller": [kort(r) for r in dyre[:5]],
        "benkesorg": [
            kort(r)
            for r in topp(spilte, lambda r: r["roundPoints"], 5,
                          lambda r: r["squadOwnershipPct"] < 15)
        ],
        "kategorikonger": kategorikonger,
        "mest_eide": [kort(r) for r in topp(ryttere, lambda r: r["squadOwnershipPct"], 5)],
    }


def main():
    runder = hent(f"{API}/tournaments/{TURNERING}/rounds")
    etapper = []
    for runde in sorted(runder, key=lambda r: r["number"]):
        try:
            url = f"{API}/tournaments/{TURNERING}/player-table?roundId={runde['id']}"
            ryttere = hent(url)
            resultat = beregn_etappe(runde, ryttere)
            if resultat:
                etapper.append(resultat)
        except Exception as e:
            print(f"Hoppet over etappe {runde['number']}: {e}", file=sys.stderr)

    ut = {
        "oppdatert": datetime.datetime.now(datetime.timezone.utc)
        .strftime("%Y-%m-%d %H:%M UTC"),
        "kilde": "tourmanager.no",
        "antallEtapper": len(etapper),
        "etapper": etapper,
    }

    with open(UTFIL, "w", encoding="utf-8") as f:
        json.dump(ut, f, ensure_ascii=False, indent=2)
    print(f"Skrev {len(etapper)} etappe(r) til {UTFIL}")


if __name__ == "__main__":
    main()
