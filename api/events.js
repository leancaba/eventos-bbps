// API de eventos para Vercel (Node). Guarda la lista en Upstash Redis vía REST.
// Variables de entorno (las crea la integración de Upstash en Vercel):
//   KV_REST_API_URL + KV_REST_API_TOKEN  (o UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
// Opcionales: ADMIN_USER y ADMIN_PASS (por defecto admin / bbps2153)

const KEY = 'bbps:eventos';
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const USER = process.env.ADMIN_USER || 'admin';
const PASS = process.env.ADMIN_PASS || 'bbps2153';

async function redis(cmd) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error('Redis ' + r.status);
  return (await r.json()).result;
}

async function readAll() {
  const raw = await redis(['GET', KEY]);
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
}

const writeAll = (list) => redis(['SET', KEY, JSON.stringify(list)]);

function authorized(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Basic ')) return false;
  const [u, ...p] = Buffer.from(h.slice(6), 'base64').toString().split(':');
  return u === USER && p.join(':') === PASS;
}

const clean = (s, max) => String(s ?? '').trim().slice(0, max);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOKEN) return res.status(503).json({ error: 'Base de datos no configurada' });

  try {
    if (req.method === 'GET') {
      if (req.query.check) {
        return authorized(req) ? res.json({ ok: true }) : res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      }
      return res.json(await readAll());
    }

    if (!authorized(req)) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const ev = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        title: clean(b.title, 80),
        date: clean(b.date, 10),
        time: clean(b.time, 5),
        place: clean(b.place, 40),
      };
      if (!ev.title || !/^\d{4}-\d{2}-\d{2}$/.test(ev.date) || !/^\d{2}:\d{2}$/.test(ev.time) || !ev.place) {
        return res.status(400).json({ error: 'Completá título, fecha, horario y lugar' });
      }
      const list = await readAll();
      list.push(ev);
      await writeAll(list);
      return res.status(201).json(ev);
    }

    if (req.method === 'DELETE') {
      const list = await readAll();
      await writeAll(list.filter((e) => e.id !== req.query.id));
      return res.json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: 'No se pudo acceder a la base de datos' });
  }
}
