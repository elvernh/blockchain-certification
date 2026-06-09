const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const requireAuth = require('../middleware/auth');

const ALLOWED_EXTS = new Set(['.pdf', '.png', '.jpg', '.jpeg']);

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_EXTS.has(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error('Only PDF, PNG, and JPEG files are allowed'), { status: 400 }));
    }
  },
});

const router = Router();

// POST /api/upload  — multipart/form-data, field name: "file"
router.post('/', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
  });
});

module.exports = router;
