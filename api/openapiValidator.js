import fs from 'fs';
import path from 'path';
import YAML from 'js-yaml';
let validator = null;
let initAttempted = false;

async function init() {
  if (validator || initAttempted) return validator;
  initAttempted = true;
  try {
    const { default: OpenAPIBackend } = await import('openapi-backend');
    const specPath = path.resolve(process.cwd(), 'docs', 'openapi.yml');
    let spec = {};
    if (fs.existsSync(specPath)) {
      spec = YAML.load(fs.readFileSync(specPath, 'utf8'));
    }

    validator = new OpenAPIBackend({ definition: spec, quick: true });
    // Register basic handlers for validation failures
    validator.register({
      notFound: (c, req, res) => {
        res.statusCode = 404;
        res.json({ error: 'Not found' });
      },
      validationFail: (c, req, res) => {
        res.statusCode = 400;
        res.json({ error: 'Validation failed', details: c.validation.errors });
      },
    });
    await validator.init();
    return validator;
  } catch (err) {
    // If the validator can't be initialized, log once and continue with noop validator
    if (!validator) {
      console.warn('[openapiValidator] init failed, validation disabled:', err && err.message);
    }
    validator = null;
    return null;
  }
}

function mapRequestForOpenAPI(req) {
  // Build a lightweight request object compatible with openapi-backend validateRequest
  const url = new URL(req.headers['x-vercel-original-url'] || req.url || '/', 'http://localhost');
  return {
    method: req.method || 'GET',
    path: url.pathname,
    query: req.query || Object.fromEntries(url.searchParams.entries()),
    headers: req.headers || {},
    body: req.body || {},
  };
}

export async function validateIncoming(req, res) {
  const api = await init();
  if (!api) return { ok: true };
  try {
    const openReq = mapRequestForOpenAPI(req);
    const result = api.validateRequest(openReq);
    if (result && result.errors && result.errors.length) {
      res.status(400).json({ error: 'OpenAPI validation failed', details: result.errors });
      return { ok: false, errors: result.errors };
    }
    return { ok: true };
  } catch (err) {
    console.warn('[openapiValidator] validateIncoming error', err && err.message);
    return { ok: true };
  }
}

export default { init, validateIncoming };
