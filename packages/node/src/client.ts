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

let globalClient: NodeClient | null = null;

export class NodeClient {
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
  private _originalUncaughtException: NodeJS.UncaughtExceptionListener | null = null;
  private _originalUnhandledRejection: ((reason: unknown, promise: Promise<unknown>) => void) | null = null;

  constructor(options: ClientOptions = {}) {
    this.scope = new Scope();
    this.scope.maxBreadcrumbs = options.maxBreadcrumbs ?? 100;
    this._enabled = Boolean(options.dsn || options.transport || options.debug);
    this._transport =
      options.transport ??
      (options.dsn ? new HttpTransport(options.dsn, { authToken: options.authToken }) : { sendEvent: () => {} });
    this.options = {
      dsn: options.dsn ?? "",
      authToken: options.authToken ?? "",
      debug: options.debug ?? false,
      environment: options.environment ?? process.env["XRAYRADAR_ENVIRONMENT"] ?? "development",
      release: options.release ?? process.env["XRAYRADAR_RELEASE"] ?? "",
      serverName: options.serverName ?? process.env["XRAYRADAR_SERVER_NAME"] ?? "",
      sampleRate: Math.max(0, Math.min(1, options.sampleRate ?? 1)),
      maxBreadcrumbs: options.maxBreadcrumbs ?? 100,
      beforeSend: options.beforeSend ?? ((e: EventPayload) => e),
      transport: this._transport,
    };
    this.scope.applyToContext({
      environment: this.options.environment,
      release: this.options.release,
      server_name: this.options.serverName || undefined,
    });
    if (this._enabled && this.options.dsn && !options.transport) {
      this._installGlobalHandlers();
    }
  }

  init(options?: ClientOptions): this {
    if (options?.dsn) this.options.dsn = options.dsn;
    if (options?.authToken !== undefined) this.options.authToken = options.authToken;
    if (options?.environment !== undefined) {
      this.options.environment = options.environment;
      this.scope.applyToContext({ environment: options.environment });
    }
    if (options?.release !== undefined) {
      this.options.release = options.release;
      this.scope.applyToContext({ release: options.release });
    }
    if (options?.serverName !== undefined) {
      this.options.serverName = options.serverName;
      this.scope.applyToContext({ server_name: options.serverName });
    }
    if (options?.sampleRate !== undefined) this.options.sampleRate = Math.max(0, Math.min(1, options.sampleRate));
    if (options?.maxBreadcrumbs !== undefined) {
      this.options.maxBreadcrumbs = options.maxBreadcrumbs;
      this.scope.maxBreadcrumbs = options.maxBreadcrumbs;
    }
    if (options?.beforeSend !== undefined) this.options.beforeSend = options.beforeSend;
    return this;
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
      const p = this._transport.sendEvent(resolved);
      if (p && typeof (p as Promise<unknown>).catch === "function") {
        (p as Promise<void>).catch(() => {});
      }
    };
    if (after instanceof Promise) {
      after.then((res) => res !== null && applyAndSend(res));
      return null;
    }
    payload = after;
    if (this.options.debug) console.warn("[XrayRadar]", payload);
    const p = this._transport.sendEvent(payload);
    if (p && typeof (p as Promise<unknown>).catch === "function") {
      (p as Promise<void>).catch(() => {});
    }
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
      const p = this._transport.sendEvent(resolved);
      if (p && typeof (p as Promise<unknown>).catch === "function") {
        (p as Promise<void>).catch(() => {});
      }
    };
    if (after instanceof Promise) {
      after.then((res) => res !== null && applyAndSend(res));
      return null;
    }
    payload = after;
    if (this.options.debug) console.warn("[XrayRadar]", payload);
    const p = this._transport.sendEvent(payload);
    if (p && typeof (p as Promise<unknown>).catch === "function") {
      (p as Promise<void>).catch(() => {});
    }
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
    this._originalUncaughtException = process.listeners("uncaughtException").pop() ?? null;
    this._originalUnhandledRejection = process.listeners("unhandledRejection").pop() ?? null;
    process.on("uncaughtException", (err: Error, origin: NodeJS.UncaughtExceptionOrigin) => {
      this.captureException(err);
      if (this._originalUncaughtException) this._originalUncaughtException(err, origin);
      else process.exit(1);
    });
    process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>) => {
      const err = reason instanceof Error ? reason : new Error(String(reason));
      this.captureException(err);
      if (this._originalUnhandledRejection) this._originalUnhandledRejection(reason, promise);
    });
  }

  private _removeGlobalHandlers(): void {
    process.removeAllListeners("uncaughtException");
    process.removeAllListeners("unhandledRejection");
    if (this._originalUncaughtException) process.on("uncaughtException", this._originalUncaughtException);
    if (this._originalUnhandledRejection) process.on("unhandledRejection", this._originalUnhandledRejection);
  }
}

export function init(options?: ClientOptions): NodeClient {
  const client = new NodeClient(options);
  globalClient = client;
  return client;
}

export function getClient(): NodeClient | null {
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
