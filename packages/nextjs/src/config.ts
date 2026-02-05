/**
 * Optional wrapper for next.config.js to integrate XrayRadar.
 * Usage: const nextConfig = withXrayRadarConfig(yourExistingConfig);
 */
export function withXrayRadarConfig<T extends Record<string, unknown>>(nextConfig: T): T {
  return nextConfig;
}
