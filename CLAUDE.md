# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Pinodo client: a Spanish-language store-management panel (SvelteKit 3, Svelte 5 runes, Tailwind v4, TypeScript, pnpm) that consumes the Pinodo REST API. UI copy, comments and domain names (`tienda`, `venta`, `categorias`…) are in Spanish; keep that.

## Commands

```sh
pnpm dev                 # vite dev
pnpm build / preview     # production build (adapter-cloudflare) / serve it
pnpm check               # svelte-kit sync + svelte-check (run after adding routes: route types are generated)
pnpm lint                # prettier --check . && eslint .
pnpm format              # prettier --write .  (tabs, single quotes, width 100, tailwind class sorting)
pnpm test:unit           # vitest in watch mode
npx vitest --run --project server                       # all node unit tests (*.spec.ts)
npx vitest --run --project server src/lib/utils/rbac    # a single spec file
pnpm test:e2e            # playwright (builds, then serves on :4173; files named *.e2e.ts)
```

Vitest has two projects: `server` (node, `src/**/*.{test,spec}.ts`) and `client` (browser/Playwright, only `*.svelte.{test,spec}.ts`). There is no `svelte.config.js`; SvelteKit options (runes forced on, adapter) live in `vite.config.ts`.

## Environment

`src/env.ts` declares the env vars with zod (`defineEnvVars`); they are static + public and imported from `$app/env/public`: `VITE_API_ENDPOINT` (API base URL **including `/api/v1`**, so service paths are written as `/usuarios/me`, `/config/`) and `PUBLIC_SITE_URL`.

## Architecture

**Import aliases.** Use `#lib/...` (package.json `imports`) with explicit `.ts` extensions, e.g. `#lib/stores/index.ts`; most folders have a barrel `index.ts`. `src/lib/config/navigation.config.ts` is _not_ re-exported from the config barrel; import it directly.

**Layering.** `config/api*.ts` (`apiPinodo`, a fetch wrapper) → `services/*.service.ts` (one class per API area, exported as singleton) → `stores/` (svelte stores that sync with localStorage) → components/routes. `apiPinodo` always throws `AppError`, sends the bearer token when present, and on a 401 does a single refresh-and-retry (see below); `postPublic`/`getPublic` skip the token.

**Auth and session.**

- Login is OAuth2 password flow (form-encoded). The access token and a CSRF token live in localStorage (`constants/keys.ts`); the refresh token is an HttpOnly cookie. `authService.refreshToken` dedupes concurrent refreshes and serializes them across tabs with a Web Lock.
- `authStore` (an object of actions, not a store) plus `currentUserStore` / `currentRole`. `authStore.ensureSession()` trusts the user stored in localStorage and calls `/usuarios/me` only when there is a token but no stored user. The role used for UI gating is therefore as fresh as the last login/profile fetch (the backend still enforces real permissions); a rejected token surfaces as a 401 on the first API call.
- `authService.clearAuth()` wipes every key in localStorage (tokens, user, tienda); `authStore.logout()` and the session-expired listener also reset the stores.
- The store configuration (`GET /config/`) is cached under `TIENDA_DATA_KEY`. `tiendaStore.ensure()` fetches only if missing (called from `panel/+layout.ts`); `login` calls `refresh()`. Read it via `currentTiendaStore`. `clear()` bumps a generation counter so late responses after logout are discarded.

**Access control (two independent layers, both UI-only; the backend enforces the real thing).**

- `config/permissions.config.ts`: `Role`, `Module`, `Action`, role→module→actions matrix (mirror of the backend's `shared/services/permissions.py`), role hierarchy. Used via `can()` / the `components/auth/can.svelte` component.
- `config/routeAccess.config.ts`: `ROLE_ACCESS` decides which _pages_ each role opens (`routes` cover subroutes, `exactRoutes`, `excludedRoutes`, `home`). Checked by `canAccessRoute()` in `utils/rbac.utils.ts` with SvelteKit **route ids** (route groups like `(legal)` are stripped). Adding a role requires an entry in both configs (`Record<Role, …>` enforces it).
- `utils/routeGuard.ts#guardRoute` is called from an area's `+layout.ts` load (`panel/+layout.ts`): no session → `/auth/sign-in?redirectTo=…`; session without access → the role's home. The panel sets `ssr = false` because the session only exists in the browser.

**Panel navigation.** `PANEL_NAVIGATION` in `config/navigation.config.ts` is the single source for the sidebar and the header title. Items are `NavItem`s built with the `navItem()` helper, which resolves `href` from a typed `route` (a typo is a type error), and may have one level of `children`. A parent is itself a page (clicking it navigates; its children expand while it or a child is active). `filterNavigation(sections, role)` drops items the role can't open (parent denied ⇒ its children go too); `findActiveNavItem` gives the header title/icon.

**Panel shell.** `routes/panel/+layout.svelte` composes `Sidebar` (desktop: blends into the page background; mobile: drawer) and a rounded main card with its own scroll containing `Header` + page. The user/tienda menu is `ui/storeMenu.svelte` at the bottom of the sidebar (the user profile is deliberately _not_ in the header, mirroring Shopify's admin layout).

**New panel modules.** Follow the `panel-module` skill (`.claude/skills/panel-module/SKILL.md`); `usuarios` is the in-repo reference implementation.

**Public storefront (`routes/(tienda)/`).** SSR (unlike the panel) over the unauthenticated `/tienda/*` endpoints via `tiendaPublicaService`, which uses `apiPinodo.getPublic(endpoint, { fetch })` (no token; pass the load's `fetch` so the SSR response is reused on hydration instead of fetched twice). URLs: `/{seccion-slug}`, `/{slug}-l{categoriaId}`, `/{slug}-p{productoId}` with matchers in `src/params.ts` (Kit 3 `defineParams`); a wrong slug 301s to the canonical one. Route id of the home is `/(tienda)` (use `resolve('/(tienda)')`, not `'/'`). `resolve()` may return relative paths (`./x`) in SSR: build absolute URLs with `new URL(href, page.url.href)`. Filters live in the query string (`parseFiltros`/`filtrosToSearchParams` in `utils/tienda.utils.ts`). `+layout.ts` loads config + navegación; `en_mantenimiento` renders `tiendaMantenimiento` instead of the store. The cart (`cesta.store.ts`, key `CESTA_KEY`) hydrates on mount and is sent as a `wa.me` message (`mensajePedido`). SSR fetches are CORS-checked by SvelteKit, so the store's domain must be an allowed origin in the API. Storefront motion uses only Svelte (`svelte/transition`, `animate:flip`, `Tween`); always pass durations through `duracion()`/`escalonado()` (`utils/motion.ts`) so prefers-reduced-motion is respected. `tiendaDrawer` keeps a native `<dialog>` and closes it on the panel's `outroend`. One deployment = one store: every public-facing name/description/logo comes from `/tienda/config` (`TiendaSeo`, `routes/manifest.webmanifest/+server.ts`, the iOS app title in the store layout, the legal pages under `(tienda)/(legal)`); `APP_SITE_CONFIG` is only the PINODO platform brand (panel, login, fallback).

**PWA.** `src/service-worker/index.ts` precaches the app shell and deliberately ignores cross-origin requests (the API is never cached). It has its own `tsconfig.json` (WebWorker types) and is excluded from the root one. `components/layout/appUpdateBanner.svelte` handles update prompts.

**Styling.** Tailwind v4 configured in `src/routes/layout.css` (`@theme`): palette tokens `light-*` / `dark-*` (`bg-light-three`, `dark:bg-dark-one`, …), dark mode via the `.dark` class (custom variant), breakpoints sm–2xl only. The whole app uses IBM Plex Mono (`@fontsource/ibm-plex-mono`, self-hosted `@font-face` in `layout.css`, weights 300–700) as `--font-sans`; add a weight's `@font-face` before using it. The UI intentionally uses square corners; the only rounded surfaces are the Shopify-style main card and the store menu.
