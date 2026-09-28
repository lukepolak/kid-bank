/**
 * Access identity — the one Cloudflare-specific auth seam (SPEC issue 02).
 *
 * Cloudflare Access sits in front of the whole app and injects the signed-in
 * parent's identity as a JWT in the `Cf-Access-Jwt-Assertion` header. This
 * module hides how identity is extracted: header parsing, JWT decoding, claim
 * validation, and the local-dev bypass. Routes only see a parent email.
 *
 * We validate the token's claims (expiry, issuer, audience) but not its
 * cryptographic signature: the signature is Cloudflare's own, enforced at the
 * edge by Access itself, and this app's only ingress is the Access-protected
 * hostname. Claims checks are the defense against stale or cross-application
 * tokens. (If the app ever grows another ingress or kid-facing access, add
 * signature verification against the team's JWKS before relaxing anything.)
 */

export interface AccessClaims {
  email: string;
  iss?: string;
  aud?: string;
  exp?: number;
}

/** Extract the parent's email from an Access JWT, or null if unusable. */
export function extractParentEmail(
  jwt: string | undefined,
  env: Env,
): string | null {
  // Local development convenience: a configured bypass email stands in for
  // the real Access login. Set via .dev.vars only — never in production.
  if (env.ACCESS_DEV_BYPASS_EMAIL) return env.ACCESS_DEV_BYPASS_EMAIL;

  if (!jwt) return null;

  const claims = decodeJwtClaims(jwt);
  if (!claims?.email) return null;

  // Fail closed: the app's Access anchors (team domain + audience tag) must
  // be configured, or the app is not wired to Access at all — reject everyone.
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== "number" || claims.exp <= now) return null;
  if (claims.iss !== env.ACCESS_TEAM_DOMAIN) return null;
  if (claims.aud !== env.ACCESS_AUD) return null;

  return claims.email;
}

function decodeJwtClaims(jwt: string): AccessClaims | null {
  const payload = jwt.split(".")[1];
  if (!payload) return null;
  try {
    const base64 = payload.replaceAll("-", "+").replaceAll("_", "/");
    const json = atob(base64);
    const claims = JSON.parse(json) as AccessClaims;
    return typeof claims.email === "string" ? claims : null;
  } catch {
    return null;
  }
}
