import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        // Test values for the Access identity anchors, and an explicit
        // neutralization of the .dev.vars bypass (see src/worker/identity.ts).
        bindings: {
          ACCESS_TEAM_DOMAIN: "https://test-team.cloudflareaccess.com",
          ACCESS_AUD: "test-audience-tag",
          ACCESS_DEV_BYPASS_EMAIL: "",
        },
      },
    }),
  ],
  test: {
    include: ["test/**/*.test.ts"],
  },
});
