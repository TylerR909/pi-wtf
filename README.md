# Pi Trainer

A toy / practical joke website for playing with the digits of π.  
MonkeyType energy. hackertyper.net energy. Not educational. Mostly.

> Default dark mode. Mostly fullscreen. Several deeply unserious modes.

## Stack

- **Node 24** · **Vite 8** · **React 19** + **React Compiler**
- **TypeScript** · **Biome** · **Lefthook** · **Vitest**
- **Lingui 6** (i18n from day one)
- Static build → **Docker** / **GHCR** (nginx). Fully edge-cacheable.

## Modes

| Mode | What it does |
|------|----------------|
| **Print** | Floods the screen with `3.14159…` |
| **Digit** | Giant one-digit-at-a-time. Space advances; hold to accelerate. Quips get mean. |
| **Trainer** | Current digit center; pick next with ←/→. Local scoreboard. |
| **Screensaver** | Slow scroll + measuring tape every 25/50/100 chars |
| **Hacker** | Mash keys → 3–7 digits of π (hackertyper vibes) |
| **Quiz** | “What’s the *n*th digit?” Type / L-R / chaos (emoji decoys) |
| **Base** | π in binary, octal, hex, dozenal, base-36… |
| **Rain** | Matrix rain, but it’s only π |

Chrome (mode bar / theme / footer) fades after idle; mouse move or Tab brings it back.

## Dev

```bash
npm install
npm run dev
```

```bash
npm test
npm run lint
npm run build
npm run preview
```

### i18n (Lingui)

```bash
npm run i18n:extract   # pull messages into locales/*/messages.po
npm run i18n:compile   # optional; vite plugin compiles on the fly in dev
```

Locales live under `locales/{en,es}/`. Macros: `@lingui/react/macro`, `@lingui/core/macro`.

### Themes

CSS variables in `src/themes/themes.ts`. Choice is stored in `localStorage` (`pi-trainer-theme`). Add a theme object — no library required.

### Spacebar quips

`src/data/quips.ts` — push more strings anytime. Intensity biases toward later entries as the user holds longer.

### π digits

~10k digits in `src/data/pi-digits.ts`. Swap or extend if you’re feeling dangerous.

## Docker

```bash
docker build -t pi-trainer .
docker run --rm -p 8080:80 pi-trainer
# → http://localhost:8080
```

GitHub Actions workflow `.github/workflows/publish-ghcr.yml` builds and pushes to **GHCR** on push to main.

Static assets under `/assets/*` get `Cache-Control: immutable` — happy Cloudflare “served by cache” numbers.

## Buy me a coffee

https://buymeacoffee.com/tylerr909?new=1

## Copyright (the unserious legal section)

Creating an original website generally gives you copyright in the *expression* (copy, design, code you wrote) automatically in most jurisdictions — you don’t need to file paperwork for copyright to *exist* (registration can still help enforcement in some places, e.g. the US).

You **cannot** copyright the mathematical constant π, or pure facts/digits of π. This site’s jokes, UI, and code are the protectable bits. Don’t sue circles.

---

Rename “Pi Trainer” wherever you like when inspiration strikes.
