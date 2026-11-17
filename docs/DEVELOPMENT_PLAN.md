# Phased Development Plan — Vanilla & Strawberry

**Revised:** 2026-11-17. This plan supersedes the earlier "documentation-only" version. See `PROJECT_AUDIT.md` for current evidence.

## Delivery principles

- One repository; Laravel in `api/`, Next.js at root.
- Vertical slices: API + UI + verification, not screenshots.
- Backend is authoritative for prices, discounts, totals, roles, table state, and status transitions.
- Money is integer cents; API responses use `{ "data": ..., "message": ... }`.
- Exactly three roles: `customer`, `chef`, `admin`.
- No feature is called complete without a test or browser verification.
- MySQL is the target database; SQLite in-memory is used for automated tests.
- Preserve existing uncommitted work; never reset or overwrite it.

---

## Phase 0 — Audit and baseline (complete)

- [x] Read `AGENTS.md` and relevant docs.
- [x] Inspect repository tree, manifests, git state, assets, and scripts.
- [x] Confirm Node, npm, PHP, Composer, MySQL, and browser tooling.
- [x] Revise `PROJECT_AUDIT.md` and this plan to match actual code.

**Acceptance:** audit and plan now describe the real repository.

---

## Phase 1 — Foundation (complete)

- [x] Laravel application in `api/` with Sanctum, `/api/v1` routes, JSON errors, CORS, rate limiting, health check.
- [x] Next.js App Router at root with TypeScript, Tailwind 4, ESLint, path aliases, fonts, metadata.
- [x] Local dessert imagery in `public/images/`.
- [x] Root scripts: `setup`, `dev`, `build`, `start`, `test`, `lint`, `health`, `db:up`, `db:down`, `db:status`.
- [x] `.env.example` at root and in `api/`.

**Acceptance:** all root scripts exist; build and lint pass.

---

## Phase 2 — Database and authentication (complete)

- [x] Full migration set for users, catalog, orders, tables/sessions, reservations, coupons, notifications, addresses, gallery, settings.
- [x] Idempotent seed data for demo accounts, products, variants, add-ons, tables, settings.
- [x] Sanctum registration/login/logout/me/profile with rate limiting.
- [x] Role middleware and backend authorization for customer/chef/admin boundaries.
- [x] Backend feature tests cover auth and role rejection.

**Acceptance:** 51 backend tests pass.

---

## Phase 3 — Catalog and public API (complete)

- [x] Categories/products endpoints with pagination, search, filters, collections, sorting.
- [x] Product detail with variants, add-ons, badges, category.
- [x] Public gallery and settings endpoints.
- [x] Table validation by QR token.
- [x] Admin catalog CRUD.

**Acceptance:** catalog pages and tests work against the API.

---

## Phase 4 — Design system and public site (mostly complete)

- [x] Editorial homepage with required section order.
- [x] Menu, product detail, story, gallery, reservations entry points.
- [x] Shared UI components: button, badge, field, modal, empty state, spinner, product card/grid.
- [x] Responsive header/footer, fixed mobile bottom navigation with centre QR scanner, reduced-motion-friendly CSS.
- [x] Aligned all tokens with the requested palette (`#FFF8EF`, `#E94B68`, `#982D49`, `#F8DDE2`, `#392725`, `#FFFFFF`).
- [x] Removed obsolete header "Order now" CTAs.
- [ ] **Remaining:** add product quick view and a fuller image gallery on detail pages.

**Acceptance:** desktop and 390 px browser checks pass; palette values verified in the browser.

---

## Phase 5 — Commerce (complete, with recent fix)

- [x] Persisted cart context with variant/add-on identity.
- [x] Cart page and new `CartDrawer` used from the header.
- [x] Checkout with delivery/pickup, coupon validation, pay-on-collection notice.
- [x] Server-side recalculation of lines, fees, tax, discounts, totals and order snapshots.
- [x] Guest order token, order confirmation, account order history/detail.
- [x] Recent fix: quick-add now resolves the product's default active variant before computing the cart key and line price.
- [x] Recent fix: submitting state is reset on successful checkout.

**Acceptance:** browser smoke verified drawer, default variant, quantity, remove, and mobile layout; no console/page errors.

---

## Phase 6 — QR and Chef workflow (complete)

- [x] `/qr/[token]` validates the table without occupying it.
- [x] Explicit table session creation; orders carry source/table/session.
- [x] Chef board with item details, notes, source, table, and elapsed time.
- [x] Permitted status transitions only; polling reconciliation and manual refresh.

**Acceptance:** backend tests cover QR attribution, role enforcement, and illegal transitions.

---

## Phase 7 — Admin operations (implemented, depth to review)

- [x] Dashboard, products, categories, add-ons, orders, customers, chefs, tables, coupons, reservations, gallery, settings.
- [x] Functional API-backed CRUD and status updates.
- [x] Strict per-key settings validation, including website name, tax/fee bounds, and `http(s)`-only map URLs.
- [ ] **Remaining:** deepen dashboard analytics and visual hierarchy without adding fake data.

**Acceptance:** admin pages exist and are API-backed; analytics polish remains.

---

## Phase 8 — Optional features and notifications (complete)

- [x] Reservations and coupons with server-enforced flags.
- [x] Transactional double-booking prevention and coupon limits.
- [x] Persisted notifications with unread UI and internal-path-only navigation URLs.
- [x] Broadcast-ready events and polling fallback; no public sensitive broadcasts.
- [x] Location permission is only requested when needed; no live courier-tracking claim.

**Acceptance:** tests cover disabled flags, limits, and authorization.

---

## Phase 9 — Verification and handover (in progress)

- [x] `php artisan test --compact` — 51 tests, 251 assertions.
- [x] `vendor/bin/pint --dirty --format agent`.
- [x] `npm run lint`, `npm run typecheck`, `npm run build` — 34 routes generated.
- [x] `npm audit --omit=dev` — 0 production vulnerabilities.
- [x] Production browser smoke — 10 routes, dynamic brand title, QR dialog, robots/sitemap, 390 px viewport, 0 console errors.
- [ ] Expand browser journeys: auth, QR → Chef → status, checkout with coupon, admin CRUD.
- [ ] Keyboard/accessibility pass across dialogs and forms.
- [ ] Add Docker/compose deployment configuration.
- [ ] Refresh `README.md`, `DEVELOPMENT.md`, `TESTING.md`, `DEPLOYMENT.md`, `API.md`, `DATABASE.md` where they still describe an unimplemented project.

**Acceptance:** evidence is recorded; remaining gaps are explicit, not hidden.

---

## Phase 10 — Current polish batch (2026-11-17)

**Completed in this batch:**
- Added `src/components/cart/cart-drawer.tsx`.
- Wired header cart button to the drawer through `SiteFrame`.
- Fixed default-variant resolution in `CartProvider`.
- Reset checkout `submitting` state after a successful order.
- Revised stale audit/plan/changelog docs.
- Verified with lint, typecheck, build, backend tests, and a live Chromium smoke test.
- Applied the requested six-colour palette to design tokens, viewport theme colour, and documented semantic aliases.

**Next safe steps:**
1. Add product quick view and richer product imagery.
2. Deepen admin dashboard analytics using existing API data only.
3. Add durable browser E2E coverage for the critical journeys below.

---

## Phase 11 — Security hardening and UX batch (2026-11-17)

**Completed:**
- [x] Fixed registration confirmation by sending `password_confirmation` from the frontend; backend `confirmed` rule retained.
- [x] Added forgot/reset/change password endpoints, notifications, requests, tests, and UI pages.
- [x] Configured Sanctum token expiration, `/auth/refresh` rotation, revocation on password change/reset, and automatic frontend token refresh on 401.
- [x] Added strict settings validation and internal-only notification URL sanitization with regression tests.
- [x] Added mobile bottom navigation with Font Awesome icons and a camera/image QR scanner.
- [x] Replaced hardcoded brand labels with the admin `restaurant_name` setting; added dynamic metadata, `robots.txt`, `sitemap.xml`, and `noindex` for account/admin/chef.
- [x] Verified with Pint, 51 backend tests, lint, typecheck, production build, `npm audit --omit=dev`, API health, and a 10-route browser smoke test.

**Remaining in this batch:**
- [ ] Commit and push with `feat: comprehensive security hardening, API fixes and UI improvements`.
- [ ] Supply the missing committed logo asset at `public/assets/img/logo.png` when approved; text fallback remains in place.
- [ ] Review the 7 moderate dev-only npm audit findings separately from production dependencies.

---

## Critical journeys (must pass)

| # | Journey | Status |
|---|---|---|
| 1 | Registration/login, password reset/change, role-aware navigation | Implemented and backend-tested; browser expansion pending. |
| 2 | Browse/filter/search catalog and open a product | Implemented. |
| 3 | Customize product, add to cart, cart survives refresh | Implemented; browser smoke passed. |
| 4 | Checkout recalculates totals server-side; confirmation displays order | Implemented; end-to-end browser run pending. |
| 5 | Coupon applied and validated; invalid/disabled coupon rejected | Implemented; backend tests pass. |
| 6 | QR validates table; explicit session start; order tagged with table | Implemented; browser expansion pending. |
| 7 | Chef sees new order and advances status | Implemented; browser expansion pending. |
| 8 | Admin creates a product; it appears publicly | Implemented; browser expansion pending. |
| 9 | Reservations disabled → UI hidden and API rejects | Implemented. |
| 10 | Unauthorized customer cannot access Chef/Admin APIs; chef cannot cancel; client totals ignored; tokens rotate/revoke | Implemented; backend tests pass. |
