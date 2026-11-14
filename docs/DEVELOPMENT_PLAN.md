# Phased Development Plan — Vanilla & Strawberry

> Audited 2026-11-14. The repository contained documentation only; this plan replaces the placeholder phases with an executable implementation plan. See `PROJECT_AUDIT.md`.

## Delivery principles

- One repository; Laravel in `api/`, Next.js at root.
- Vertical slices: each phase ships working API + UI + tests, not screenshots.
- Backend is authoritative for prices, discounts, totals, roles, table state, and status transitions.
- Money stored as integer cents; all API responses use `{ "data": ..., "message": ... }`.
- Exactly three roles: `customer`, `chef`, `admin`.
- No feature is marked complete without a test or browser verification.
- MySQL is the target database; SQLite in-memory is used for automated tests.

---

## Phase 0 — Audit and baseline (complete)

- [x] Read `AGENTS.md` and all `docs/` files.
- [x] Inspect repository tree; confirm no app code, git history, manifests, or assets.
- [x] Verify Node, npm, PHP, Composer, MySQL, and network.
- [x] Record findings in `docs/PROJECT_AUDIT.md`.
- [x] Record environment decisions: MySQL on port `3307` for local dev, SQLite for tests.

**Acceptance:** audit exists and no application files were modified.

---

## Phase 1 — Foundation

### 1.1 Laravel API scaffold
- Create Laravel application in `api/` with Composer.
- Install Sanctum; configure token auth.
- Configure `/api/v1` route prefix, JSON errors, CORS for `localhost:3000`, rate limiters.
- Add `HealthController` with database check.
- Set `APP_URL`, `FRONTEND_URL`, DB, and token settings in `.env.example`.

### 1.2 Frontend scaffold
- Create Next.js App Router project at root with TypeScript, Tailwind CSS 4, ESLint.
- Configure `next.config.ts`, path aliases, typed environment access.
- Add shared fonts, design tokens, base layout, metadata.
- Download licensed dessert photography into `public/images`.

### 1.3 Root tooling
- Root `package.json` scripts: `setup`, `dev`, `build`, `start`, `test`, `lint`, `health`, `db:up`, `db:down`.
- Cross-platform Node scripts in `scripts/` using `child_process`, with prerequisite and port checks, labelled output, and clean SIGINT shutdown.
- Local MySQL bootstrap script: initialize `.mysql-data`, run on `127.0.0.1:3307`, create `vanilla_strawberry` database, never touch unknown databases.
- `.env.example` at root and `api/.env.example`; `.gitignore` for env, dependencies, builds, and local MySQL data.

**Acceptance:** `npm run setup`, `npm run dev`, `npm run health` work from root; API `/api/v1/health` returns OK.

---

## Phase 2 — Database and authentication

### 2.1 Schema (additive, reversible migrations)
Tables: `users`, `categories`, `products`, `product_variants`, `add_ons`, `product_add_on`, `orders`, `order_items`, `order_item_add_ons`, `tables`, `table_sessions`, `reservations`, `coupons`, `coupon_redemptions`, `notifications`, `addresses`, `gallery_items`, `settings`.

Key constraints:
- `users.role` enum `customer|chef|admin`; unique email.
- Money columns integer unsigned; quantities positive.
- Order item snapshots of product name, variant, unit price, add-ons.
- `tables.token` unique random; `table_sessions.token` unique, status open/closed.
- `orders.order_number` unique; source `online|qr`; fulfillment `delivery|pickup|dine_in`; status enum.
- Reservation slot lookup index on `(reservation_date, reservation_time)`.
- Coupon code unique, usage counter, validity window.
- `settings` key/value JSON for feature flags and fees.

### 2.2 Seed data
- Admin, chef, and customer demo accounts.
- 5 categories, 14 products with variants/add-ons, 8 tables with secure tokens.
- Gallery items, sample reservations/coupons, feature settings.
- Idempotent seeders; no destructive operations in setup.

### 2.3 Authentication and authorization
- Register customer, login (all roles), logout, me, update profile.
- Sanctum bearer tokens; rate-limited auth endpoints.
- Role middleware; policies for orders, reservations, addresses, admin resources.
- Backend returns 401/403 correctly; frontend role guards are UX only.

**Acceptance:** feature tests for registration, login, role rejection, protected routes, password handling.

---

## Phase 3 — Catalog and public API

- Categories and products endpoints with pagination, search, category filter, collection filters (`new`, `best`, `budget`, `premium`), and sorting.
- Product detail with variants, add-ons, images, badges, category.
- Gallery and public settings endpoints (feature flags, restaurant info, tax/fees).
- Table validation endpoint by QR token.
- Admin catalog CRUD with image URL validation and slug generation.
- API resources keep response shapes consistent.

**Acceptance:** tests for search/filter/pagination, inactive product exclusion, admin-only writes, table token validation.

---

## Phase 4 — Design system and public site

- Tokens: vanilla background, warm surface, strawberry primary/deep/soft, ink, border, success/error; Tailwind `@theme` integration.
- Typography: Fraunces (display) + Manrope (body), restrained scale.
- Components: button, input, select, textarea, badge, card, dialog, alert, empty state, product tile, quantity stepper, navbar, footer, section heading.
- Homepage sections in required order: landing, progressive hero, about, location, book-like photo catalog, new arrivals, best sellers, cheapest, premium, search/discovery, login/register entry, footer.
- Menu page with search, category and collection filters, responsive grid.
- Product detail with variant/add-on selection and add to cart.
- About/location content and reservation entry point.
- Accessibility: semantic headings, visible focus, reduced motion, alt text, mobile navigation.

**Acceptance:** responsive browser review at 390px, 768px, 1280px; no horizontal overflow; keyboard navigation works.

---

## Phase 5 — Commerce

- Cart context persisted to localStorage; add/remove/update; variant and add-on identity.
- Checkout page: delivery/pickup, customer details, address, notes, coupon, payment-on-collection notice.
- `POST /orders` validates product/variant/add-on availability; recalculates each line, tax, fees, discount, total; stores snapshots in a transaction.
- Guest checkout allowed; authenticated orders linked to user.
- Order confirmation page with order number; guest access token.
- Account: order history and detail, profile, addresses.
- Coupon validation endpoint and server-side redemption limits.
- State transitions validated; clients cannot set totals or statuses.

**Acceptance:** tests prove client-supplied totals are ignored, invalid coupons rejected, order snapshots survive catalog edits, order ownership enforced.

---

## Phase 6 — QR and Chef workflow

- `/qr/[token]` validates table; page load does not occupy the table.
- Explicit "Start table order" creates an open table session; orders carry `source=qr`, table and session IDs; `dine_in` enforced.
- Chef dashboard lists active and recent orders with items, quantities, variants, add-ons, notes, table, source, and elapsed time.
- Chef status updates only through permitted transitions: `pending → confirmed → preparing → ready → completed`; cancellation is admin-only.
- Polling every 15 seconds reconciles API state; manual refresh available.
- Notifications created for new orders and status changes.

**Acceptance:** tests for session creation, QR order attribution, invalid token, chef role enforcement, illegal transitions, table release by admin.

---

## Phase 7 — Admin operations

- Dashboard: revenue, order counts, active orders, customers, average order value, top products, recent orders.
- Products: create/edit/archive, variants and add-ons, collection flags, imagery.
- Categories: create/edit/deactivate.
- Orders: filter, inspect, update status, cancel with reason.
- Customers: list/search, detail, order count.
- Chefs: create, edit, activate/deactivate, reset password.
- Tables: create/edit, activate, regenerate QR token, view QR link, close session.
- Reservations: list and update status, feature toggle.
- Coupons: CRUD, usage stats, feature toggle.
- Gallery/content: CRUD, ordering, visibility.
- Settings: restaurant details, fees, tax, reservation/coupon flags.
- All admin pages are functional against the API, not decorative.

**Acceptance:** tests for admin authorization, CRUD validation, feature toggles, status updates; browser verification of each page.

---

## Phase 8 — Optional features and notifications

- Reservations: create (public), list (account/admin), transactional slot capacity, status updates, feature flag rejection.
- Coupons: validate/apply at checkout, redemption records, usage and date limits, feature flag rejection.
- Notifications: persisted records, customer/chef/admin endpoints, unread counts, mark read.
- Real-time: broadcast events for new orders and status changes, private channel authorization, polling fallback. No public broadcast of sensitive data.
- GPS: request only at checkout when delivery is chosen; store coordinates; no live courier tracking claim.

**Acceptance:** tests for disabled-feature rejection, double-booking prevention, coupon limits, notification authorization, channel authorization.

---

## Phase 9 — Verification and handover

- Backend: `php artisan test` (feature coverage for all critical journeys).
- Frontend: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- Browser: customer browse → detail → cart → coupon → checkout → order; QR → session → order → Chef → status; admin catalog/settings; auth flows; mobile layouts; reduced motion.
- Accessibility: keyboard forms/dialogs, labels, contrast, focus.
- Performance: image dimensions, `next/image`, loading/empty/error states.
- Docs: update `API.md`, `DATABASE.md`, `DEVELOPMENT.md`, `TESTING.md`, `DEPLOYMENT.md`, `CHANGELOG.md`.
- Deployment: Dockerfiles, compose for MySQL/API/frontend, environment checklist.

**Acceptance:** commands produce evidence; any blocker is documented honestly.

---

## Critical journeys (must pass)

1. Customer registration/login and role-aware navigation.
2. Browse/filter/search catalog and open a product.
3. Customize product, add to cart, cart survives refresh.
4. Checkout recalculates totals server-side; confirmation displays order.
5. Coupon applied and validated; invalid/disabled coupon rejected.
6. QR scan validates table; explicit session start; order tagged with table.
7. Chef sees new order and advances status; customer sees update.
8. Admin creates a product; it appears publicly.
9. Reservations disabled → UI hidden and API rejects.
10. Unauthorized customer cannot access Chef/Admin APIs; chef cannot cancel; client totals ignored.
