import { useState } from "react";
import { captureException, captureMessage, addBreadcrumb } from "@xrayradar/react";

export default function App() {
  const [clicked, setClicked] = useState(false);

  const triggerError = () => {
    addBreadcrumb("User clicked Trigger error", { category: "ui", level: "info" });
    setClicked(true);
    captureException(new Error("Example error from Vite + React"));
  };

  const sendMessage = () => {
    captureMessage("Button 'Send message' clicked", { level: "info" });
    alert("Message sent (check console in debug mode or your XrayRadar project).");
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "40rem" }}>
      <h1>XrayRadar Vite + React example</h1>
      <p>
        Init and ErrorBoundary are set up in <code>main.jsx</code>. Use the buttons below to
        capture an exception or a message.
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
          An error was thrown and captured by the ErrorBoundary above.
        </p>
      )}
    </div>
  );
}
