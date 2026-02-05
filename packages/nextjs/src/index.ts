export { withXrayRadarConfig } from "./config.js";
export { registerServerInstrumentation } from "./instrumentation.js";

export {
  init as initBrowser,
  getClient as getBrowserClient,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  setTag,
  setExtra,
  setContext,
  ErrorBoundary,
  XrayRadarProvider,
  useXrayRadar,
} from "@xrayradar/react";
export { init as initNode, getClient as getNodeClient } from "@xrayradar/node";
