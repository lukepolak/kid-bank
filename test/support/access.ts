/**
 * Craft an Access JWT for tests. The identity module validates claims
 * (exp/iss/aud), not signatures — signatures are Cloudflare's concern at the
 * edge — so a dummy signature is fine here.
 */
export function makeAccessJwt(claims: {
  email: string;
  iss?: string;
  aud?: string;
  exp?: number;
}): string {
  const testTeam = "https://test-team.cloudflareaccess.com";
  const defaults = {
    iss: testTeam,
    aud: "test-audience-tag",
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1h in the future
  };
  const payload = { ...defaults, ...claims };
  const header = { alg: "RS256", typ: "JWT" };
  return [header, payload].map(encodePart).join(".") + ".dummy-signature";
}

function encodePart(value: unknown): string {
  const json = JSON.stringify(value);
  const base64 = btoa(String.fromCharCode(...new TextEncoder().encode(json)));
  return base64.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
