import { describe, it, expect } from "vitest";
import { NodeClient } from "../client.js";
import { expressErrorHandler, expressRequestHandler } from "./express.js";
import { koaMiddleware } from "./koa.js";

describe("node middleware", () => {
  it("expressRequestHandler sets request context on scope", () => {
    const client = new NodeClient({ debug: false, transport: { sendEvent: () => {} } });
    const mw = expressRequestHandler(client);

    mw(
      { method: "GET", originalUrl: "/hello", headers: { "x-test": "1", authorization: "secret" }, query: { a: "b" } },
      {},
      () => {}
    );

    const ctx = client.scope.getContext();
    expect(ctx.request?.url).toBe("/hello");
    expect(ctx.request?.method).toBe("GET");
    expect(ctx.request?.headers?.authorization).toBeUndefined();
  });

  it("expressErrorHandler captures error with request context", () => {
    const sent: any[] = [];
    const client = new NodeClient({ debug: false, transport: { sendEvent: (e) => sent.push(e) } });
    const mw = expressErrorHandler(client);

    const next = (err?: unknown) => {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toBe("boom");
    };
    mw(
      new Error("boom"),
      { method: "POST", originalUrl: "/fail", headers: { "x-test": "1" }, query: { q: "1" } },
      { statusCode: 500 },
      next
    );

    expect(sent.length).toBe(1);
    expect(sent[0].contexts?.request?.url).toBe("/fail");
    expect(sent[0].contexts?.request?.method).toBe("POST");
  });

  it("koaMiddleware captures thrown errors", async () => {
    const sent: any[] = [];
    const client = new NodeClient({ debug: false, transport: { sendEvent: (e) => sent.push(e) } });
    const mw = koaMiddleware(client);

    const ctx: any = { request: { method: "GET", url: "/koa", header: { "x-test": "1" }, querystring: "a=1" }, status: 500 };

    await expect(
      mw(ctx, async () => {
        throw new Error("koa boom");
      })
    ).rejects.toThrow(/koa boom/);

    expect(sent.length).toBe(1);
    expect(sent[0].contexts?.request?.url).toBe("/koa");
    expect(sent[0].contexts?.request?.method).toBe("GET");
    expect(sent[0].message).toBe("Koa request error");
  });

  it("koaMiddleware passes through when next() does not throw", async () => {
    const sent: any[] = [];
    const client = new NodeClient({ debug: false, transport: { sendEvent: (e) => sent.push(e) } });
    const mw = koaMiddleware(client);
    const ctx: any = { request: { method: "GET", url: "/ok" } };
    await mw(ctx, async () => {});
    expect(sent.length).toBe(0);
  });
});

