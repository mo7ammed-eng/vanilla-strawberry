# API Conventions

## General
- Prefix APIs with `/api/v1`.
- Return JSON consistently.
- Validate all inputs on the server.
- Apply authentication and authorization policies to protected routes.
- Paginate collections.
- Use appropriate HTTP status codes.
- Never expose internal stack traces or secrets.

## Suggested response envelope
Success:
```json
{
  "data": {},
  "message": "Success"
}
```

Validation/error response should be consistent and safe, with field errors where applicable. Align with existing Laravel conventions rather than introducing an unnecessary custom framework.

## Authentication endpoints
- `POST /api/v1/auth/register` — requires `password_confirmation`.
- `POST /api/v1/auth/login` — returns a Sanctum bearer token.
- `POST /api/v1/auth/forgot-password` — generic response; emails a reset link built from `app.frontend_url`.
- `POST /api/v1/auth/reset-password` — requires `token`, `email`, `password`, `password_confirmation`; revokes existing tokens on success.
- `POST /api/v1/auth/refresh` — authenticated; rotates the current bearer token.
- `PATCH /api/v1/auth/password` — authenticated; verifies `current_password`, revokes old tokens, returns a new token.
- `GET /api/v1/auth/me`, `POST /api/v1/auth/logout` — authenticated account/session endpoints.

## Security
- Never trust client price, role, discount, order total, or table status.
- Authorize access to each order and customer resource.
- Rate-limit sensitive endpoints.
- Validate uploads and restrict file types/sizes.
- Use private channels for private real-time data.

## API documentation
Update this file or generate an OpenAPI specification when endpoints change. Keep frontend types/contracts synchronized with actual API responses.
