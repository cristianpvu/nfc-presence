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

export const formatDate = value => dateFormat.format(new Date(value));
export const formatTime = value => timeFormat.format(new Date(value));
export const formatInterval = course => `${formatTime(course.startsAt)} – ${formatTime(course.endsAt)}`;

export const STATUS_LABELS = {
  upcoming: 'Programat',
  live: 'În desfășurare',
  ended: 'Încheiat',
};

export function courseStatus(course, now = Date.now()) {
  if (now < new Date(course.startsAt).getTime()) return 'upcoming';
  if (now > new Date(course.endsAt).getTime()) return 'ended';
  return 'live';
}
