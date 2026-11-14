# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-11-14

No API or runtime changes. Packages still support Node 20+.

### Changed

- **Package metadata:** all packages now list `author` (Rhyme Solutions), `homepage` (the XrayRadar case study) and `bugs` (GitHub issues), so npm shows these links.
- **READMEs:** each package README now notes that XrayRadar is built and maintained by Rhyme Solutions.

### Development

- Dev dependencies updated: Vitest 5, ESLint 10, TypeScript 6, tsup 9, happy-dom 21. Development now uses Node 24 (`.nvmrc`).
- GitHub Actions updated to `actions/checkout` v7 and `actions/setup-node` v7.
- `npm audit` is clean again: `minimatch` inside typescript-eslint is overridden to a patched version.

## [0.2.0] - 2026-02-08

### Added

- **Browser integrations (opt-in via `init({ integrations: ... })`)**
  - Fetch instrumentation: breadcrumbs and optional auto-capture for failing requests.
  - XHR instrumentation: breadcrumbs and optional auto-capture for failing requests.
  - History/navigation instrumentation: `pushState` / `replaceState` / `popstate` breadcrumbs.
  - Console instrumentation: `console.(debug|info|warn|error)` breadcrumbs.
  - Manual exports: `instrumentFetch`, `instrumentXhr`, `instrumentHistory`, `instrumentConsole`.
- **Node middleware helpers**
  - Express: `expressRequestHandler`, `expressErrorHandler`.
  - Koa: `koaMiddleware`.
- **Per-capture context overrides**
  - `captureException(..., { context, breadcrumbs })` and `captureMessage(..., { context, breadcrumbs })` without mutating the global scope.
  - `Scope.clone()` to support request-local scope usage.
- **React package export fix**
  - `@xrayradar/react` now correctly re-exports `parseDsn` at runtime.

### Tests

- Added unit tests for browser integrations, Node middleware helpers, and the new scope clone behavior.

## [0.1.0] - 2025-02-07

### Added

- **@xrayradar/core** – Shared types, scope, breadcrumbs, event builder, and transport interface for the XrayRadar SDK.
- **@xrayradar/node** – Node.js SDK with HTTP transport, `init`, `captureException`, `captureMessage`, and global error handlers.
- **@xrayradar/browser** – Browser SDK with the same API, fetch-based transport, and automatic `window.onerror` / `unhandledrejection` capture.
- **@xrayradar/react** – React integration with `ErrorBoundary`, `XrayRadarProvider`, `useXrayRadar`, and re-exports from the browser package.
- **@xrayradar/nextjs** – Next.js integration with config helper, instrumentation, and server + client setup.
- TypeScript support and type definitions for all packages.
- ESM and CJS build outputs.
- Examples for Node CLI, Vite + React, and Next.js.
- Documentation for Node, browser, React, Next.js, and Remix usage.

### Requirements

- Node.js 20+ for Node/Next.js packages.
- ES2020-capable browsers for browser/React packages.
- React 17+ and Next.js 13+ where applicable.

[0.2.0]: https://github.com/KingPegasus/XrayRadar-JS-SDK/releases/tag/v0.2.0
[0.1.0]: https://github.com/KingPegasus/XrayRadar-JS-SDK/releases/tag/v0.1.0
