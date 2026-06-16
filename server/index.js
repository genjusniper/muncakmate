import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// API: Register
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username dan password wajib diisi.' });

  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  
  db.run('INSERT INTO users (username, password, avatar) VALUES (?, ?, ?)', [username, password, defaultAvatar], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Username sudah digunakan.' });
      return res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
    res.json({ id: this.lastID, username, avatar: defaultAvatar });
  });
});

// API: Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: 'Terjadi kesalahan server.' });
    if (!row) return res.status(401).json({ error: 'Username atau password salah.' });
    res.json({ id: row.id, username: row.username, avatar: row.avatar });
  });
});

// API: Sync Activity
app.post('/api/activities', (req, res) => {
  const { userId, type, duration, distance, topSpeed, path, date, driver, vehicle } = req.body;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  db.run(`
    INSERT INTO activities (user_id, type, duration, distance, topSpeed, path, date, driver, vehicle) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [userId, type, duration, distance, topSpeed, JSON.stringify(path), date, driver, vehicle], function(err) {
    if (err) return res.status(500).json({ error: 'Gagal sinkronisasi' });
    res.json({ success: true, activityId: this.lastID });
  });
});

// API: Get Feed (All Users' Activities)
app.get('/api/feed', (req, res) => {
  const currentUserId = req.query.userId;
  db.all(`
    SELECT a.*, u.username, u.avatar, 
      (SELECT COUNT(*) FROM kudos WHERE activity_id = a.id) as kudos_count,
      (SELECT COUNT(*) FROM kudos WHERE activity_id = a.id AND user_id = ?) as has_kudoed
    FROM activities a
    JOIN users u ON a.user_id = u.id
    ORDER BY a.id DESC
    LIMIT 50
  `, [currentUserId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil feed' });
    const feed = rows.map(r => ({
      ...r,
      path: JSON.parse(r.path || '[]'),
      has_kudoed: r.has_kudoed > 0
    }));
    res.json(feed);
  });
});

// API: Give Kudo
app.post('/api/kudos', (req, res) => {
  const { userId, activityId } = req.body;
  db.run('INSERT INTO kudos (user_id, activity_id) VALUES (?, ?)', [userId, activityId], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        db.run('DELETE FROM kudos WHERE user_id = ? AND activity_id = ?', [userId, activityId]);
        return res.json({ success: true, action: 'removed' });
      }
      return res.status(500).json({ error: 'Gagal memberikan kudo' });
    }
    res.json({ success: true, action: 'added' });
  });
});

// API: Leaderboard
app.get('/api/leaderboard', (req, res) => {
  const { period } = req.query; // 'week', 'month', 'all'
  
  let dateFilter = '';
  const now = new Date();
  
  if (period === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    dateFilter = `AND a.date >= '${weekAgo}'`;
  } else if (period === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    dateFilter = `AND a.date >= '${monthAgo}'`;
  }

  db.all(`
    SELECT u.id, u.username, u.avatar,
      ROUND(SUM(a.distance), 2) as total_distance,
      COUNT(a.id) as total_activities,
      MAX(a.topSpeed) as max_speed
    FROM users u
    JOIN activities a ON a.user_id = u.id
    WHERE 1=1 ${dateFilter}
    GROUP BY u.id
    ORDER BY total_distance DESC
    LIMIT 20
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil leaderboard' });
    res.json(rows);
  });
});

// API: Get Comments for an Activity
app.get('/api/comments/:activityId', (req, res) => {
  const { activityId } = req.params;
  db.all(`
    SELECT c.*, u.username, u.avatar
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.activity_id = ?
    ORDER BY c.id ASC
  `, [activityId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil komentar' });
    res.json(rows);
  });
});

// API: Post Comment
app.post('/api/comments', (req, res) => {
  const { userId, activityId, text } = req.body;
  if (!userId || !activityId || !text) return res.status(400).json({ error: 'Data tidak lengkap.' });

  const date = new Date().toISOString();
  db.run(
    'INSERT INTO comments (user_id, activity_id, text, date) VALUES (?, ?, ?, ?)',
    [userId, activityId, text, date],
    function(err) {
      if (err) return res.status(500).json({ error: 'Gagal memposting komentar' });
      res.json({ success: true, commentId: this.lastID });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Backend Server berjalan di http://localhost:${PORT}`);
});
