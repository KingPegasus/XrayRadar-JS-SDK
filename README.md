# XrayRadar-JS-SDK

[![CI](https://img.shields.io/github/actions/workflow/status/KingPegasus/XrayRadar-JS-SDK/ci.yml?label=CI&style=flat-square)](https://github.com/KingPegasus/XrayRadar-JS-SDK/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen?style=flat-square)

JavaScript/TypeScript SDK for [XrayRadar](https://github.com/xrayradar/xrayradar-server) error tracking. Supports Node.js, browser, React, Next.js, and Remix.

## Packages

| Package | Description |
|---------|-------------|
| [@xrayradar/core](packages/core) | Shared types, scope, breadcrumbs, event builder, transport interface |
| [@xrayradar/node](packages/node) | Node.js SDK – HTTP transport, init, captureException/captureMessage, global handlers |
| [@xrayradar/browser](packages/browser) | Browser SDK – same API, fetch transport, window.onerror / unhandledrejection |
| [@xrayradar/react](packages/react) | React – ErrorBoundary, XrayRadarProvider, useXrayRadar, re-exports from browser |
| [@xrayradar/nextjs](packages/nextjs) | Next.js – config helper, instrumentation, server + client setup |

## Install

```bash
# Node.js
npm install @xrayradar/node

# Browser only
npm install @xrayradar/browser

# React
npm install @xrayradar/react

# Next.js (includes node + react)
npm install @xrayradar/nextjs

# Remix (use node + react; see Quick start > Remix)
npm install @xrayradar/node @xrayradar/react
```

## Quick start

**Node:**

```ts
import { init, captureException } from "@xrayradar/node";

init({ dsn: "https://xrayradar.com/your_project_id", authToken: "your-token" });
captureException(new Error("Something broke"));
```

**Browser / React:**

```ts
import { init, captureException } from "@xrayradar/browser"; // or @xrayradar/react
import { ErrorBoundary } from "@xrayradar/react";

init({ dsn: "https://xrayradar.com/your_project_id", authToken: "your-token" });

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

Events are sent to `POST /api/{project_id}/store/` with header `X-Xrayradar-Token`. See the [server API](https://github.com/xrayradar/xrayradar-server) and [Python SDK](https://github.com/xrayradar/xrayradar) for the same contract.

## Browser auto-instrumentation (integrations)

By default, the browser SDK auto-captures:

- `window.error`
- `window.unhandledrejection`

Optionally, you can enable additional **auto-instrumentation** (breadcrumbs + optional auto-capture for failures) via `integrations`.

Enable everything (safe defaults) with one flag:

```ts
import { init } from "@xrayradar/browser";

init({
  dsn: "https://xrayradar.com/your_project_id",
  authToken: "your-token",
  integrations: true, // fetch + XHR + history + console
});
```

Or configure each integration:

```ts
init({
  dsn: "https://xrayradar.com/your_project_id",
  authToken: "your-token",
  integrations: {
    fetch: { breadcrumbs: true, captureErrors: true },
    xhr: { breadcrumbs: true, captureErrors: true },
    history: true,
    console: true,
  },
});
```

## Node middleware helpers (Express/Koa)

`@xrayradar/node` includes optional helpers for popular frameworks.

**Express:**

```ts
import express from "express";
import { init, getClient, expressRequestHandler, expressErrorHandler } from "@xrayradar/node";

init({ dsn: process.env.XRAYRADAR_DSN!, authToken: process.env.XRAYRADAR_AUTH_TOKEN });
const client = getClient()!;

const app = express();
app.use(expressRequestHandler(client));

// ... routes ...

app.use(expressErrorHandler(client)); // must be after routes
```

**Koa:**

```ts
import Koa from "koa";
import { init, getClient, koaMiddleware } from "@xrayradar/node";

init({ dsn: process.env.XRAYRADAR_DSN!, authToken: process.env.XRAYRADAR_AUTH_TOKEN });
const client = getClient()!;

const app = new Koa();
app.use(koaMiddleware(client));
```

### Remix

Use **@xrayradar/node** on the server and **@xrayradar/react** on the client. No separate Remix package is required.

**Server:** In your Remix server entry (e.g. the Node file that runs the app, or `entry.server.tsx` if you use `handleError`), init the Node SDK once:

```ts
import { init, captureException } from "@xrayradar/node";

init({
  dsn: process.env.XRAYRADAR_DSN!,
  authToken: process.env.XRAYRADAR_AUTH_TOKEN,
  environment: process.env.XRAYRADAR_ENVIRONMENT,
  release: process.env.XRAYRADAR_RELEASE,
});
// In handleError (if you use a custom entry.server): captureException(error);
```

**Client:** In `app/root.tsx`, init the browser SDK and wrap the app in `ErrorBoundary`:

```tsx
import { init, ErrorBoundary } from "@xrayradar/react";

if (typeof window !== "undefined") {
  init({
    dsn: process.env.XRAYRADAR_DSN!,  // or a public env your build inlines
    authToken: process.env.XRAYRADAR_AUTH_TOKEN,
  });
}

export default function App() {
  return (
    <html>
      <head>...</head>
      <body>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
        <Scripts />
      </body>
    </html>
  );
}
```

Set `XRAYRADAR_DSN` and `XRAYRADAR_AUTH_TOKEN` in your environment; use a public env (e.g. Vite’s `import.meta.env`) for client-side DSN if your stack exposes it.

## Requirements

Node 20+ for the Node/Next.js packages; modern browsers (ES2020) for the browser/React packages. React 17+ and Next.js 13+ where applicable.

## Test coverage

Tests and coverage run in CI on every push and pull request to `main`. To run tests with coverage locally from the repo root:

```bash
npm run test:coverage
```

To run coverage for a single package:

```bash
npm run test:coverage -w @xrayradar/core
npm run test:coverage -w @xrayradar/node
npm run test:coverage -w @xrayradar/browser
```

Vitest prints a coverage summary (lines, branches, functions) in the terminal. For an HTML report, open `packages/<package-name>/coverage/index.html` in a browser after running coverage for that package.

For more on testing and coverage, see [TESTING.md](TESTING.md).

## Examples

Runable examples (Node CLI, Vite + React, Next.js) are in [examples/](examples/). Build the repo once (`npm run build`), then see [examples/README.md](examples/README.md) for how to run each.

For security practices, audit, and reporting vulnerabilities: see [SECURITY.md](SECURITY.md).

Contributing (build, test, versioning, releases): see [CONTRIBUTING.md](CONTRIBUTING.md).
