const express = require('express');
const Course = require('../models/Course');
const Desk = require('../models/Desk');
const Attendance = require('../models/Attendance');
const { requireAuth } = require('../middleware/auth');
const { NOT_FOUND } = require('../messages');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  const courses = await Course.find({ professor: req.user.id })
    .sort({ startsAt: 1 })
    .select('name room startsAt endsAt')
    .populate('room', 'name');
  res.json(courses);
});

router.get('/:id', async (req, res) => {
  const course = await Course.findOne({ _id: req.params.id, professor: req.user.id })
    .select('name room startsAt endsAt')
    .populate('room', 'name');
  if (!course) return res.status(404).json({ error: NOT_FOUND });

  const [desks, attendances] = await Promise.all([
    Desk.find({ room: course.room._id }).sort({ row: 1, col: 1 }).select('label row col'),
    Attendance.find({ course: course._id }).sort({ createdAt: 1 }).select('desk studentName createdAt'),
  ]);

  res.json({ course, desks, attendances });
});

module.exports = router;
