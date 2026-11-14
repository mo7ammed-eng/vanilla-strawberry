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

## Security
- Never trust client price, role, discount, order total, or table status.
- Authorize access to each order and customer resource.
- Rate-limit sensitive endpoints.
- Validate uploads and restrict file types/sizes.
- Use private channels for private real-time data.

## API documentation
Update this file or generate an OpenAPI specification when endpoints change. Keep frontend types/contracts synchronized with actual API responses.
