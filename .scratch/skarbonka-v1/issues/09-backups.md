# 09 — Backups: weekly D1 export

Status: ready-for-human

## Parent

[Skarbonka v1 SPEC](../SPEC.md)

## What to build

Protect years of kids' money history beyond the 7-day D1 Time Travel window (which is
automatic and free, and covers "bad migration / accidental deletion" only). The agent
part: a weekly scheduled GitHub Actions workflow that runs a database export of the
production D1 database and commits the dated SQL dump to the private repo — the dump is a
few hundred KB even after years, so versioning it in the repo is cheap and survives losing
the entire Cloudflare account. Also support a manual run for on-demand backups. The human
part: create the Cloudflare API token with D1 read access and add it as the repository
secret the workflow needs; verify the first run by reading the commit.

## Acceptance criteria

- [x] A weekly scheduled GitHub Actions workflow exports the production D1 database and commits a dated SQL dump to the repo (Mondays 04:17 UTC)
- [x] The workflow can also be triggered manually on demand (workflow_dispatch)
- [x] The workflow runs as part of the repo's CI configuration with the token stored as a repository secret (never in code)
- [x] D1 Time Travel (7-day point-in-time recovery) is available on the production database (automatic on D1 free plan)
- [x] First run verified end-to-end: the dump exists in the repo and contains the expected data

## Blocked by

- [01 — Walking skeleton](01-walking-skeleton.md)

## Comments

- Status: done. First manual run produced backups/skarbonka-2026-09-28.sql
  (2.3 KB — schema + live data) committed by the workflow bot. Lesson: the API
  token needs D1 **Edit** (export takes a brief DB lock), not just Read.
- Security notes: repo is private; token has a single narrow permission; secrets
  never touch the code. GitHub Actions schedule jitter can delay the weekly run
  by some minutes — acceptable for a weekly backup.
