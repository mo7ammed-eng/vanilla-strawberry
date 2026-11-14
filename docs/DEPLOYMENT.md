# Deployment Guide

## Important
This application contains multiple runtime requirements:
- Next.js / Node.js runtime.
- Laravel / PHP runtime.
- MySQL database.
- Reverb/WebSocket process if real-time features are enabled.
- Queue worker if asynchronous jobs are used.

A hosting provider may not support all of these in one service. Do not promise one-click universal deployment.

## Deployment targets
- VPS: can host all components with a reverse proxy and process supervisor/container orchestration.
- Docker: use separate services/containers for frontend, API, database, and optional Redis/Reverb/worker.
- Managed platforms: deploy each component to a compatible service and configure private/public URLs correctly.
- Traditional PHP hosting: may host Laravel only if the host supports the required PHP version/extensions and persistent processes; Next.js and WebSockets may need separate hosting.

## Production requirements
- HTTPS.
- Correct CORS and cookie/session settings.
- Secure environment variables.
- Production database backups.
- Laravel production configuration and migrations.
- Queue worker supervision where needed.
- Reverb process supervision if enabled.
- Correct storage permissions and public storage link.
- Logs and health checks.
- No debug mode in production.

## Environment
Use `.env.example` as a template only. Never commit actual `.env` files or secrets. Keep browser-exposed variables clearly separated from server-only values.

## Release checklist
- Run tests and production builds.
- Verify migrations against a backup/staging database.
- Confirm frontend API URL and backend CORS/auth settings.
- Confirm WebSocket URL and private channel authorization.
- Verify uploads, mail, queues, and storage.
- Smoke-test customer, chef, and admin journeys.
