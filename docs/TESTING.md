# Testing and Quality Gates

## Frontend
- Lint.
- Typecheck where configured.
- Production build.
- Component tests for complex reusable behavior.
- Playwright tests for important user journeys.

## Backend
- Pest or PHPUnit.
- Feature tests for authentication, authorization, validation, ordering, QR tokens, coupons, reservations, and state transitions.
- Test database constraints and transactions.

## Critical journeys
1. Customer authentication.
2. Catalog browsing and product customization.
3. Cart total recalculated by backend.
4. QR scan -> valid table -> order submission.
5. New order appears for Chef.
6. Chef updates status; customer/admin receive authorized updates.
7. Admin creates/updates a product.
8. Reservations disabled -> API rejects creation.
9. Coupons disabled -> API rejects redemption.
10. Unauthorized role/resource access is rejected.

## Browser checks
Test desktop and mobile layouts, keyboard navigation, forms, dialogs, loading/empty/error states, and reduced motion.

Report actual results. Separate pre-existing failures from regressions.
