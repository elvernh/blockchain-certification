require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes  = require('./routes/auth');
const certRoutes  = require('./routes/certificates');
const uploadRoutes = require('./routes/upload');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'] }));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/certificates', certRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
