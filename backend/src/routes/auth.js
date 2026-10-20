const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { isValidPassword } = require('../validation');
const { INVALID_LOGIN, INVALID_PASSWORD, WRONG_PASSWORD, NOT_FOUND } = require('../messages');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: INVALID_LOGIN });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: INVALID_LOGIN });
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

router.post('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (typeof currentPassword !== 'string' || !currentPassword) return res.status(400).json({ error: WRONG_PASSWORD });
  if (!isValidPassword(newPassword)) return res.status(400).json({ error: INVALID_PASSWORD });

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: NOT_FOUND });
  if (!(await bcrypt.compare(currentPassword, user.password))) return res.status(400).json({ error: WRONG_PASSWORD });

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.status(204).end();
});

module.exports = router;
