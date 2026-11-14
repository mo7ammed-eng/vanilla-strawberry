# Development Guide

## Prerequisites
- Node.js LTS compatible with the installed Next.js version.
- npm.
- PHP version compatible with the Laravel version in `api/composer.json`.
- Composer.
- MySQL.
- Optional Redis only if the chosen queue/cache configuration requires it.

Do not guess versions: inspect `package.json`, `api/composer.json`, and lockfiles.

## First setup
The intended flow is:

```bash
npm install
npm run setup
```

Configure the required environment files using the supplied examples. Keep secrets local and out of version control.

## Start everything
```bash
npm run dev
```

The root script should coordinate frontend and API processes, check prerequisites, report unavailable services, and terminate child processes cleanly.

## Other commands
```bash
npm run build
npm run start
npm run lint
npm run test
npm run health
```

Only add scripts after implementing them. Never create a script that simply prints success without doing its job.

## Cross-platform scripting
Use Node.js scripts or a cross-platform process runner. Do not depend on Bash-only syntax, `&`, `export`, or Linux-specific utilities in root npm scripts. Ensure PowerShell works.

## Code standards
- TypeScript strictness should be enabled where compatible.
- Validate at API boundaries.
- Keep components focused.
- Keep controllers thin.
- Use consistent naming and formatting.
- Avoid dead code and unused dependencies.
- Update tests and docs with behavior changes.
- Client API data fetching may update state inside effects after awaited responses; `react-hooks/set-state-in-effect` is intentionally disabled in `eslint.config.mjs` until the hook rule is appropriate for this architecture.

## Database safety
Never automatically run destructive migrations, `migrate:fresh`, database drops, or resets. Setup may run safe pending migrations only after confirming the configured database and explaining the action.
