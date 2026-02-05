import type { EventPayload, Transport } from "@xrayradar/core";
import { getSdkInfo } from "@xrayradar/core";
import { parseDsn } from "./dsn.js";

const MAX_PAYLOAD_SIZE = 100 * 1024;

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
    const fromGlobal =
      typeof globalThis !== "undefined"
        ? (globalThis as unknown as { XRAYRADAR_AUTH_TOKEN?: string }).XRAYRADAR_AUTH_TOKEN
        : undefined;
    this.authToken =
      (typeof fromGlobal === "string" ? fromGlobal : options?.authToken) ?? "";
    this.timeout = options?.timeout ?? 10_000;
  }

  sendEvent(event: EventPayload): void {
    const payload = JSON.stringify(event);
    if (new Blob([payload]).size > MAX_PAYLOAD_SIZE) {
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
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeout);
    fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(event),
      signal: controller.signal,
      keepalive: true,
    })
      .then((res) => {
        clearTimeout(id);
        if (res.status === 429) {
          console.warn("[XrayRadar] Rate limited by server.");
          return;
        }
        if (!res.ok) {
          res.text().then((t) => console.warn("[XrayRadar] Send failed:", res.status, t.slice(0, 200)));
        }
      })
      .catch((err) => {
        clearTimeout(id);
        console.warn("[XrayRadar] Send failed:", err);
      });
  }

  flush(): void {}

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
