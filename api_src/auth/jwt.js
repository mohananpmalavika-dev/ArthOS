/**
 * Shared JWT Configuration
 *
 * Centralises JWT_SECRET, signing options, and token verification
 * so no route handler ever hardcodes a secret string.
 *
 * ⚠️  Production MUST set JWT_SECRET env var to a strong, unique value.
 *     The fallback exists ONLY for local dev convenience and logs a
 *     one-time warning every start.
 */

const JWT_SECRET = (() => {
  const s = process.env.JWT_SECRET;
  if (!s) {
    console.warn(
      '⚠️  WARNING: JWT_SECRET environment variable is not set. ' +
      'Falling back to dev-only secret. SET JWT_SECRET in production.'
    );
    return 'arthos-dev-secret-change-in-production';
  }
  return s;
})();

/** Re-export so consumers get the same constant everywhere. */
export const JWT_CONFIG = {
  secret:    JWT_SECRET,
  algorithm: 'HS256',
  expiresIn: '30d',
};

/**
 * Verify a JWT from an Authorization header.
 * Returns decoded payload on success, null on failure / missing token.
 */
export async function verifyRequestToken(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;

  try {
    const { default: jwt } = await import('jsonwebtoken');
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch (_err) {
    return null;
  }
}

/**
 * Extract a user object from a verified JWT.
 * Returns { id, email } or null.
 */
export async function extractUserFromRequest(req) {
  const decoded = await verifyRequestToken(req);
  if (!decoded) return null;
  return {
    id:    decoded.userId || decoded.id || decoded.email || null,
    email: decoded.email || null,
  };
}
