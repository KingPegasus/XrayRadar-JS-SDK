"use client";

import { init, ErrorBoundary } from "@xrayradar/react";

const dsn =
  process.env.NEXT_PUBLIC_XRAYRADAR_DSN || "https://your-server.com/your_project_id";
const authToken = process.env.NEXT_PUBLIC_XRAYRADAR_AUTH_TOKEN || "";

if (typeof window !== "undefined") {
  init({
    dsn,
    authToken,
    environment: process.env.NEXT_PUBLIC_XRAYRADAR_ENVIRONMENT || "development",
    debug: !authToken,
  });
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary
          fallback={({ error, reset }) => (
            <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
              <h2>Something went wrong</h2>
              <pre style={{ background: "#f5f5f5", padding: "0.5rem" }}>{error.message}</pre>
              <button type="button" onClick={reset}>
                Try again
              </button>
            </div>
          )}
        >
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
