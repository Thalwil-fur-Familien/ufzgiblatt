# ufzgiblatt.ch

Printable worksheet generator (math + German, Swiss primary school) plus
learning games and the interactive "Üben & Verdienen" screen-time mode.
Plain static site: no build step, no framework. Serve the repo root.

## Hosting & deployment — IMPORTANT

- **All web projects in this organization run on Cloudflare.** ufzgiblatt.ch
  is served by Cloudflare Pages via its Git integration with this repo —
  deployment happens automatically on push, there is no deploy step in this
  repo. GitHub Actions (`ci.yml`) run tests only. Never deploy via GitHub
  Pages / gh-pages (the legacy `gh-pages` branch is dead weight).
- The site is plain static files with no build step: the Pages project must
  have an empty build command and `/` as output directory.
- Extensionless URLs (`/practice`, `/geography-game`) must keep working on
  the host (Cloudflare Pages and `npx serve` both resolve `foo` →
  `foo.html`).

## Development

- Run locally: `npm install`, then `npx serve .` → http://localhost:3000
- Unit tests: `npm test -- --run` (vitest, `tests/`)
- GUI tests: `npm run test:gui` (Playwright, `tests-gui/`; config pins
  locale `de-CH` because the app auto-detects browser language; tests block
  external requests — keep them hermetic)
- The app is bilingual (DE default / EN); translations live in
  `js/translations.js`. Randomness must go through the seeded RNG in
  `js/mathUtils.js` (`setSeed`/`seededRandom`/`shuffle`) so worksheets are
  reproducible from the `seed` URL param — the practice mode is the one
  deliberate exception.

## Privacy

Audience is families/children: PostHog runs cookieless
(`persistence: 'memory'`, no autocapture) — keep it that way, and avoid
adding tracking or third-party scripts without SRI.
