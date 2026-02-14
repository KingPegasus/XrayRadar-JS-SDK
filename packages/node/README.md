# @xrayradar/node

[![npm](https://img.shields.io/npm/v/%40xrayradar%2Fnode?style=flat-square)](https://www.npmjs.com/package/@xrayradar/node)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen?style=flat-square)

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

## Configuration

`init(options)` supports:

- **`dsn`**: `https://xrayradar.com/your_project_id`
- **`authToken`**: sent as `X-Xrayradar-Token`
- **`debug`**: log captured payloads to `console.warn`
- **`environment`**, **`release`**, **`serverName`**
- **`sampleRate`**: number in \([0, 1]\)
- **`maxBreadcrumbs`**
- **`beforeSend(event)`**: return modified event, `null` to drop, or a `Promise`
- **`transport`**: custom transport implementing `sendEvent(event)` (disables built-in global handlers)

### Environment variables (optional)

If you don’t pass these explicitly, you can set:

- `XRAYRADAR_ENVIRONMENT`
- `XRAYRADAR_RELEASE`
- `XRAYRADAR_SERVER_NAME`
- `XRAYRADAR_AUTH_TOKEN` (used by the built-in HTTP transport)

## Middleware helpers (optional)

### Express

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

### Koa

```ts
import Koa from "koa";
import { init, getClient, koaMiddleware } from "@xrayradar/node";

init({ dsn: process.env.XRAYRADAR_DSN!, authToken: process.env.XRAYRADAR_AUTH_TOKEN });
const client = getClient()!;

const app = new Koa();
app.use(koaMiddleware(client));
```

Requires **Node 20+**. For global uncaught exception / rejection handling, see the [full documentation](https://github.com/KingPegasus/XrayRadar-JS-SDK#readme).
