# @xrayradar/nextjs

[![npm](https://img.shields.io/npm/v/%40xrayradar%2Fnextjs?style=flat-square)](https://www.npmjs.com/package/@xrayradar/nextjs)
![Next.js](https://img.shields.io/badge/next-%3E%3D13-brightgreen?style=flat-square)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen?style=flat-square)

XrayRadar SDK for Next.js: use **@xrayradar/node** on the server and **@xrayradar/react** (or **@xrayradar/browser**) on the client.

## Install

```bash
npm install @xrayradar/nextjs
```

## Server (Node)

1. Create `instrumentation.ts` at your project root (same level as `app/` or `pages/`):

```ts
import { init } from "@xrayradar/node";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    init({
      dsn: process.env.XRAYRADAR_DSN!,
      authToken: process.env.XRAYRADAR_AUTH_TOKEN,
      environment: process.env.XRAYRADAR_ENVIRONMENT,
      release: process.env.XRAYRADAR_RELEASE,
    });
  }
}
```

2. Set env: `XRAYRADAR_DSN`, `XRAYRADAR_AUTH_TOKEN` (and optional `XRAYRADAR_ENVIRONMENT`, `XRAYRADAR_RELEASE`).

Server options you can set (same as `@xrayradar/node`):

- `dsn`, `authToken`, `debug`
- `environment`, `release`, `serverName`
- `sampleRate`, `maxBreadcrumbs`
- `beforeSend(event)` (sync or async)
- `transport` (custom transport disables built-in global handlers)

## Client (Browser)

In your root layout or `_app.tsx`:

```tsx
import { init } from "@xrayradar/react";
import { ErrorBoundary } from "@xrayradar/react";

// Call once when the app loads (client-side)
if (typeof window !== "undefined") {
  init({
    dsn: process.env.NEXT_PUBLIC_XRAYRADAR_DSN!,
    authToken: process.env.NEXT_PUBLIC_XRAYRADAR_AUTH_TOKEN,
  });
}

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}
```

Use `NEXT_PUBLIC_*` for any client-visible DSN/token so Next.js inlines them.

Client options you can set (same as `@xrayradar/react` / `@xrayradar/browser`):

- `dsn`, `authToken`, `debug`
- `environment`, `release`, `serverName`
- `sampleRate`, `maxBreadcrumbs`
- `beforeSend(event)` (sync or async)
- `transport`
- `integrations` (fetch/XHR/history/console)

## Optional config wrapper

```js
// next.config.js
const { withXrayRadarConfig } = require("@xrayradar/nextjs");
module.exports = withXrayRadarConfig(yourExistingConfig);
```

This is a no-op placeholder for future Next.js-specific config (e.g. source maps, rewrites).
