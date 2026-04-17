import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import "./index.css";
import "./styles/chat-animations.css";

const sentryDsn = import.meta.env.VITE_SENTRY_DSN?.trim();
const sentrySampleRate = Number(
  import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? "0.1",
);

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    release: import.meta.env.VITE_APP_RELEASE || undefined,
    tracesSampleRate: Number.isFinite(sentrySampleRate) ? sentrySampleRate : 0.1,
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
