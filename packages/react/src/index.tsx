export { ErrorBoundary } from "./ErrorBoundary";
export type { ErrorBoundaryProps } from "./ErrorBoundary";
export { XrayRadarProvider, useXrayRadar } from "./provider";
export type { XrayRadarProviderProps } from "./provider";

export {
  init,
  getClient,
  resetGlobal,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  setTag,
  setExtra,
  setContext,
} from "@xrayradar/browser";
export type { BrowserClient } from "@xrayradar/browser";
