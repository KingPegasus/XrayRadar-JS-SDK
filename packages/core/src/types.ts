/**
 * Event severity levels (aligned with server and Python SDK).
 */
export type Level = "fatal" | "error" | "warning" | "info" | "debug";

/**
 * Breadcrumb type hint.
 */
export type BreadcrumbType =
  | "default"
  | "http"
  | "navigation"
  | "ui"
  | "console"
  | "error"
  | "query"
  | "user";

export interface BreadcrumbData {
  timestamp: string; // ISO
  message: string;
  category?: string;
  level?: Level;
  data?: Record<string, unknown>;
  type?: BreadcrumbType;
}

export interface UserContext {
  id?: string;
  username?: string;
  email?: string;
  ip_address?: string;
  data?: Record<string, unknown>;
}

export interface RequestContext {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  query_string?: string;
  data?: string;
  env?: Record<string, string>;
}

export interface EventContexts {
  user?: UserContext | null;
  request?: RequestContext | null;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  server_name?: string;
  release?: string;
  environment?: string;
}

export interface StackFrame {
  filename: string;
  function: string;
  lineno: number;
  colno?: number;
  abs_path?: string;
  context_line?: string;
  pre_context?: string[];
  post_context?: string[];
  in_app?: boolean;
}

export interface ExceptionValue {
  type: string;
  value: string;
  module?: string;
  stacktrace?: { frames: StackFrame[] };
}

export interface EventException {
  values: ExceptionValue[];
}

/**
 * Event payload sent to POST /api/{project_id}/store/
 */
export interface EventPayload {
  event_id: string;
  timestamp: string; // ISO
  level: Level;
  message: string;
  platform: string;
  sdk: { name: string; version: string };
  contexts: EventContexts;
  breadcrumbs: BreadcrumbData[];
  fingerprint?: string[];
  exception?: EventException;
  modules?: Record<string, string>;
}

export interface Transport {
  sendEvent(event: EventPayload): void | Promise<void>;
  flush?(timeout?: number): void | Promise<void>;
  close?(): void | Promise<void>;
}

export interface ClientOptions {
  dsn?: string;
  authToken?: string;
  debug?: boolean;
  environment?: string;
  release?: string;
  serverName?: string;
  sampleRate?: number;
  maxBreadcrumbs?: number;
  beforeSend?: (event: EventPayload) => EventPayload | null | Promise<EventPayload | null>;
  transport?: Transport;
}
