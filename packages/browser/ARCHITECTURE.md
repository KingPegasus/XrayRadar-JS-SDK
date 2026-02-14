# @xrayradar/browser — Architecture

## Purpose

`@xrayradar/browser` captures browser/runtime errors and sends them to XrayRadar using a fetch-based HTTP transport.

## Key modules

- `src/client.ts`
  - `BrowserClient`: owns a `Scope`, exposes `captureException`, `captureMessage`, and context APIs.
  - Installs global handlers for `window.error` and `window.unhandledrejection`.
  - Applies `beforeSend` and sampling.
- `src/transport.ts`
  - `HttpTransport`: serializes events and `POST`s to `.../api/{project_id}/store/` using `fetch`.
  - Adds header `X-Xrayradar-Token` when token is provided.
  - Truncates large payloads.
- `src/dsn.ts`
  - `parseDsn(dsn)`: parses `https://host[:port]/<project_id>`.

## Data flow

1. `init({ dsn, authToken, ... })` creates a global `BrowserClient`.
2. Errors are captured via:
   - explicit `captureException`/`captureMessage`, or
   - global handlers (`error`, `unhandledrejection`).
3. Event builder in `@xrayradar/core` produces `EventPayload`.
4. `HttpTransport` sends the event to `/api/{project_id}/store/`.

## “Previous functionality” (≤ 0.1.x)

- Global auto-capture:
  - `window.addEventListener("error", ...)`
  - `window.addEventListener("unhandledrejection", ...)`
- Manual capture APIs: `init`, `captureException`, `captureMessage`, `addBreadcrumb`, `setUser`, `setTag`, `setExtra`, `setContext`.

## New in 0.2.0

### Opt-in “integrations” (auto-instrumentation)

Enabled via:

- `init({ integrations: { fetch, xhr, history, console } })`
- `init({ integrations: true })` (enables all integrations with safe defaults)

Integrations live in `src/integrations/` and each returns an uninstall function so `client.close()` can cleanly undo patches.

- **Fetch** (`instrumentFetch`)
  - Adds HTTP breadcrumbs for each request.
  - Optional auto-capture for failed status codes and thrown fetch errors.
- **XHR** (`instrumentXhr`)
  - Adds HTTP breadcrumbs for XHR requests.
  - Optional auto-capture for failing status codes.
- **History** (`instrumentHistory`)
  - Adds navigation breadcrumbs for `pushState`, `replaceState`, and `popstate`.
- **Console** (`instrumentConsole`)
  - Adds console breadcrumbs for `console.debug/info/warn/error`.

