import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  NodeClient,
  init,
  getClient,
  resetGlobal,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  setTag,
  setExtra,
  setContext,
} from "./client.js";

describe("NodeClient", () => {
  beforeEach(() => {
    resetGlobal();
  });
  afterEach(() => {
    resetGlobal();
  });

  it("constructor with transport only sets enabled and no global handlers", () => {
    const sent: unknown[] = [];
    const client = new NodeClient({
      transport: { sendEvent: (e) => sent.push(e) },
    });
    expect(client.scope.maxBreadcrumbs).toBe(100);
    const id = client.captureException(new Error("e"));
    expect(id).toBeDefined();
    expect(sent).toHaveLength(1);
  });

  it("constructor with options applies env, release, serverName, sampleRate, maxBreadcrumbs, beforeSend", () => {
    const client = new NodeClient({
      transport: { sendEvent: () => {} },
      environment: "staging",
      release: "v1",
      serverName: "svc",
      sampleRate: 0.5,
      maxBreadcrumbs: 50,
      beforeSend: (e) => ({ ...e, message: "filtered" }),
    });
    expect(client.scope.getContext().environment).toBe("staging");
    expect(client.scope.getContext().release).toBe("v1");
    expect(client.scope.getContext().server_name).toBe("svc");
    expect(client.scope.maxBreadcrumbs).toBe(50);
    const sent: unknown[] = [];
    const c2 = new NodeClient({
      transport: { sendEvent: (e) => sent.push(e) },
      beforeSend: (e) => ({ ...e, message: "filtered" }),
    });
    c2.captureException(new Error("x"));
    expect((sent[0] as { message?: string }).message).toBe("filtered");
  });

  it("init updates options and scope", () => {
    const client = new NodeClient({
      transport: { sendEvent: () => {} },
      environment: "dev",
    });
    client.init({
      dsn: "https://x.com/p1",
      authToken: "t",
      environment: "prod",
      release: "r1",
      serverName: "s1",
      sampleRate: 0,
      maxBreadcrumbs: 10,
      beforeSend: (e) => e,
    });
    expect(client.options.dsn).toBe("https://x.com/p1");
    expect(client.options.authToken).toBe("t");
    expect(client.scope.getContext().environment).toBe("prod");
    expect(client.scope.getContext().release).toBe("r1");
    expect(client.scope.getContext().server_name).toBe("s1");
    expect(client.options.sampleRate).toBe(0);
    expect(client.scope.maxBreadcrumbs).toBe(10);
  });

  it("captureException returns null when disabled (no dsn/transport/debug)", () => {
    const client = new NodeClient({});
    expect(client.captureException(new Error("x"))).toBeNull();
  });

  it("captureException returns null when beforeSend returns null", () => {
    const client = new NodeClient({
      transport: { sendEvent: () => {} },
      beforeSend: () => null,
    });
    expect(client.captureException(new Error("x"))).toBeNull();
  });

  it("captureException with beforeSend returning Promise defers send and returns null", async () => {
    const sent: unknown[] = [];
    const client = new NodeClient({
      transport: { sendEvent: (e) => sent.push(e) },
      beforeSend: (e) => Promise.resolve(e),
    });
    expect(client.captureException(new Error("async"))).toBeNull();
    await vi.waitFor(() => sent.length === 1);
    expect(sent).toHaveLength(1);
  });

  it("captureException with beforeSend Promise resolving null does not send", async () => {
    const sent: unknown[] = [];
    const client = new NodeClient({
      transport: { sendEvent: (e) => sent.push(e) },
      beforeSend: () => Promise.resolve(null),
    });
    client.captureException(new Error("x"));
    await new Promise((r) => setTimeout(r, 50));
    expect(sent).toHaveLength(0);
  });

  it("captureException respects sampleRate 0", () => {
    const sent: unknown[] = [];
    const client = new NodeClient({
      transport: { sendEvent: (e) => sent.push(e) },
      sampleRate: 0,
    });
    expect(client.captureException(new Error("x"))).toBeNull();
    expect(sent).toHaveLength(0);
  });

  it("captureException with options.context uses _scopeForCapture", () => {
    const sent: unknown[] = [];
    const client = new NodeClient({
      transport: { sendEvent: (e) => sent.push(e) },
    });
    client.captureException(new Error("x"), {
      context: { request: { url: "/test", method: "GET" } as any },
    });
    expect(sent).toHaveLength(1);
    expect((sent[0] as any).contexts?.request?.url).toBe("/test");
  });

  it("captureException with options.breadcrumbs uses _scopeForCapture", () => {
    const sent: unknown[] = [];
    const client = new NodeClient({
      transport: { sendEvent: (e) => sent.push(e) },
    });
    client.captureException(new Error("x"), {
      breadcrumbs: [{ message: "step1", category: "test" }],
    });
    expect(sent).toHaveLength(1);
    expect((sent[0] as any).breadcrumbs).toHaveLength(1);
    expect((sent[0] as any).breadcrumbs[0].message).toBe("step1");
  });

  it("captureMessage returns null when disabled", () => {
    const client = new NodeClient({});
    expect(client.captureMessage("hi")).toBeNull();
  });

  it("captureMessage sends and returns event_id", () => {
    const sent: unknown[] = [];
    const client = new NodeClient({
      transport: { sendEvent: (e) => sent.push(e) },
    });
    const id = client.captureMessage("hello", { level: "info" });
    expect(id).toBeDefined();
    expect(sent).toHaveLength(1);
    expect((sent[0] as any).message).toBe("hello");
    expect((sent[0] as any).level).toBe("info");
  });

  it("captureMessage with beforeSend Promise", async () => {
    const sent: unknown[] = [];
    const client = new NodeClient({
      transport: { sendEvent: (e) => sent.push(e) },
      beforeSend: (e) => Promise.resolve(e),
    });
    expect(client.captureMessage("async")).toBeNull();
    await vi.waitFor(() => sent.length === 1);
  });

  it("addBreadcrumb, setUser, setTag, setExtra, setContext when enabled", () => {
    const client = new NodeClient({ transport: { sendEvent: () => {} } });
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

  it("clearBreadcrumbs clears scope breadcrumbs", () => {
    const client = new NodeClient({ transport: { sendEvent: () => {} } });
    client.addBreadcrumb("a");
    client.addBreadcrumb("b");
    expect(client.scope.getBreadcrumbs()).toHaveLength(2);
    client.clearBreadcrumbs();
    expect(client.scope.getBreadcrumbs()).toHaveLength(0);
  });

  it("captureException with debug and transport returning Promise calls applyAndSend and catches promise", async () => {
    const sent: unknown[] = [];
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const client = new NodeClient({
      debug: true,
      transport: {
        sendEvent: (e) => {
          sent.push(e);
          return Promise.resolve();
        },
      },
      beforeSend: (e) => Promise.resolve(e),
    });
    expect(client.captureException(new Error("async-debug"))).toBeNull();
    await vi.waitFor(() => sent.length === 1);
    expect(warn).toHaveBeenCalledWith("[XrayRadar]", expect.any(Object));
    warn.mockRestore();
  });

  it("captureException sync with debug and transport returning Promise", () => {
    const sent: unknown[] = [];
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const client = new NodeClient({
      debug: true,
      transport: {
        sendEvent: (e) => {
          sent.push(e);
          return Promise.resolve();
        },
      },
    });
    const id = client.captureException(new Error("sync-debug"));
    expect(id).toBeDefined();
    expect(sent).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith("[XrayRadar]", expect.any(Object));
    warn.mockRestore();
  });

  it("captureMessage with debug and transport returning Promise (async beforeSend)", async () => {
    const sent: unknown[] = [];
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const client = new NodeClient({
      debug: true,
      transport: {
        sendEvent: (e) => {
          sent.push(e);
          return Promise.resolve();
        },
      },
      beforeSend: (e) => Promise.resolve(e),
    });
    expect(client.captureMessage("async-msg")).toBeNull();
    await vi.waitFor(() => sent.length === 1);
    expect(warn).toHaveBeenCalledWith("[XrayRadar]", expect.any(Object));
    warn.mockRestore();
  });

  it("captureMessage sync with debug and transport returning Promise", () => {
    const sent: unknown[] = [];
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const client = new NodeClient({
      debug: true,
      transport: {
        sendEvent: (e) => {
          sent.push(e);
          return Promise.resolve();
        },
      },
    });
    const id = client.captureMessage("sync-msg");
    expect(id).toBeDefined();
    expect(sent).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith("[XrayRadar]", expect.any(Object));
    warn.mockRestore();
  });

  it("flush and close call transport flush/close", () => {
    const flush = vi.fn();
    const close = vi.fn();
    const client = new NodeClient({
      transport: { sendEvent: () => {}, flush, close },
    });
    client.flush();
    expect(flush).toHaveBeenCalled();
    client.close();
    expect(close).toHaveBeenCalled();
  });

  it("constructor with dsn and no transport installs global handlers; close removes them", () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    const uncaughtListener = vi.fn();
    process.on("uncaughtException", uncaughtListener);
    const client = new NodeClient({ dsn: "https://ingest.example.com/proj_1" });
    process.removeListener("uncaughtException", uncaughtListener);
    client.close();
    vi.unstubAllGlobals();
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
    expect(client.scope.getBreadcrumbs()[0].message).toBe("global-b");
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
