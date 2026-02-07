# @xrayradar/browser

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
});

captureException(new Error("Something broke"));
captureMessage("Something happened");
```

For React (ErrorBoundary, Provider, hooks), use **@xrayradar/react**. Full docs: [XrayRadar-JS-SDK](https://github.com/KingPegasus/XrayRadar-JS-SDK#readme).
