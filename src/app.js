'use strict';

require('dotenv').config();

const express    = require('express');
const authRoutes = require('./routes/authRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Global Middlewares ─────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ── Health check ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint không tồn tại.' });
});

// ── Global Error Handler ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[App] Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Lỗi server không xác định.' });
});

// ── Start Server ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[App] ✅ Server running on http://localhost:${PORT}`);
  console.log(`[App] Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
