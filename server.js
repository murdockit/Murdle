const express = require('express');
const path = require('path');

const app = express();
const PORT = 3020;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for mysteries
let mysteries = [];
let nextId = 1;

// API: list all mysteries
app.get('/api/mysteries', (req, res) => {
  res.json(mysteries);
});

// API: get a single mystery
app.get('/api/mysteries/:id', (req, res) => {
  const mystery = mysteries.find(m => m.id === parseInt(req.params.id));
  if (!mystery) return res.status(404).json({ error: 'Mystery not found' });
  res.json(mystery);
});

// API: create a new mystery
app.post('/api/mysteries', (req, res) => {
  const { title, description, suspects, weapons, locations } = req.body;
  if (!title || !suspects?.length || !weapons?.length || !locations?.length) {
    return res.status(400).json({ error: 'Title, suspects, weapons, and locations are required' });
  }
  const mystery = {
    id: nextId++,
    title,
    description: description || '',
    suspects,
    weapons,
    locations,
    // Grid state: object keyed by "row-col" with values "", "x", or "check"
    grid: {},
    createdAt: new Date().toISOString()
  };
  mysteries.push(mystery);
  res.status(201).json(mystery);
});

// API: update grid state
app.put('/api/mysteries/:id/grid', (req, res) => {
  const mystery = mysteries.find(m => m.id === parseInt(req.params.id));
  if (!mystery) return res.status(404).json({ error: 'Mystery not found' });
  mystery.grid = req.body.grid;
  res.json(mystery);
});

// API: delete a mystery
app.delete('/api/mysteries/:id', (req, res) => {
  const idx = mysteries.findIndex(m => m.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Mystery not found' });
  mysteries.splice(idx, 1);
  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Murdle server running on http://localhost:${PORT}`);
});
