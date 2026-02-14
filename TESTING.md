# Testing the XrayRadar JS SDK

This document describes how to test the SDK at different levels and how to run tests.

## Running tests

From the repo root:

```bash
npm test
```

To run tests for a single package:

```bash
npm test -w @xrayradar/core
npm test -w @xrayradar/browser
npm test -w @xrayradar/node
```

Browser package tests use **happy-dom** (Vitest `environment: "happy-dom"`) so `window`, `fetch`, `history`, and `XMLHttpRequest` are available.

### Coverage

To run tests with coverage from the repo root:

```bash
npm run test:coverage
```

For a single package:

```bash
npm run test:coverage -w @xrayradar/core
npm run test:coverage -w @xrayradar/node
npm run test:coverage -w @xrayradar/browser
```

Coverage output is written to `coverage/` in each package (e.g. `packages/core/coverage/`). The terminal shows a summary; open `packages/<package-name>/coverage/index.html` in a browser for the full HTML report.

---

## Testing layers

### 1. Unit tests (existing)

- **@xrayradar/core**: event builder, scope, breadcrumbs, `Scope.clone()`, sampling, level normalization.
- **@xrayradar/browser**: integrations (fetch, XHR, history, console), DSN parsing, transport (URL/headers/body when sending).
- **@xrayradar/node**: Express/Koa middleware (request context, error capture).

Use a **mock transport** (`sendEvent: (e) => sent.push(e)`) to assert event shape and that capture is invoked; no real HTTP.

### 2. Transport / “integration” tests (recommended)

- **HttpTransport**: Mock `fetch` (or Node `fetch`), call `transport.sendEvent(payload)`, and assert:
  - `POST` to `{serverUrl}/api/{projectId}/store/`
  - Headers: `Content-Type: application/json`, `X-Xrayradar-Token` when token set, `User-Agent`.
  - Body: valid JSON with `event_id`, `level`, `message`, `exception` or similar.
- Run in both **browser** (Vitest + happy-dom) and **node** (Vitest) if you have separate transport implementations.

### 3. Global handlers and init

- Create a client with `init({ dsn, transport: mockTransport, integrations: true })`, then:
  - Trigger `window.dispatchEvent(new ErrorEvent(...))` or `Promise.reject(...)` and assert one event is sent.
- Ensures `window.onerror` / `unhandledrejection` and optional integrations are wired.

### 4. React (ErrorBoundary)

- Use `@testing-library/react` and Vitest in **@xrayradar/react**:
  - Render a component that throws inside `<ErrorBoundary>`; assert `captureException` was called (mock the client or use a spy on the transport).
  - Assert fallback UI or “Try again” behavior if you expose it.

### 5. End-to-end (manual or automated)

- **Manual**: Use the **xrayradar-react-ingest-test** app (or `examples/vite-react`). Start xrayradar-server locally, set DSN + token, click “Trigger error” / “Uncaught exception” / “React render crash”, then confirm events in the dashboard or via server API.
- **Automated E2E**: Run the same app in a headless browser (Playwright or Cypress), trigger errors, then either:
  - **Option A**: Mock the server (e.g. intercept `POST .../store/` and assert body), or  
  - **Option B**: Hit a real local xrayradar-server and query its API/database to confirm the event was stored.

### 6. Contract tests (optional)

- Share a schema (e.g. JSON Schema or TypeScript types) for the ingest payload with **xrayradar-server**.
- In the SDK, build a minimal payload and validate it against the schema so server and client stay in sync.

---

## What’s covered today

| Area                 | Package   | Status |
|----------------------|-----------|--------|
| Event builder, scope | core      | ✅     |
| Integrations (fetch, XHR, history, console) | browser | ✅ |
| DSN parsing          | browser   | ✅     |
| HttpTransport (URL/headers/body) | browser | ✅ |
| Express/Koa middleware | node    | ✅     |
| Global error handlers + init | browser | ✅ |
| `integrations: true`         | browser | ✅ |
| React ErrorBoundary  | react     | ❌ (no tests yet) |
| Node HttpTransport   | node      | Optional (same contract) |
| E2E with real server | —         | Manual / separate project |

---

## Tips

- **Keep tests fast**: Use mocks for `fetch` and the transport; avoid real network in unit/integration tests.
- **Isolate globals**: Restore `fetch`, `XMLHttpRequest`, `history`, and process listeners in `afterEach` so tests don’t leak.
- **Test “integrations: true”**: One test that enables all integrations and triggers fetch/XHR/navigation/console, then asserts breadcrumbs or events as appropriate.
- **CI**: Run `npm run build && npm test` on every PR; add E2E in a separate job if you introduce Playwright/Cypress.
