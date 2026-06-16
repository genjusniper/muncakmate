import getPool, { initDb } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await initDb();
  const { period } = req.query;
  let dateFilter = '';
  const now = new Date();
  if (period === 'week') dateFilter = `AND a.date >= '${new Date(now - 7*86400000).toISOString()}'`;
  else if (period === 'month') dateFilter = `AND a.date >= '${new Date(now - 30*86400000).toISOString()}'`;

  try {
    const result = await getPool().query(`
      SELECT u.id, u.username, u.avatar,
        ROUND(CAST(SUM(a.distance) AS numeric), 2) as total_distance,
        COUNT(a.id)::int as total_activities,
        MAX(a."topSpeed") as max_speed
      FROM users u JOIN activities a ON a.user_id = u.id
      WHERE 1=1 ${dateFilter}
      GROUP BY u.id, u.username, u.avatar
      ORDER BY total_distance DESC LIMIT 20
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil leaderboard' });
  }
}
