# Project Audit — Vanilla & Strawberry

**Audit date:** 2026-11-17
**Audit scope:** full repository at `G:\shop-deploy` — Next.js frontend, Laravel API, root tooling, docs, assets, tests, git state, and a live browser smoke test.
**Mode:** audit followed by verified hardening/feature implementation batches. No database was reset and no user work was overwritten.

## 1. Executive summary

This repository is a **working monorepo**, not a documentation-only scaffold. It contains a complete Next.js 16 / React 19 storefront, a Laravel 13 API in `api/` with Sanctum auth, a large feature set (catalog, cart, checkout, orders, QR tables, chef board, admin operations, reservations, coupons, notifications), 51 passing backend tests, and cross-platform root scripts.

The platform has now been hardened beyond the earlier audit: password confirmation is enforced end to end, self-service password change/reset exists, Sanctum tokens expire and rotate, settings input is strictly validated, notification URLs are restricted to internal paths, private dashboards are `noindex`, branding/SEO are driven by the admin website name, and mobile navigation includes a Font Awesome QR scanner. Remaining work is deeper E2E/accessibility coverage, deploying Docker/compose config, and resolving the missing committed logo asset.

## 2. Repository inventory

| Path | State | Notes |
|---|---|---|
| `AGENTS.md` | Present | Authoritative engineering constitution; exactly three roles. |
| `README.md` | Present | Documentation-pack oriented; could be refreshed. |
| `package.json` / `package-lock.json` | Present | Root Next.js app and scripts. |
| `src/` | Present | App Router pages, components, providers, lib. |
| `public/images/` | Present | 12 local dessert images used by UI and seeders. |
| `api/` | Present | Laravel application, migrations, seeders, feature tests. |
| `scripts/` | Present | `dev`, `start`, `test`, `health`, `setup`, `db`, `api-*` helpers. |
| `docs/` | Present | Documentation pack; audit/plan were stale and are now revised. |
| `.env.example`, `api/.env.example` | Present | Environment contract; Reverb values are placeholders. |
| Git repository | Present | History exists; working tree contains prior uncommitted work that must be preserved. |
| Docker / compose config | **Missing** | Deployment guidance exists, but no Dockerfile or compose file is committed. |

## 3. Environment audit

Verified locally on 2026-11-17:

| Tool | Result | Impact |
|---|---|---|
| Node.js | `v24.21.0` | Compatible with Next.js 16. |
| npm | `11.19.0` | Root scripts work. |
| PHP | `8.5.0` | Compatible with current Laravel. |
| Composer | `2.8.12` | Available. |
| MySQL | `8.0.46` installed; Windows service stopped | Local dev uses project-local MySQL on port `3307`; tests use SQLite in-memory. |
| Git | Initialized with history | Preserve existing uncommitted changes; do not reset. |
| Browser | Chromium via Playwright | Used for the cart-drawer smoke test. |

## 4. Feature audit

| Area | Status | Evidence / notes |
|---|---|---|
| Brand site / homepage | Implemented | `/` renders editorial sections, categories, featured products, story, gallery and visit blocks; verified in browser. |
| Catalog & collections | Implemented | `/menu`, category/collection filters, search, public products API. |
| Product detail & customization | Implemented | Variants, add-ons, live pricing, quantity stepper. |
| Cart & checkout | Implemented | Persisted cart provider, cart page, new cart drawer, coupon validation, server-side order recalculation. |
| Authentication | Implemented + hardened | Sanctum bearer tokens, register/login/logout/me, password confirmation, forgot/reset/change password, expiring/rotating/revocable tokens, role-aware UI. |
| Customer account | Implemented | Orders, order detail, addresses, profile with password change, reservations. |
| QR table ordering | Implemented | Token validation, explicit session start, QR camera/image scanner in mobile nav, source/table attribution, no occupancy on page load. |
| Chef workflow | Implemented | Order board, item/customization visibility, permitted status transitions. |
| Admin operations | Implemented (breadth) | 13 admin controllers covering catalog, orders, users, tables, reservations, coupons, gallery, settings; analytics depth still needs review. |
| Reservations & coupons | Implemented | Server-side flags, validation, double-booking and usage-limit rules. |
| Notifications | Implemented | Persisted notifications, unread indicators, UI bell. |
| Real-time | Partial | Broadcast-ready events and polling fallback; Reverb not configured in the local environment. |
| Security | Hardened core | Server-side money/validation, roles, guest-token checks, rate limits, strict settings validation, internal-only notification URLs, token expiration/rotation/revocation, `noindex` private dashboards; no claim of 100% security. |
| Tests | Strong backend + smoke | 51 backend tests / 251 assertions pass; frontend lint/typecheck/build pass; 10-route browser smoke passes with zero console errors. |
| SEO / branding | Implemented | Dynamic website name in logo/title/metadata, canonical/OG/Twitter tags, `robots.ts`, `sitemap.ts`, private-area noindex. |
| Root tooling | Implemented | `setup`, `dev`, `build`, `start`, `test`, `lint`, `health`, `db:*`. |
| Deployment config | Partial | Docs exist; Docker/compose files are not committed. |
| Documentation | Being synchronized | `PROJECT_AUDIT.md`, `DEVELOPMENT_PLAN.md`, and `CHANGELOG.md` revised on 2026-11-17. |

## 5. Architecture decisions (current)

1. Single repository; Laravel in `api/`, Next.js at root.
2. REST API is authoritative; WebSockets, when configured, deliver updates only.
3. Exactly three roles: `customer`, `chef`, `admin`.
4. Money is stored as integer minor units (cents).
5. Sanctum bearer tokens are used for cross-origin auth; tokens expire (default 10080 minutes), rotate through `/auth/refresh`, and are revoked on password change/reset; no server secrets are exposed to the browser.
6. Feature flags are enforced server-side for reservations and coupons.
7. QR table tokens are unguessable; table sessions close explicitly.
8. Order statuses follow a validated transition service.
9. Payment is pay-on-collection / pay-on-delivery; no fake card processing.
10. Polling is the graceful fallback when Reverb is unavailable.
11. The admin `restaurant_name` setting is the authoritative website name for navigation, metadata, footer, and receipts.
12. Notification URLs are accepted only when they are internal paths.

## 6. Risks and blockers

| Risk | Severity | Mitigation |
|---|---|---|
| MySQL Windows service cannot be started without admin | Medium | Project-local MySQL on `3307`; SQLite in-memory for tests. |
| Reverb not configured | Medium | Keep polling fallback; document separate WebSocket process requirement. |
| No payment provider | Low | Current checkout is explicitly pay-on-collection/delivery; do not simulate card success. |
| Prior uncommitted work in working tree | Medium | Inspect diffs before editing; never discard or reset. |
| Browser coverage is smoke-level, not durable E2E | Medium | Expand E2E to auth, QR/Chef, checkout, admin, keyboard/accessibility. |
| Requested logo asset missing | Medium | `public/assets/img/logo.png` is not present; text logo fallback is used. Do not generate or replace the asset without approval. |
| Local port 8000 occupied by unrelated process | Low | Verification used isolated ports 8100/3101; `npm run dev` reports the conflict clearly. |
| Deployment config absent | Medium | Add Docker/compose and environment checklist in a later phase. |
| Requested palette | Resolved | Six requested values applied as source-of-truth tokens on 2026-11-17; see `DESIGN_SYSTEM.md`. |
| Dev-only npm audit findings | Low | `npm audit --omit=dev` reports 0 production vulnerabilities; 7 moderate dev-only findings remain. |

## 7. Verification evidence (fresh, 2026-11-17)

| Command / check | Result |
|---|---|
| `vendor/bin/pint --dirty --format agent` | Passed. |
| `php artisan test --compact` | Passed: 51 tests, 251 assertions, 2507 ms. |
| `npm run typecheck` | Passed, no errors. |
| `npm run lint` | Passed, no errors. |
| `npm run build` | Passed; 34 routes generated. |
| `npm audit --omit=dev` | 0 production vulnerabilities; 7 moderate dev-only findings reported by install. |
| Python Playwright browser smoke | Passed: 10 routes, dynamic brand title, no header "Order now" CTA, mobile QR dialog with camera/upload actions, `robots.txt`, `sitemap.xml`, 390 px viewport, 0 console/page errors. |
| API health | Passed at isolated `http://127.0.0.1:8100/api/v1/health`. |

Browser checks ran against a production build on isolated ports `3101` (frontend) and `8100` (API) because port `3000/8000` were occupied by unrelated processes. CORS was verified with the API `FRONTEND_URL` matching the isolated frontend origin; no permissive CORS code was added.

## 8. Conclusion and next step

The platform is functional, hardened in the audited areas, and safe to extend in small stages. The next safe phase is durable browser E2E/accessibility coverage, admin analytics polish, deployment configuration, and supplying the missing committed logo asset. See `DEVELOPMENT_PLAN.md` for the revised phase status.
