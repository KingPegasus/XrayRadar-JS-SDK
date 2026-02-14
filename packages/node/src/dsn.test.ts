import { describe, it, expect } from "vitest";
import { parseDsn } from "./dsn.js";

describe("parseDsn", () => {
  it("parses valid DSN and returns serverUrl and projectId", () => {
    const out = parseDsn("https://xrayradar.com/my_project_id");
    expect(out.serverUrl).toBe("https://xrayradar.com");
    expect(out.projectId).toBe("my_project_id");
  });

  it("handles DSN with trailing slashes and path", () => {
    const out = parseDsn("https://host.example.com:8080/foo/bar/project_123");
    expect(out.serverUrl).toBe("https://host.example.com:8080");
    expect(out.projectId).toBe("project_123");
  });

  it("throws on invalid URL", () => {
    expect(() => parseDsn("not-a-url")).toThrow(/Invalid DSN format/);
  });

  it("throws when protocol or host missing", () => {
    expect(() => parseDsn("file:///path")).toThrow(/Invalid DSN format/);
  });

  it("throws when project ID is missing", () => {
    expect(() => parseDsn("https://host.com/")).toThrow(/Missing project ID/);
  });
});
