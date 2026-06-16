import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiDirectory = path.resolve(__dirname, "api_src");

/**
 * Files that handle ALL subpaths under their route.
 * These are "umbrella" handlers (apis/index.js style) that internally
 * parse the URL to dispatch to sub-handlers.
 */
const PREFIX_MATCH_FILES = new Set([
  "memory.js",
  "sync.js",
  "subscriptions-handler.js",
  "follow-up-handler.js",
  "reminders.js",
  "ai-coach-handler.js",
  "coach-handler.js",
]);

function normalizeSegment(segment) {
  if (segment.startsWith("[") && segment.endsWith("]")) {
    return `:${segment.slice(1, -1)}`;
  }
  return segment;
}

/**
 * Build a route string from directory segments + file.
 * Strips "-handler" suffixes so subscriptions-handler.js becomes /api/subscriptions.
 */
function buildRouteString(segments) {
  const normalized = segments.map((s) => {
    // Strip trailing "-handler" from any segment
    if (s.endsWith("-handler")) {
      return s.slice(0, -"-handler".length);
    }
    return s;
  });
  // Remove consecutive duplicates so that e.g.
  // ["api", "follow-up", "follow-up"] → ["api", "follow-up"] → "/api/follow-up"
  const deduped = normalized.filter((s, idx) => idx === 0 || s !== normalized[idx - 1]);
  return "/" + deduped.filter(Boolean).join("/");
}

function createRouteMatcher(route) {
  const paramNames = [];
  const regexString = route
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      if (segment.startsWith(":")) {
        paramNames.push(segment.slice(1));
        return "([^/]+)";
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  const regex = new RegExp(`^/${regexString}/?$`);
  return (pathname) => {
    const match = regex.exec(pathname);
    if (!match) return null;
    const params = {};
    paramNames.forEach((name, index) => {
      params[name] = decodeURIComponent(match[index + 1]);
    });
    return params;
  };
}

function createPrefixMatcher(route) {
  // strip trailing slash
  const prefix = route.replace(/\/+$/, "");
  return (pathname) => {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return {};
    }
    return null;
  };
}

function buildApiRoutes() {
  const routes = [];
  const walk = (dir, routePrefix = "/api") => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, `${routePrefix}/${entry.name}`);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".js")) continue;

      const fileBase = entry.name === "index.js" ? "" : entry.name.replace(/\.js$/, "");
      const segments = [...routePrefix.split("/").filter(Boolean)];
      if (fileBase) segments.push(fileBase);

      const route = buildRouteString(segments);

      // Use prefix matcher for umbrella handlers (match subpaths)
      // Use exact matcher for everything else
      const isPrefixMatch = PREFIX_MATCH_FILES.has(entry.name);
      const matcher = isPrefixMatch
        ? createPrefixMatcher(route)
        : createRouteMatcher(route);

      routes.push({ route, matcher, fullPath, isPrefixMatch });
    }
  };

  walk(apiDirectory);
  return routes;
}

async function loadApiHandlers(routes) {
  const handlers = [];
  for (const entry of routes) {
    try {
      const module = await import(pathToFileURL(entry.fullPath).href);
      if (typeof module.default !== "function") {
        continue;
      }
      handlers.push({
        route: entry.route,
        matcher: entry.matcher,
        handler: module.default,
        isPrefixMatch: entry.isPrefixMatch,
      });
    } catch (error) {
      // Skip modules that can't be loaded as handlers
      console.warn(`[vite-plugin-api] Skipping ${entry.route}: ${error.message}`);
      continue;
    }
  }
  return handlers;
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function createApiMiddleware(handlers) {
  return async (req, res, next) => {
    const url = new URL(req.url || "", "http://localhost");
    const pathname = url.pathname;
    const matched = handlers.find((entry) => entry.matcher(pathname));
    if (!matched) return next();

    req.query = Object.fromEntries(url.searchParams.entries());
    // For prefix matchers, set params to an empty object;
    // for exact matchers with captured groups, return them
    const matchResult = matched.matcher(pathname);
    req.params = matchResult || {};

    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      try {
        req.body = await parseJsonBody(req);
      } catch (error) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({ error: "Invalid JSON payload" }));
      }
    }

    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (payload) => {
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(payload));
    };

    try {
      await matched.handler(req, res);
    } catch (error) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: error.message || "API handler error" }));
    }
  };
}

const apiRoutes = buildApiRoutes();
const apiHandlersPromise = loadApiHandlers(apiRoutes);

function createApiPlugin() {
  return {
    name: "vite-plugin-local-api",
    async configureServer(server) {
      const handlers = await apiHandlersPromise;

      // Add CSP middleware to allow data URIs, external fonts, and unsafe-inline styles
      // NOTE: Avoid breaking Vite internals (/@vite/*, /@react-refresh/*) during dev.
      server.middlewares.use((req, res, next) => {
        const url = req.url || "";
        const pathname = url.split("?")[0];

        if (
          pathname.startsWith("/@vite/") ||
          pathname.startsWith("/@react-refresh") ||
          pathname.startsWith("/src/") ||
          pathname.endsWith("/src/lib/featureFlagEngine.js")
        ) {
          return next();
        }


        res.setHeader(
          "Content-Security-Policy",
          "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com"
        );
        next();
      });

      server.middlewares.use(createApiMiddleware(handlers));
    },
    async configurePreviewServer(server) {
      const handlers = await apiHandlersPromise;

      // Add CSP middleware to allow data URIs, external fonts, and unsafe-inline styles
      server.middlewares.use((req, res, next) => {
        res.setHeader(
          "Content-Security-Policy",
          "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com"
        );
        next();
      });

      server.middlewares.use(createApiMiddleware(handlers));
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), createApiPlugin()],
  optimizeDeps: {
    exclude: ["@sentry/react"], // Optional dependency - skip pre-bundling
  },
  test: {
    // Vitest configuration
    globals: true,
    environment: "jsdom",
    setupFiles: [],
    include: ["test/**/*.test.{js,jsx,ts,tsx}"],
    exclude: ["node_modules", "dist"],
  },
  build: {
    target: "esnext",
    minify: "terser",
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      external: [
        "@sentry/react", // Optional error monitoring - not included in bundle
      ],
      output: {
        manualChunks: {
          // Vendor libraries - split large dependencies
          "vendor-charts": ["recharts"],
          "vendor-icons": ["lucide-react"],
          "vendor-supabase": ["@supabase/supabase-js"],

          // Heavy UI components - loaded on-demand
          "feature-dashboard": [
            "./src/components/AnalyticsDashboard.jsx",
            "./src/components/CognitionGraphView.jsx",
          ],
          "feature-b2b": [
            "./src/components/B2BPartnerPortal.jsx",
            "./src/components/PartnerSdkDemo.jsx",
          ],
          "feature-advanced": [
            "./src/components/FinancialTwin.jsx",
            "./src/components/UserHistory.jsx",
            "./src/components/TraitMatrixVisualizer.jsx",
          ],

          // Insight engines - split heavy computation modules
          "engine-narrative": [
            "./src/engines/trajectoryNarrativeEngine.js",
            "./src/engines/cognitionEngine.js",
            "./src/engines/cognitionGraph.js",
          ],
          "engine-forecast": [
            "./src/engines/forecastEngine.js",
            "./src/engines/opportunityForecastEngine.js",
            "./src/engines/consequenceForecastEngine.js",
          ],
          "engine-analysis": [
            "./src/engines/biasEngine.js",
            "./src/engines/emotionalTriggerEngine.js",
            "./src/engines/counterfactualEngine.js",
          ],

          // React and DOM
          "react-vendor": ["react", "react-dom"],
        },
        // Optimize chunk names for caching
        entryFileNames: "assets/[name]-[hash:8].js",
        chunkFileNames: "assets/[name]-[hash:8].js",
        assetFileNames: "assets/[name]-[hash:8][extname]",
      },
    },
  },
});
