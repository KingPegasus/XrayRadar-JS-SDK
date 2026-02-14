import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HttpTransport } from "./transport.js";

describe("HttpTransport", () => {
  const minimalPayload = {
    event_id: "test-id",
    timestamp: new Date().toISOString(),
    level: "error" as const,
    message: "test",
    platform: "javascript",
    sdk: { name: "xrayradar.javascript", version: "0.1.0" },
    contexts: {},
    breadcrumbs: [],
  };

  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    globalThis.fetch = fetchMock as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("POSTs to correct URL from DSN", () => {
    const transport = new HttpTransport("https://example.com/42", { authToken: "secret" });
    transport.sendEvent(minimalPayload);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("https://example.com/api/42/store/");
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
  });

  it("sends Content-Type and X-Xrayradar-Token when token provided", () => {
    const transport = new HttpTransport("https://example.com/1", { authToken: "my-token" });
    transport.sendEvent(minimalPayload);

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["X-Xrayradar-Token"]).toBe("my-token");
    expect(headers["User-Agent"]).toMatch(/^xrayradar\//);
  });

  it("sends event body as JSON", () => {
    const transport = new HttpTransport("https://example.com/1", { authToken: "x" });
    transport.sendEvent(minimalPayload);

    const body = fetchMock.mock.calls[0][1].body;
    const parsed = JSON.parse(body);
    expect(parsed.event_id).toBe("test-id");
    expect(parsed.level).toBe("error");
    expect(parsed.message).toBe("test");
    expect(parsed.platform).toBe("javascript");
  });

  it("truncates oversized payload (message, breadcrumbs, frames)", () => {
    const transport = new HttpTransport("https://example.com/1", { authToken: "x" });
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
    transport.sendEvent({
      ...minimalPayload,
      message: longMessage,
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

  it("handles 429 without throwing (logs warning)", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 429 }));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const transport = new HttpTransport("https://example.com/1");
    transport.sendEvent(minimalPayload);
    await vi.waitFor(() => fetchMock.mock.results.length > 0);
    expect(warn).toHaveBeenCalledWith("[XrayRadar] Rate limited by server.");
    warn.mockRestore();
  });

  it("handles non-OK response (logs warning)", async () => {
    const stubFetch = vi.fn().mockResolvedValue(new Response("Bad request", { status: 400 }));
    vi.stubGlobal("fetch", stubFetch);
    try {
      const transport = new HttpTransport("https://example.com/1");
      transport.sendEvent(minimalPayload);
      await vi.waitFor(() => stubFetch.mock.results.length > 0);
      expect(stubFetch).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("handles fetch rejection (logs warning)", async () => {
    const stubFetch = vi.fn().mockRejectedValue(new Error("network error"));
    vi.stubGlobal("fetch", stubFetch);
    try {
      const transport = new HttpTransport("https://example.com/1");
      transport.sendEvent(minimalPayload);
      await vi.waitFor(() => stubFetch.mock.results.length > 0);
      expect(stubFetch).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("sends without auth header when authToken empty", () => {
    const transport = new HttpTransport("https://example.com/1");
    transport.sendEvent(minimalPayload);
    const call = fetchMock.mock.calls[0][1];
    expect(call.headers["X-Xrayradar-Token"]).toBeUndefined();
  });
});
