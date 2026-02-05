import { describe, it, expect } from "vitest";
import {
  eventFromException,
  eventFromMessage,
  normalizeLevel,
  shouldSample,
} from "./event.js";
import { Scope } from "./scope.js";

describe("eventFromException", () => {
  it("builds payload with exception and stack", () => {
    const err = new Error("test");
    const payload = eventFromException(err, "error");
    expect(payload.event_id).toBeDefined();
    expect(payload.message).toBe("Error: test");
    expect(payload.level).toBe("error");
    expect(payload.exception?.values).toHaveLength(1);
    expect(payload.exception?.values[0].type).toBe("Error");
    expect(payload.exception?.values[0].value).toBe("test");
    expect(payload.fingerprint).toBeDefined();
    expect(payload.platform).toBe("javascript");
  });

  it("includes scope breadcrumbs and context", () => {
    const scope = new Scope();
    scope.addBreadcrumb("step");
    scope.setTag("env", "test");
    const payload = eventFromException(new Error("x"), "error", undefined, scope);
    expect(payload.breadcrumbs).toHaveLength(1);
    expect(payload.breadcrumbs[0].message).toBe("step");
    expect(payload.contexts.tags?.env).toBe("test");
  });
});

describe("eventFromMessage", () => {
  it("builds payload without exception", () => {
    const payload = eventFromMessage("hello", "warning");
    expect(payload.message).toBe("hello");
    expect(payload.level).toBe("warning");
    expect(payload.exception).toBeUndefined();
    expect(payload.fingerprint).toEqual(["hello"]);
  });
});

describe("normalizeLevel", () => {
  it("returns valid level", () => {
    expect(normalizeLevel("error")).toBe("error");
    expect(normalizeLevel("ERROR")).toBe("error");
    expect(normalizeLevel("invalid")).toBe("error");
  });
});

describe("shouldSample", () => {
  it("respects sample rate", () => {
    expect(shouldSample(1)).toBe(true);
    expect(shouldSample(0)).toBe(false);
    let hits = 0;
    for (let i = 0; i < 100; i++) {
      if (shouldSample(0.5)) hits++;
    }
    expect(hits).toBeGreaterThan(20);
    expect(hits).toBeLessThan(80);
  });
});
