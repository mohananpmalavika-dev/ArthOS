import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.js"],
    css: true,
    include: ["test/**/*.test.{js,jsx,ts,tsx}", "src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    exclude: [
      "node_modules/",
      "test/arthos-flow-qa.spec.js",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "test/",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@engines": path.resolve(__dirname, "./src/engines"),
    },
  },
});
