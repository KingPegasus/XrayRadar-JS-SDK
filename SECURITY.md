# Security

This document outlines security practices and audit for the **xrayradar-js** SDK (Node, Browser, React, Next.js).

## Automated security scanning

The repo runs dependency vulnerability scanning in CI:

- **npm audit**: Checks all dependencies (root and workspaces) for known vulnerabilities.

### Running a security audit locally

```bash
# Full audit (writes report to ~/.xrayradar-js-security-reports/)
./scripts/security_audit.sh

# Or via npm
npm run audit

# Or run npm audit directly
npm audit
npm audit --json   # JSON report
```

## Practices implemented

### 1. Secrets and configuration

- **No hardcoded secrets**: DSN and auth tokens come from options or environment (`XRAYRADAR_DSN`, `XRAYRADAR_AUTH_TOKEN`, `NEXT_PUBLIC_*` for client).
- **Token handling**: Tokens are passed via init options or env; not logged in debug output beyond presence checks where appropriate.

### 2. Data and privacy

- **Payload limits**: Transport truncates large payloads (e.g. 100KB) to limit exposure.
- **User/context**: User, tags, and extra are set explicitly by the app; SDK does not auto-capture request headers or cookies.

### 3. Transport

- **HTTPS**: DSN uses `https://`; fetch is used with default TLS.
- **Timeouts**: HTTP transport uses configurable timeouts.
- **429 handling**: Rate limits (429) are handled with optional retry/backoff.

### 4. Dependencies

- **Audits**: Dependencies are scanned in CI with `npm audit`.
- **Workspaces**: Single lockfile at root; all packages share the same audit surface.

## Audit results

- **npm audit**: Runs in CI on every push/PR. Fix reported issues with `npm audit fix` (or `npm audit fix --force` only when you accept breaking changes).

## Reporting security issues

If you find a security vulnerability, please report it responsibly:

1. **Do not** open a public issue.
2. Email: **dev@xrayradar.com** with details.
3. Allow time for a fix before public disclosure.

This document is updated as practices change.
