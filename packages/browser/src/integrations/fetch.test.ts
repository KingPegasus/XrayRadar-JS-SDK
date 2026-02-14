import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BrowserClient } from "../client.js";

describe("browser integrations: fetch", () => {
  const origFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = origFetch;
  });

  it("adds breadcrumbs for fetch success", async () => {
    const sent: any[] = [];
    globalThis.fetch = vi.fn(async () => new Response("ok", { status: 200 })) as any;

    const client = new BrowserClient({
      debug: false,
      transport: { sendEvent: (e) => sent.push(e) },
      integrations: { fetch: { breadcrumbs: true, captureErrors: false } },
    });

    await fetch("https://example.com/api/ok", { method: "POST" });

    const crumbs = client.scope.getBreadcrumbs();
    expect(crumbs.length).toBeGreaterThan(0);
    expect(crumbs[crumbs.length - 1].type).toBe("http");
    expect(crumbs[crumbs.length - 1].message).toMatch(/POST .*\/api\/ok/);
    expect(sent.length).toBe(0);
  });

  it("captures an exception for failing status when enabled", async () => {
    const sent: any[] = [];
    globalThis.fetch = vi.fn(async () => new Response("nope", { status: 503 })) as any;

    const client = new BrowserClient({
      debug: false,
      transport: { sendEvent: (e) => sent.push(e) },
      integrations: { fetch: { breadcrumbs: true, captureErrors: true } },
    });

    await fetch("https://example.com/api/bad", { method: "GET" });

    expect(sent.length).toBe(1);
    expect(sent[0].contexts?.request?.url).toMatch(/example\.com\/api\/bad/);
    expect(sent[0].contexts?.extra?.http_status).toBe(503);
  });

  it("captures an exception for thrown fetch when enabled", async () => {
    const sent: any[] = [];
    globalThis.fetch = vi.fn(async () => {
      throw new Error("network down");
    }) as any;

    const client = new BrowserClient({
      debug: false,
      transport: { sendEvent: (e) => sent.push(e) },
      integrations: { fetch: { breadcrumbs: true, captureErrors: true } },
    });

    await expect(fetch("https://example.com/api/throw")).rejects.toThrow(/network down/);
    expect(sent.length).toBe(1);
    expect(sent[0].exception?.values?.[0]?.value).toMatch(/network down/);
  });
});

