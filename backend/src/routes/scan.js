const express = require('express');
const jwt = require('jsonwebtoken');
const Desk = require('../models/Desk');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const verifyTag = require('../verifyTag');
const logScan = require('../scanLog');
const { isValidDeviceId } = require('../validation');
const { TAP_AGAIN, UNKNOWN_DESK, NO_COURSE, SEAT_TAKEN, DEVICE_USED, INVALID_DEVICE } = require('../messages');

const router = express.Router();

router.post('/', async (req, res) => {
  const { picc, uid, ctr, cmac, deviceId } = req.body ?? {};
  if (!isValidDeviceId(deviceId)) return res.status(400).json({ error: INVALID_DEVICE });

  if (!cmac) {
    logScan(req, 'link_missing');
    return res.status(401).json({ error: TAP_AGAIN });
  }

  let tagUid;
  try {
    tagUid = await verifyTag({ picc, uid, ctr, cmac });
  } catch (err) {
    logScan(req, 'verify_down');
    throw err;
  }
  if (!tagUid) {
    logScan(req, 'link_invalid');
    return res.status(401).json({ error: TAP_AGAIN });
  }

  const desk = await Desk.findOne({ tagUid });
  if (!desk) {
    logScan(req, 'tag_unknown', { tagUid });
    return res.status(404).json({ error: UNKNOWN_DESK });
  }

  const now = new Date();
  const course = await Course.findOne({ room: desk.room, startsAt: { $lte: now }, endsAt: { $gte: now } })
    .sort({ startsAt: 1 });
  if (!course) {
    logScan(req, 'no_course', { tagUid, desk: desk._id });
    return res.status(404).json({ error: NO_COURSE });
  }

  const place = { tagUid, desk: desk._id, course: course._id };
  if (await Attendance.exists({ course: course._id, deviceId })) {
    logScan(req, 'browser_used', place);
    return res.status(409).json({ error: DEVICE_USED });
  }
  if (await Attendance.exists({ course: course._id, desk: desk._id })) {
    logScan(req, 'seat_taken', place);
    return res.status(409).json({ error: SEAT_TAKEN });
  }

  const token = jwt.sign(
    { courseId: course._id, deskId: desk._id, deviceId },
    process.env.SCAN_TOKEN_SECRET,
    { expiresIn: '5m' }
  );

  logScan(req, 'scan_ok', place);
  res.json({
    token,
    course: { name: course.name, startsAt: course.startsAt, endsAt: course.endsAt },
  });
});

module.exports = router;
