# ufzgiblatt.ch

Printable worksheet generator (math + German, Swiss primary school) plus
learning games and the interactive "Üben & Verdienen" screen-time mode.
Plain static site: no build step, no framework. Serve the repo root.

## Hosting & deployment — IMPORTANT

- **All web projects in this organization run on Cloudflare.** ufzgiblatt.ch
  DNS is on Cloudflare and the live site is served by a Cloudflare origin
  (Cloudflare Pages), NOT by GitHub Pages.
- The GitHub Actions workflows (`deploy-dev.yml`, `deploy-prod.yml`) publish
  to the `gh-pages` branch. As of 2026-07 the domain does not serve from
  GitHub Pages, so those deploys are invisible on ufzgiblatt.ch until
  deployment is rewired to Cloudflare Pages (wrangler or the Pages Git
  integration). Do not "fix" deployment by pointing DNS at GitHub Pages.
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
