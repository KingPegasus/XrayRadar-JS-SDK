# @xrayradar/react

[![npm](https://img.shields.io/npm/v/%40xrayradar%2Freact?style=flat-square)](https://www.npmjs.com/package/@xrayradar/react)
![React](https://img.shields.io/badge/react-%3E%3D17-brightgreen?style=flat-square)

XrayRadar SDK for **React** – ErrorBoundary, XrayRadarProvider, useXrayRadar, and re-exports from **@xrayradar/browser** for [XrayRadar](https://xrayradar.com) error tracking.

## Install

```bash
npm install @xrayradar/react
```

## Quick start

```tsx
import { init, captureException, ErrorBoundary } from "@xrayradar/react";

init({
  dsn: "https://xrayradar.com/your_project_id",
  authToken: "your-token",
  // Optional: enable browser integrations (fetch/XHR/history/console)
  // integrations: true,
});

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

## Configuration

`init(options)` supports the same options as `@xrayradar/browser`:

- `dsn`, `authToken`, `debug`
- `environment`, `release`, `serverName`
- `sampleRate`, `maxBreadcrumbs`
- `beforeSend(event)` (sync or async)
- `transport`
- `integrations` (fetch/XHR/history/console)

Requires **React 17+**. For Next.js, use **@xrayradar/nextjs**. Full docs and Remix setup: [XrayRadar-JS-SDK](https://github.com/KingPegasus/XrayRadar-JS-SDK#readme).
