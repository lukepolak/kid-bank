import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { makeAccessJwt } from "./support/access";

// Declare the Worker's main module so `exports` (Cloudflare.Exports) is fully
// typed — this is the runtime's documented extension point.
declare global {
  namespace Cloudflare {
    interface GlobalProps {
      mainModule: typeof import("../../src/worker");
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

interface Entry {
  id: string;
  amountGrosze: number;
  description: string | null;
  createdBy: string;
  createdAt: string;
}

async function createKid(jwt: string, name: string): Promise<{ id: string }> {
  const res = await exports.default.fetch(
    authedJsonRequest("POST", "/api/kids", jwt, { name }),
  );
  expect(res.status).toBe(201);
  return (await res.json()) as { id: string };
}

async function addEntry(
  jwt: string,
  kidId: string,
  input: { amountGrosze: number; description?: string },
): Promise<{ entry: Entry; balanceGrosze: number; overdraft: boolean }> {
  const res = await exports.default.fetch(
    authedJsonRequest("POST", `/api/accounts/${kidId}/entries`, jwt, input),
  );
  expect(res.status).toBe(201);
  return (await res.json()) as {
    entry: Entry;
    balanceGrosze: number;
    overdraft: boolean;
  };
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

  it("records an entry with attribution and returns the new balance", async () => {
    const jwt = makeAccessJwt({ email: PARENT_EMAIL });
    const kid = await createKid(jwt, "Zosia");

    const res = await exports.default.fetch(
      authedJsonRequest(
        "POST",
        `/api/accounts/${kid.id}/entries`,
        jwt,
        { amountGrosze: 10000, description: "Prezent urodzinowy" },
      ),
    );

    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      entry: Entry;
      balanceGrosze: number;
      overdraft: boolean;
    };
    expect(body.entry.amountGrosze).toBe(10000);
    expect(body.entry.description).toBe("Prezent urodzinowy");
    expect(body.entry.createdBy).toBe(PARENT_EMAIL);
    expect(typeof body.entry.createdAt).toBe("string");
    expect(body.balanceGrosze).toBe(10000);
    expect(body.overdraft).toBe(false);
  });

  it("lists an account's history newest first, and the home list reflects it", async () => {
    const jwt = makeAccessJwt({ email: PARENT_EMAIL });
    const kid = await createKid(jwt, "Historia");

    for (const [amount, description] of [
      [5000, "Kieszonkowe"],
      [-2000, "LEGO z karetką"],
    ] as const) {
      const res = await exports.default.fetch(
        authedJsonRequest(
          "POST",
          `/api/accounts/${kid.id}/entries`,
          jwt,
          { amountGrosze: amount, description },
        ),
      );
      expect(res.status).toBe(201);
    }

    const history = await exports.default.fetch(
      authedRequest(`/api/accounts/${kid.id}/entries`, jwt),
    );
    expect(history.status).toBe(200);
    const entryList = (await history.json()) as Entry[];
    expect(entryList).toHaveLength(2);
    // Newest first: LEGO was recorded after Kieszonkowe.
    expect(entryList[0]?.description).toBe("LEGO z karetką");
    expect(entryList[1]?.description).toBe("Kieszonkowe");

    const accountsRes = await exports.default.fetch(
      authedRequest("/api/accounts", jwt),
    );
    const accounts = (await accountsRes.json()) as Account[];
    const account = accounts.find((a) => a.id === kid.id);
    expect(account?.balanceGrosze).toBe(3000);
    expect(account?.overdraft).toBe(false);
  });

  it.each([
    ["non-integer grosze", 100.5],
    ["zero amount", 0],
    ["out-of-range amount", 2_000_000],
  ] as const)("rejects an entry with a %s", async (_name, amountGrosze) => {
    const jwt = makeAccessJwt({ email: PARENT_EMAIL });
    const kid = await createKid(jwt, "Walidacja");

    const res = await exports.default.fetch(
      authedJsonRequest("POST", `/api/accounts/${kid.id}/entries`, jwt, {
        amountGrosze,
        description: "Test",
      }),
    );

    expect(res.status).toBe(400);
  });

  it("returns 404 when adding an entry to an unknown kid", async () => {
    const jwt = makeAccessJwt({ email: PARENT_EMAIL });
    const res = await exports.default.fetch(
      authedJsonRequest(
        "POST",
        "/api/accounts/nie-ma-takiego/entries",
        jwt,
        { amountGrosze: 1000 },
      ),
    );

    expect(res.status).toBe(404);
  });

  it("allows spending past zero: balance goes negative, overdraft flag flips, entry accepted", async () => {
    const jwt = makeAccessJwt({ email: PARENT_EMAIL });
    const kid = await createKid(jwt, "Minus");

    const first = await exports.default.fetch(
      authedJsonRequest("POST", `/api/accounts/${kid.id}/entries`, jwt, {
        amountGrosze: 1000,
      }),
    );
    expect(first.status).toBe(201);

    const second = await exports.default.fetch(
      authedJsonRequest("POST", `/api/accounts/${kid.id}/entries`, jwt, {
        amountGrosze: -3000,
        description: "LEGO za dużo",
      }),
    );
    expect(second.status).toBe(201); // reality has overdrafts; never block
    const body = (await second.json()) as {
      balanceGrosze: number;
      overdraft: boolean;
    };
    expect(body.balanceGrosze).toBe(-2000);
    expect(body.overdraft).toBe(true);

    const accounts = (await (
      await exports.default.fetch(authedRequest("/api/accounts", jwt))
    ).json()) as Account[];
    expect(accounts.find((a) => a.id === kid.id)?.overdraft).toBe(true);
  });

  it("edits an entry: amount and description change, balance follows, created_at preserved", async () => {
    const jwt = makeAccessJwt({ email: PARENT_EMAIL });
    const kid = await createKid(jwt, "Edycja");
    const created = await addEntry(jwt, kid.id, {
      amountGrosze: 10000,
      description: "Kieszonkowe",
    });

    const res = await exports.default.fetch(
      authedJsonRequest("PATCH", `/api/entries/${created.entry.id}`, jwt, {
        amountGrosze: 1000,
        description: "Kieszonkowe (mniej)",
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      entry: Entry;
      balanceGrosze: number;
      overdraft: boolean;
    };
    expect(body.entry.amountGrosze).toBe(1000);
    expect(body.entry.description).toBe("Kieszonkowe (mniej)");
    // ADR 0001: the entry keeps its original creation timestamp.
    expect(body.entry.createdAt).toBe(created.entry.createdAt);
    expect(body.balanceGrosze).toBe(1000);

    const accounts = (await (
      await exports.default.fetch(authedRequest("/api/accounts", jwt))
    ).json()) as Account[];
    expect(accounts.find((a) => a.id === kid.id)?.balanceGrosze).toBe(1000);
  });

  it("soft-deletes an entry: gone from history and balance, but the row survives (ADR 0001)", async () => {
    const jwt = makeAccessJwt({ email: PARENT_EMAIL });
    const kid = await createKid(jwt, "Usuwanko");
    const { entry } = await addEntry(jwt, kid.id, { amountGrosze: 10000 });

    const res = await exports.default.fetch(
      authedJsonRequest("DELETE", `/api/entries/${entry.id}`, jwt),
    );
    expect(res.status).toBe(204);

    // Gone from the account's history…
    const history = (await (
      await exports.default.fetch(
        authedRequest(`/api/accounts/${kid.id}/entries`, jwt),
      )
    ).json()) as Entry[];
    expect(history).toHaveLength(0);

    // …and from the balance.
    const accounts = (await (
      await exports.default.fetch(authedRequest("/api/accounts", jwt))
    ).json()) as Account[];
    expect(accounts.find((a) => a.id === kid.id)?.balanceGrosze).toBe(0);

    // No HTTP endpoint exposes deleted entries (by design), so this one
    // assertion goes around the seam — deliberately — to pin ADR 0001's
    // invariant that soft-deleted rows are never physically removed.
    const { env } = await import("cloudflare:workers");
    const row = await env.DB.prepare(
      "SELECT deleted_at FROM entries WHERE id = ?",
    )
      .bind(entry.id)
      .first<{ deleted_at: number }>();
    expect(row).not.toBeNull();
    expect(row?.deleted_at).not.toBeNull();
  });

  it("returns 404 when deleting an unknown or already-deleted entry", async () => {
    const jwt = makeAccessJwt({ email: PARENT_EMAIL });
    const kid = await createKid(jwt, "Usuwanko2");
    const { entry } = await addEntry(jwt, kid.id, { amountGrosze: 100 });

    await exports.default.fetch(
      authedJsonRequest("DELETE", `/api/entries/${entry.id}`, jwt),
    );

    const res = await exports.default.fetch(
      authedJsonRequest("DELETE", `/api/entries/${entry.id}`, jwt),
    );
    expect(res.status).toBe(404);

    const unknown = await exports.default.fetch(
      authedJsonRequest("DELETE", "/api/entries/nie-ma-takiego", jwt),
    );
    expect(unknown.status).toBe(404);
  });

  it("renames a kid; the new name appears everywhere", async () => {
    const jwt = makeAccessJwt({ email: PARENT_EMAIL });
    const kid = await createKid(jwt, "StareImie");
    await addEntry(jwt, kid.id, { amountGrosze: 500 });

    const res = await exports.default.fetch(
      authedJsonRequest("PATCH", `/api/kids/${kid.id}`, jwt, {
        name: "NoweImie",
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as Account;
    expect(body.name).toBe("NoweImie");

    const accounts = (await (
      await exports.default.fetch(authedRequest("/api/accounts", jwt))
    ).json()) as Account[];
    const account = accounts.find((a) => a.id === kid.id);
    expect(account?.name).toBe("NoweImie");
    // History and balance are untouched by a rename.
    expect(account?.balanceGrosze).toBe(500);
  });

  it("archives and unarchives a kid; history and balance survive", async () => {
    const jwt = makeAccessJwt({ email: PARENT_EMAIL });
    const kid = await createKid(jwt, "DoArchiwum");
    await addEntry(jwt, kid.id, { amountGrosze: 2500, description: "Kieszonkowe" });

    const archive = await exports.default.fetch(
      authedJsonRequest("PATCH", `/api/kids/${kid.id}`, jwt, {
        archived: true,
      }),
    );
    expect(archive.status).toBe(200);
    expect(((await archive.json()) as Account).archived).toBe(true);

    // The accounts list still carries the kid (flagged), with balance intact.
    let accounts = (await (
      await exports.default.fetch(authedRequest("/api/accounts", jwt))
    ).json()) as Account[];
    expect(accounts.find((a) => a.id === kid.id)?.archived).toBe(true);
    expect(accounts.find((a) => a.id === kid.id)?.balanceGrosze).toBe(2500);

    // History is preserved while archived.
    const history = (await (
      await exports.default.fetch(
        authedRequest(`/api/accounts/${kid.id}/entries`, jwt),
      )
    ).json()) as Entry[];
    expect(history).toHaveLength(1);

    const unarchive = await exports.default.fetch(
      authedJsonRequest("PATCH", `/api/kids/${kid.id}`, jwt, {
        archived: false,
      }),
    );
    expect(unarchive.status).toBe(200);
    expect(((await unarchive.json()) as Account).archived).toBe(false);

    accounts = (await (
      await exports.default.fetch(authedRequest("/api/accounts", jwt))
    ).json()) as Account[];
    expect(accounts.find((a) => a.id === kid.id)?.archived).toBe(false);
  });

  it("cannot delete a kid — no such endpoint exists", async () => {
    const jwt = makeAccessJwt({ email: PARENT_EMAIL });
    const kid = await createKid(jwt, "Nieusuwalny");

    const res = await exports.default.fetch(
      authedJsonRequest("DELETE", `/api/kids/${kid.id}`, jwt),
    );
    expect(res.status).toBe(404);
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
    const names = accounts.map((a) => a.name);

    expect(names.indexOf("Antek")).toBeLessThan(names.indexOf("Zosia"));
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
