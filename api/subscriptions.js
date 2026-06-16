import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Database client not configured' });
  }

  try {
    const body = req.body;
    if (!body || !body.endpoint) {
      return res.status(400).json({ error: 'Missing subscription payload' });
    }

    const record = {
      endpoint: body.endpoint,
      auth: body.auth || null,
      p256dh: body.p256dh || null,
      user_agent: body.userAgent || req.headers['user-agent'] || null,
      created_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
      user_id: body.userId || null
    };

    const { data, error } = await supabase.from('subscription_endpoints').upsert(record, { returning: 'representation' });
    if (error) {
      console.error('Supabase upsert error', error);
      return res.status(500).json({ error: 'Failed to upsert subscription' });
    }

    return res.status(200).json({ success: true, subscription: data?.[0] || null });
  } catch (error) {
    console.error('subscriptions handler error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
