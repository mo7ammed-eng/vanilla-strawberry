# Project Audit — Vanilla & Strawberry

**Audit date:** 2026-11-14
**Audit scope:** repository root, documentation pack, local toolchain, database availability, assets.
**Mode:** read-only. No application files existed to modify.

## 1. Executive summary

This repository is a **documentation-only scaffold**, not an existing application. It contains the AI engineering constitution (`AGENTS.md`), a product/design/architecture documentation pack, and an empty OpenCode plugin setup. There is:

- no frontend source, root `package.json`, or lockfile;
- no Laravel application in `api/`;
- no database, migrations, seeders, or SQL;
- no application tests;
- no git repository or commit history;
- no project imagery or brand assets.

Therefore the build is **greenfield within an existing repository**, governed by the documented architecture. The audit confirms every product feature described in the docs is missing and must be implemented, not repaired.

## 2. Inventory of what exists

| Path | State | Notes |
|---|---|---|
| `AGENTS.md` | Present | Complete engineering constitution; authoritative. |
| `README.md` | Present | Documentation-pack install instructions only. |
| `docs/PROJECT_OVERVIEW.md` | Present | Product scope, roles, homepage order. |
| `docs/ARCHITECTURE.md` | Present | Target monorepo layout; aspirational. |
| `docs/API.md` | Present | API conventions; no endpoints implemented. |
| `docs/DATABASE.md` | Present | Entity guidance; no schema implemented. |
| `docs/DESIGN_SYSTEM.md` | Present | Brand tokens and visual rules. |
| `docs/DEVELOPMENT.md` | Present | Intended commands; not implemented. |
| `docs/DEPLOYMENT.md` | Present | Deployment guidance; no configuration. |
| `docs/TESTING.md` | Present | Quality gates; no tests. |
| `docs/DEVELOPMENT_PLAN.md` | Present | High-level phases; expanded by this audit. |
| `docs/CHANGELOG.md` | Present | States no application implementation is claimed. |
| `docs/README.md` | Present | Documentation index. |
| `.opencode/` | Present | Only `@opencode-ai/plugin` dev tooling; unrelated to app. |
| `api/` | **Missing** | Laravel backend not created. |
| `src/`, `public/`, `scripts/`, `tests/` | **Missing** | No frontend, assets, root scripts, or cross-app tests. |
| Root `package.json` | **Missing** | No runnable commands. |
| `.env.example` | **Missing** | No environment contract. |

## 3. Environment audit

Verified locally on 2026-11-14:

| Tool | Result | Impact |
|---|---|---|
| Node.js | `v24.21.0` | Compatible with Next.js 16. |
| npm | `11.19.0` | Available. |
| PHP | `8.5.0` (`herd-lite`) | Modern; compatible with current Laravel. |
| Composer | `2.8.12` | Available. |
| MySQL server | `8.0.46` installed, service `MySQL80` **stopped** | Service could not be started without elevated privileges. |
| MySQL client | Binary exists at `C:\Program Files\MySQL\MySQL Server 8.0\bin`, not on `PATH` | Root scripts must not assume `mysql` is on `PATH`. |
| Git | Repository is **not initialized** | No history, branches, or diffs to preserve. |
| Network | npm registry and image CDN reachable | Dependencies and licensed imagery can be fetched. |

**Database decision:** MySQL remains the production/target database. Because the installed Windows service cannot be started in this sandbox, development will use a project-local MySQL 8 data directory and port `3307`, launched by a cross-platform root script using the installed `mysqld` binary. Automated backend tests use SQLite in-memory for speed and isolation. This keeps MySQL as the primary relational database and avoids destructive operations against unknown data.

## 4. Feature audit

Every area below is **not implemented**. Status is recorded against the requirement, not the docs.

| Area | Status | Required work |
|---|---|---|
| Brand site / homepage | Missing | Full editorial homepage in required section order. |
| Product catalog & collections | Missing | Categories, products, variants, add-ons, new/best/budget/premium collections, search. |
| Product detail & customization | Missing | Variant and add-on selection with live pricing. |
| Cart & checkout | Missing | Persisted client cart, backend recalculation, guest/auth checkout, order snapshot. |
| Authentication | Missing | Sanctum tokens, registration/login/logout, profile, three roles. |
| Customer account | Missing | Orders, addresses, notifications, reservations. |
| QR table ordering | Missing | Unguessable table tokens, explicit session start, source/table attribution. |
| Chef workflow | Missing | Order board, item/customization details, permitted status transitions. |
| Admin | Missing | Dashboard, catalog, orders, users/chefs, tables/QR, reservations, coupons, gallery, settings. |
| Reservations | Missing | Feature flag, server rejection when disabled, double-booking protection. |
| Coupons | Missing | Feature flag, validation, usage limits, min order, server-side discount. |
| Notifications | Missing | Persisted notifications + polling/real-time reconciliation. |
| Real-time | Missing | Broadcast-ready events, private authorization, polling fallback. |
| Security | Missing | Validation, policies, rate limiting, CORS, secret separation. |
| Tests | Missing | Backend feature tests, frontend typecheck/lint/build, browser journeys. |
| Root tooling | Missing | `setup`, `dev`, `build`, `start`, `test`, `lint`, `health`. |
| Deployment docs/config | Partial | Guidance exists; no Docker/env/health implementation. |

## 5. Architecture observations and decisions

1. **Single repository, modular monolith.** Laravel in `api/`; Next.js at root. Confirmed by `AGENTS.md`.
2. **REST is authoritative.** Frontend never computes final prices, discounts, or order totals.
3. **Exactly three roles.** `customer`, `chef`, `admin`; enforced by enum, middleware, and policies.
4. **Money as integer minor units.** All prices, fees, and discounts are integer cents.
5. **Token authentication.** Sanctum personal access tokens via `Authorization: Bearer` are used because the frontend and API run on separate origins. No browser-exposed server secrets.
6. **Feature flags.** `reservations_enabled` and `coupons_enabled` live in server settings and are enforced on the API.
7. **Real-time.** Laravel broadcasting event classes and private-channel authorization are implemented. The UI reconciles via API polling, which is the graceful fallback when Reverb is not running. No claim of live courier tracking.
8. **QR sessions.** Scanning a QR URL only validates the table. A table session starts only after an explicit customer action, and orders reference the session.
9. **Payment.** No payment provider is configured. Checkout uses pay-on-collection/pay-on-delivery and is clearly labelled. No fake card processing.
10. **Reservations.** The feature is optional; when disabled, both UI and API reject creation. Slot capacity is enforced transactionally.

## 6. Risks and blockers

| Risk | Severity | Mitigation |
|---|---|---|
| MySQL Windows service cannot be started without admin | Medium | Project-local MySQL on port `3307` via root script; SQLite for tests. |
| No photography in repository | Medium | Use licensed Unsplash dessert photography downloaded locally; verified HTTP 200. |
| Real-time requires a separate Reverb process | Medium | Event classes + polling fallback; document process requirement. |
| Large scope can produce shallow screens | High | Implement end-to-end vertical slices with tests; no placeholder-only pages. |
| Cross-origin auth and CORS misconfiguration | High | Explicit CORS config, bearer tokens, browser verification. |
| MySQL vs SQLite behavioral differences | Medium | Use portable schema, run browser journeys against MySQL. |
| No git history | Low | Initialize git locally; do not commit unless requested. |

## 7. Conclusion and next step

The repository is safe to build in: there is no application code to preserve or overwrite. The next step is the phased implementation in `docs/DEVELOPMENT_PLAN.md`, starting with the Laravel API foundation and database schema, followed by the Next.js design system and public site, then commerce, QR/Chef, Admin, optional features, and verification.
