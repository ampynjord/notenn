# Notenn

Web application that turns a score, a MIDI file or a recording into a tablature, with a playback cursor and PDF export. Available in French and English (`/fr/…` and `/en/…`).

Notenn is multi-instrument. The first instrument, and the most complete one, is the diatonic accordion, written by default in the **Argoat System** (a gestural tablature for the diatonic accordion). Other notations and instruments are added over time.

Private project — all rights reserved (see [`LICENSE`](LICENSE)).

## Status

Beta in preparation. Already in place:

- **Instruments**: diatonic accordion (G/C, D/G, A/D, C/F, B♭/E♭, three-row G/C/F, Hohner 2915 layout), chromatic accordion (C system, preview), guitar (standard, DADGAD), ukulele and tin whistle (D, C, B♭) — the last ones are still to be refined.
- **Notations** for the diatonic accordion: Argoat System, CADB and Corgeron, selectable in the editor and in the PDF.
- **Editor**: track and passage selection, transposition, keyboard and row choice, optional staff, basses, click-to-edit (button, row, bellows direction).
- **Practice**: playback cursor, loop on a passage, slow-down without pitch change, metronome with count-in.
- **Import**: MIDI, MusicXML (including `.mxl`) and ABC. **Export**: PDF (with or without staff, bars per line, colour or black and white).
- **Site**: home, tune library (public domain, traditional, free licences), accounts, personal library (saved fingerings and settings), donations, privacy, legal notice, installable PWA.

## Repository contents

| Folder | Contents |
| --- | --- |
| `docs/` | Project plan, definition of the Argoat System, instrument profile format, Hohner 2915 keyboard layout, tune validation, SEO (in French) |
| `apps/web/` | Next.js + Payload CMS 3 application (PostgreSQL) |
| `packages/engine/` | TypeScript music engine: melody, transposition, fingering, basses, instrument profiles (keyboards, strings, whistles) |
| `packages/argoat/` | Tablature layout (staff, P/T lines, basses) for Argoat, CADB and Corgeron, independent of the output medium |
| `packages/import/` | MIDI, MusicXML (including `.mxl`) and ABC file reading; test bench on real files |
| `deploy/` | VPS deployment: Docker Compose, deploy and backup scripts |
| `prototype/` | Working single-page HTML prototype (MIDI/MusicXML/ABC import, fingering, basses, staff, cursor, PDF) |

The prototype opens directly in a browser: `prototype/systeme-argoat.html`.

## Stack

- Next.js (React, TypeScript), installable web app (PWA)
- Payload CMS 3 embedded in Next.js
- PostgreSQL
- VPS hosting: Docker + Traefik, CI/CD through GitHub Actions
- Later: separate Python service for score reading (photo/PDF)

## Roadmap

| Phase | Contents |
| --- | --- |
| 0 · Universal engine | Multi-instrument, multi-voice TypeScript engine, Next.js + Payload project, test bench on real files — done |
| 1 · Beta | Diatonic accordion, Argoat System, MIDI/MusicXML/ABC import, PDF export, FR + EN, accounts and library, donations — remaining: more Breton tunes, checking keyboards on real instruments, opening the beta |
| 2 · Following months | MP3 import, more instruments (piano, harmonica, concertina), keyboard editor, community (sharing, ratings, comments), MIDI/MusicXML/PNG exports, setlists |
| 3 · Afterwards | Score photo/PDF, pay-per-use, groups and classes, duets and lyrics |

Full details: [`docs/plan.md`](docs/plan.md) (in French).

## Running locally

Requirements: Node 22, pnpm 10, Docker.

```bash
pnpm install
pnpm db:up                      # development PostgreSQL
cp apps/web/.env.example apps/web/.env   # then set a random PAYLOAD_SECRET
pnpm dev                        # http://localhost:3000 and /admin
pnpm test                       # engine, layout, import and web unit tests
pnpm typecheck
```
