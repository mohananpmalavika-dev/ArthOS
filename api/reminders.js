import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

export default async function handler(req, res) {
  try {
    if (!supabase) return res.status(500).json({ error: 'Database client not configured' });

    if (req.method === 'GET') {
      const userId = req.query.userId || req.headers['x-user-id'] || null;
      if (!userId) return res.status(400).json({ error: 'Missing userId' });

      const { data, error } = await supabase.from('reminders').select('*').eq('user_id', userId).order('deliver_at', { ascending: true });
      if (error) {
        console.error('Supabase select error', error);
        return res.status(500).json({ error: 'Failed to query reminders' });
      }
      return res.status(200).json({ reminders: data || [] });
    }

    if (req.method === 'POST') {
      const body = req.body;
      if (!body || !body.id || !body.userId || !body.deliverAt) {
        return res.status(400).json({ error: 'Invalid reminder payload' });
      }

      const record = {
        id: body.id,
        user_id: body.userId,
        type: body.type || 'custom',
        deliver_at: new Date(body.deliverAt).toISOString(),
        timezone: body.timezone || null,
        title: body.title || null,
        body: body.body || null,
        action_url: body.actionUrl || null,
        channels: body.channels || null,
        channel_preferences: body.channelPreferences || null,
        idempotency_key: body.idempotencyKey || null,
        created_at: new Date().toISOString(),
        metadata: body.metadata || null
      };

      const { data, error } = await supabase.from('reminders').upsert(record, { returning: 'representation' });
      if (error) {
        console.error('Supabase upsert error', error);
        return res.status(500).json({ error: 'Failed to upsert reminder' });
      }

      return res.status(200).json({ success: true, reminder: data?.[0] || null });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('reminders handler error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
