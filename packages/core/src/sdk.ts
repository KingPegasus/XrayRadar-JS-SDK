export const SDK_NAME = "xrayradar.javascript";
export const SDK_VERSION = "0.1.0";

export function getSdkInfo(): { name: string; version: string } {
  return { name: SDK_NAME, version: SDK_VERSION };
}
