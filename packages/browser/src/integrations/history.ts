import type { BrowserClient } from "../client.js";
import type { BrowserIntegrationHistoryOptions } from "@xrayradar/core";
import { asOptions, safeUrl, type Uninstall } from "./utils.js";

export function instrumentHistory(
  client: BrowserClient,
  opt: boolean | BrowserIntegrationHistoryOptions | undefined
): Uninstall {
  const options = asOptions(opt, { breadcrumbs: true });
  if (!options) return () => {};
  if (typeof window === "undefined" || typeof history === "undefined") return () => {};

  const origPush = history.pushState;
  const origReplace = history.replaceState;

  const crumb = (to: string, from: string, op: string) => {
    if (!options.breadcrumbs) return;
    client.addBreadcrumb(`${op}: ${from} → ${to}`, {
      type: "navigation",
      category: "navigation",
      level: "info",
      data: { from, to, op },
    });
  };

  const getLoc = () => safeUrl(window.location.href);

  history.pushState = function (this: History, ...args: any[]) {
    const from = getLoc();
    const res = origPush.apply(this, args as any);
    const to = getLoc();
    if (to !== from) crumb(to, from, "pushState");
    return res;
  } as any;

  history.replaceState = function (this: History, ...args: any[]) {
    const from = getLoc();
    const res = origReplace.apply(this, args as any);
    const to = getLoc();
    if (to !== from) crumb(to, from, "replaceState");
    return res;
  } as any;

  const onPop = () => {
    // popstate fires after URL changes
    client.addBreadcrumb(`popstate: ${getLoc()}`, {
      type: "navigation",
      category: "navigation",
      level: "info",
      data: { to: getLoc(), op: "popstate" },
    });
  };
  window.addEventListener("popstate", onPop);

  return () => {
    history.pushState = origPush;
    history.replaceState = origReplace;
    window.removeEventListener("popstate", onPop);
  };
}

