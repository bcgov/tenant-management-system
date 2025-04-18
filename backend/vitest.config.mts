import { defineConfig } from "vitest/config";
import swc from "unplugin-swc";

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    include: ["**/*.e2e-spec.ts", "**/*.spec.ts"],
    exclude: ["**/node_modules/**"],
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["lcov", "text-summary", "text", "json", "html"],
    },
  },
  plugins: [swc.vite()],
});
