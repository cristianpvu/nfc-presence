const Desk = require('./models/Desk');
const Attendance = require('./models/Attendance');

const MAX_LINES = 80;
const MAX_GROUPS = 10;
const MAX_GROUP_SIZE = 40;
const MAX_DESKS = 2000;
const AISLE = /^(-+|—|culoar)$/i;
const REPEAT = /^(\d+)\s*[x×*]\s*(.+)$/i;

const layoutError = (message, status = 400) => Object.assign(new Error(message), { status, expose: true });

const rowWidth = groups => groups.reduce((sum, size) => sum + size, 0) + groups.length - 1;

function parseLine(line) {
  const repeat = line.match(REPEAT);
  const count = repeat ? Number(repeat[1]) : 1;
  const body = repeat ? repeat[2].trim() : line;
  if (count < 1 || count > MAX_LINES) throw layoutError(`Linie invalidă: „${line}”.`);
  if (AISLE.test(body)) return Array(count).fill(null);

  const groups = body.split(/[\s,+]+/).filter(Boolean).map(Number);
  const valid = groups.length >= 1 && groups.length <= MAX_GROUPS
    && groups.every(size => Number.isInteger(size) && size >= 1 && size <= MAX_GROUP_SIZE);
  if (!valid) throw layoutError(`Linie invalidă: „${line}”.`);
  return Array(count).fill(groups);
}

function parseLayout(text) {
  if (typeof text !== 'string') throw layoutError('Configurație invalidă.');
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean).flatMap(parseLine);

  if (!lines.some(Boolean)) throw layoutError('Adaugă cel puțin un rând de bănci.');
  if (lines.length > MAX_LINES) throw layoutError(`Sala poate avea cel mult ${MAX_LINES} rânduri.`);
  if (!lines[0] || !lines[lines.length - 1]) throw layoutError('Culoarul trebuie să fie între două rânduri.');
  const deskCount = lines.filter(Boolean).reduce((sum, groups) => sum + groups.reduce((a, b) => a + b, 0), 0);
  if (deskCount > MAX_DESKS) throw layoutError(`Sala poate avea cel mult ${MAX_DESKS} bănci.`);

  return lines.reverse();
}

function buildDesks(lines) {
  const maxWidth = Math.max(...lines.filter(Boolean).map(rowWidth));
  const desks = [];
  let row = 0;
  lines.forEach((groups, index) => {
    if (!groups) return;
    row++;
    const offset = (maxWidth - rowWidth(groups)) / 2;
    let col = 1;
    let seat = 1;
    for (const size of groups) {
      for (let i = 0; i < size; i++) {
        desks.push({ label: `R${row}-${seat++}`, row, col, x: col + offset, y: index + 1 });
        col++;
      }
      col++;
    }
  });
  return desks;
}

function describeLayout(desks) {
  const byRow = new Map();
  for (const desk of desks) byRow.set(desk.row, [...(byRow.get(desk.row) ?? []), desk]);

  const rows = [...byRow.entries()].sort(([a], [b]) => a - b).map(([, rowDesks]) => {
    const cols = rowDesks.map(desk => desk.col).sort((a, b) => a - b);
    const groups = [];
    cols.forEach((col, index) => {
      if (index === 0 || col !== cols[index - 1] + 1) groups.push(0);
      groups[groups.length - 1]++;
    });
    return { y: rowDesks[0].y ?? rowDesks[0].row, groups };
  });

  const lines = [];
  rows.forEach((row, index) => {
    const gap = index === 0 ? 0 : row.y - rows[index - 1].y - 1;
    for (let i = 0; i < gap; i++) lines.push(null);
    lines.push(row.groups);
  });
  return lines;
}

function formatLayout(lines) {
  const parts = [];
  for (const groups of [...lines].reverse()) {
    const text = groups ? groups.join(' ') : '-';
    const last = parts[parts.length - 1];
    if (last && last.text === text) last.count++;
    else parts.push({ text, count: 1 });
  }
  return parts.map(({ text, count }) => (count > 1 ? `${count} x ${text}` : text)).join('\n');
}

const summarizeLayout = lines => ({
  layout: formatLayout(lines),
  rows: lines.filter(Boolean).length,
  aisles: lines.filter(groups => !groups).length,
});

async function syncDesks(roomId, lines) {
  const desks = buildDesks(lines);
  const labels = desks.map(desk => desk.label);

  const removed = await Desk.find({ room: roomId, label: { $nin: labels } }).select('tagUid');
  const removedIds = removed.map(desk => desk._id);
  if (removedIds.length && await Attendance.exists({ desk: { $in: removedIds } })) {
    throw layoutError('Unele bănci eliminate au prezențe înregistrate.', 409);
  }
  if (removed.some(desk => desk.tagUid)) {
    throw layoutError('Unele bănci eliminate au etichete NFC. Elimină mai întâi etichetele lor.', 409);
  }

  await Desk.bulkWrite(desks.map(desk => ({
    updateOne: {
      filter: { room: roomId, label: desk.label },
      update: { $set: { row: desk.row, col: desk.col, x: desk.x, y: desk.y } },
      upsert: true,
    },
  })));
  await Desk.deleteMany({ _id: { $in: removedIds } });
}

module.exports = { parseLayout, buildDesks, describeLayout, summarizeLayout, syncDesks };
