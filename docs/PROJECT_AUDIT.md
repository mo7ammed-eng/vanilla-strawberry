# Project Audit — Vanilla & Strawberry

**Audit date:** 2026-11-17
**Audit scope:** full repository at `G:\shop-deploy` — Next.js frontend, Laravel API, root tooling, docs, assets, tests, git state, and a live browser smoke test.
**Mode:** read-only audit followed by one small, verified implementation batch. No database was reset and no user work was overwritten.

## 1. Executive summary

This repository is a **working monorepo**, not a documentation-only scaffold. It contains a complete Next.js 16 / React 19 storefront, a Laravel 12-style API in `api/` with Sanctum auth, a large feature set (catalog, cart, checkout, orders, QR tables, chef board, admin operations, reservations, coupons, notifications), 41 passing backend tests, and cross-platform root scripts.

The earlier audit (2026-11-14) was accurate at the time but is now stale. The current state is **implementation with remaining polish and verification gaps**, not greenfield work. The most important remaining work is design-token alignment with the requested palette, deeper admin analytics, expanded browser/accessibility coverage, and deployment configuration.

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
| Authentication | Implemented | Sanctum bearer tokens, register/login/logout/me, role-aware UI. |
| Customer account | Implemented | Orders, order detail, addresses, profile, reservations. |
| QR table ordering | Implemented | Token validation, explicit session start, source/table attribution, no occupancy on page load. |
| Chef workflow | Implemented | Order board, item/customization visibility, permitted status transitions. |
| Admin operations | Implemented (breadth) | 13 admin controllers covering catalog, orders, users, tables, reservations, coupons, gallery, settings; analytics depth still needs review. |
| Reservations & coupons | Implemented | Server-side flags, validation, double-booking and usage-limit rules. |
| Notifications | Implemented | Persisted notifications, unread indicators, UI bell. |
| Real-time | Partial | Broadcast-ready events and polling fallback; Reverb not configured in the local environment. |
| Security | Implemented core | Server-side money/validation, roles, guest-token checks, rate limits; broader audit remains. |
| Tests | Partial → strong backend | 41 backend tests / 208 assertions pass; frontend lint/typecheck/build pass; targeted browser smoke passes. |
| Root tooling | Implemented | `setup`, `dev`, `build`, `start`, `test`, `lint`, `health`, `db:*`. |
| Deployment config | Partial | Docs exist; Docker/compose files are not committed. |
| Documentation | Being synchronized | `PROJECT_AUDIT.md`, `DEVELOPMENT_PLAN.md`, and `CHANGELOG.md` revised on 2026-11-17. |

## 5. Architecture decisions (current)

1. Single repository; Laravel in `api/`, Next.js at root.
2. REST API is authoritative; WebSockets, when configured, deliver updates only.
3. Exactly three roles: `customer`, `chef`, `admin`.
4. Money is stored as integer minor units (cents).
5. Sanctum bearer tokens are used for cross-origin auth; no server secrets are exposed to the browser.
6. Feature flags are enforced server-side for reservations and coupons.
7. QR table tokens are unguessable; table sessions close explicitly.
8. Order statuses follow a validated transition service.
9. Payment is pay-on-collection / pay-on-delivery; no fake card processing.
10. Polling is the graceful fallback when Reverb is unavailable.

## 6. Risks and blockers

| Risk | Severity | Mitigation |
|---|---|---|
| MySQL Windows service cannot be started without admin | Medium | Project-local MySQL on `3307`; SQLite in-memory for tests. |
| Reverb not configured | Medium | Keep polling fallback; document separate WebSocket process requirement. |
| No payment provider | Low | Current checkout is explicitly pay-on-collection/delivery; do not simulate card success. |
| Prior uncommitted work in working tree | Medium | Inspect diffs before editing; never discard or reset. |
| Browser coverage currently limited to cart flow | Medium | Expand E2E to auth, QR/Chef, checkout, admin. |
| Deployment config absent | Medium | Add Docker/compose and environment checklist in a later phase. |
| Requested palette | Resolved | Six requested values applied as source-of-truth tokens on 2026-11-17; see `DESIGN_SYSTEM.md`. |

## 7. Verification evidence (fresh, 2026-11-17)

| Command / check | Result |
|---|---|
| `npm run lint` | Passed, no errors. |
| `npm run typecheck` | Passed, no errors. |
| `npm run build` | Passed; 30 routes generated. |
| `php artisan test --compact` | Passed: 41 tests, 208 assertions, 2825 ms. |
| Python Playwright browser smoke | Passed: cart drawer open/close, default variant name, quantity +/-, remove, 390 px layout, no console/page errors, no failed same-origin requests. |
| Palette verification | Passed: body background `rgb(255, 248, 239)` and CSS variables match all six requested palette values. |

Browser checks ran on an isolated frontend port `3100` because port `3000` was occupied by an unrelated Next.js process. Chromium was launched with CORS disabled for the smoke test only; no application CORS code was changed.

## 8. Conclusion and next step

The platform is already functional and safe to extend in small stages. The next safe phase is polish, not rebuild: align design tokens with the requested vanilla/strawberry palette, deepen admin analytics, add durable browser E2E coverage, and add deployment configuration. See `DEVELOPMENT_PLAN.md` for the revised phase status.
