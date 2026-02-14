import type { NodeClient } from "../client.js";

type KoaContext = {
  request?: {
    method?: string;
    url?: string;
    header?: Record<string, unknown>;
    querystring?: string;
    ip?: string;
  };
  status?: number;
};

export function koaMiddleware(client: NodeClient) {
  return async function xrayradarKoaMiddleware(ctx: KoaContext, next: () => Promise<unknown>) {
    try {
      await next();
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      const req = ctx?.request;
      client.captureException(e, {
        level: "error",
        message: "Koa request error",
        context: {
          request: {
            url: String(req?.url ?? ""),
            method: String(req?.method ?? ""),
            headers: sanitizeHeaders(req?.header),
            query_string: req?.querystring,
          } as any,
          extra: { status_code: ctx?.status },
        },
      } as any);
      throw err;
    }
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

