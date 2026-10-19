const TIME_ZONE = 'Europe/Bucharest';

const dateFormat = new Intl.DateTimeFormat('ro-RO', {
  timeZone: TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const timeFormat = new Intl.DateTimeFormat('ro-RO', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
});

const shortDateFormat = new Intl.DateTimeFormat('ro-RO', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dayKeyFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE });

const monthFormat = new Intl.DateTimeFormat('ro-RO', { timeZone: 'UTC', month: 'long', year: 'numeric' });

export const formatDate = value => dateFormat.format(new Date(value));
export const dayKey = value => dayKeyFormat.format(new Date(value));
export const formatMonth = (year, month) => {
  const text = monthFormat.format(new Date(Date.UTC(year, month, 1)));
  return text[0].toUpperCase() + text.slice(1);
};
export const formatShortDate = value => shortDateFormat.format(new Date(value));
export const formatTime = value => timeFormat.format(new Date(value));
export const formatInterval = course => `${formatTime(course.startsAt)} – ${formatTime(course.endsAt)}`;

export const hasEnded = (course, now = Date.now()) => now > new Date(course.endsAt).getTime();
export const isLive = (course, now = Date.now()) => now >= new Date(course.startsAt).getTime() && !hasEnded(course, now);
