# Vanilla & Strawberry — AI Engineering Constitution

> **This file is the single source of truth for AI coding agents working in this repository.**
> Read it completely before inspecting, planning, editing, installing packages, or running commands.

## 1. Mandatory working rules

1. Work only inside this repository. Never create a second project or a separate backend repository.
2. The Laravel backend MUST live at `./api`. The Next.js application lives at the repository root (or the existing agreed frontend structure). Do not move `api` outside the project.
3. Before changing anything, inspect the actual repository, current git status, package manifests, Laravel version, existing features, and environment examples. Preserve working code.
4. Never overwrite, delete, or replace user work without first understanding its purpose. Avoid destructive commands. Never run database reset/fresh/seed commands against an unknown or non-local database.
5. Do not invent completed functionality. A feature is complete only after implementation and a meaningful test.
6. Do not leave fake buttons, dead links, placeholder pages, mock API success, hardcoded production secrets, or TODO-only implementations.
7. Do not claim a command passed unless you actually ran it and checked its exit status/output.
8. If a required service or credential is unavailable, document the blocker and implement/test everything that can safely be completed.
9. Do not ask the user to repeat information already present in this file or project documentation.
10. Keep documentation synchronized with code changes.

## 2. Product identity

**Brand:** Vanilla & Strawberry  
**Product:** Premium ice-cream and dessert restaurant website and ordering platform.  
**Design keywords:** clean, elegant, fresh, vanilla, strawberry, editorial, premium, warm, minimal, delicious.

The interface should feel like a real premium dessert brand—not a generic SaaS template, not a crowded admin theme, and not an over-animated 3D demo.

## 3. Non-negotiable architecture

- One repository / monorepo.
- Laravel backend path: `./api`.
- Next.js frontend and its `package.json` at repository root unless the existing repository already has a documented compatible arrangement.
- MySQL is the primary relational database.
- Laravel Sanctum for API authentication where appropriate.
- Laravel Reverb + Echo for real-time events where required.
- REST API is the source of truth; WebSockets deliver updates, not authoritative state.
- Use a modular monolith in Laravel. Do not introduce microservices without explicit approval.
- Do not duplicate business rules in frontend and backend. Backend validation and authorization are authoritative.
- Use environment variables for URLs, credentials, keys, and deployment-specific settings.
- Never expose Laravel secrets, database credentials, private API keys, or server-only configuration to browser bundles.

Before adding a dependency, check whether the repository already has a suitable package. Add only dependencies that have a concrete use.

## 4. Roles — exactly three

The only account roles are:
1. `customer`
2. `chef`
3. `admin`

Never add `waiter`, `delivery`, `super-admin`, or another account role without explicit user approval. Operational delivery-location reporting, if implemented, must not silently introduce a fourth account role.

Enforce authorization on the backend. Hiding a button in the frontend is not authorization.

## 5. Engineering standards: clean code

- Use clear, descriptive names and small, cohesive functions/components.
- Prefer composition over giant components and deeply nested conditionals.
- Keep controllers thin; put business logic in suitable services/actions/domain classes.
- Use Form Requests or equivalent centralized backend validation.
- Use typed TypeScript. Avoid `any`; if unavoidable, explain and isolate it.
- Keep API response shapes consistent and documented.
- Handle loading, empty, success, validation, unauthorized, and server-error states.
- Avoid duplicated components, duplicated CSS, duplicated API calls, and duplicated business rules.
- Do not create abstractions for hypothetical future needs.
- Do not use `@ts-ignore`, disabling lint rules globally, or swallowing errors to make checks pass.
- Do not suppress warnings without understanding and documenting why.
- Follow the formatting and conventions already established in the repository; otherwise use the defaults documented in `docs/DEVELOPMENT.md`.

## 6. Visual constitution — clean vanilla & strawberry

### Brand palette (use design tokens, not scattered hex values)
- Vanilla background: `#FFF9F0`
- Warm surface: `#FFFDF9`
- Strawberry primary: `#E94B62`
- Strawberry deep: `#C93650`
- Soft strawberry: `#F9DCE1`
- Vanilla accent: `#F1DFC2`
- Main text: `#292421`
- Muted text: `#786F69`
- Border: `#EDE4DA`
- Success: `#397A5B`
- Error: `#C93650`

These are starting tokens. Refine only through a documented design decision; preserve the vanilla/strawberry identity.

### Visual rules
- Use generous whitespace and a clear visual hierarchy.
- Use a restrained type scale and readable line lengths.
- Use high-quality, relevant dessert/restaurant imagery; do not use random stock imagery.
- Cards should be simple, tactile, and consistent—not layers of glass effects.
- Use subtle shadows, thin warm borders, and purposeful rounded corners.
- Buttons must have clear primary/secondary/disabled/loading states.
- Keep navigation and calls to action obvious.
- Do not use oversized headings, excessive gradients, neon colors, excessive blur, or decorative effects that reduce readability.
- Do not put every section inside a card.
- Avoid visual clutter, repeated sections, and redundant labels.
- Use consistent spacing, grid, radii, shadows, and interaction states through shared tokens/components.
- Admin and Chef dashboards must remain functional, readable, and operational—not overly decorative.

### Typography
Choose one suitable display font and one highly readable UI/body font. Load them efficiently and define a documented type scale. Avoid using many font families or arbitrary font sizes.

### Motion
- Motion must explain hierarchy or provide feedback.
- Keep transitions short and purposeful.
- Respect `prefers-reduced-motion`.
- Avoid animating large layout properties when transform/opacity can work.
- Do not add GSAP and Framer Motion to the same interaction. Assign clear responsibilities if both are genuinely needed.
- 3D is optional enhancement, never a blocker for core content or ordering.
- Provide a lightweight mobile/fallback experience for 3D.

## 7. Accessibility and responsive behavior

- Mobile-first; test small phones, tablets, laptops, and wide screens.
- Semantic HTML and correct heading hierarchy.
- Keyboard-accessible navigation, dialogs, menus, and forms.
- Visible focus indicators.
- Proper labels and accessible error messages.
- Sufficient color contrast.
- Useful alt text for meaningful images; empty alt for decorative images.
- Do not rely on color alone to communicate status.
- Respect reduced motion and browser zoom.

## 8. Business requirements

### Customer
- Registration/login and profile.
- Browse products and product details.
- Product variants, sizes, toppings/add-ons where configured.
- Cart and checkout.
- QR table ordering.
- Online ordering and order history.
- Addresses and location permission when needed.
- Notifications.

Do not assume guest checkout or mandatory login behavior beyond what is specified in the current product requirements. Document the decision and ask only if it blocks implementation.

### Chef
- Receive QR and online orders.
- View order items, quantities, customizations, notes, table number/ID, and order source.
- Update permitted preparation statuses.
- Receive real-time notifications.
- No access to admin-only management.

### Admin
- Dashboard/analytics.
- Products and categories.
- Orders.
- Customers and Chef accounts.
- Tables and QR management.
- Reservations and coupons settings/management.
- Gallery and website content.
- Notifications, reports, and system settings.

### QR tables
- Each table has a stable internal ID and a secure, unguessable token.
- Do not use a sequential table number as the security token.
- Validate that a table exists and is active.
- Opening a QR URL alone must not mark a table occupied.
- Model table sessions and define how they close/release.
- Associate each order with its source and table/session where applicable.
- New orders must appear in the Chef workflow.

### Reservations and coupons
- Admin-controlled feature flags.
- When disabled, hide customer controls AND reject the operation server-side.
- Preserve existing records when disabled.
- Prevent reservation double-booking with database-safe logic.
- Validate coupon dates, usage limits, minimum order, and discount rules on the backend.

### Real-time
- Authorize private channels.
- Never broadcast sensitive customer/order data publicly.
- Re-fetch or reconcile authoritative state through the API after relevant events.
- Provide graceful fallback when WebSockets are unavailable.

### GPS
- Request location permission only when needed and explain why.
- Distinguish customer location capture from live courier tracking.
- Do not claim live tracking exists unless a real authorized location source is implemented.
- Do not add a fourth role to support tracking.

## 9. Security and data integrity

- Validate all input server-side.
- Authorize every protected operation.
- Use secure password hashing and appropriate session/token handling.
- Protect against mass assignment, IDOR, SQL injection, XSS, CSRF where applicable, and unsafe file uploads.
- Rate-limit authentication and sensitive endpoints.
- Keep secrets out of git and logs.
- Use least-privilege database credentials.
- Use transactions for multi-step order, payment, reservation, and inventory operations where needed.
- Store money as integer minor units or a precise decimal strategy; never use floating-point arithmetic for prices.
- Define order status transitions and reject invalid transitions.
- Never trust client-submitted totals, discounts, roles, table IDs, or prices.

## 10. Local development and deployment

The target developer experience is:

```bash
npm install
npm run setup
npm run dev
```

`npm run dev` should start the frontend and Laravel API together when prerequisites are installed and configured. It must:
- Check Node.js, PHP, Composer, dependencies, and environment configuration.
- Check database connectivity and report clear instructions if unavailable.
- Detect port conflicts.
- Start child processes with clear labels.
- Shut down child processes cleanly on Ctrl+C.
- Avoid destructive database operations.
- Not pretend it can start a database service that is not installed or configured.

Also provide:
- `npm run build`
- `npm run start`
- `npm run test`
- `npm run lint`
- `npm run health`

Support Windows PowerShell and Linux. Do not rely on Bash-only syntax in cross-platform npm scripts.

Prepare deployment documentation/configuration for compatible Node.js + PHP hosting, VPS, and Docker. Explain that providers may require separate frontend, backend, database, and WebSocket services. Never claim every platform can host the entire stack in one service.

Use production environment variables; never hardcode `localhost` in production code.

## 11. Required workflow for every task

### Step A — Inspect
- Read this file and relevant docs.
- Inspect repository tree and git status.
- Identify the affected frontend/backend/database/tests.
- Confirm actual installed versions and conventions.

### Step B — Plan
- State a concise implementation plan.
- Identify migrations, API changes, UI changes, dependencies, and risks.
- Avoid asking for approval for ordinary safe implementation details; ask before destructive or materially scope-changing actions.

### Step C — Implement
- Make focused, complete changes.
- Keep frontend and backend contracts synchronized.
- Update docs when behavior or architecture changes.

### Step D — Verify
Run the relevant checks that are available:
- Frontend lint/typecheck/build.
- Backend tests and formatting.
- API integration checks.
- Browser tests for important flows.
- Responsive and accessibility checks.

Fix failures caused by your changes. Report unrelated pre-existing failures separately.

### Step E — Report
Summarize:
- What changed.
- Files/areas affected.
- Commands actually run and their results.
- What remains blocked or incomplete.
- Any required manual setup.

Never claim “fully working” without evidence.

## 12. Stop conditions

Stop and ask before:
- Deleting user data or project files.
- Rewriting migrations that may have run in shared environments.
- Resetting or dropping databases.
- Changing the three-role rule.
- Introducing paid services or dependencies that require a paid account.
- Changing the agreed stack or moving `api` outside the repository.
- Making a production deployment or modifying live infrastructure.

## 13. First task when entering this repository

1. Read `AGENTS.md` and all relevant files in `docs/`.
2. Audit the current repository without modifying it.
3. Produce/update `docs/PROJECT_AUDIT.md` and `docs/DEVELOPMENT_PLAN.md`.
4. Identify the current state and the next safe implementation phase.
5. Then implement in small verified stages—do not rebuild blindly.
