const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Room = require('../models/Room');
const Desk = require('../models/Desk');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const ManualAttendance = require('../models/ManualAttendance');
const ScanLog = require('../models/ScanLog');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { parseLayout, buildDesks, describeLayout, summarizeLayout, syncDesks } = require('../layout');
const { bucharestTime, isDay, isTime } = require('../time');
const { isValidPassword } = require('../validation');
const { EVENT_LABELS, describeUserAgent } = require('../logLabels');
const { NOT_FOUND, INVALID_PASSWORD } = require('../messages');

const router = express.Router();

router.use(requireAuth, requireAdmin);

const ROLES = ['admin', 'professor'];
const text = value => (typeof value === 'string' ? value.trim() : '');
const fail = (res, status, error) => res.status(status).json({ error });

router.get('/users', async (req, res) => {
  const users = await User.find().sort({ name: 1 }).select('name email role');
  res.json(users);
});

async function saveUser(req, res, user) {
  const { password } = req.body ?? {};
  const name = text(req.body?.name);
  const email = text(req.body?.email).toLowerCase();
  const role = req.body?.role;

  if (!name) return fail(res, 400, 'Introdu numele complet.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 400, 'Introdu un email valid.');
  if (!ROLES.includes(role)) return fail(res, 400, 'Rol invalid.');
  if (password !== undefined && password !== '' && !isValidPassword(password)) return fail(res, 400, INVALID_PASSWORD);
  if (user.isNew && !password) return fail(res, 400, 'Introdu o parolă.');
  if (String(user._id) === req.user.id && role !== 'admin') {
    return fail(res, 400, 'Nu îți poți elimina propriul rol de administrator.');
  }
  if (!user.isNew && user.role === 'professor' && role !== 'professor' && await Course.exists({ professor: user._id })) {
    return fail(res, 409, 'Profesorul are cursuri asociate.');
  }

  user.set({ name, email, role });
  if (password) user.password = await bcrypt.hash(password, 10);

  try {
    await user.save();
  } catch (err) {
    if (err.code === 11000) return fail(res, 409, 'Există deja un utilizator cu acest email.');
    throw err;
  }
  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
}

router.post('/users', (req, res) => saveUser(req, res, new User()));

router.put('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return fail(res, 404, NOT_FOUND);
  return saveUser(req, res, user);
});

router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user.id) return fail(res, 400, 'Nu îți poți șterge propriul cont.');
  if (await Course.exists({ professor: req.params.id })) return fail(res, 409, 'Profesorul are cursuri asociate.');
  const deleted = await User.findByIdAndDelete(req.params.id);
  if (!deleted) return fail(res, 404, NOT_FOUND);
  res.status(204).end();
});

router.get('/rooms', async (req, res) => {
  const [rooms, desks] = await Promise.all([
    Room.find().sort({ name: 1 }),
    Desk.find().select('room row col y tagUid'),
  ]);
  res.json(rooms.map(room => {
    const roomDesks = desks.filter(desk => String(desk.room) === String(room._id));
    return {
      _id: room._id,
      name: room.name,
      ...summarizeLayout(describeLayout(roomDesks)),
      deskCount: roomDesks.length,
      taggedCount: roomDesks.filter(desk => desk.tagUid).length,
    };
  }));
});

async function saveRoom(req, res, room) {
  const name = text(req.body?.name);
  if (!name) return fail(res, 400, 'Introdu numele sălii.');
  const lines = parseLayout(req.body?.layout);
  if (await Room.exists({ name, _id: { $ne: room._id } })) return fail(res, 409, 'Există deja o sală cu acest nume.');

  await syncDesks(room._id, lines);
  room.name = name;
  await room.save();
  res.json({ _id: room._id, name: room.name });
}

router.post('/layout-preview', (req, res) => {
  const lines = parseLayout(req.body?.layout);
  const desks = buildDesks(lines).map(desk => ({ _id: desk.label, ...desk }));
  res.json({ desks, ...summarizeLayout(lines) });
});

router.post('/rooms', (req, res) => saveRoom(req, res, new Room()));

router.put('/rooms/:id', async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return fail(res, 404, NOT_FOUND);
  return saveRoom(req, res, room);
});

router.delete('/rooms/:id', async (req, res) => {
  if (await Course.exists({ room: req.params.id })) return fail(res, 409, 'Sala are cursuri asociate.');
  const deleted = await Room.findByIdAndDelete(req.params.id);
  if (!deleted) return fail(res, 404, NOT_FOUND);
  await Desk.deleteMany({ room: deleted._id });
  res.status(204).end();
});

router.get('/rooms/:id/desks', async (req, res) => {
  const room = await Room.findById(req.params.id).select('name');
  if (!room) return fail(res, 404, NOT_FOUND);
  const desks = await Desk.find({ room: room._id }).sort({ row: 1, col: 1 }).select('label row col tagUid');
  res.json({ room, desks });
});

router.put('/desks/:id', async (req, res) => {
  const tagUid = text(req.body?.tagUid).toUpperCase();
  if (tagUid && !/^[0-9A-F]{14}$/.test(tagUid)) return fail(res, 400, 'UID-ul trebuie să aibă 14 caractere hexazecimale.');

  const desk = await Desk.findById(req.params.id);
  if (!desk) return fail(res, 404, NOT_FOUND);

  if (tagUid) {
    await Desk.updateMany({ tagUid, _id: { $ne: desk._id } }, { $unset: { tagUid: 1 } });
    desk.tagUid = tagUid;
  } else {
    desk.tagUid = undefined;
  }
  await desk.save();
  res.json({ _id: desk._id, label: desk.label, tagUid: desk.tagUid ?? null });
});

router.get('/courses', async (req, res) => {
  const courses = await Course.find()
    .sort({ startsAt: 1 })
    .populate('room', 'name')
    .populate('professor', 'name');
  res.json(courses);
});

async function saveCourse(req, res, course) {
  const { room, professor, date, start, end } = req.body ?? {};
  const name = text(req.body?.name);

  if (!name) return fail(res, 400, 'Introdu numele cursului.');
  if (!mongoose.isValidObjectId(room) || !await Room.exists({ _id: room })) return fail(res, 400, 'Alege o sală.');
  if (!mongoose.isValidObjectId(professor) || !await User.exists({ _id: professor, role: 'professor' })) {
    return fail(res, 400, 'Alege un profesor.');
  }
  if (!isDay(date) || !isTime(start) || !isTime(end)) return fail(res, 400, 'Data sau ora este invalidă.');

  const startsAt = bucharestTime(date, start);
  const endsAt = bucharestTime(date, end);
  if (endsAt <= startsAt) return fail(res, 400, 'Ora de sfârșit trebuie să fie după ora de început.');

  const overlap = await Course.exists({ room, _id: { $ne: course._id }, startsAt: { $lt: endsAt }, endsAt: { $gt: startsAt } });
  if (overlap) return fail(res, 409, 'Sala are deja un curs în acest interval.');

  course.set({ name, room, professor, startsAt, endsAt });
  await course.save();
  res.json(course);
}

router.post('/courses', (req, res) => saveCourse(req, res, new Course()));

router.put('/courses/:id', async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return fail(res, 404, NOT_FOUND);
  return saveCourse(req, res, course);
});

router.delete('/courses/:id', async (req, res) => {
  const deleted = await Course.findByIdAndDelete(req.params.id);
  if (!deleted) return fail(res, 404, NOT_FOUND);
  await Promise.all([Attendance.deleteMany({ course: deleted._id }), ManualAttendance.deleteMany({ course: deleted._id })]);
  res.status(204).end();
});

router.delete('/attendances/:id', async (req, res) => {
  const deleted = (await Attendance.findByIdAndDelete(req.params.id)) ?? (await ManualAttendance.findByIdAndDelete(req.params.id));
  if (!deleted) return fail(res, 404, NOT_FOUND);
  req.app.get('io').to(`course:${deleted.course}`).emit('attendance-removed', { _id: deleted._id });
  res.status(204).end();
});

const LOG_PAGE_SIZE = 20;
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const plain = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

function nextDay(day) {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, date + 1)).toISOString().slice(0, 10);
}

async function logFilter(query) {
  const conditions = [];
  if (mongoose.isValidObjectId(query.course)) conditions.push({ course: query.course });
  if (isDay(query.date)) {
    conditions.push({ at: { $gte: bucharestTime(query.date, '00:00'), $lt: bucharestTime(nextDay(query.date), '00:00') } });
  }
  const term = text(query.search);
  if (term) {
    const pattern = new RegExp(escapeRegex(term), 'i');
    const matches = label => plain(label).includes(plain(term));
    const events = Object.keys(EVENT_LABELS).filter(event => matches(EVENT_LABELS[event]));
    const userAgents = (await ScanLog.distinct('userAgent')).filter(userAgent => matches(describeUserAgent(userAgent)));
    conditions.push({
      $or: [
        ...['studentName', 'studentId', 'browserId', 'ip', 'tagUid'].map(field => ({ [field]: pattern })),
        { event: { $in: events } },
        { userAgent: { $in: userAgents } },
      ],
    });
  }
  return conditions.length ? { $and: conditions } : {};
}

router.get('/logs', async (req, res) => {
  const filter = await logFilter(req.query);
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const [total, logs] = await Promise.all([
    ScanLog.countDocuments(filter),
    ScanLog.find(filter)
      .sort({ at: -1 })
      .skip((page - 1) * LOG_PAGE_SIZE)
      .limit(LOG_PAGE_SIZE)
      .populate('desk', 'label')
      .populate('course', 'name startsAt')
      .lean(),
  ]);
  res.json({
    logs: logs.map(log => ({ ...log, eventLabel: EVENT_LABELS[log.event] ?? log.event, browser: describeUserAgent(log.userAgent) })),
    total,
    page,
    pageSize: LOG_PAGE_SIZE,
  });
});

module.exports = router;
