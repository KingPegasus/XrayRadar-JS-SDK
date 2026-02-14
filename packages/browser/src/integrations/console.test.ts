import { describe, it, expect } from "vitest";
import { BrowserClient } from "../client.js";

describe("browser integrations: console", () => {
  it("adds console breadcrumbs", () => {
    const spy = (console as any).warn;
    (console as any).warn = () => {};
    const client = new BrowserClient({
      debug: false,
      transport: { sendEvent: () => {} },
      integrations: { console: true },
    });

    console.warn("hello", { a: 1 });

    const crumbs = client.scope.getBreadcrumbs();
    expect(crumbs.length).toBeGreaterThan(0);
    expect(crumbs[crumbs.length - 1].type).toBe("console");
    expect(crumbs[crumbs.length - 1].message).toMatch(/hello/);
    (console as any).warn = spy;
  });
});

