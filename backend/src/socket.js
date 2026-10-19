const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Course = require('./models/Course');

module.exports = io => {
  io.use((socket, next) => {
    try {
      socket.user = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', socket => {
    socket.on('join', async (courseId, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        const allowed = mongoose.isValidObjectId(courseId)
          && await Course.exists({ _id: courseId, professor: socket.user.id });
        if (allowed) socket.join(`course:${courseId}`);
        reply(Boolean(allowed));
      } catch (err) {
        console.error('Socket join failed:', err.message);
        reply(false);
      }
    });
  });
};
