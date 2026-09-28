import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failure is non-fatal; the app still works online.
    });
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    // Run queries/mutations even when the browser reports offline, and fail
    // fast: offline data operations must land in the visible "Brak połączenia"
    // error state (SPEC issue 08), not hang pending in TanStack's paused queue.
    queries: { retry: false, networkMode: "always" },
    mutations: { networkMode: "always" },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
