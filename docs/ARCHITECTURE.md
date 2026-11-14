# Architecture

## Repository layout

```text
/
├── api/                 # Laravel application
├── src/                 # Next.js application source (if using src directory)
├── public/              # Public frontend assets
├── docs/                # Product and engineering documentation
├── scripts/             # Cross-platform Node scripts
├── tests/               # Optional cross-app tests
├── AGENTS.md
├── package.json         # Root developer commands
├── .env.example
└── README.md
```

Keep Laravel fully contained in `api/`. Its own `composer.json`, `artisan`, `bootstrap/`, `routes/`, `database/`, and `tests/` belong there.

## Runtime boundaries
- Next.js serves the web experience.
- Laravel exposes versioned JSON APIs.
- MySQL stores persistent business data.
- Reverb broadcasts authorized real-time events.
- Queue workers process asynchronous jobs when configured.

## Recommended backend structure
Use Laravel's conventional structure first. Add `Actions/`, `Services/`, or domain modules only where they reduce complexity. Keep controllers thin and business rules testable.

## API
Use a consistent prefix such as `/api/v1`. Use resource-oriented endpoints, request validation, authorization policies, pagination, and consistent error responses.

## Frontend
Organize by feature where practical: catalog, cart, checkout, account, chef, admin, reservations, and shared UI. Keep server data separate from ephemeral client state.

## Data flow
Frontend -> Laravel API -> validation/authorization/business logic -> MySQL.
Realtime events notify clients of changes; clients reconcile with API state.

## Avoid
- Microservices at this stage.
- Duplicated business logic.
- Frontend database access.
- Secrets in client bundles.
- Direct DB calls from UI components.
- One giant controller or page component.
