require('dotenv').config({ quiet: true });

const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const scanRoutes = require('./routes/scan');
const attendanceRoutes = require('./routes/attendance');
const nfcRoutes = require('./routes/nfc');
const adminRoutes = require('./routes/admin');
const deviceTestRoutes = require('./routes/deviceTest');
const registerSocket = require('./socket');
const { NOT_FOUND, SERVER_ERROR } = require('./messages');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_ORIGIN } });

app.set('io', io);
app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/nfc', nfcRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/device-test', deviceTestRoutes);

app.use((req, res) => res.status(404).json({ error: NOT_FOUND }));

app.use((err, req, res, next) => {
  if (err.name === 'CastError') return res.status(404).json({ error: NOT_FOUND });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.expose ? err.message : SERVER_ERROR });
});

registerSocket(io);

async function start() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  const port = process.env.PORT || 4000;
  server.listen(port, () => console.log(`Server running on port ${port}`));
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});
