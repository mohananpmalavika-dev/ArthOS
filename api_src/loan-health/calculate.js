import { calculateLoanHealth } from '../services/loanHealthEngine.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = req.body || {};
  const result = calculateLoanHealth(body.customer || body.profile || body);
  return res.status(200).json({
    ok: true,
    result
  });
}
