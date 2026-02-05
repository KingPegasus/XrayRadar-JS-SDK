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
npm install @xrayradar/node

# Browser only
npm install @xrayradar/browser

# React
npm install @xrayradar/react

# Next.js (includes node + react)
npm install @xrayradar/nextjs
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

## Requirements

Node 18+ for the Node/Next.js packages; modern browsers (ES2020) for the browser/React packages. React 17+ and Next.js 13+ where applicable.

## Examples

Runable examples (Node CLI, Vite + React, Next.js) are in [examples/](examples/). Build the repo once (`npm run build`), then see [examples/README.md](examples/README.md) for how to run each.

---

Contributing (build, test, versioning, releases): see [CONTRIBUTING.md](CONTRIBUTING.md).
