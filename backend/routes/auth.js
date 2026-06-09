const { Router } = require('express');
const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = Router();

const buildMessage = (nonce, address) =>
  `Sign this message to authenticate with CertChain.\n\nNonce: ${nonce}\nAddress: ${address}`;

// GET /api/auth/nonce/:address
// Returns a one-time challenge message for the wallet to sign
router.get('/nonce/:address', async (req, res, next) => {
  try {
    const address = req.params.address.toLowerCase();
    const nonce = crypto.randomUUID();
    await pool.query(
      `INSERT INTO auth_nonces (address, nonce, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (address) DO UPDATE SET nonce = $2, created_at = NOW()`,
      [address, nonce]
    );
    res.json({ nonce, message: buildMessage(nonce, address) });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify
// Body: { address, signature }  →  { token, address }
router.post('/verify', async (req, res, next) => {
  try {
    const { address, signature } = req.body;
    if (!address || !signature) {
      return res.status(400).json({ error: 'address and signature are required' });
    }
    const normalAddress = address.toLowerCase();

    const row = await pool.query(
      'SELECT nonce FROM auth_nonces WHERE address = $1',
      [normalAddress]
    );
    if (!row.rows.length) {
      return res.status(400).json({ error: 'No pending nonce. Call GET /api/auth/nonce/:address first.' });
    }

    const message = buildMessage(row.rows[0].nonce, normalAddress);
    const recovered = ethers.verifyMessage(message, signature).toLowerCase();

    if (recovered !== normalAddress) {
      return res.status(401).json({ error: 'Signature does not match address' });
    }

    // Consume the nonce so it can't be replayed
    await pool.query('DELETE FROM auth_nonces WHERE address = $1', [normalAddress]);

    const token = jwt.sign({ address: normalAddress }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, address: normalAddress });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
