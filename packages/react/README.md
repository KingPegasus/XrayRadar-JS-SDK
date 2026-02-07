# @xrayradar/react

XrayRadar SDK for **React** – ErrorBoundary, XrayRadarProvider, useXrayRadar, and re-exports from **@xrayradar/browser** for [XrayRadar](xrayradar.com) error tracking.

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
});

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

Requires **React 17+**. For Next.js, use **@xrayradar/nextjs**. Full docs and Remix setup: [XrayRadar-JS-SDK](https://github.com/KingPegasus/XrayRadar-JS-SDK#readme).
