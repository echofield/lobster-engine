# Studio Intelligence

## What this project is
A bilingual (FR/EN) studio assistant web app for a professional recording/mastering studio in Paris. It encodes the complete gear inventory, patchbay topology, and signal routing of the studio into an interactive application.

## Tech decisions
- Next.js 16+ App Router, TypeScript, Tailwind CSS v4
- All studio data in TypeScript files under src/data/ — no database
- SVG-based interactive patchbay visualizer
- Optional AI layer via Claude API or Vertex — behind a "bring your own key" settings panel
- Deploy target: Vercel

## Key files
- src/data/gear.ts — every piece of equipment with specs, I/O, patchbay points
- src/data/patchbay.ts — complete patchbay topology (6 bays, all labeled points)
- src/data/signal-chains.ts — pre-built chains for common tasks
- src/data/workflows.ts — decision trees for guided mode
- src/data/i18n.ts — bilingual string registry
- src/types/studio.ts — all TypeScript interfaces

## Design direction
- Industrial/utilitarian aesthetic — this is a working tool, not a marketing site
- Dark theme always (studio environment)
- Monospace for technical labels (Geist Mono), clean sans-serif for UI (Geist)
- Color-coded signal paths matching the actual patchbay label colors
- The patchbay visualizer should feel like looking at the real thing

## Important context
- The studio uses Signex/Isopatch Bantam Pro Series patchbays (TT/bantam connectors)
- Patchbay labeling uses color-coded strips: pink=AD-DA, green=inputs, yellow=inserts, orange=gear I/O, red=Studer
- The Crookwood monitor controller is the central routing hub for monitoring
- The Studer console is the analog heart — all mic inputs and line routing go through it
- There is both a digital path (Lynx/Burl/Prism converters → Pro Tools HD Native) and an analog path (Studer console → tape or direct)

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — run ESLint

## Claude Code Skills
- `/instrument` — Create new web instruments with the AETHER design system (WebAudio, recording, export)

## Folder structure
```
src/
├── app/           # Next.js App Router pages
├── components/    # React components
├── data/          # Studio knowledge base (gear, patchbay, chains)
├── lib/           # Utilities (routing engine, validators)
└── types/         # TypeScript interfaces
```
