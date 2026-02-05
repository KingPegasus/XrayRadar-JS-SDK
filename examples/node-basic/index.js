/**
 * Basic usage example for @xrayradar/node
 *
 * Run from repo root after: npm run build
 * Then: cd examples/node-basic && npm install && npm start
 *
 * Set XRAYRADAR_DSN and XRAYRADAR_AUTH_TOKEN, or leave unset for debug (events printed to console).
 */

import {
  init,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  setTag,
  setExtra,
  getClient,
} from "@xrayradar/node";

const dsn = process.env.XRAYRADAR_DSN || "https://your-server.com/your_project_id";
const authToken = process.env.XRAYRADAR_AUTH_TOKEN || "";

init({
  dsn,
  authToken,
  environment: process.env.XRAYRADAR_ENVIRONMENT || "development",
  release: process.env.XRAYRADAR_RELEASE || "1.0.0",
  debug: !authToken,
});

const client = getClient();
if (!client) {
  console.error("XrayRadar client not initialized");
  process.exit(1);
}

console.log("XrayRadar Node.js basic example");
console.log("================================\n");

// 1. Capture an exception
console.log("1. Capturing an exception:");
try {
  const _ = 1 / 0;
} catch (e) {
  const eventId = captureException(e);
  console.log(`   Exception captured, event_id: ${eventId ?? "(debug)"}`);
}

// 2. Capture a message
console.log("\n2. Capturing a message:");
const msgId = captureMessage("User login failed", { level: "warning" });
console.log(`   Message captured, event_id: ${msgId ?? "(debug)"}`);

// 3. Set user context
console.log("\n3. Setting user context:");
setUser({ id: "123", email: "user@example.com", username: "johndoe" });
console.log("   User context set");

// 4. Tags and extra
console.log("\n4. Adding tags and extra:");
setTag("feature", "checkout");
setTag("locale", "en-US");
setExtra("cart_value", 99.99);
setExtra("payment_method", "credit_card");
console.log("   Tags and extra set");

// 5. Breadcrumbs
console.log("\n5. Adding breadcrumbs:");
addBreadcrumb("User clicked checkout", { category: "user", level: "info" });
addBreadcrumb("Payment processing started", { category: "payment", level: "info" });
console.log("   Breadcrumbs added");

// 6. Capture exception with context (breadcrumbs and user will be attached)
console.log("\n6. Capturing exception with context:");
try {
  throw new Error("Payment gateway timeout");
} catch (e) {
  const eventId = captureException(e, { message: "Payment failed" });
  console.log(`   Exception with context captured, event_id: ${eventId ?? "(debug)"}`);
}

// 7. Different levels
console.log("\n7. Different levels:");
captureMessage("Debug message", { level: "debug" });
captureMessage("Info message", { level: "info" });
captureMessage("Warning message", { level: "warning" });
captureMessage("Error message", { level: "error" });
console.log("   Messages sent");

console.log("\n================================\n");
console.log("Done. With a real DSN and token, events are sent to XrayRadar.");
console.log("With no token, events are printed in debug mode.");
