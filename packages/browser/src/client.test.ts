import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  BrowserClient,
  init,
  resetGlobal,
  getClient,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  setTag,
  setExtra,
  setContext,
} from "./client.js";

describe("BrowserClient", () => {
  beforeEach(() => {
    resetGlobal();
  });
  afterEach(() => {
    resetGlobal();
  });

  it("constructor with transport only sets enabled", () => {
    const sent: unknown[] = [];
    const client = new BrowserClient({
      transport: { sendEvent: (e) => sent.push(e) },
    });
    expect(client.captureException(new Error("e"))).toBeDefined();
    expect(sent).toHaveLength(1);
  });

  it("captureException returns null when disabled", () => {
    const client = new BrowserClient({});
    expect(client.captureException(new Error("x"))).toBeNull();
  });

  it("captureException returns null when beforeSend returns null", () => {
    const client = new BrowserClient({
      transport: { sendEvent: () => {} },
      beforeSend: () => null,
    });
    expect(client.captureException(new Error("x"))).toBeNull();
  });

  it("captureException with beforeSend Promise defers send", async () => {
    const sent: unknown[] = [];
    const client = new BrowserClient({
      transport: { sendEvent: (e) => sent.push(e) },
      beforeSend: (e) => Promise.resolve(e),
    });
    expect(client.captureException(new Error("async"))).toBeNull();
    await vi.waitFor(() => sent.length === 1);
  });

  it("captureException with debug logs payload", () => {
    const sent: unknown[] = [];
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const client = new BrowserClient({
      debug: true,
      transport: { sendEvent: (e) => sent.push(e) },
    });
    client.captureException(new Error("debug-err"));
    expect(warn).toHaveBeenCalledWith("[XrayRadar]", expect.any(Object));
    warn.mockRestore();
  });

  it("captureException with options.context uses _scopeForCapture", () => {
    const sent: unknown[] = [];
    const client = new BrowserClient({
      transport: { sendEvent: (e) => sent.push(e) },
    });
    client.captureException(new Error("x"), {
      context: { request: { url: "/test", method: "GET" } as any },
    });
    expect((sent[0] as any).contexts?.request?.url).toBe("/test");
  });

  it("captureMessage returns null when disabled", () => {
    const client = new BrowserClient({});
    expect(client.captureMessage("hi")).toBeNull();
  });

  it("captureMessage sends and returns event_id", () => {
    const sent: unknown[] = [];
    const client = new BrowserClient({
      transport: { sendEvent: (e) => sent.push(e) },
    });
    const id = client.captureMessage("hello", { level: "info" });
    expect(id).toBeDefined();
    expect((sent[0] as any).message).toBe("hello");
  });

  it("captureMessage with beforeSend Promise defers send", async () => {
    const sent: unknown[] = [];
    const client = new BrowserClient({
      transport: { sendEvent: (e) => sent.push(e) },
      beforeSend: (e) => Promise.resolve(e),
    });
    expect(client.captureMessage("async")).toBeNull();
    await vi.waitFor(() => sent.length === 1);
  });

  it("captureMessage with debug logs payload", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const client = new BrowserClient({
      debug: true,
      transport: { sendEvent: () => {} },
    });
    client.captureMessage("msg");
    expect(warn).toHaveBeenCalledWith("[XrayRadar]", expect.any(Object));
    warn.mockRestore();
  });

  it("addBreadcrumb, setUser, setTag, setExtra, setContext when enabled", () => {
    const client = new BrowserClient({ transport: { sendEvent: () => {} } });
    client.addBreadcrumb("b", { category: "c" });
    client.setUser({ id: "u1" });
    client.setTag("k", "v");
    client.setExtra("x", 42);
    client.setContext("custom", { foo: "bar" });
    const ctx = client.scope.getContext();
    expect(ctx.user?.id).toBe("u1");
    expect(ctx.tags?.k).toBe("v");
    expect(ctx.extra?.x).toBe(42);
    expect(ctx.extra?.custom).toEqual({ foo: "bar" });
    expect(client.scope.getBreadcrumbs()).toHaveLength(1);
  });

  it("clearBreadcrumbs clears scope", () => {
    const client = new BrowserClient({ transport: { sendEvent: () => {} } });
    client.addBreadcrumb("a");
    client.addBreadcrumb("b");
    client.clearBreadcrumbs();
    expect(client.scope.getBreadcrumbs()).toHaveLength(0);
  });

  it("flush and close call transport flush/close and remove handlers", () => {
    const flush = vi.fn();
    const close = vi.fn();
    const client = new BrowserClient({
      transport: { sendEvent: () => {}, flush, close },
    });
    client.flush();
    expect(flush).toHaveBeenCalled();
    client.close();
    expect(close).toHaveBeenCalled();
  });

  it("close uninstalls integrations", () => {
    const client = new BrowserClient({
      transport: { sendEvent: () => {} },
      integrations: { history: true },
    });
    history.pushState({}, "", "/a");
    const len = client.scope.getBreadcrumbs().length;
    client.close();
    history.pushState({}, "", "/b");
    expect(client.scope.getBreadcrumbs().length).toBe(len);
  });

  it("integrations: object with fetch/xhr/history/console", () => {
    const sent: unknown[] = [];
    const client = new BrowserClient({
      transport: { sendEvent: (e) => sent.push(e) },
      integrations: { fetch: true, history: true },
    });
    expect(client.scope.getBreadcrumbs()).toHaveLength(0);
    history.pushState({}, "", "/integrations-test");
    expect(client.scope.getBreadcrumbs().length).toBeGreaterThan(0);
    client.close();
  });
});

describe("BrowserClient init and global handlers", () => {
  afterEach(() => {
    resetGlobal();
  });

  it("captures uncaught error via window.error when init has dsn (no custom transport)", async () => {
    const fetchCalls: { url: string; body: string }[] = [];
    globalThis.fetch = vi.fn(async (url: string, opts: any) => {
      fetchCalls.push({ url, body: opts?.body ?? "" });
      return new Response("{}", { status: 200 });
    }) as any;

    init({
      dsn: "https://example.com/1",
      authToken: "token",
    });

    const err = new Error("window.error test");
    window.dispatchEvent(new ErrorEvent("error", { message: err.message, error: err }));

    await vi.waitFor(() => {
      expect(fetchCalls.length).toBeGreaterThanOrEqual(1);
    });
    const body = JSON.parse(fetchCalls[fetchCalls.length - 1].body);
    expect(body.message).toMatch(/window\.error test/);
    expect(body.exception?.values?.[0]?.value).toBe("window.error test");
  });

  it("integrations: true enables fetch breadcrumbs", async () => {
    const origFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async () => new Response("ok", { status: 200 })) as any;

    const sent: any[] = [];
    init({
      dsn: "https://example.com/1",
      authToken: "token",
      transport: { sendEvent: (e) => sent.push(e) },
      integrations: true,
    });

    await fetch("https://example.com/foo");

    const client = getClient();
    const crumbs = client!.scope.getBreadcrumbs();
    expect(crumbs.length).toBeGreaterThan(0);
    expect(crumbs[crumbs.length - 1].type).toBe("http");
    expect(crumbs[crumbs.length - 1].message).toMatch(/GET.*\/foo/);

    resetGlobal();
    globalThis.fetch = origFetch;
  });
});

describe("init, getClient, resetGlobal, global capture helpers", () => {
  beforeEach(() => {
    resetGlobal();
  });
  afterEach(() => {
    resetGlobal();
  });

  it("init sets global client and getClient returns it", () => {
    expect(getClient()).toBeNull();
    const client = init({ transport: { sendEvent: () => {} } });
    expect(getClient()).toBe(client);
  });

  it("resetGlobal closes and clears global client", () => {
    const close = vi.fn();
    init({ transport: { sendEvent: () => {}, close } });
    expect(getClient()).not.toBeNull();
    resetGlobal();
    expect(getClient()).toBeNull();
    expect(close).toHaveBeenCalled();
  });

  it("captureException/captureMessage return null when no client", () => {
    expect(captureException(new Error("x"))).toBeNull();
    expect(captureMessage("m")).toBeNull();
  });

  it("captureException/captureMessage use global client", () => {
    const sent: unknown[] = [];
    init({ transport: { sendEvent: (e) => sent.push(e) } });
    captureException(new Error("e"));
    captureMessage("m");
    expect(sent).toHaveLength(2);
  });

  it("global addBreadcrumb, setUser, setTag, setExtra, setContext update client scope", () => {
    init({ transport: { sendEvent: () => {} } });
    const client = getClient()!;
    addBreadcrumb("global-b", { category: "c" });
    setUser({ id: "gu1" });
    setTag("gk", "gv");
    setExtra("gx", 99);
    setContext("gkey", { bar: "baz" });
    const ctx = client.scope.getContext();
    expect(ctx.user?.id).toBe("gu1");
    expect(ctx.tags?.gk).toBe("gv");
    expect(ctx.extra?.gx).toBe(99);
    expect(ctx.extra?.gkey).toEqual({ bar: "baz" });
    expect(client.scope.getBreadcrumbs()).toHaveLength(1);
  });

  it("addBreadcrumb, setUser, setTag, setExtra, setContext no-op when no client", () => {
    expect(() => {
      addBreadcrumb("b");
      setUser(null);
      setTag("k", "v");
      setExtra("x", 1);
      setContext("c", {});
    }).not.toThrow();
  });
});
