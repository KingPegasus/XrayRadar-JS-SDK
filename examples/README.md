# Examples

Example apps using the XrayRadar JavaScript SDK. Use your own DSN and auth token (or set `XRAYRADAR_DSN` / `XRAYRADAR_AUTH_TOKEN`).

**Prerequisite:** From the repo root, build the packages once:

```bash
npm run build
```

Then run any example as below.

## Node (basic usage)

CLI-style example: init, captureException, captureMessage, setUser, setTag, setExtra, addBreadcrumb.

```bash
cd node-basic
npm install
npm start
```

Set env (optional): `XRAYRADAR_DSN`, `XRAYRADAR_AUTH_TOKEN`. With no token, the SDK runs in debug mode and prints events to the console.

## Vite + React

Browser app with React, init, and ErrorBoundary. Hit “Trigger error” to send an event.

```bash
cd vite-react
npm install
npm run dev
```

Set `VITE_XRAYRADAR_DSN` and `VITE_XRAYRADAR_AUTH_TOKEN` in `.env` (or `.env.local`) for real reporting.

## Next.js

Next.js app with server instrumentation and client init + ErrorBoundary.

```bash
cd next-app
npm install
npm run dev
```

Set `XRAYRADAR_DSN`, `XRAYRADAR_AUTH_TOKEN` for server, and `NEXT_PUBLIC_XRAYRADAR_DSN`, `NEXT_PUBLIC_XRAYRADAR_AUTH_TOKEN` for client (or use one DSN for both).
