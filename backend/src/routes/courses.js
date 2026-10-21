const express = require('express');
const Course = require('../models/Course');
const Desk = require('../models/Desk');
const Attendance = require('../models/Attendance');
const ManualAttendance = require('../models/ManualAttendance');
const { requireAuth } = require('../middleware/auth');
const { normalizeName } = require('../validation');
const { NOT_FOUND, INVALID_NAME, INVALID_STUDENT_ID } = require('../messages');

const router = express.Router();

router.use(requireAuth);

const courseFilter = req => (req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, professor: req.user.id });

router.get('/', async (req, res) => {
  const courses = await Course.find({ professor: req.user.id })
    .sort({ startsAt: 1 })
    .select('name room startsAt endsAt')
    .populate('room', 'name');
  res.json(courses);
});

router.get('/:id', async (req, res) => {
  const course = await Course.findOne(courseFilter(req))
    .select('name room startsAt endsAt')
    .populate('room', 'name');
  if (!course) return res.status(404).json({ error: NOT_FOUND });

  const [desks, scanned, manual] = await Promise.all([
    Desk.find({ room: course.room._id }).sort({ row: 1, col: 1 }).select('label row col x y'),
    Attendance.find({ course: course._id }).select('desk studentName studentId createdAt'),
    ManualAttendance.find({ course: course._id }).select('studentName studentId createdAt'),
  ]);
  const attendances = [...scanned, ...manual].sort((a, b) => b.createdAt - a.createdAt);

  res.json({ course, desks, attendances });
});

router.post('/:id/attendances', async (req, res) => {
  const course = await Course.findOne(courseFilter(req)).select('_id');
  if (!course) return res.status(404).json({ error: NOT_FOUND });

  const studentName = normalizeName(req.body?.studentName);
  const studentId = normalizeName(req.body?.studentId);
  if (studentName.length < 3 || studentName.length > 100) return res.status(400).json({ error: INVALID_NAME });
  if (studentId.length > 50) return res.status(400).json({ error: INVALID_STUDENT_ID });

  const attendance = await ManualAttendance.create({ course: course._id, studentName, studentId: studentId || undefined });
  const entry = {
    _id: attendance._id,
    studentName: attendance.studentName,
    studentId: attendance.studentId,
    createdAt: attendance.createdAt,
  };
  req.app.get('io').to(`course:${course._id}`).emit('attendance', entry);

  res.status(201).json(entry);
});

module.exports = router;
