const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { SESSION_EXPIRED } = require('../messages');

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: SESSION_EXPIRED });
  }
}

function requireApiKey(req, res, next) {
  const provided = Buffer.from(String(req.headers['x-api-key'] ?? ''));
  const expected = Buffer.from(process.env.NFC_API_KEY);
  if (provided.length === expected.length && crypto.timingSafeEqual(provided, expected)) return next();
  res.status(401).json({ error: 'Invalid API key' });
}

module.exports = { requireAuth, requireApiKey };
