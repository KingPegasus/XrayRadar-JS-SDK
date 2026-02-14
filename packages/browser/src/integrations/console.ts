import type { BrowserClient } from "../client.js";
import type { BrowserIntegrationConsoleOptions, Level } from "@xrayradar/core";
import { asOptions, type Uninstall } from "./utils.js";

export function instrumentConsole(
  client: BrowserClient,
  opt: boolean | BrowserIntegrationConsoleOptions | undefined
): Uninstall {
  const options = asOptions(opt, { breadcrumbs: true });
  if (!options) return () => {};

  const c = console as any;
  const orig = {
    debug: c.debug,
    info: c.info,
    warn: c.warn,
    error: c.error,
  };

  const wrap = (method: keyof typeof orig, level: Level) => {
    if (typeof orig[method] !== "function") return;
    c[method] = (...args: any[]) => {
      try {
        if (options.breadcrumbs) {
          const msg = args.map((a) => (typeof a === "string" ? a : safeStringify(a))).join(" ");
          client.addBreadcrumb(msg, { type: "console", category: "console", level, data: { method } });
        }
      } catch {
        // ignore breadcrumb errors
      }
      return orig[method].apply(console, args);
    };
  };

  wrap("debug", "debug");
  wrap("info", "info");
  wrap("warn", "warning");
  wrap("error", "error");

  return () => {
    c.debug = orig.debug;
    c.info = orig.info;
    c.warn = orig.warn;
    c.error = orig.error;
  };
}

function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

