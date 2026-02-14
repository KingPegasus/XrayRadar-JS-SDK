import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HttpTransport } from "./transport.js";

describe("HttpTransport", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("constructs from DSN and sends POST to store URL with auth header", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });
    const transport = new HttpTransport("https://ingest.example.com/proj_1", {
      authToken: "secret",
    });
    await transport.sendEvent({
      event_id: "e1",
      timestamp: new Date().toISOString(),
      level: "error",
      message: "test",
      platform: "javascript",
      sdk: { name: "x", version: "1" },
      contexts: { tags: {}, extra: {} },
      breadcrumbs: [],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://ingest.example.com/api/proj_1/store/",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-Xrayradar-Token": "secret",
        }),
      })
    );
  });

  it("sends without auth header when authToken empty", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });
    const transport = new HttpTransport("https://h.example.com/p1");
    await transport.sendEvent({
      event_id: "e2",
      timestamp: new Date().toISOString(),
      level: "info",
      message: "msg",
      platform: "javascript",
      sdk: { name: "x", version: "1" },
      contexts: { tags: {}, extra: {} },
      breadcrumbs: [],
    });
    const call = fetchMock.mock.calls[0][1];
    expect(call.headers["X-Xrayradar-Token"]).toBeUndefined();
  });

  it("throws on 429 with Retry-After", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: { get: (k: string) => (k.toLowerCase() === "retry-after" ? "120" : null) },
    });
    const transport = new HttpTransport("https://h.example.com/p1");
    await expect(transport.sendEvent({
      event_id: "e",
      timestamp: new Date().toISOString(),
      level: "error",
      message: "x",
      platform: "javascript",
      sdk: { name: "x", version: "1" },
      contexts: { tags: {}, extra: {} },
      breadcrumbs: [],
    })).rejects.toThrow(/Rate limited.*120/);
  });

  it("throws on non-OK response with body detail", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve("Bad request body"),
    });
    const transport = new HttpTransport("https://h.example.com/p1");
    await expect(transport.sendEvent({
      event_id: "e",
      timestamp: new Date().toISOString(),
      level: "error",
      message: "x",
      platform: "javascript",
      sdk: { name: "x", version: "1" },
      contexts: { tags: {}, extra: {} },
      breadcrumbs: [],
    })).rejects.toThrow(/HTTP 400.*Bad request body/);
  });

  it("truncates oversized payload (message, breadcrumbs, frames)", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });
    const transport = new HttpTransport("https://h.example.com/p1");
    // Exceed 100KB so truncatePayload is called
    const longMessage = "a".repeat(120 * 1024);
    const manyBreadcrumbs = Array.from({ length: 150 }, (_, i) => ({
      timestamp: new Date().toISOString(),
      message: `b${i}`,
      category: "x",
      level: "info" as const,
      data: {},
      type: "default" as const,
    }));
    const manyFrames = Array.from({ length: 60 }, (_, i) => ({
      filename: `f${i}.ts`,
      function: "fn",
      lineno: i,
      in_app: true,
    }));
    await transport.sendEvent({
      event_id: "e",
      timestamp: new Date().toISOString(),
      level: "error",
      message: longMessage,
      platform: "javascript",
      sdk: { name: "x", version: "1" },
      contexts: { tags: {}, extra: {} },
      breadcrumbs: manyBreadcrumbs,
      exception: {
        values: [{ type: "Error", value: "x", stacktrace: { frames: manyFrames } }],
      },
    });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.message).toHaveLength(1000);
    expect(body.message.endsWith("...")).toBe(true);
    expect(body.breadcrumbs).toHaveLength(100);
    expect(body.exception.values[0].stacktrace.frames).toHaveLength(50);
  });

  it("flush is no-op", () => {
    const transport = new HttpTransport("https://h.example.com/p1");
    expect(() => transport.flush()).not.toThrow();
  });
});
