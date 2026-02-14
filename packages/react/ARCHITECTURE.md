# @xrayradar/react — Architecture

## Purpose

`@xrayradar/react` provides React-specific helpers on top of `@xrayradar/browser`.

## Key modules

- `src/ErrorBoundary.tsx`
  - React error boundary that calls `captureException` from the browser SDK.
- `src/provider.tsx`
  - Optional `XrayRadarProvider` + `useXrayRadar()` for accessing a client instance.
- `src/index.tsx`
  - Re-exports the browser SDK’s API (init/capture/context) plus React components/hooks.

## Data flow

1. App calls `init()` (re-exported from `@xrayradar/browser`) on the client.
2. Wrap the tree with `ErrorBoundary` to capture render errors.
3. Errors become events via `@xrayradar/core` builder and are sent via browser transport.

## “Previous functionality” (≤ 0.1.x)

- `ErrorBoundary`
- `XrayRadarProvider`, `useXrayRadar`
- Re-exports from `@xrayradar/browser`

## New in 0.2.0

- **Runtime export parity fix**: `parseDsn` is now re-exported from `@xrayradar/react` (not just in type definitions).

