const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = 3020;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite database
const db = new Database('murdle.db');

// Create mysteries table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS mysteries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    suspects TEXT NOT NULL,
    weapons TEXT NOT NULL,
    locations TEXT NOT NULL,
    grid TEXT DEFAULT '{}',
    createdAt TEXT NOT NULL
  )
`);

// API: list all mysteries
app.get('/api/mysteries', (req, res) => {
  const mysteries = db.prepare('SELECT * FROM mysteries ORDER BY createdAt DESC').all();
  // Parse JSON fields
  const parsed = mysteries.map(m => ({
    ...m,
    suspects: JSON.parse(m.suspects),
    weapons: JSON.parse(m.weapons),
    locations: JSON.parse(m.locations),
    grid: JSON.parse(m.grid)
  }));
  res.json(parsed);
});

// API: get a single mystery
app.get('/api/mysteries/:id', (req, res) => {
  const mystery = db.prepare('SELECT * FROM mysteries WHERE id = ?').get(parseInt(req.params.id));
  if (!mystery) return res.status(404).json({ error: 'Mystery not found' });
  // Parse JSON fields
  const parsed = {
    ...mystery,
    suspects: JSON.parse(mystery.suspects),
    weapons: JSON.parse(mystery.weapons),
    locations: JSON.parse(mystery.locations),
    grid: JSON.parse(mystery.grid)
  };
  res.json(parsed);
});

// API: create a new mystery
app.post('/api/mysteries', (req, res) => {
  const { title, description, suspects, weapons, locations } = req.body;
  if (!title || !suspects?.length || !weapons?.length || !locations?.length) {
    return res.status(400).json({ error: 'Title, suspects, weapons, and locations are required' });
  }

  const createdAt = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO mysteries (title, description, suspects, weapons, locations, grid, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    title,
    description || '',
    JSON.stringify(suspects),
    JSON.stringify(weapons),
    JSON.stringify(locations),
    JSON.stringify({}),
    createdAt
  );

  const mystery = {
    id: result.lastInsertRowid,
    title,
    description: description || '',
    suspects,
    weapons,
    locations,
    grid: {},
    createdAt
  };

  res.status(201).json(mystery);
});

// API: update grid state
app.put('/api/mysteries/:id/grid', (req, res) => {
  const id = parseInt(req.params.id);
  const mystery = db.prepare('SELECT * FROM mysteries WHERE id = ?').get(id);
  if (!mystery) return res.status(404).json({ error: 'Mystery not found' });

  const stmt = db.prepare('UPDATE mysteries SET grid = ? WHERE id = ?');
  stmt.run(JSON.stringify(req.body.grid), id);

  // Return updated mystery
  const updated = db.prepare('SELECT * FROM mysteries WHERE id = ?').get(id);
  const parsed = {
    ...updated,
    suspects: JSON.parse(updated.suspects),
    weapons: JSON.parse(updated.weapons),
    locations: JSON.parse(updated.locations),
    grid: JSON.parse(updated.grid)
  };
  res.json(parsed);
});

// API: delete a mystery
app.delete('/api/mysteries/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const stmt = db.prepare('DELETE FROM mysteries WHERE id = ?');
  const result = stmt.run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Mystery not found' });
  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Murdle server running on http://localhost:${PORT}`);
});
