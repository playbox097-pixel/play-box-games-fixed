// Simple Express server for Game Hub accounts and Playbux
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// In-memory user store (use a database for real projects)
const users = {};

// Register
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  if (users[username]) return res.status(409).json({ error: 'Username exists' });
  const hash = await bcrypt.hash(password, 10);
  users[username] = { password: hash, playbux: 0 };
  res.json({ success: true });
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user) return res.status(404).json({ error: 'User not found' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Wrong password' });
  res.json({ success: true, playbux: user.playbux });
});

// Get Playbux
app.get('/playbux/:username', (req, res) => {
  const user = users[req.params.username];
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ playbux: user.playbux });
});

// Update Playbux
app.post('/playbux', (req, res) => {
  const { username, playbux } = req.body;
  const user = users[username];
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.playbux = playbux;
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
