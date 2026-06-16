import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pool from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// API: Register
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  try {
    const result = await pool.query(
      'INSERT INTO users (username, password, avatar) VALUES ($1, $2, $3) RETURNING id, username, avatar',
      [username, password, defaultAvatar]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Username sudah digunakan.' });
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// API: Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT id, username, avatar FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Username atau password salah.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// API: Sync Activity
app.post('/api/activities', async (req, res) => {
  const { userId, type, duration, distance, topSpeed, path, date, driver, vehicle } = req.body;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const result = await pool.query(
      `INSERT INTO activities (user_id, type, duration, distance, "topSpeed", path, date, driver, vehicle) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [userId, type, duration, distance, topSpeed || 0, JSON.stringify(path || []), date, driver || '', vehicle || '']
    );
    res.json({ success: true, activityId: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal sinkronisasi' });
  }
});

// API: Get Feed
app.get('/api/feed', async (req, res) => {
  const currentUserId = req.query.userId;
  try {
    const result = await pool.query(`
      SELECT a.*, u.username, u.avatar,
        (SELECT COUNT(*) FROM kudos WHERE activity_id = a.id)::int as kudos_count,
        (SELECT COUNT(*) FROM kudos WHERE activity_id = a.id AND user_id = $1)::int as has_kudoed
      FROM activities a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.id DESC
      LIMIT 50
    `, [currentUserId]);
    const feed = result.rows.map(r => ({
      ...r,
      path: JSON.parse(r.path || '[]'),
      has_kudoed: r.has_kudoed > 0
    }));
    res.json(feed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil feed' });
  }
});

// API: Kudos
app.post('/api/kudos', async (req, res) => {
  const { userId, activityId } = req.body;
  try {
    await pool.query(
      'INSERT INTO kudos (user_id, activity_id) VALUES ($1, $2)',
      [userId, activityId]
    );
    res.json({ success: true, action: 'added' });
  } catch (err) {
    if (err.code === '23505') {
      await pool.query('DELETE FROM kudos WHERE user_id = $1 AND activity_id = $2', [userId, activityId]);
      return res.json({ success: true, action: 'removed' });
    }
    res.status(500).json({ error: 'Gagal memberikan kudo' });
  }
});

// API: Leaderboard
app.get('/api/leaderboard', async (req, res) => {
  const { period } = req.query;
  let dateFilter = '';
  const now = new Date();
  if (period === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    dateFilter = `AND a.date >= '${weekAgo}'`;
  } else if (period === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    dateFilter = `AND a.date >= '${monthAgo}'`;
  }
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.avatar,
        ROUND(CAST(SUM(a.distance) AS numeric), 2) as total_distance,
        COUNT(a.id)::int as total_activities,
        MAX(a."topSpeed") as max_speed
      FROM users u
      JOIN activities a ON a.user_id = u.id
      WHERE 1=1 ${dateFilter}
      GROUP BY u.id, u.username, u.avatar
      ORDER BY total_distance DESC
      LIMIT 20
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil leaderboard' });
  }
});

// API: Get Comments
app.get('/api/comments/:activityId', async (req, res) => {
  const { activityId } = req.params;
  try {
    const result = await pool.query(`
      SELECT c.*, u.username, u.avatar
      FROM comments c JOIN users u ON c.user_id = u.id
      WHERE c.activity_id = $1 ORDER BY c.id ASC
    `, [activityId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil komentar' });
  }
});

// API: Post Comment
app.post('/api/comments', async (req, res) => {
  const { userId, activityId, text } = req.body;
  if (!userId || !activityId || !text) return res.status(400).json({ error: 'Data tidak lengkap.' });
  const date = new Date().toISOString();
  try {
    const result = await pool.query(
      'INSERT INTO comments (user_id, activity_id, text, date) VALUES ($1,$2,$3,$4) RETURNING id',
      [userId, activityId, text, date]
    );
    res.json({ success: true, commentId: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memposting komentar' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend Server berjalan di http://localhost:${PORT}`);
});
