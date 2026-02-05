/**
 * Next.js 13+ instrumentation: runs once when the Node server starts.
 * Use this to init @xrayradar/node for server-side error capture.
 *
 * In your project, create instrumentation.ts (or .js) at the project root (same level as app/)
 * and call registerServerInstrumentation() from there, or init @xrayradar/node directly:
 *
 *   import { init } from "@xrayradar/node";
 *   export async function register() {
 *     if (process.env.NEXT_RUNTIME === "nodejs") {
 *       init({ dsn: process.env.XRAYRADAR_DSN, authToken: process.env.XRAYRADAR_AUTH_TOKEN });
 *     }
 *   }
 */
export async function registerServerInstrumentation(options?: {
  dsn?: string;
  authToken?: string;
  environment?: string;
  release?: string;
}): Promise<void> {
  if (typeof process === "undefined" || process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  const { init } = await import("@xrayradar/node");
  init({
    dsn: options?.dsn ?? process.env.XRAYRADAR_DSN,
    authToken: options?.authToken ?? process.env.XRAYRADAR_AUTH_TOKEN,
    environment: options?.environment ?? process.env.XRAYRADAR_ENVIRONMENT,
    release: options?.release ?? process.env.XRAYRADAR_RELEASE,
  });
}
