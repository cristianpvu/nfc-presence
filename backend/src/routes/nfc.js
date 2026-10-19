const express = require('express');
const Room = require('../models/Room');
const Desk = require('../models/Desk');
const { requireApiKey } = require('../middleware/auth');

const router = express.Router();

router.use(requireApiKey);

router.get('/rooms', async (req, res) => {
  const rooms = await Room.find().sort({ name: 1 }).select('name');
  res.json(rooms);
});

router.get('/rooms/:id/desks', async (req, res) => {
  const desks = await Desk.find({ room: req.params.id }).sort({ row: 1, col: 1 });
  res.json(desks.map(desk => ({
    _id: desk._id,
    label: desk.label,
    row: desk.row,
    col: desk.col,
    tagUid: desk.tagUid ?? null,
  })));
});

router.post('/desks/:id/bind', async (req, res) => {
  const { uid } = req.body ?? {};
  if (typeof uid !== 'string' || !/^[0-9A-Fa-f]{14}$/.test(uid)) {
    return res.status(400).json({ error: 'Invalid uid' });
  }

  const desk = await Desk.findById(req.params.id);
  if (!desk) return res.status(404).json({ error: 'Desk not found' });

  const tagUid = uid.toUpperCase();
  await Desk.updateMany({ tagUid, _id: { $ne: desk._id } }, { $unset: { tagUid: 1 } });
  desk.tagUid = tagUid;
  await desk.save();

  res.json({ _id: desk._id, label: desk.label, tagUid: desk.tagUid });
});

module.exports = router;
