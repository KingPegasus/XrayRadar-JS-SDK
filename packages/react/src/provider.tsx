import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getClient, type BrowserClient } from "@xrayradar/browser";

const XrayRadarContext = createContext<BrowserClient | null>(null);

export interface XrayRadarProviderProps {
  children: ReactNode;
  client?: BrowserClient | null;
}

/**
 * Optional provider to expose the client via useXrayRadar().
 * If client is not provided, useXrayRadar() returns getClient() (global).
 */
export function XrayRadarProvider({ children, client }: XrayRadarProviderProps): ReactNode {
  const value = useMemo(() => client ?? getClient(), [client]);
  return (
    <XrayRadarContext.Provider value={value}>{children}</XrayRadarContext.Provider>
  );
}

export function useXrayRadar(): BrowserClient | null {
  const context = useContext(XrayRadarContext);
  return context ?? getClient();
}
