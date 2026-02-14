import { describe, it, expect } from "vitest";
import { Scope } from "./scope.js";

describe("Scope", () => {
  it("adds and returns breadcrumbs", () => {
    const scope = new Scope();
    scope.maxBreadcrumbs = 5;
    scope.addBreadcrumb("a");
    scope.addBreadcrumb("b");
    expect(scope.getBreadcrumbs()).toHaveLength(2);
    expect(scope.getBreadcrumbs()[0].message).toBe("a");
    scope.clearBreadcrumbs();
    expect(scope.getBreadcrumbs()).toHaveLength(0);
  });

  it("caps breadcrumbs at maxBreadcrumbs", () => {
    const scope = new Scope();
    scope.maxBreadcrumbs = 2;
    scope.addBreadcrumb("1");
    scope.addBreadcrumb("2");
    scope.addBreadcrumb("3");
    const crumbs = scope.getBreadcrumbs();
    expect(crumbs).toHaveLength(2);
    expect(crumbs[0].message).toBe("2");
    expect(crumbs[1].message).toBe("3");
  });

  it("setUser and getContext", () => {
    const scope = new Scope();
    scope.setUser({ id: "1", email: "a@b.com" });
    const ctx = scope.getContext();
    expect(ctx.user?.id).toBe("1");
    expect(ctx.user?.email).toBe("a@b.com");
    scope.setUser(null);
    expect(scope.getContext().user).toBeUndefined();
  });

  it("setTag and setExtra", () => {
    const scope = new Scope();
    scope.setTag("k", "v");
    scope.setExtra("x", 42);
    const ctx = scope.getContext();
    expect(ctx.tags?.k).toBe("v");
    expect(ctx.extra?.x).toBe(42);
  });

  it("setRequest", () => {
    const scope = new Scope();
    scope.setRequest({ method: "GET", url: "/api" });
    const ctx = scope.getContext();
    expect(ctx.request?.method).toBe("GET");
    expect(ctx.request?.url).toBe("/api");
    scope.setRequest(null);
    expect(scope.getContext().request).toBeUndefined();
  });

  it("setContext with user, request, and other keys", () => {
    const scope = new Scope();
    scope.setContext("user", { id: "u1", email: "u@x.com" });
    scope.setContext("request", { method: "POST", url: "/submit" });
    scope.setContext("custom", { foo: "bar" });
    const ctx = scope.getContext();
    expect(ctx.user?.id).toBe("u1");
    expect(ctx.request?.method).toBe("POST");
    expect(ctx.extra?.custom).toEqual({ foo: "bar" });
  });

  it("clone copies context, breadcrumbs with all options", () => {
    const scope = new Scope();
    scope.setUser({ id: "1" });
    scope.setTag("t", "v");
    scope.addBreadcrumb("crumb", {
      category: "cat",
      level: "info",
      data: { k: 1 },
      type: "http",
      timestamp: "2020-01-01T00:00:00.000Z",
    });
    const cloned = scope.clone();
    const ctx = cloned.getContext();
    expect(ctx.user?.id).toBe("1");
    expect(ctx.tags?.t).toBe("v");
    const crumbs = cloned.getBreadcrumbs();
    expect(crumbs).toHaveLength(1);
    expect(crumbs[0]).toMatchObject({
      message: "crumb",
      category: "cat",
      level: "info",
      data: { k: 1 },
      type: "http",
      timestamp: "2020-01-01T00:00:00.000Z",
    });
  });
});
