# π piwtf

**Proprietary. All Rights Reserved.** See [`LICENSE`](LICENSE).

**[piwtf.com](https://piwtf.com)** — a toy for people who want to learn the digits of π and a joke for people who already know they won’t.

You may **pull and run** the official GHCR image for personal, non-commercial use. You may **not** fork, copy, modify, or redistribute the source, site, or joke/IP. π digits are public-domain facts; only the original code, UI, copy, and jokes are protected.

MonkeyType energy. hackertyper.net energy. Digit #1 is 3. `3.14` is the first three digits. Entertainment only. No warranties.

## Modes

| Mode | What it does |
|------|----------------|
| **Pi** | Wall of digits. Select a span → `#1 - #57`. Scroll loads more π. |
| **Digit** | One giant digit. Space / tap to advance; hold to run. Quips get mean. |
| **Trainer** | See the stack, pick the next digit left or right. |
| **Quiz** | “What’s the *n*th digit?” 50/50 or Pro Mode. Hints lie. |
| **Tape** | Slow scroll with ticks at 25 / 50 / 100. |
| **Hacker** | Mash keys (or tap the well). Digits spill. |
| **Base** | Real π in binary, hex, dozenal, … and fake Wingdings. |
| **Rain** | Matrix rain, but it’s only π. |

`R` randomizes the theme (except in Hacker). Arrow up / down cycles. Phones: shake anywhere (after a tap, so iOS can ask). Idle chrome fades on desktop; phones keep the nav.

## Dev

```bash
npm install
npm start          # or: npm run dev
npm test
npm run lint
npm run typecheck
npm run build
```

Node 24 (`.nvmrc`). Lefthook runs lint / typecheck / tests on commit.

**i18n** — Lingui 6, `locales/{en,es}/`. `npm run i18n:extract`. Dev-only **pseudo-en** is QA padding so hardcoded English sticks out.

**Themes** — CSS variables in `src/themes/themes.ts`, stored as `pi-wtf-theme`.

**π** — ~5k digits in the bundle, then `/public/pi.txt` hydrates the rest (~1e6).

## PWA

`npm run build && npm run preview`. Installable. Service worker precaches the shell + `/pi.txt`.

## CI & deploy

GitHub Actions on PR / `main`: lint · typecheck · test.

Live site is **Cloudflare Workers Static Assets** (not classic Pages):

| Dashboard | Value |
|-----------|--------|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Production branch | `main` |
| Project name | `pi-wtf` (must match `wrangler.jsonc`) |

Build writes `dist/`. Wrangler publishes it. Don’t put `npm run build` in the deploy command.

**Docker / GHCR** — merge to `main` also runs **Release · GHCR**: auto patch tag, push image, GitHub Release.

```bash
docker pull ghcr.io/tylerr909/pi-wtf:latest
docker run --rm -p 8080:80 ghcr.io/tylerr909/pi-wtf:latest
```

That image is the only granted distribution path. After the first successful push: GHCR package → **Public** so anonymous `docker pull` works. Local: `docker build -t pi-wtf .`

## License

Copyright © 2026 TylerR909. All Rights Reserved.

A practical joke. Entertainment only. No warranties. π digits are public-domain mathematical facts; only the original code, UI, copy, and jokes are protected.

Full terms: [`LICENSE`](LICENSE) · third-party fonts/libs: [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)

## Also

- Coffee: [buymeacoffee.com/tylerr909](https://buymeacoffee.com/tylerr909?new=1)
