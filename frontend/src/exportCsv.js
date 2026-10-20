import { formatShortDate, formatTime } from './format';

const toPascalCase = text => text
  .normalize('NFD')
  .replace(/\p{M}/gu, '')
  .split(/[^A-Za-z0-9]+/)
  .filter(Boolean)
  .map(word => word[0].toUpperCase() + word.slice(1))
  .join('');

const csvField = value => `"${String(value).replace(/"/g, '""')}"`;

export function exportAttendance(course, attendances, deskLabels) {
  const rows = [
    ['Nume complet', 'ID student', 'Banca', 'Ora'],
    ...attendances.map(item => [item.studentName, item.studentId ?? '', deskLabels.get(item.desk) ?? '', formatTime(item.createdAt)]),
  ];
  const csv = '\uFEFF' + rows.map(row => row.map(csvField).join(',')).join('\r\n');

  const fileTime = value => formatTime(value).replace(':', '.');
  const interval = `${fileTime(course.startsAt)}-${fileTime(course.endsAt)}`;
  const fileName = `${toPascalCase(course.name)}_${formatShortDate(course.startsAt)}_${interval}.csv`;

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
