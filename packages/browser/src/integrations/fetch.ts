import type { BrowserClient } from "../client.js";
import type { BrowserIntegrationFetchOptions } from "@xrayradar/core";
import { asOptions, matchesStatus, safeUrl, crumbHttp, type Uninstall } from "./utils.js";

export function instrumentFetch(
  client: BrowserClient,
  opt: boolean | BrowserIntegrationFetchOptions | undefined
): Uninstall {
  const options = asOptions(opt, {
    breadcrumbs: true,
    captureErrors: false,
    captureStatusCodes: [[500, 599]],
  });
  if (!options) return () => {};

  const g = globalThis as unknown as { fetch?: typeof fetch };
  const orig = g.fetch;
  if (typeof orig !== "function") return () => {};

  g.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const method =
      (init?.method || (typeof input === "object" && "method" in input ? (input as Request).method : "GET") || "GET").toUpperCase();
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;

    const started = Date.now();
    try {
      const res = await orig(input as any, init as any);
      const ms = Date.now() - started;

      if (options.breadcrumbs) {
        crumbHttp(client, `${method} ${safeUrl(url)}`, {
          method,
          url: safeUrl(url),
          status: res.status,
          ok: res.ok,
          duration_ms: ms,
        });
      }

      if (options.captureErrors && matchesStatus(res.status, options.captureStatusCodes)) {
        client.captureException(new Error(`HTTP ${res.status} for ${method} ${safeUrl(url)}`), {
          level: "error",
          message: "Fetch request failed",
          context: {
            request: { url: safeUrl(url), method },
            extra: { http_status: res.status, duration_ms: ms },
          },
        } as any);
      }

      return res;
    } catch (err) {
      const ms = Date.now() - started;
      if (options.breadcrumbs) {
        crumbHttp(client, `${method} ${safeUrl(url)}`, {
          method,
          url: safeUrl(url),
          error: String((err as any)?.message ?? err),
          duration_ms: ms,
        });
      }
      if (options.captureErrors) {
        const e = err instanceof Error ? err : new Error(String(err));
        client.captureException(e, {
          level: "error",
          message: "Fetch request threw",
          context: {
            request: { url: safeUrl(url), method },
            extra: { duration_ms: ms },
          },
        } as any);
      }
      throw err;
    }
  }) as any;

  return () => {
    g.fetch = orig;
  };
}

