import * as Sentry from "@sentry/react";

// if (["prod","staging"].includes(import.meta.env.VITE_STAGE)) {
if (["prod"].includes(import.meta.env.VITE_STAGE)) {
  Sentry.init({
    dsn: "https://7e5c1355b63245718ef89682a7eb49b9@o1081176.ingest.sentry.io/4505417410347008",
    integrations: [
      new Sentry.BrowserTracing({
        // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
        tracePropagationTargets: ["localhost"], //, /^https:\/\/yourserver\.io\/api/],
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
  })
}