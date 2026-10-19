const express = require('express');
const jwt = require('jsonwebtoken');
const Desk = require('../models/Desk');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const verifyTag = require('../verifyTag');
const { isValidDeviceId } = require('../validation');
const { TAP_AGAIN, UNKNOWN_DESK, NO_COURSE, SEAT_TAKEN, DEVICE_USED, INVALID_DEVICE } = require('../messages');

const router = express.Router();

router.post('/', async (req, res) => {
  const { picc, uid, ctr, cmac, deviceId } = req.body ?? {};
  if (!isValidDeviceId(deviceId)) return res.status(400).json({ error: INVALID_DEVICE });

  const tagUid = await verifyTag({ picc, uid, ctr, cmac });
  if (!tagUid) return res.status(401).json({ error: TAP_AGAIN });

  const desk = await Desk.findOne({ tagUid });
  if (!desk) return res.status(404).json({ error: UNKNOWN_DESK });

  const now = new Date();
  const course = await Course.findOne({ room: desk.room, startsAt: { $lte: now }, endsAt: { $gte: now } })
    .sort({ startsAt: 1 });
  if (!course) return res.status(404).json({ error: NO_COURSE });

  if (await Attendance.exists({ course: course._id, deviceId })) {
    return res.status(409).json({ error: DEVICE_USED });
  }
  if (await Attendance.exists({ course: course._id, desk: desk._id })) {
    return res.status(409).json({ error: SEAT_TAKEN });
  }

  const token = jwt.sign(
    { courseId: course._id, deskId: desk._id, deviceId },
    process.env.SCAN_TOKEN_SECRET,
    { expiresIn: '5m' }
  );

  res.json({
    token,
    course: { name: course.name, startsAt: course.startsAt, endsAt: course.endsAt },
  });
});

module.exports = router;
