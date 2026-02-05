import type { EventPayload, Transport } from "@xrayradar/core";
import { getSdkInfo } from "@xrayradar/core";
import { parseDsn } from "./dsn.js";

const MAX_PAYLOAD_SIZE = 100 * 1024; // 100KB

export class HttpTransport implements Transport {
  private serverUrl: string;
  private projectId: string;
  private authToken: string;
  private timeout: number;

  constructor(
    dsn: string,
    options?: { authToken?: string; timeout?: number }
  ) {
    const { serverUrl, projectId } = parseDsn(dsn);
    this.serverUrl = serverUrl;
    this.projectId = projectId;
    this.authToken =
      options?.authToken ?? process.env["XRAYRADAR_AUTH_TOKEN"] ?? "";
    this.timeout = options?.timeout ?? 10_000;
  }

  async sendEvent(event: EventPayload): Promise<void> {
    const payload = JSON.stringify(event);
    if (Buffer.byteLength(payload, "utf8") > MAX_PAYLOAD_SIZE) {
      event = this.truncatePayload(event);
    }
    const url = `${this.serverUrl}/api/${this.projectId}/store/`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": `xrayradar/${getSdkInfo().version}`,
    };
    if (this.authToken) {
      headers["X-Xrayradar-Token"] = this.authToken;
    }
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(this.timeout),
    });
    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After") ?? "60";
      throw new Error(
        `Rate limited by XrayRadar server. Retry after ${retryAfter} seconds.`
      );
    }
    if (!res.ok) {
      const text = await res.text();
      const detail = text.slice(0, 200);
      throw new Error(
        `Failed to send event to XrayRadar: HTTP ${res.status}${detail ? ` - ${detail}` : ""}`
      );
    }
  }

  flush(): void {
    // HTTP sends immediately; no-op
  }

  private truncatePayload(event: EventPayload): EventPayload {
    const out = { ...event };
    if (out.message && out.message.length > 1000) {
      out.message = out.message.slice(0, 997) + "...";
    }
    if (out.breadcrumbs && out.breadcrumbs.length > 100) {
      out.breadcrumbs = out.breadcrumbs.slice(-100);
    }
    if (out.exception?.values) {
      for (const v of out.exception.values) {
        if (v.stacktrace?.frames && v.stacktrace.frames.length > 50) {
          v.stacktrace.frames = v.stacktrace.frames.slice(0, 50);
        }
      }
    }
    return out;
  }
}
