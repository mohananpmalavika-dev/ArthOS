import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import { JWT_CONFIG } from './jwt.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI;
const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PG_SSL = process.env.PG_SSL === 'true';

function getFrontendOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || 'localhost:5173';
  return `${proto}://${host}`;
}

function getRedirectUri(req) {
  if (GOOGLE_REDIRECT_URI) {
    return GOOGLE_REDIRECT_URI;
  }
  return `${getFrontendOrigin(req)}/api/auth/google/callback`;
}

function createSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

function getPgPool() {
  if (!DATABASE_URL) return null;
  return new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: PG_SSL ? { rejectUnauthorized: false } : false,
  });
}

async function findOrCreateUserByEmail(email, name) {
  if (!email) {
    throw new Error('Google profile did not return an email address.');
  }

  if (DATABASE_URL) {
    const pool = getPgPool();
    if (!pool) {
      throw new Error('PostgreSQL pool could not be initialized.');
    }

    const { rows } = await pool.query(
      `SELECT id, email, name FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );

    if (rows.length > 0) {
      await pool.end();
      return rows[0];
    }

    const insertResult = await pool.query(
      `INSERT INTO users (email, name, email_verified, created_at) VALUES ($1, $2, true, NOW()) RETURNING id, email, name`,
      [email, name || email.split('@')[0]]
    );
    await pool.end();
    return insertResult.rows[0];
  }

  const supabase = createSupabaseClient();
  if (supabase) {
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .limit(1)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    if (existingUser) {
      return existingUser;
    }

    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert({ email, name: name || email.split('@')[0], email_verified: true })
      .select('id, email, name')
      .limit(1);

    if (insertError) {
      throw insertError;
    }

    return insertedUser?.[0];
  }

  return {
    id: email,
    email,
    name: name || email.split('@')[0],
  };
}

async function fetchGoogleUserInfo(accessToken) {
  const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Failed to fetch Google user info: ${response.status} ${body}`);
  }

  return await response.json();
}

function createJwtToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_CONFIG.secret,
    { expiresIn: JWT_CONFIG.expiresIn }
  );
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    res.status(500).json({ error: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' });
    return;
  }

  const pathname = req.url ? new URL(req.url, 'http://localhost').pathname : '/api/auth/google';

  if (pathname === '/api/auth/google') {
    const redirectUri = getRedirectUri(req);
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });
    res.status(302).setHeader('Location', `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    res.end();
    return;
  }

  if (pathname === '/api/auth/google/callback') {
    const code = req.query?.code;
    const errorDescription = req.query?.error_description || req.query?.error;

    if (!code) {
      const redirectTarget = `/login?oauthError=${encodeURIComponent(errorDescription || 'Google sign-in failed')}`;
      res.status(302).setHeader('Location', redirectTarget);
      res.end();
      return;
    }

    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: getRedirectUri(req),
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        throw new Error(tokenData.error_description || tokenData.error || 'Google token exchange failed');
      }

      const userInfo = await fetchGoogleUserInfo(tokenData.access_token);
      const user = await findOrCreateUserByEmail(userInfo.email, userInfo.name || userInfo.email?.split('@')[0]);
      const jwtToken = createJwtToken(user);

      const redirectTarget = `/login?token=${encodeURIComponent(jwtToken)}&provider=google`;
      res.status(302).setHeader('Location', redirectTarget);
      res.end();
      return;
    } catch (error) {
      const redirectTarget = `/login?oauthError=${encodeURIComponent(error.message || 'Google sign-in failed')}`;
      res.status(302).setHeader('Location', redirectTarget);
      res.end();
      return;
    }
  }

  res.status(404).json({ error: 'Not found' });
}
