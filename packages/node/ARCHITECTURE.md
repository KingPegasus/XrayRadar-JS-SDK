# @xrayradar/node — Architecture

## Purpose

`@xrayradar/node` captures Node.js errors and sends them to XrayRadar using an HTTP transport.

## Key modules

- `src/client.ts`
  - `NodeClient`: owns a `Scope`, exposes capture + context APIs.
  - Installs global handlers for `process.uncaughtException` and `process.unhandledRejection`.
  - Applies `beforeSend` and sampling.
- `src/transport.ts`
  - `HttpTransport`: serializes events and sends them to `/api/{project_id}/store/` with `fetch`.
  - Truncates large payloads and turns non-OK responses into thrown errors.
- `src/dsn.ts`
  - `parseDsn(dsn)` shared DSN parsing behavior.
- `src/middleware/*`
  - Optional framework helpers (Express/Koa).

## Data flow

1. `init({ dsn, authToken, ... })` creates a global `NodeClient`.
2. Errors are captured via:
   - explicit `captureException`/`captureMessage`, or
   - global process handlers.
3. Event builder in `@xrayradar/core` produces `EventPayload`.
4. `HttpTransport` sends the event to `/api/{project_id}/store/`.

## “Previous functionality” (≤ 0.1.x)

- Global auto-capture:
  - `process.on("uncaughtException", ...)`
  - `process.on("unhandledRejection", ...)`
- Manual capture APIs: `init`, `captureException`, `captureMessage`, `addBreadcrumb`, `setUser`, `setTag`, `setExtra`, `setContext`.

## New in 0.2.0

### Middleware helpers

These are optional utilities you can attach to your web framework.

- **Express**
  - `expressRequestHandler(client)`: attaches request metadata to scope (URL/method/headers/query).
  - `expressErrorHandler(client)`: captures thrown route errors with request context.
- **Koa**
  - `koaMiddleware(client)`: captures thrown middleware errors with request context.

### Per-capture context overrides

`captureException` / `captureMessage` accept `{ context, breadcrumbs }` so middleware can attach request data for that capture without mutating the shared scope.

