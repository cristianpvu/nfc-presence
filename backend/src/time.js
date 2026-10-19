const TIME_ZONE = 'Europe/Bucharest';

const wallClock = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function offsetAt(date) {
  const parts = Object.fromEntries(wallClock.formatToParts(date).map(part => [part.type, part.value]));
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - date.getTime();
}

const isDay = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
const isTime = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

function bucharestTime(day, time) {
  const wall = new Date(`${day}T${time}:00Z`);
  const guess = new Date(wall.getTime() - offsetAt(wall));
  return new Date(wall.getTime() - offsetAt(guess));
}

const todayInBucharest = () => new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date());

module.exports = { bucharestTime, todayInBucharest, isDay, isTime };
