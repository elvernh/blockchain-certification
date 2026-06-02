const { Router } = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = Router();

// GET /api/certificates?holder=0x...&issuer=0x...
router.get('/', async (req, res, next) => {
  try {
    const { holder, issuer, status } = req.query;
    const params = [];
    const conditions = [];

    if (holder) {
      params.push(holder.toLowerCase());
      conditions.push(`holder_address = $${params.length}`);
    }
    if (issuer) {
      params.push(issuer.toLowerCase());
      conditions.push(`issuer_address = $${params.length}`);
    }
    if (status) {
      params.push(status.toUpperCase());
      conditions.push(`status = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT * FROM certificate_metadata ${where} ORDER BY issued_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/certificates/:certId
router.get('/:certId', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM certificate_metadata WHERE cert_id = $1',
      [req.params.certId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Certificate not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/certificates  (issuer saves metadata after on-chain issuance)
// Body: { cert_id, holder_address, name, description?, institution?, course_name?, tx_hash?, issued_at?, expires_at?, file_url? }
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { cert_id, holder_address, name, description, institution, course_name, tx_hash, issued_at, expires_at, file_url } = req.body;

    if (!cert_id || !holder_address || !name) {
      return res.status(400).json({ error: 'cert_id, holder_address, and name are required' });
    }

    const result = await pool.query(
      `INSERT INTO certificate_metadata
         (cert_id, holder_address, issuer_address, name, description, institution, course_name, tx_hash, issued_at, expires_at, file_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        cert_id,
        holder_address.toLowerCase(),
        req.walletAddress,
        name,
        description   || null,
        institution   || null,
        course_name   || null,
        tx_hash       || null,
        issued_at     || new Date(),
        expires_at    || null,
        file_url      || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Certificate ID already exists' });
    }
    next(err);
  }
});

// PATCH /api/certificates/:certId/revoke  (mirror on-chain revoke in the DB)
router.patch('/:certId/revoke', requireAuth, async (req, res, next) => {
  try {
    const { reason } = req.body;
    const result = await pool.query(
      `UPDATE certificate_metadata
       SET status = 'REVOKED', revoke_reason = $1
       WHERE cert_id = $2
       RETURNING *`,
      [reason || '', req.params.certId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Certificate not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
