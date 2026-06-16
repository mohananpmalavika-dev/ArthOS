/**
 * Simple calendar export endpoint returning an .ics file
 */
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const body = req.body || {};
    const title = body.title || 'ArthOS Reminder';
    const description = body.description || '';
    const start = body.start || new Date().toISOString();
    const end = body.end || new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const uid = body.uid || `arthos-${Date.now()}`;

    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dtStart = new Date(start).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dtEnd = new Date(end).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ArthOS//EN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeICalText(title)}`,
      `DESCRIPTION:${escapeICalText(description)}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="event-${uid}.ics"`);
    return res.status(200).send(ics);
  } catch (error) {
    console.error('calendar_export handler error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function escapeICalText(s) {
  if (!s) return '';
  return String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}
