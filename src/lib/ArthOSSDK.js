export class ArthOSSDK {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async getHealthScore(userId) {
    const res = await fetch(`${this.baseUrl}/api/user/${encodeURIComponent(userId)}/score`);
    if (!res.ok) throw new Error('Failed to load health score');
    return res.json();
  }

  async getRiskProfile(userId, userPayload = null) {
    const endpoint = `${this.baseUrl}/api/user/${encodeURIComponent(userId)}/risk`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: userPayload }),
    });
    if (!res.ok) throw new Error('Failed to load risk profile');
    return res.json();
  }
}
