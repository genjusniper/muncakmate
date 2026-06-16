import getPool, { initDb } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await initDb();
  const currentUserId = req.query.userId;
  try {
    const result = await getPool().query(`
      SELECT a.*, u.username, u.avatar,
        (SELECT COUNT(*) FROM kudos WHERE activity_id = a.id)::int as kudos_count,
        (SELECT COUNT(*) FROM kudos WHERE activity_id = a.id AND user_id = $1)::int as has_kudoed
      FROM activities a JOIN users u ON a.user_id = u.id
      ORDER BY a.id DESC LIMIT 50
    `, [currentUserId]);
    const feed = result.rows.map(r => ({ ...r, path: JSON.parse(r.path || '[]'), has_kudoed: r.has_kudoed > 0 }));
    res.json(feed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil feed' });
  }
}
