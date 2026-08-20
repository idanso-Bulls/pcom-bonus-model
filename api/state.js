// api/state.js — GET/PUT draft state (manager writes, any authed user reads)
// Storage: Vercel KV (Upstash Redis REST API) — key "pcom:state"
// Auth:    X-Auth-Token header must match a password from USERS below

const USERS = {
  manager:  { password: 'pcom-admin',   role: 'manager' },
  enri:     { password: 'enri2026',     role: 'tl' },
  stella:   { password: 'stella2026',   role: 'mb' },
  anxhela:  { password: 'anxhela2026',  role: 'mb' },
  kasandra: { password: 'kasandra2026', role: 'mb' },
  semi:     { password: 'semi2026',     role: 'mb' },
  suela:    { password: 'suela2026',    role: 'mb' },
};

const KV_KEY = 'pcom:state';

function authenticate(headers) {
  const token = (headers['x-auth-token'] || '').trim();
  if (!token) return null;
  for (const [username, u] of Object.entries(USERS)) {
    if (u.password === token) return { username, role: u.role };
  }
  return null;
}

async function kvGet(key) {
  const url   = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const res  = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (json.result == null) return null;
  try {
    return typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
  } catch {
    return null;
  }
}

async function kvSet(key, value) {
  const url   = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('KV not configured — add KV_REST_API_URL and KV_REST_API_TOKEN env vars');

  const serialized = JSON.stringify(value);
  // Use the pipeline endpoint so large JSON values are sent in the body, not the URL
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([['SET', key, serialized]]),
  });
  const json = await res.json();
  if (!Array.isArray(json) || json[0]?.result !== 'OK') {
    throw new Error('KV set failed: ' + JSON.stringify(json));
  }
}

export default async function handler(req, res) {
  const user = authenticate(req.headers);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    try {
      const data = await kvGet(KV_KEY);
      return res.status(200).json(data ?? null);
    } catch (err) {
      console.error('[state GET]', err);
      return res.status(500).json({ error: 'Failed to read state: ' + err.message });
    }
  }

  if (req.method === 'PUT') {
    if (user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden — manager role required to write state' });
    }
    const body = req.body;
    if (!body || !body.projects || !body.mbs || !body.pool) {
      return res.status(400).json({ error: 'Invalid state: must include projects, mbs, pool' });
    }
    try {
      await kvSet(KV_KEY, body);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[state PUT]', err);
      return res.status(500).json({ error: 'Failed to write state: ' + err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
