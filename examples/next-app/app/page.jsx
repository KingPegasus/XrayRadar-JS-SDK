"use client";

import { useState } from "react";
import { captureException, captureMessage, addBreadcrumb } from "@xrayradar/react";

export default function Home() {
  const [clicked, setClicked] = useState(false);

  const triggerError = () => {
    addBreadcrumb("User clicked Trigger error", { category: "ui", level: "info" });
    setClicked(true);
    captureException(new Error("Example error from Next.js app"));
  };

  const sendMessage = () => {
    captureMessage("Button 'Send message' clicked", { level: "info" });
    alert("Message sent (check console in debug mode or your XrayRadar project).");
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "40rem" }}>
      <h1>XrayRadar Next.js example</h1>
      <p>
        Server: <code>instrumentation.ts</code> initializes @xrayradar/node. Client: this layout
        initializes @xrayradar/react and wraps the app in ErrorBoundary.
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button type="button" onClick={triggerError}>
          Trigger error (caught by ErrorBoundary)
        </button>
        <button type="button" onClick={sendMessage}>
          Send message
        </button>
      </div>
      {clicked && (
        <p style={{ marginTop: "1rem", color: "#666" }}>
          An error was thrown and captured by the ErrorBoundary.
        </p>
      )}
    </div>
  );
}
