# Examples

Example apps using the XrayRadar JavaScript SDK. Use your own DSN and auth token (or set `XRAYRADAR_DSN` / `XRAYRADAR_AUTH_TOKEN`).

**Prerequisite:** From the repo root, build the packages once:

```bash
npm run build
```

**Getting DSN and Token:**

1. **DSN format:** `http://localhost:8001/{project_id}` (or `https://xrayradar.com/{project_id}`)
   - Get `project_id` from your XrayRadar project settings or create a project in the dashboard
   - For local dev: if your server runs on `http://localhost:8001`, use `http://localhost:8001/your_project_id`

2. **Auth token:** Get the API token from your project settings in the XrayRadar dashboard

3. **Set environment variables** as shown below for each example type

Then run any example as below.

## Node (basic usage)

CLI-style example: init, captureException, captureMessage, setUser, setTag, setExtra, addBreadcrumb.

```bash
cd node-basic
npm install
npm start
```

**Set environment variables:**

```bash
# Option 1: Export before running
export XRAYRADAR_DSN="http://xrayradar.com/your_project_id"
export XRAYRADAR_AUTH_TOKEN="your_token_here"
npm start

# Option 2: Inline
XRAYRADAR_DSN="http://xrayradar.com/your_project_id" XRAYRADAR_AUTH_TOKEN="your_token" npm start

# Option 3: Create .env file (if using dotenv)
XRAYRADAR_DSN=http://xrayradar.com/your_project_id
XRAYRADAR_AUTH_TOKEN=your_token
```

With no token, the SDK runs in debug mode and prints events to the console.

## Vite + React

Browser app with React, init, and ErrorBoundary. Hit “Trigger error” to send an event.

```bash
cd vite-react
npm install
npm run dev
```

**Set environment variables:**

Create `.env` or `.env.local` in `examples/vite-react/`:

```bash
VITE_XRAYRADAR_DSN=http://localhost:8001/your_project_id
VITE_XRAYRADAR_AUTH_TOKEN=your_token
```

**Note:** Vite requires the `VITE_` prefix for client-accessible env vars. Restart the dev server after changing `.env`.

## Next.js

Next.js app with server instrumentation and client init + ErrorBoundary.

```bash
cd next-app
npm install
npm run dev
```

**Set environment variables:**

Create `.env.local` in `examples/next-app/`:

```bash
# Server-side (instrumentation.ts)
XRAYRADAR_DSN=http://localhost:8001/your_project_id
XRAYRADAR_AUTH_TOKEN=your_token

# Client-side (app/layout.jsx) - NEXT_PUBLIC_ prefix required
NEXT_PUBLIC_XRAYRADAR_DSN=http://localhost:8001/your_project_id
NEXT_PUBLIC_XRAYRADAR_AUTH_TOKEN=your_token
```

**Note:** Next.js requires `NEXT_PUBLIC_` prefix for client-accessible env vars. You can use the same DSN/token for both server and client, or use different ones. Restart the dev server after changing `.env.local`.
