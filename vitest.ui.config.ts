import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Seam 2: component tests. DOM environment, no Workers runtime —
// components are tested as pure UI, with server behavior injected via props.
export default defineConfig({
  plugins: [react()],
  test: {
    include: ["test/ui/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    setupFiles: ["./test/ui/setup.ts"],
  },
});
