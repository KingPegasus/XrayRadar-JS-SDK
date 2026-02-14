# @xrayradar/browser

[![npm](https://img.shields.io/npm/v/%40xrayradar%2Fbrowser?style=flat-square)](https://www.npmjs.com/package/@xrayradar/browser)

XrayRadar SDK for the **browser** – capture errors and messages and send them to your [XrayRadar](https://xrayradar.com) server. Uses `fetch` and automatically hooks into `window.onerror` and `unhandledrejection`.

## Install

```bash
npm install @xrayradar/browser
```

## Quick start

```ts
import { init, captureException, captureMessage } from "@xrayradar/browser";

init({
  dsn: "https://xrayradar.com/your_project_id",
  authToken: "your-token",
  // Optional: enable auto-instrumentation (fetch/XHR/history/console)
  // integrations: true,
});

captureException(new Error("Something broke"));
captureMessage("Something happened");
```

## Configuration

`init(options)` supports:

- **`dsn`**: `https://xrayradar.com/your_project_id`
- **`authToken`**: sent as `X-Xrayradar-Token`
  - If omitted, the browser transport also checks `globalThis.XRAYRADAR_AUTH_TOKEN`
- **`debug`**: log captured payloads to `console.warn`
- **`environment`**, **`release`**, **`serverName`**
- **`sampleRate`**: number in \([0, 1]\)
- **`maxBreadcrumbs`**
- **`beforeSend(event)`**: return modified event, `null` to drop, or a `Promise`
- **`transport`**: custom transport implementing `sendEvent(event)` (disables built-in global handlers)
- **`integrations`**: enable auto-instrumentation (see below)

## Integrations (optional)

Enable all integrations with one flag:

```ts
import { init } from "@xrayradar/browser";

init({
  dsn: "https://xrayradar.com/your_project_id",
  authToken: "your-token",
  integrations: true,
});
```

Or configure them individually:

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

For React (ErrorBoundary, Provider, hooks), use **@xrayradar/react**. Full docs: [XrayRadar-JS-SDK](https://github.com/KingPegasus/XrayRadar-JS-SDK#readme).
