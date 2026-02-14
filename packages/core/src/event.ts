import type {
  EventPayload,
  EventContexts,
  BreadcrumbData,
  Level,
  EventException,
  StackFrame,
} from "./types.js";
import { getSdkInfo } from "./sdk.js";
import type { Scope } from "./scope.js";

const LEVELS: Level[] = ["fatal", "error", "warning", "info", "debug"];

function parseStack(err: Error): StackFrame[] {
  const stack = err.stack;
  if (!stack) return [];

  const lines = stack.split("\n").slice(1);
  const frames: StackFrame[] = [];

  // Simple regex for Chrome/Node: "    at fn (file:line:col)" or "    at file:line:col"
  const re = new RegExp(
    "^\\s*at (?:(.+?) \\()?(?:(.+?):(\\d+):(\\d+))\\)?$|^\\s*at (.+?):(\\d+):(\\d+)$"
  );
  for (const line of lines) {
    const m = line.match(re);
    if (!m) continue;
    let functionName = "?";
    let filename = "";
    let lineno = 0;
    let colno: number | undefined;
    if (m[1] !== undefined && m[2] !== undefined) {
      functionName = m[1].trim();
      filename = m[2];
      lineno = parseInt(m[3] ?? "0", 10) || 0;
      colno = parseInt(m[4] ?? "0", 10) || undefined;
    } else if (m[2] !== undefined) {
      // "at file:line:col" (first alternative matched, no function name)
      functionName = "?";
      filename = m[2];
      lineno = parseInt(m[3] ?? "0", 10) || 0;
      colno = parseInt(m[4] ?? "0", 10) || undefined;
    } else if (m[5] !== undefined) {
      filename = m[5];
      lineno = parseInt(m[6] ?? "0", 10) || 0;
      colno = parseInt(m[7] ?? "0", 10) || undefined;
    }
    const isInApp =
      !filename.includes("node_modules") &&
      !filename.includes("<anonymous>") &&
      !/^internal\//.test(filename);
    frames.push({
      filename,
      function: functionName,
      lineno,
      colno,
      abs_path: filename,
      in_app: isInApp,
    });
  }
  return frames.reverse();
}

/**
 * Build event payload from an Error. Server can compute fingerprint if not provided.
 */
export function eventFromException(
  error: Error,
  level: Level,
  message?: string,
  scope?: Scope
): EventPayload {
  const frames = parseStack(error);
  const exception: EventException = {
    values: [
      {
        type: error.name,
        value: error.message,
        stacktrace: { frames },
      },
    ],
  };
  const contexts: EventContexts = scope?.getContext() ?? { tags: {}, extra: {} };
  const breadcrumbs: BreadcrumbData[] = scope?.getBreadcrumbs() ?? [];

  const payload: EventPayload = {
    event_id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    level,
    message: message ?? `${error.name}: ${error.message}`,
    platform: "javascript",
    sdk: getSdkInfo(),
    contexts,
    breadcrumbs,
    exception,
    fingerprint: [error.name, error.message, frames[0]?.function].filter(
      (x): x is string => typeof x === "string" && x.length > 0
    ),
  };
  return payload;
}

/**
 * Build event payload from a message (no exception).
 */
export function eventFromMessage(
  message: string,
  level: Level,
  scope?: Scope
): EventPayload {
  const contexts: EventContexts = scope?.getContext() ?? { tags: {}, extra: {} };
  const breadcrumbs: BreadcrumbData[] = scope?.getBreadcrumbs() ?? [];

  return {
    event_id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    level,
    message,
    platform: "javascript",
    sdk: getSdkInfo(),
    contexts,
    breadcrumbs,
    fingerprint: [message],
  };
}

/**
 * Check if level string is valid.
 */
export function normalizeLevel(level: string): Level {
  const lower = level.toLowerCase();
  if (LEVELS.includes(lower as Level)) return lower as Level;
  return "error";
}

/**
 * Apply sampleRate: return true if event should be sent (random < sampleRate).
 */
export function shouldSample(sampleRate: number): boolean {
  if (sampleRate >= 1) return true;
  if (sampleRate <= 0) return false;
  return Math.random() < sampleRate;
}
