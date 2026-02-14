# @xrayradar/nextjs — Architecture

## Purpose

`@xrayradar/nextjs` provides thin helpers for integrating XrayRadar into Next.js apps:

- Server-side capture via `@xrayradar/node`
- Client-side capture via `@xrayradar/react`

## Key modules

- `src/instrumentation.ts`
  - `registerServerInstrumentation()`: helper intended for Next.js 13+ `instrumentation.ts` to initialize `@xrayradar/node` once on server start.
- `src/config.ts`
  - `withXrayRadarConfig()`: placeholder wrapper for future Next.js build-time integration.
- `src/index.ts`
  - Re-exports from node + react packages (and `registerServerInstrumentation`).

## “Previous functionality” (≤ 0.1.x)

- Server instrumentation helper (Node runtime only).
- Client React exports via `@xrayradar/react`.
- Optional config wrapper.

## New in 0.2.0

- No Next.js-specific behavior changes in this release; it benefits indirectly from:
  - browser integrations (if enabled in client `init()`),
  - node middleware/per-capture context helpers (if used in custom server routes).

