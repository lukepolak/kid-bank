import { hc, type InferResponseType } from "hono/client";
// Type-only import: erased at build, no worker code reaches the client bundle.
import type { AppType } from "./worker";

// Typed RPC client: routes validate via zod, and their response types are
// inferred from them — no hand-written API shapes anywhere in the app.
export const api = hc<AppType>("/api", {
  // Cloudflare Access returns 401 (instead of a redirect to the login page)
  // for XHR requests carrying this header when the session has expired.
  headers: { "X-Requested-With": "XMLHttpRequest" },
});

// API-derived types — the compiler owns the contract with the server.
// The 200 filter narrows past each route's 404 error branch.
export type Account = InferResponseType<typeof api.accounts.$get, 200>[number];
export type Entry =
  InferResponseType<
    (typeof api.accounts)[":kidId"]["entries"]["$get"],
    200
  >[number];
