const Desk = require('./models/Desk');
const Attendance = require('./models/Attendance');

function buildDesks(rows, groups) {
  const desks = [];
  for (let row = 1; row <= rows; row++) {
    let col = 1;
    let seat = 1;
    for (const size of groups) {
      for (let i = 0; i < size; i++) desks.push({ row, col: col++, label: `R${row}-${seat++}` });
      col++;
    }
  }
  return desks;
}

function describeLayout(desks) {
  const rows = Math.max(0, ...desks.map(desk => desk.row));
  const cols = desks.filter(desk => desk.row === 1).map(desk => desk.col).sort((a, b) => a - b);
  const groups = [];
  cols.forEach((col, index) => {
    if (index === 0 || col !== cols[index - 1] + 1) groups.push(0);
    groups[groups.length - 1]++;
  });
  return { rows, groups };
}

const isValidLayout = (rows, groups) => Number.isInteger(rows) && rows >= 1 && rows <= 50
  && Array.isArray(groups) && groups.length >= 1 && groups.length <= 10
  && groups.every(size => Number.isInteger(size) && size >= 1 && size <= 30);

async function syncDesks(roomId, rows, groups) {
  const desks = buildDesks(rows, groups);
  const labels = desks.map(desk => desk.label);

  const removed = await Desk.find({ room: roomId, label: { $nin: labels } }).distinct('_id');
  if (removed.length && await Attendance.exists({ desk: { $in: removed } })) {
    throw Object.assign(new Error('Unele bănci eliminate au prezențe înregistrate.'), { status: 409, expose: true });
  }

  await Desk.bulkWrite(desks.map(desk => ({
    updateOne: {
      filter: { room: roomId, label: desk.label },
      update: { $set: { row: desk.row, col: desk.col } },
      upsert: true,
    },
  })));
  await Desk.deleteMany({ _id: { $in: removed } });
}

module.exports = { buildDesks, describeLayout, isValidLayout, syncDesks };
