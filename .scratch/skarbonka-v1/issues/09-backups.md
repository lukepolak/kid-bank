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

- [ ] A weekly scheduled GitHub Actions workflow exports the production D1 database and commits a dated SQL dump to the repo
- [ ] The workflow can also be triggered manually on demand
- [ ] The workflow runs as part of the repo's CI configuration with the token stored as a repository secret (never in code)
- [ ] D1 Time Travel (7-day point-in-time recovery) is confirmed available on the production database
- [ ] First run verified end-to-end by a human: the dump exists in the repo and contains the expected data

## Blocked by

- [01 — Walking skeleton](01-walking-skeleton.md)
