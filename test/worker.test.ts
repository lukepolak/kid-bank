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

function authedJsonRequest(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  jwt: string,
  body?: unknown,
): Request {
  return new Request(`https://example.com${path}`, {
    method,
    headers: {
      "Cf-Access-Jwt-Assertion": jwt,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

interface Account {
  id: string;
  name: string;
  archived: boolean;
  balanceGrosze: number;
  overdraft: boolean;
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

  it("creates a kid and lists the account with a zero balance", async () => {
    const create = await exports.default.fetch(
      authedJsonRequest("POST", "/api/kids", makeAccessJwt({ email: PARENT_EMAIL }), {
        name: "Zosia",
      }),
    );
    expect(create.status).toBe(201);
    const kid = (await create.json()) as { id: string; name: string };
    expect(kid.name).toBe("Zosia");

    const list = await exports.default.fetch(
      authedRequest("/api/accounts", makeAccessJwt({ email: PARENT_EMAIL })),
    );
    expect(list.status).toBe(200);
    const accounts = (await list.json()) as Account[];
    const zosia = accounts.find((a) => a.id === kid.id);
    expect(zosia).toEqual({
      id: kid.id,
      name: "Zosia",
      archived: false,
      balanceGrosze: 0,
      overdraft: false,
    });
  });

  it("rejects a kid with an empty name with 400", async () => {
    const res = await exports.default.fetch(
      authedJsonRequest("POST", "/api/kids", makeAccessJwt({ email: PARENT_EMAIL }), {
        name: "   ",
      }),
    );

    expect(res.status).toBe(400);
  });

  it("lists accounts ordered by kid name", async () => {
    const jwt = makeAccessJwt({ email: PARENT_EMAIL });
    for (const name of ["Zosia", "Antek"]) {
      await exports.default.fetch(authedJsonRequest("POST", "/api/kids", jwt, { name }));
    }

    const res = await exports.default.fetch(authedRequest("/api/accounts", jwt));
    const accounts = (await res.json()) as Account[];

    expect(accounts.at(0)?.name).toBe("Antek");
    expect(accounts.at(1)?.name).toBe("Zosia");
  });

  it("accepts a real-shaped token whose aud is an array (Cloudflare sends arrays)", async () => {
    const res = await exports.default.fetch(
      authedRequest(
        "/api/ping",
        makeAccessJwt({ email: PARENT_EMAIL, aud: ["test-audience-tag"] }),
      ),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { parent: string };
    expect(body.parent).toBe(PARENT_EMAIL);
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
