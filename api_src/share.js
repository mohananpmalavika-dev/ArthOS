import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
}

function parseSharePath(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length !== 4 || segments[0] !== 'api' || segments[1] !== 'share') {
    return null;
  }
  return {
    type: segments[2] || null,
    id: segments[3] || null,
  };
}

function generateAccessToken() {
  return crypto.randomBytes(16).toString('hex');
}

export default async function handler(req, res) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ error: 'Database client not configured' });
  }

  const pathname = req.url || '';
  const pathInfo = parseSharePath(new URL(pathname, 'http://localhost').pathname);
  if (!pathInfo) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Share-Token');
      return res.status(200).end();
    }

    if (req.method === 'GET') {
      const shareToken = req.headers['x-share-token'];
      if (!shareToken) {
        return res.status(401).json({ error: 'Missing share token' });
      }

      const query = supabase
        .from('shared_assets')
        .select('*')
        .eq('access_token', shareToken)
        .eq('content_type', pathInfo.type)
        .eq('asset_key', pathInfo.id)
        .single();

      const { data: share, error } = await query;
      if (error || !share) {
        return res.status(403).json({ error: 'Share expired or invalid' });
      }

      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return res.status(403).json({ error: 'Share expired' });
      }

      const metadata = share.metadata || {};
      const updatedMetadata = {
        ...metadata,
        viewCount: (metadata.viewCount || 0) + 1,
        lastViewedAt: new Date().toISOString(),
      };

      await supabase
        .from('shared_assets')
        .update({ metadata: updatedMetadata })
        .eq('id', share.id);

      return res.status(200).json({ share: { ...share, metadata: updatedMetadata } });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const token = req.headers['x-share-token'] || body.accessToken || null;

      if (pathInfo.action === 'revoke') {
        const shareToken = req.headers['x-share-token'];
        if (!shareToken) {
          return res.status(401).json({ error: 'Missing share token' });
        }

        const { data: share, error } = await supabase
          .from('shared_assets')
          .select('*')
          .eq('access_token', shareToken)
          .eq('asset_key', pathInfo.revokeTarget)
          .single();

        if (error || !share) {
          return res.status(404).json({ error: 'Share not found' });
        }

        await supabase
          .from('shared_assets')
          .update({ access_token: null, expires_at: new Date().toISOString(), metadata: { ...share.metadata, revoked: true } })
          .eq('id', share.id);

        return res.status(200).json({ success: true, revoked: true });
      }

      if (!pathInfo.type || !pathInfo.id) {
        return res.status(400).json({ error: 'Missing share type or id' });
      }

      const ownerUserId = body.ownerUserId || body.owner_user_id || null;
      if (!ownerUserId) {
        return res.status(400).json({ error: 'Missing ownerUserId' });
      }

      const expiresAt = body.expiresAt ? new Date(body.expiresAt).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const accessToken = token || body.accessToken || generateAccessToken();

      const record = {
        owner_user_id: ownerUserId,
        asset_key: pathInfo.id,
        content_type: pathInfo.type,
        storage_path: body.storagePath || null,
        access_token: accessToken,
        expires_at: expiresAt,
        metadata: body.metadata || {},
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('shared_assets')
        .upsert(record, { returning: 'representation' });

      if (error) {
        console.error('Supabase upsert error', error);
        return res.status(500).json({ error: 'Failed to create share', detail: error.message });
      }

      return res.status(201).json({ share: data?.[0] || record });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('share handler error', error);
    return res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
}
