import { defineConfig } from "vitest/config";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

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
    setupFiles: ["dotenv/config"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
