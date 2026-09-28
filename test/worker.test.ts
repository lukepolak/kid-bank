import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { makeAccessJwt } from "./support/access";

// Declare the Worker's main module so `exports` (Cloudflare.Exports) is fully
// typed — this is the runtime's documented extension point.
declare global {
  namespace Cloudflare {
    interface GlobalProps {
      mainModule: typeof import("../src/worker");
    }
  }
}

const PARENT_EMAIL = "mama@example.com";

function authedRequest(path: string, jwt: string): Request {
  return new Request(`https://example.com${path}`, {
    headers: { "Cf-Access-Jwt-Assertion": jwt },
  });
}

describe("Access identity at the API seam", () => {
  it("rejects requests without Access identity with 401", async () => {
    const res = await exports.default.fetch(
      new Request("https://example.com/api/ping"),
    );

    expect(res.status).toBe(401);
  });

  it.each([
    ["expired token", { email: PARENT_EMAIL, exp: Math.floor(Date.now() / 1000) - 60 }],
    ["wrong issuer", { email: PARENT_EMAIL, iss: "https://evil.example.com" }],
    ["wrong audience", { email: PARENT_EMAIL, aud: "someone-elses-app" }],
  ] as const)("rejects %s with 401", async (_name, claims) => {
    const res = await exports.default.fetch(
      authedRequest("/api/ping", makeAccessJwt(claims)),
    );

    expect(res.status).toBe(401);
  });

  it("rejects a malformed JWT with 401", async () => {
    const res = await exports.default.fetch(
      authedRequest("/api/ping", "not-a-jwt"),
    );

    expect(res.status).toBe(401);
  });

  it("answers an authenticated ping", async () => {
    const res = await exports.default.fetch(
      authedRequest("/api/ping", makeAccessJwt({ email: PARENT_EMAIL })),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      app: "Skarbonka",
      status: "ok",
      database: "connected",
      parent: PARENT_EMAIL,
    });
  });
});
