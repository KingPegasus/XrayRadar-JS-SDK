import { describe, it, expect } from "vitest";
import { BrowserClient } from "../client.js";

describe("browser integrations: history", () => {
  it("adds navigation breadcrumbs on pushState", () => {
    const client = new BrowserClient({
      debug: false,
      transport: { sendEvent: () => {} },
      integrations: { history: true },
    });

    history.pushState({}, "", "/test-path");

    const crumbs = client.scope.getBreadcrumbs();
    expect(crumbs.length).toBeGreaterThan(0);
    expect(crumbs[crumbs.length - 1].type).toBe("navigation");
    expect(crumbs[crumbs.length - 1].message).toMatch(/pushState/);
  });

  it("adds navigation breadcrumbs on replaceState", () => {
    const client = new BrowserClient({
      debug: false,
      transport: { sendEvent: () => {} },
      integrations: { history: true },
    });

    history.replaceState({}, "", "/replace-path");

    const crumbs = client.scope.getBreadcrumbs();
    expect(crumbs.length).toBeGreaterThan(0);
    expect(crumbs[crumbs.length - 1].type).toBe("navigation");
    expect(crumbs[crumbs.length - 1].message).toMatch(/replaceState/);
  });

  it("adds navigation breadcrumb on popstate", () => {
    const client = new BrowserClient({
      debug: false,
      transport: { sendEvent: () => {} },
      integrations: { history: true },
    });

    window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));

    const crumbs = client.scope.getBreadcrumbs();
    expect(crumbs.length).toBeGreaterThan(0);
    expect(crumbs[crumbs.length - 1].type).toBe("navigation");
    expect(crumbs[crumbs.length - 1].message).toMatch(/popstate/);
  });
});

