require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors());
app.use(express.json());

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      wallet_address VARCHAR(42) UNIQUE NOT NULL,
      username      VARCHAR(100),
      role          VARCHAR(20) DEFAULT 'holder',
      created_at    TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS nonces (
      wallet_address VARCHAR(42) PRIMARY KEY,
      nonce         VARCHAR(64)  NOT NULL,
      expires_at    TIMESTAMP    NOT NULL
    );
  `);
}

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Step 1: request a nonce to sign
app.post('/auth/nonce', async (req, res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: 'address required' });

  const addr = address.toLowerCase();
  const nonce = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await pool.query(
    `INSERT INTO nonces (wallet_address, nonce, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (wallet_address) DO UPDATE SET nonce = $2, expires_at = $3`,
    [addr, nonce, expiresAt]
  );

  res.json({
    nonce,
    message: `Sign in to CertChain\nNonce: ${nonce}`,
  });
});

// Step 2: submit signed nonce, receive JWT
app.post('/auth/verify', async (req, res) => {
  const { address, signature } = req.body;
  if (!address || !signature)
    return res.status(400).json({ error: 'address and signature required' });

  const addr = address.toLowerCase();

  const { rows } = await pool.query(
    `SELECT nonce, expires_at FROM nonces WHERE wallet_address = $1`,
    [addr]
  );

  if (!rows.length || new Date(rows[0].expires_at) < new Date())
    return res.status(400).json({ error: 'Nonce expired or not found. Reconnect your wallet.' });

  const message = `Sign in to CertChain\nNonce: ${rows[0].nonce}`;

  let recovered;
  try {
    recovered = ethers.verifyMessage(message, signature);
  } catch {
    return res.status(401).json({ error: 'Signature verification failed' });
  }

  if (recovered.toLowerCase() !== addr)
    return res.status(401).json({ error: 'Signature does not match address' });

  await pool.query(`DELETE FROM nonces WHERE wallet_address = $1`, [addr]);

  const { rows: userRows } = await pool.query(
    `INSERT INTO users (wallet_address)
     VALUES ($1)
     ON CONFLICT (wallet_address) DO UPDATE SET wallet_address = EXCLUDED.wallet_address
     RETURNING id, wallet_address, username, role, created_at`,
    [addr]
  );

  const user = userRows[0];
  const token = jwt.sign(
    { id: user.id, address: addr, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user });
});

// GET /auth/me — current authenticated user
app.get('/auth/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, wallet_address, username, role, created_at FROM users WHERE id = $1`,
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

// PATCH /users/me — update display name
app.patch('/users/me', requireAuth, async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'username required' });
  const { rows } = await pool.query(
    `UPDATE users SET username = $1 WHERE id = $2
     RETURNING id, wallet_address, username, role, created_at`,
    [username, req.user.id]
  );
  res.json(rows[0]);
});

const PORT = process.env.PORT || 3001;
initDB()
  .then(() => app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`)))
  .catch((err) => { console.error('DB init failed:', err.message); process.exit(1); });
