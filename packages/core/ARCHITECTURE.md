# @xrayradar/core — Architecture

## Purpose

`@xrayradar/core` is the shared, framework-agnostic foundation used by all SDK packages. It defines:

- The **event contract** (`EventPayload`) that gets sent to XrayRadar (`POST /api/{project_id}/store/`).
- The **Scope** model (tags, extra, user, request, breadcrumbs).
- The **event builders** that convert JS `Error` / messages into an `EventPayload`.
- The **sampling** and **severity normalization** helpers.

## Key modules

- `src/types.ts`
  - Public types: `EventPayload`, `EventContexts`, `BreadcrumbData`, `ClientOptions`, `Transport`, etc.
- `src/scope.ts`
  - `Scope`: stores breadcrumbs + context and can be applied to event builders.
- `src/event.ts`
  - `eventFromException`, `eventFromMessage`: builds `EventPayload` from errors/messages + scope.
- `src/sdk.ts`
  - SDK identity: `SDK_NAME`, `SDK_VERSION`, `getSdkInfo()`.

## Data flow

1. A package (`@xrayradar/browser`, `@xrayradar/node`) holds a `Scope`.
2. When capturing, it calls `eventFromException` or `eventFromMessage`.
3. The resulting `EventPayload` is passed to a `Transport` (usually HTTP transport).

## “Previous functionality” (≤ 0.1.x)

- Scope: tags/extra/user/request + breadcrumbs.
- Event builders: exception and message events.
- Client options: `dsn`, `authToken`, `beforeSend`, `sampleRate`, etc.

## New in 0.2.0

- **Per-capture context overrides** via `CaptureContextOptions`:
  - `captureException(..., { context, breadcrumbs })`
  - `captureMessage(..., { context, breadcrumbs })`
- **`Scope.clone()`**:
  - Enables request-local context/breadcrumbs without mutating the global scope (important for concurrent requests).

