import { init } from "@xrayradar/node";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    init({
      dsn: process.env.XRAYRADAR_DSN || "https://xrayradar.com/your_project_id",
      authToken: process.env.XRAYRADAR_AUTH_TOKEN,
      environment: process.env.XRAYRADAR_ENVIRONMENT || "development",
      release: process.env.XRAYRADAR_RELEASE,
      debug: !process.env.XRAYRADAR_AUTH_TOKEN,
    });
  }
}
