# @xrayradar/nextjs

XrayRadar SDK for Next.js: use **@xrayradar/node** on the server and **@xrayradar/react** (or **@xrayradar/browser**) on the client.

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

## Optional config wrapper

```js
// next.config.js
const { withXrayRadarConfig } = require("@xrayradar/nextjs");
module.exports = withXrayRadarConfig(yourExistingConfig);
```

This is a no-op placeholder for future Next.js-specific config (e.g. source maps, rewrites).
