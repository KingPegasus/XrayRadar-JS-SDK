import { describe, it, expect } from "vitest";
import { parseDsn } from "./dsn.js";

describe("parseDsn", () => {
  it("parses https DSN with path", () => {
    const out = parseDsn("https://xrayradar.com/123");
    expect(out.serverUrl).toBe("https://xrayradar.com");
    expect(out.projectId).toBe("123");
  });

  it("parses http DSN with port", () => {
    const out = parseDsn("http://localhost:8001/99");
    expect(out.serverUrl).toBe("http://localhost:8001");
    expect(out.projectId).toBe("99");
  });

  it("uses last path segment as project id", () => {
    const out = parseDsn("https://host.com/org/project_abc");
    expect(out.serverUrl).toBe("https://host.com");
    expect(out.projectId).toBe("project_abc");
  });

  it("throws on invalid URL", () => {
    expect(() => parseDsn("not-a-url")).toThrow(/Invalid DSN format/);
  });

  it("throws when protocol or host missing", () => {
    expect(() => parseDsn("file:///path")).toThrow(/Invalid DSN format/);
  });

  it("throws on empty path", () => {
    expect(() => parseDsn("https://host.com/")).toThrow(/Missing project ID/);
  });
});
