# @xrayradar/node

XrayRadar SDK for **Node.js** – capture errors and messages and send them to your [XrayRadar](https://xrayradar.com) server.

## Install

```bash
npm install @xrayradar/node
```

## Quick start

```ts
import { init, captureException, captureMessage } from "@xrayradar/node";

init({
  dsn: "https://xrayradar.com/your_project_id",
  authToken: "your-token",
});

captureException(new Error("Something broke"));
captureMessage("Something happened");
```

Requires **Node 20+**. For global uncaught exception / rejection handling, see the [full documentation](https://github.com/KingPegasus/XrayRadar-JS-SDK#readme).
