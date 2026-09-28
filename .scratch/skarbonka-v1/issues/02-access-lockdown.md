# 02 — Access lock-down: Zero Trust + identity

Status: ready-for-human

## Parent

[Skarbonka v1 SPEC](../SPEC.md)

## What to build

Lock Skarbonka behind Cloudflare Access on the family's subdomain. Human part: set up the
Zero Trust organization, an Access application for the subdomain with Google as the
identity provider, a 1-month session duration, and an allow policy for exactly the two
parents' emails. Agent part: implement identity extraction in the Worker — read the
parent's email from the Access JWT in request headers (the `ctx.access` API is unavailable
for Workers with static assets), reject requests without valid Access identity with 401,
and configure local development to simulate an Access identity without going through the
real login flow. Every future write stamps entries with this identity (issue 04 depends on
it).

## Acceptance criteria

- [ ] Visiting the subdomain unauthenticated shows the Cloudflare Access login page
- [ ] Signing in with Google works for exactly the two allowed emails; anyone else is denied
- [ ] API requests without Access identity get 401; authenticated requests expose the parent's email to the API layer
- [ ] Session duration is 1 month (re-login roughly monthly)
- [ ] Local development simulates a parent identity via Wrangler config — no real Access login needed while coding
- [ ] Integration test at the primary seam: request without identity → 401; with simulated identity → 200 and the email is visible to the route
- [ ] The workers.dev URL from issue 01 is disabled or likewise protected, so the app has exactly one entrance

## Blocked by

- [01 — Walking skeleton](01-walking-skeleton.md)
