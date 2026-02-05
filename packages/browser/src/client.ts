import {
  Scope,
  eventFromException,
  eventFromMessage,
  shouldSample,
  normalizeLevel,
  type ClientOptions,
  type EventPayload,
  type Level,
  type Transport,
} from "@xrayradar/core";
import { HttpTransport } from "./transport.js";

declare let globalThis: { XRAYRADAR_AUTH_TOKEN?: string };

let globalClient: BrowserClient | null = null;

export class BrowserClient {
  readonly scope: Scope;
  readonly options: Required<
    Pick<
      ClientOptions,
      | "dsn"
      | "authToken"
      | "debug"
      | "environment"
      | "release"
      | "serverName"
      | "sampleRate"
      | "maxBreadcrumbs"
      | "beforeSend"
    >
  > & { transport: Transport };
  private _transport: Transport;
  private _enabled: boolean;
  private _onError: ((event: ErrorEvent) => void) | null = null;
  private _onUnhandledRejection: ((event: PromiseRejectionEvent) => void) | null = null;

  constructor(options: ClientOptions = {}) {
    this.scope = new Scope();
    this.scope.maxBreadcrumbs = options.maxBreadcrumbs ?? 100;
    this._enabled = Boolean(options.dsn || options.transport || options.debug);
    this._transport =
      options.transport ??
      (options.dsn ? new HttpTransport(options.dsn, { authToken: options.authToken }) : { sendEvent: () => {} });
    const authToken =
      options.authToken ??
      (typeof globalThis !== "undefined" ? globalThis.XRAYRADAR_AUTH_TOKEN : "") ??
      "";
    this.options = {
      dsn: options.dsn ?? "",
      authToken: typeof authToken === "string" ? authToken : "",
      debug: options.debug ?? false,
      environment: options.environment ?? "development",
      release: options.release ?? "",
      serverName: options.serverName ?? "",
      sampleRate: Math.max(0, Math.min(1, options.sampleRate ?? 1)),
      maxBreadcrumbs: options.maxBreadcrumbs ?? 100,
      beforeSend: options.beforeSend ?? ((e: EventPayload) => e),
      transport: this._transport,
    };
    this.scope.applyToContext({
      environment: this.options.environment,
      release: this.options.release,
      server_name: this.options.serverName,
    });
    if (this._enabled && this.options.dsn && !options.transport) {
      this._installGlobalHandlers();
    }
  }

  captureException(
    error: Error,
    options?: { level?: Level; message?: string }
  ): string | null {
    if (!this._enabled) return null;
    if (!shouldSample(this.options.sampleRate)) return null;
    const level = options?.level ?? "error";
    let payload = eventFromException(
      error,
      level,
      options?.message,
      this.scope
    );
    const after = this.options.beforeSend(payload);
    if (after === null) return null;
    const applyAndSend = (resolved: EventPayload) => {
      if (this.options.debug) console.warn("[XrayRadar]", resolved);
      this._transport.sendEvent(resolved);
    };
    if (after instanceof Promise) {
      after.then((res) => res !== null && applyAndSend(res));
      return null;
    }
    payload = after;
    if (this.options.debug) console.warn("[XrayRadar]", payload);
    this._transport.sendEvent(payload);
    return payload.event_id;
  }

  captureMessage(
    message: string,
    options?: { level?: Level }
  ): string | null {
    if (!this._enabled) return null;
    if (!shouldSample(this.options.sampleRate)) return null;
    const level = normalizeLevel(options?.level ?? "error");
    let payload = eventFromMessage(message, level, this.scope);
    const after = this.options.beforeSend(payload);
    if (after === null) return null;
    const applyAndSend = (resolved: EventPayload) => {
      if (this.options.debug) console.warn("[XrayRadar]", resolved);
      this._transport.sendEvent(resolved);
    };
    if (after instanceof Promise) {
      after.then((res) => res !== null && applyAndSend(res));
      return null;
    }
    payload = after;
    if (this.options.debug) console.warn("[XrayRadar]", payload);
    this._transport.sendEvent(payload);
    return payload.event_id;
  }

  addBreadcrumb(
    message: string,
    options?: { category?: string; level?: Level; data?: Record<string, unknown>; type?: string }
  ): void {
    if (!this._enabled) return;
    this.scope.addBreadcrumb(message, options);
  }

  clearBreadcrumbs(): void {
    this.scope.clearBreadcrumbs();
  }

  setUser(user: { id?: string; username?: string; email?: string; [key: string]: unknown } | null): void {
    if (!this._enabled) return;
    this.scope.setUser(user);
  }

  setTag(key: string, value: string): void {
    if (!this._enabled) return;
    this.scope.setTag(key, value);
  }

  setExtra(key: string, value: unknown): void {
    if (!this._enabled) return;
    this.scope.setExtra(key, value);
  }

  setContext(key: string, data: Record<string, unknown>): void {
    if (!this._enabled) return;
    this.scope.setContext(key, data);
  }

  flush(): void {
    if (this._transport.flush) this._transport.flush();
  }

  close(): void {
    this.flush();
    if (this._transport.close) this._transport.close();
    this._removeGlobalHandlers();
  }

  private _installGlobalHandlers(): void {
    this._onError = (event: ErrorEvent) => {
      const err = event.error ?? new Error(event.message ?? "Unknown error");
      this.captureException(err instanceof Error ? err : new Error(String(err)));
    };
    this._onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const err = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      this.captureException(err);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("error", this._onError);
      window.addEventListener("unhandledrejection", this._onUnhandledRejection);
    }
  }

  private _removeGlobalHandlers(): void {
    if (typeof window !== "undefined" && this._onError && this._onUnhandledRejection) {
      window.removeEventListener("error", this._onError);
      window.removeEventListener("unhandledrejection", this._onUnhandledRejection);
    }
  }
}

export function init(options?: ClientOptions): BrowserClient {
  const client = new BrowserClient(options);
  globalClient = client;
  return client;
}

export function getClient(): BrowserClient | null {
  return globalClient;
}

export function resetGlobal(): void {
  if (globalClient) {
    globalClient.close();
    globalClient = null;
  }
}

export function captureException(
  error: Error,
  options?: { level?: Level; message?: string }
): string | null {
  const client = getClient();
  return client ? client.captureException(error, options) : null;
}

export function captureMessage(
  message: string,
  options?: { level?: Level }
): string | null {
  const client = getClient();
  return client ? client.captureMessage(message, options) : null;
}

export function addBreadcrumb(
  message: string,
  options?: { category?: string; level?: Level; data?: Record<string, unknown>; type?: string }
): void {
  getClient()?.addBreadcrumb(message, options);
}

export function setUser(user: { id?: string; username?: string; email?: string; [key: string]: unknown } | null): void {
  getClient()?.setUser(user);
}

export function setTag(key: string, value: string): void {
  getClient()?.setTag(key, value);
}

export function setExtra(key: string, value: unknown): void {
  getClient()?.setExtra(key, value);
}

export function setContext(key: string, data: Record<string, unknown>): void {
  getClient()?.setContext(key, data);
}
