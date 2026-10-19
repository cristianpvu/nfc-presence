const express = require('express');
const DeviceTest = require('../models/DeviceTest');

const router = express.Router();

router.get('/', async (req, res) => {
  const reports = await DeviceTest.find().sort({ createdAt: -1 }).limit(100);
  res.json(reports);
});

router.post('/', async (req, res) => {
  const label = typeof req.body?.label === 'string' ? req.body.label.trim() : '';
  const data = req.body?.data;
  if (!label || label.length > 80) return res.status(400).json({ error: 'Introdu o denumire (max. 80 caractere).' });
  if (!data || typeof data !== 'object' || JSON.stringify(data).length > 20000) {
    return res.status(400).json({ error: 'Date invalide.' });
  }
  const report = await DeviceTest.create({ label, data });
  res.status(201).json(report);
});

module.exports = router;
