import path from "node:path";
import { fileURLToPath } from "node:url";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [
    cloudflareTest(async () => {
      // Real migrations, applied to the test D1 by the setup file —
      // tests run against the actual schema, never mocks.
      const migrations = await readD1Migrations(path.join(root, "migrations"));

      return {
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            // Test values for the Access identity anchors, and an explicit
            // neutralization of the .dev.vars bypass (see src/worker/identity.ts).
            ACCESS_TEAM_DOMAIN: "https://test-team.cloudflareaccess.com",
            ACCESS_AUD: "test-audience-tag",
            ACCESS_DEV_BYPASS_EMAIL: "",
          },
        },
      };
    }),
  ],
  test: {
    include: ["test/**/*.test.ts"],
    setupFiles: ["./test/apply-migrations.ts"],
  },
});
