# @xrayradar/core

[![npm](https://img.shields.io/npm/v/%40xrayradar%2Fcore?style=flat-square)](https://www.npmjs.com/package/@xrayradar/core)

Shared types, scope, breadcrumbs, event builder, and transport interface for the [XrayRadar](https://xrayradar.com) JavaScript/TypeScript SDK.

This package is typically used as a dependency of **@xrayradar/node**, **@xrayradar/browser**, or other XrayRadar packages. You usually don’t install it directly unless you’re building a custom transport or integrating with the low-level API.

## Install

```bash
npm install @xrayradar/core
```

## What’s inside

- `Scope`: breadcrumbs + context (tags, user, request, extra)
- Event builders: `eventFromException`, `eventFromMessage`
- Transport interface: implement `Transport` to send events (or swap transports in other packages)
- Shared types: `EventPayload`, `ClientOptions`, etc.

## Documentation

Full docs, quick start, and examples: [XrayRadar-JS-SDK](https://github.com/KingPegasus/XrayRadar-JS-SDK#readme).
