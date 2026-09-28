import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

// Declare the Worker's main module so `exports` (Cloudflare.Exports) is fully
// typed — this is the runtime's documented extension point.
declare global {
  namespace Cloudflare {
    interface GlobalProps {
      mainModule: typeof import("../src/worker");
    }
  }
}

describe("GET /api/ping", () => {
  it("answers with the app identity and a live D1 connection", async () => {
    const res = await exports.default.fetch(
      new Request("https://example.com/api/ping"),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      app: "Skarbonka",
      status: "ok",
      database: "connected",
    });
  });
});
