# Agent guidelines — Filmweb Helper

Cross-browser extension (Chrome / Edge / Firefox) that randomizes films from a Filmweb „want to see” list. Aim for production-quality code: clear, maintainable, and safe for users.

## Required skills

Before writing or refactoring JavaScript, apply the **modern-javascript-patterns** skill (`/modern-javascript-patterns`):

- Prefer `const`, arrow functions, destructuring, optional chaining, and nullish coalescing
- Use `async`/`await` with proper `try`/`catch` — no bare Promise chains or swallowed errors
- Prefer pure helpers and immutable updates (spread / array methods) over mutation
- Keep functions small and single-purpose; extract shared logic into `lib/`

## Code quality

- Write **clean, readable** code that matches existing style in `lib/`, `content/`, `background/`, and `popup/`
- Document non-obvious behavior with short comments (why, not what). Public helpers in `lib/` should have a one-line JSDoc when intent is not obvious from the name
- Prefer explicit error codes (e.g. `NOT_LOGGED_IN`, `EMPTY_LIST`) and map them to i18n messages — never hardcode user-facing strings in JS
- Handle MV3 realities: service worker lifecycle, content-script messaging, and missing `document` in background contexts
- Do not over-engineer: no unused abstractions, no drive-by refactors outside the task

## Browser extension standards

- Keep app code shared; browser differences belong in `manifests/` and `scripts/use-manifest.*`
- Content scripts must remain robust on Filmweb SPA navigation (`pushState` / hash changes)
- Prefer public Filmweb API endpoints when possible; use credentialed/`logged` calls only as fallback
- Respect permissions: request only what is needed; never expand host permissions casually
- Test mentally for both Chromium (`service_worker`) and Firefox (`background.scripts` + gecko id)

## Privacy

- Never commit a real Filmweb nick, cookies, tokens, or session data
- Use placeholders only (`YOUR_NICK` / `TWOJ_NICK`) in docs and i18n
- Do not log personally identifiable Filmweb account details

## Git workflow

- Work on **`dev`**. Commit there by default
- **`main`** is for bug-free, production-ready code only — merge when the change is stable
- **Commit frequently**: one logical change per commit (Conventional Commits: `feat`, `fix`, `refactor`, `docs`, `chore`)
- Commit after each coherent unit of work — do not leave large uncommitted batches
- Never put secrets or account-identifying data in commits
- Do not force-push `main` / `master` or skip hooks unless the user explicitly asks

## Project layout (quick map)

| Path | Role |
| --- | --- |
| `lib/` | Shared logic (API, browser polyfill) |
| `content/` | In-page UI on filmweb.pl |
| `background/` | Service worker / background scripts |
| `popup/` | Extension popup |
| `manifests/` | Chromium vs Firefox manifest templates |
| `_locales/` | en_US / pl messages |
