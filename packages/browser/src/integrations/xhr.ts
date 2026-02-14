import type { BrowserClient } from "../client.js";
import type { BrowserIntegrationXhrOptions } from "@xrayradar/core";
import { asOptions, matchesStatus, safeUrl, type Uninstall } from "./utils.js";

export function instrumentXhr(
  client: BrowserClient,
  opt: boolean | BrowserIntegrationXhrOptions | undefined
): Uninstall {
  const options = asOptions(opt, {
    breadcrumbs: true,
    captureErrors: false,
    captureStatusCodes: [[500, 599]],
  });
  if (!options) return () => {};

  const g = globalThis as any;
  const XHR = g.XMLHttpRequest;
  if (typeof XHR !== "function") return () => {};

  const origOpen = XHR.prototype.open;
  const origSend = XHR.prototype.send;

  XHR.prototype.open = function (method: string, url: string, ...rest: any[]) {
    (this as any).__xrayradar_xhr = {
      method: String(method || "GET").toUpperCase(),
      url: String(url),
      started: 0,
    };
    return origOpen.call(this, method, url, ...rest);
  };

  XHR.prototype.send = function (body?: any) {
    const meta = (this as any).__xrayradar_xhr;
    if (meta) meta.started = Date.now();

    const onLoadEnd = () => {
      try {
        const m = (this as any).__xrayradar_xhr;
        if (!m) return;
        const ms = m.started ? Date.now() - m.started : undefined;
        const status = (this as any).status;

        if (options.breadcrumbs) {
          client.addBreadcrumb(`${m.method} ${safeUrl(m.url)}`, {
            type: "http",
            category: "xhr",
            level: "info",
            data: {
              method: m.method,
              url: safeUrl(m.url),
              status,
              duration_ms: ms,
            },
          });
        }

        if (options.captureErrors && typeof status === "number" && matchesStatus(status, options.captureStatusCodes)) {
          client.captureException(new Error(`HTTP ${status} for ${m.method} ${safeUrl(m.url)}`), {
            level: "error",
            message: "XHR request failed",
            context: {
              request: { url: safeUrl(m.url), method: m.method },
              extra: { http_status: status, duration_ms: ms },
            },
          } as any);
        }
      } finally {
        // no-op
      }
    };

    // Add only one listener per request.
    this.addEventListener("loadend", onLoadEnd, { once: true } as any);
    return origSend.call(this, body);
  };

  return () => {
    XHR.prototype.open = origOpen;
    XHR.prototype.send = origSend;
  };
}

