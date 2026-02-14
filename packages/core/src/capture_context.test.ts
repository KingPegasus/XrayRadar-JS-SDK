import { describe, it, expect } from "vitest";
import { Scope } from "./scope.js";
import { eventFromMessage } from "./event.js";

describe("per-capture context helpers", () => {
  it("Scope.clone allows adding request context without mutating original", () => {
    const s1 = new Scope();
    s1.setTag("a", "1");

    const s2 = s1.clone();
    s2.setContext("request", { url: "/x", method: "GET" });

    expect(s1.getContext().request).toBeUndefined();
    expect(s2.getContext().request?.url).toBe("/x");

    const ev = eventFromMessage("hello", "info", s2);
    expect(ev.contexts.request?.url).toBe("/x");
  });
});

