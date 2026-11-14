# Contributing

## Build and test

```bash
npm install
npm run build
npm run test
npm run lint
```

## Compatibility

- **Node:** Developing (build, lint, test) needs Node `^22.12` or `>=24` (Vitest 5). CI runs on Node 24. The published packages still support Node 20+ at runtime.
- **Browsers:** Output is ES2020; works in current Chrome, Firefox, Safari, Edge and other ES2020‑capable environments.
- **React:** `>=17` (peer). Next.js: `>=13` (peer).

## Versioning and releases

- **Strategy:** All packages share the same version (e.g. `0.1.0`). Versions are bumped together.
- **Publishing:** From the repo root with npm auth configured:
  ```bash
  npm version patch   # or minor / major
  npm publish --workspaces --access public
  ```
  The root `package.json` is `private`, so only `@xrayradar/core`, `@xrayradar/node`, `@xrayradar/browser`, `@xrayradar/react`, and `@xrayradar/nextjs` are published.
- **CI:** The [Publish workflow](.github/workflows/publish.yml) can publish on release or manual trigger (requires `NPM_TOKEN`).
