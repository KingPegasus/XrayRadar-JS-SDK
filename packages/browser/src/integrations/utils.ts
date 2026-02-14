import type { BrowserClient } from "../client.js";

export type Uninstall = () => void;

export function isEnabledOption<T extends object>(v: boolean | T | undefined): v is T {
  return typeof v === "object" && v !== null;
}

export function asOptions<T extends object>(v: boolean | T | undefined, defaults: T): T | null {
  if (!v) return null;
  if (typeof v === "boolean") return defaults;
  return { ...defaults, ...v };
}

export function matchesStatus(
  status: number,
  ranges: Array<number | [number, number]> | undefined
): boolean {
  const r = ranges ?? [[500, 599]];
  return r.some((x) => {
    if (typeof x === "number") return status === x;
    return status >= x[0] && status <= x[1];
  });
}

export function safeUrl(input: string): string {
  try {
    const u = new URL(input, typeof window !== "undefined" ? window.location.href : undefined);
    return `${u.origin}${u.pathname}`;
  } catch {
    return input;
  }
}

export function crumbHttp(
  client: BrowserClient,
  message: string,
  data: Record<string, unknown>
): void {
  client.addBreadcrumb(message, { type: "http", category: "fetch", level: "info", data });
}

