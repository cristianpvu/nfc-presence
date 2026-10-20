const express = require('express');
const jwt = require('jsonwebtoken');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const { isValidDeviceId, normalizeName } = require('../validation');
const { TAP_AGAIN, COURSE_ENDED, SEAT_TAKEN, DEVICE_USED, INVALID_DEVICE, INVALID_NAME, INVALID_STUDENT_ID } = require('../messages');

const router = express.Router();

router.post('/', async (req, res) => {
  const { token, deviceId } = req.body ?? {};
  const studentName = normalizeName(req.body?.studentName);
  const studentId = normalizeName(req.body?.studentId);

  if (studentName.length < 3 || studentName.length > 100) return res.status(400).json({ error: INVALID_NAME });
  if (!studentId || studentId.length > 50) return res.status(400).json({ error: INVALID_STUDENT_ID });
  if (!isValidDeviceId(deviceId)) return res.status(400).json({ error: INVALID_DEVICE });

  let scan;
  try {
    scan = jwt.verify(token, process.env.SCAN_TOKEN_SECRET);
  } catch {
    return res.status(401).json({ error: TAP_AGAIN });
  }
  if (scan.deviceId !== deviceId) return res.status(401).json({ error: TAP_AGAIN });

  const course = await Course.findById(scan.courseId);
  if (!course || course.endsAt < new Date()) return res.status(410).json({ error: COURSE_ENDED });

  let attendance;
  try {
    attendance = await Attendance.create({ course: course._id, desk: scan.deskId, studentName, studentId, deviceId });
  } catch (err) {
    if (err.code !== 11000) throw err;
    return res.status(409).json({ error: err.keyPattern?.deviceId ? DEVICE_USED : SEAT_TAKEN });
  }

  const entry = {
    _id: attendance._id,
    desk: attendance.desk,
    studentName: attendance.studentName,
    studentId: attendance.studentId,
    createdAt: attendance.createdAt,
  };
  req.app.get('io').to(`course:${course._id}`).emit('attendance', entry);

  res.status(201).json(entry);
});

module.exports = router;
