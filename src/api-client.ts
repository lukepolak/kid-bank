import { hc } from "hono/client";
// Type-only import: erased at build, no worker code reaches the client bundle.
import type { AppType } from "./worker";

export const api = hc<AppType>("/api");
