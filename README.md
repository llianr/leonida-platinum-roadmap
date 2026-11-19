# Leonida Platinum Roadmap — GTA VI Trophy Guide & Tracker

[![gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/llianr/leonida-platinum-roadmap/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/llianr/leonida-platinum-roadmap/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of **Grand Theft Auto VI**, built for the [make.fun competition](https://make.fun/c/gta6-trophy-guide-01).

## What it is

- **Every trophy, officially named.** All 55 trophies — 1 platinum, 2 gold, 6 silver, 46 bronze — with their official names, descriptions and grades as PlayStation publishes them, and a guide to each written for this page in its own words, with its source named beside it.
- **A tracker that saves.** Tick trophies off and the progress stays in your browser (localStorage). Export it to a file and import it back.
- **Filters by grade and kind** — story, missable, collectibles, activities, online — plus search and a roadmap stage filter.
- **Spoiler mode.** Story trophies stay hidden — name, description and guide — until you earn them.
- **A roadmap to the platinum** in seven stages, built only from the official trophy descriptions: which story chapters and missions, which collectibles and counts, in what order.
- **A missable watchlist.** Eight trophies are tied to a one-time story moment or a specific condition; the guide flags each one and says what to do before you pass it.
- **100% offline.** Static files under `app/` — no build step, no network request at runtime. Serve `app/` with any static server and open `index.html`.

## Honesty note

GTA VI released on 19 November 2026. Every guide here is derived from the official trophy description and the counts PlayStation tracks, and says so where a detail cannot be verified yet. No location or step is invented, no guide text is copied from another guide, and no Rockstar logo or artwork is used anywhere.

## Sources

- Official trophy descriptions, PlayStation via the Exophase trophy list for Grand Theft Auto VI.
- PSNProfiles trophy list for Grand Theft Auto VI (grades, hidden flags and progress counts).

## Run it

```sh
node serve.ts        # serves app/ on http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## Layout

- `app/index.html`, `app/app.js`, `app/style.css` — the guide itself.
- `app/data/trophies.json` — the 55 trophies: official name, description, grade, kind, missable flag, roadmap stage, guide and source.
- `app/data/roadmap.json` — the seven roadmap stages.
- `screenshots/` — three renders of the guide (checklist, silver filter, bronze filter scrolled).
- `main.ts` — the entry program. `serve.ts` — the local static server. `shots.json` — what each screenshot shows.
