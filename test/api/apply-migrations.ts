import type { D1Migration } from "@cloudflare/vitest-plugin";
import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";

declare global {
  namespace Cloudflare {
    interface Env {
      // Injected by vitest.config.ts (miniflare bindings); not in production.
      TEST_MIGRATIONS: D1Migration[];
    }
  }
}

// Runs in every test file's Workers runtime before tests: applies the real
// D1 migrations to that file's isolated test database.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
