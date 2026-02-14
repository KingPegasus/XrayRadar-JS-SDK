import type { NodeClient } from "../client.js";

type ExpressRequest = {
  method?: string;
  originalUrl?: string;
  url?: string;
  headers?: Record<string, unknown>;
  query?: Record<string, unknown>;
  ip?: string;
};
type ExpressResponse = { statusCode?: number };
type Next = (err?: unknown) => void;

export function expressRequestHandler(client: NodeClient) {
  return function xrayradarExpressRequestHandler(req: ExpressRequest, _res: ExpressResponse, next: Next) {
    try {
      client.setContext("request", {
        url: String(req.originalUrl ?? req.url ?? ""),
        method: String(req.method ?? ""),
        headers: sanitizeHeaders(req.headers),
        query_string: safeQuery(req.query),
        env: {},
      } as any);
    } catch {
      // ignore
    }
    return next();
  };
}

/**
 * Express error-handling middleware (must have 4 args).
 * Put this after your routes.
 */
export function expressErrorHandler(client: NodeClient) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function xrayradarExpressErrorHandler(err: any, req: ExpressRequest, res: ExpressResponse, next: Next) {
    const e = err instanceof Error ? err : new Error(String(err));
    client.captureException(e, {
      level: "error",
      message: "Express request error",
      context: {
        request: {
          url: String(req.originalUrl ?? req.url ?? ""),
          method: String(req.method ?? ""),
          headers: sanitizeHeaders(req.headers),
          query_string: safeQuery(req.query),
        } as any,
        extra: { status_code: res?.statusCode },
      },
    } as any);
    return next(err);
  };
}

function sanitizeHeaders(h: Record<string, unknown> | undefined): Record<string, string> | undefined {
  if (!h) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(h)) {
    const key = k.toLowerCase();
    if (key === "authorization" || key === "cookie" || key === "set-cookie") continue;
    out[k] = Array.isArray(v) ? v.join(",") : String(v);
  }
  return out;
}

function safeQuery(q: Record<string, unknown> | undefined): string | undefined {
  if (!q) return undefined;
  try {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) usp.set(k, String(v));
    return usp.toString();
  } catch {
    return undefined;
  }
}

