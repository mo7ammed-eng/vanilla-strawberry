# Changelog

Record meaningful changes in reverse chronological order.

## Unreleased

### 2026-11-17 — Brand palette alignment
- Refined design tokens to the requested palette: vanilla cream `#FFF8EF`, strawberry `#E94B68`, deep berry `#982D49`, soft pink `#F8DDE2`, chocolate `#392725`, and white `#FFFFFF`.
- Preserved existing semantic class names while updating their palette values and the viewport theme colour.
- Verified computed CSS variables, body background, mobile layout, and console cleanliness in Chromium.

### 2026-11-17 — Cart experience and documentation reconciliation
- Added a reusable `CartDrawer` wired into the public site header.
- Fixed quick-add cart items to resolve and store the product's default active variant.
- Reset checkout submitting state after a successful order.
- Replaced the stale "documentation-only" audit with a current repository audit.
- Revised the phased development plan to reflect implemented, partial, and remaining work.
- Verified with lint, typecheck, production build, 41 backend tests, and a Chromium browser smoke test.

### Earlier
- Initial AI engineering constitution and project documentation pack.
- Laravel API, Next.js storefront, root tooling, feature implementation, and backend test suite.
