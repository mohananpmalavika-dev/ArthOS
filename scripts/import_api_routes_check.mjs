import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const apiDirectory = path.resolve('api_src');
const PREFIX_MATCH_FILES = new Set([
  'memory.js',
  'sync.js',
  'subscriptions-handler.js',
  'follow-up-handler.js',
  'reminders.js',
  'ai-coach-handler.js',
  'coach-handler.js',
]);

function normalizeSegment(segment) {
  if (segment.startsWith('[') && segment.endsWith(']')) {
    return `:${segment.slice(1, -1)}`;
  }
  return segment;
}

function buildRouteString(segments) {
  const normalized = segments.map((s) => {
    if (s.endsWith('-handler')) {
      return s.slice(0, -'-handler'.length);
    }
    return s;
  });
  const deduped = normalized.filter((s, idx) => idx === 0 || s !== normalized[idx - 1]);
  return '/' + deduped.filter(Boolean).join('/');
}

function walk(dir, routePrefix = '/api') {
  const routes = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      routes.push(...walk(fullPath, `${routePrefix}/${entry.name}`));
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
    const fileBase = entry.name === 'index.js' ? '' : entry.name.replace(/\.js$/, '');
    const segments = [...routePrefix.split('/').filter(Boolean)];
    if (fileBase) segments.push(fileBase);
    const route = buildRouteString(segments);
    const isPrefixMatch = PREFIX_MATCH_FILES.has(entry.name);
    routes.push({ route, fullPath, isPrefixMatch });
  }
  return routes;
}

const routes = walk(apiDirectory);
for (const route of routes) {
  try {
    const module = await import(pathToFileURL(route.fullPath).href);
    const isFunction = typeof module.default === 'function';
    console.log(route.route, 'OK', isFunction ? 'handler OK' : 'default missing', route.fullPath);
  } catch (error) {
    console.error(route.route, 'ERROR', error.message, route.fullPath);
  }
}
