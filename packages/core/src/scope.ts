import type { BreadcrumbData, EventContexts, Level, UserContext, RequestContext } from "./types.js";

const DEFAULT_MAX_BREADCRUMBS = 100;

export class Scope {
  private _breadcrumbs: BreadcrumbData[] = [];
  private _context: EventContexts = {
    tags: {},
    extra: {},
  };
  maxBreadcrumbs: number = DEFAULT_MAX_BREADCRUMBS;

  addBreadcrumb(
    message: string,
    options?: {
      category?: string;
      level?: Level;
      data?: Record<string, unknown>;
      type?: string;
      timestamp?: string;
    }
  ): void {
    const crumb: BreadcrumbData = {
      timestamp: options?.timestamp ?? new Date().toISOString(),
      message,
      category: options?.category,
      level: options?.level,
      data: options?.data ?? {},
      type: (options?.type as BreadcrumbData["type"]) ?? "default",
    };
    this._breadcrumbs.push(crumb);
    if (this._breadcrumbs.length > this.maxBreadcrumbs) {
      this._breadcrumbs = this._breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  clearBreadcrumbs(): void {
    this._breadcrumbs = [];
  }

  getBreadcrumbs(): BreadcrumbData[] {
    return [...this._breadcrumbs];
  }

  setUser(user: UserContext | null): void {
    this._context.user = user ?? undefined;
  }

  setTag(key: string, value: string): void {
    if (!this._context.tags) this._context.tags = {};
    this._context.tags[key] = value;
  }

  setExtra(key: string, value: unknown): void {
    if (!this._context.extra) this._context.extra = {};
    this._context.extra[key] = value;
  }

  setRequest(request: RequestContext | null): void {
    this._context.request = request ?? undefined;
  }

  setContext(key: string, data: Record<string, unknown>): void {
    if (key === "user") {
      this._context.user = data as UserContext;
    } else if (key === "request") {
      this._context.request = data as RequestContext;
    } else {
      if (!this._context.extra) this._context.extra = {};
      this._context.extra[key] = data;
    }
  }

  getContext(): EventContexts {
    return { ...this._context };
  }

  applyToContext(overrides: Partial<EventContexts>): void {
    if (overrides.user !== undefined) this._context.user = overrides.user;
    if (overrides.request !== undefined) this._context.request = overrides.request;
    if (overrides.tags) this._context.tags = { ...this._context.tags, ...overrides.tags };
    if (overrides.extra) this._context.extra = { ...this._context.extra, ...overrides.extra };
    if (overrides.server_name !== undefined) this._context.server_name = overrides.server_name;
    if (overrides.release !== undefined) this._context.release = overrides.release;
    if (overrides.environment !== undefined) this._context.environment = overrides.environment;
  }
}
