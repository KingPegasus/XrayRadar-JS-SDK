import { describe, it, expect, vi, afterEach } from "vitest";
import { BrowserClient } from "../client.js";

class MockXHR {
  static listeners: Record<string, Array<() => void>> = {};
  status = 0;
  __xrayradar_xhr?: { method: string; url: string; started: number };

  open(_method: string, _url: string) {
    // patched by integration
  }

  addEventListener(name: string, cb: () => void) {
    MockXHR.listeners[name] ??= [];
    MockXHR.listeners[name].push(cb);
  }

  send() {
    // patched by integration; our "native" send should simulate completion.
    this.status = 500;
    for (const cb of MockXHR.listeners["loadend"] ?? []) cb();
    MockXHR.listeners = {};
  }
}

describe("browser integrations: xhr", () => {
  const OrigXHR = (globalThis as any).XMLHttpRequest;

  afterEach(() => {
    (globalThis as any).XMLHttpRequest = OrigXHR;
  });

  it("adds breadcrumbs and captures error status when enabled", () => {
    (globalThis as any).XMLHttpRequest = MockXHR;
    const sent: any[] = [];

    const client = new BrowserClient({
      debug: false,
      transport: { sendEvent: (e) => sent.push(e) },
      integrations: { xhr: { breadcrumbs: true, captureErrors: true } },
    });

    const xhr = new (globalThis as any).XMLHttpRequest();
    xhr.open("GET", "https://example.com/api/xhr");
    xhr.send();

    const crumbs = client.scope.getBreadcrumbs();
    expect(crumbs.length).toBe(1);
    expect(crumbs[0].type).toBe("http");
    expect(crumbs[0].category).toBe("xhr");
    expect(sent.length).toBe(1);
    expect(sent[0].contexts?.extra?.http_status).toBe(500);
  });
});

