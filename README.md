# xrayradar-js

JavaScript/TypeScript SDK for [XrayRadar](https://github.com/xrayradar/xrayradar-server) error tracking. Supports Node.js, browser, React, and Next.js.

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
pnpm add @xrayradar/node

# Browser only
pnpm add @xrayradar/browser

# React
pnpm add @xrayradar/react

# Next.js (includes node + react)
pnpm add @xrayradar/nextjs
```

## Quick start

**Node:**

```ts
import { init, captureException } from "@xrayradar/node";

init({ dsn: "https://your-server.com/your_project_id", authToken: "your-token" });
captureException(new Error("Something broke"));
```

**Browser / React:**

```ts
import { init, captureException } from "@xrayradar/browser"; // or @xrayradar/react
import { ErrorBoundary } from "@xrayradar/react";

init({ dsn: "https://your-server.com/your_project_id", authToken: "your-token" });

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

Events are sent to `POST /api/{project_id}/store/` with header `X-Xrayradar-Token`. See the [server API](https://github.com/xrayradar/xrayradar-server) and [Python SDK](https://github.com/xrayradar/xrayradar) for the same contract.

## Build and test

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
```

## Publish (npm)

Scoped packages are published under `@xrayradar/*`. Configure npm auth and run from each package or use a workspace publish script.
