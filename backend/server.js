const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'weekly-planner-secret-change-in-prod';
const PASSWORD_HASH = bcrypt.hashSync(process.env.APP_PASSWORD || 'rizkyr117h', 10);

// Ensure data directory exists
const DATA_DIR = '/data';
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// SQLite database
const db = new Database(path.join(DATA_DIR, 'planner.db'));

// Init tables
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    date_key TEXT NOT NULL,
    text TEXT NOT NULL,
    cat TEXT NOT NULL,
    done INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch())
  );
  CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date_key);
`);

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static('/app/frontend'));

// ---- AUTH ----
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (!password || !bcrypt.compareSync(password, PASSWORD_HASH)) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  const token = jwt.sign({ auth: true }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token });
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ---- TASKS ----

// Get tasks for a date range (whole week)
app.get('/api/tasks', authMiddleware, (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'Missing from/to' });
  const tasks = db.prepare(
    'SELECT * FROM tasks WHERE date_key >= ? AND date_key <= ? ORDER BY created_at DESC'
  ).all(from, to);
  // Group by date_key
  const grouped = {};
  tasks.forEach(t => {
    if (!grouped[t.date_key]) grouped[t.date_key] = [];
    grouped[t.date_key].push({ ...t, done: t.done === 1 });
  });
  res.json(grouped);
});

// Add task
app.post('/api/tasks', authMiddleware, (req, res) => {
  const { id, date_key, text, cat } = req.body;
  if (!id || !date_key || !text || !cat) return res.status(400).json({ error: 'Missing fields' });
  db.prepare('INSERT INTO tasks (id, date_key, text, cat) VALUES (?, ?, ?, ?)').run(id, date_key, text, cat);
  res.json({ ok: true });
});

// Toggle done
app.patch('/api/tasks/:id', authMiddleware, (req, res) => {
  const { done } = req.body;
  db.prepare('UPDATE tasks SET done = ? WHERE id = ?').run(done ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

// Delete task
app.delete('/api/tasks/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join('/app/frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Weekly Planner running on port ${PORT}`);
});
