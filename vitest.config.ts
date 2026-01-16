import { defineConfig } from "vitest/config";
import path from "path";
import dotenvFlow from "dotenv-flow";

// Load environment variables based on NODE_ENV
dotenvFlow.config();

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.{test,spec}.{js,ts}"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    env: {
      NODE_ENV: "test",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
