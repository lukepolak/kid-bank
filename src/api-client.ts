import { hc } from "hono/client";
// Type-only import: erased at build, no worker code reaches the client bundle.
import type { AppType } from "./worker";

export const api = hc<AppType>("/api", {
  // Cloudflare Access returns 401 (instead of a redirect to the login page)
  // for XHR requests carrying this header when the session has expired.
  headers: { "X-Requested-With": "XMLHttpRequest" },
});
