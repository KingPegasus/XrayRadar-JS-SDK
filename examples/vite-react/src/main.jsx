import React from "react";
import ReactDOM from "react-dom/client";
import { init, captureException, ErrorBoundary } from "@xrayradar/react";
import App from "./App";

const dsn = import.meta.env.VITE_XRAYRADAR_DSN || "https://your-server.com/your_project_id";
const authToken = import.meta.env.VITE_XRAYRADAR_AUTH_TOKEN || "";

init({
  dsn,
  authToken,
  environment: import.meta.env.MODE || "development",
  debug: !authToken,
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
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
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
