const { Router } = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = Router();

// POST /api/applications — applier submits a new application
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { name, institution, course_name, description, file_url } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const result = await pool.query(
      `INSERT INTO certificate_applications
         (applicant_address, name, institution, course_name, description, file_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.walletAddress, name, institution || null, course_name || null, description || null, file_url || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/mine — applier views their own applications
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM certificate_applications
       WHERE applicant_address = $1
       ORDER BY created_at DESC`,
      [req.walletAddress]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/pending — authenticator views all applications
router.get('/pending', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM certificate_applications
       ORDER BY
         CASE status WHEN 'PENDING' THEN 0 ELSE 1 END,
         created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/applications/:id/approve — authenticator approves
router.patch('/:id/approve', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cert_id, tx_hash } = req.body;
    if (!cert_id || !tx_hash) return res.status(400).json({ error: 'cert_id and tx_hash are required' });

    const result = await pool.query(
      `UPDATE certificate_applications
       SET status = 'APPROVED',
           authenticator_address = $1,
           cert_id = $2,
           tx_hash = $3,
           reviewed_at = NOW()
       WHERE id = $4 AND status = 'PENDING'
       RETURNING *`,
      [req.walletAddress, cert_id, tx_hash, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Application not found or already reviewed' });

    // Mirror into certificate_metadata so the Viewer portal can find it
    const app = result.rows[0];
    await pool.query(
      `INSERT INTO certificate_metadata
         (cert_id, holder_address, issuer_address, name, institution, course_name,
          description, file_url, tx_hash, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'VALID')
       ON CONFLICT (cert_id) DO NOTHING`,
      [cert_id, app.applicant_address, req.walletAddress, app.name,
       app.institution, app.course_name, app.description, app.file_url, tx_hash]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/applications/:id/reject — authenticator rejects
router.patch('/:id/reject', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reject_reason } = req.body;

    const result = await pool.query(
      `UPDATE certificate_applications
       SET status = 'REJECTED',
           authenticator_address = $1,
           reject_reason = $2,
           reviewed_at = NOW()
       WHERE id = $3 AND status = 'PENDING'
       RETURNING *`,
      [req.walletAddress, reject_reason || 'No reason provided', id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Application not found or already reviewed' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
