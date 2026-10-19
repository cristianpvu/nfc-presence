import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import { dayKey, formatMonth, formatTime, isLive } from '../format';

const WEEKDAYS = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];

function currentMonth() {
  const [year, month] = dayKey(Date.now()).split('-').map(Number);
  return { year, month: month - 1 };
}

function buildWeeks(year, month) {
  const offset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const weekCount = Math.ceil((offset + daysInMonth) / 7);

  return Array.from({ length: weekCount }, (_, week) => Array.from({ length: 7 }, (_, weekday) => {
    const date = new Date(Date.UTC(year, month, 1 - offset + week * 7 + weekday));
    return {
      key: date.toISOString().slice(0, 10),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === month,
    };
  }));
}

export default function CourseCalendar({ courses }) {
  const [{ year, month }, setMonth] = useState(currentMonth);
  const today = dayKey(Date.now());

  const coursesByDay = useMemo(() => {
    const groups = new Map();
    for (const course of courses) {
      const key = dayKey(course.startsAt);
      groups.set(key, [...(groups.get(key) ?? []), course]);
    }
    return groups;
  }, [courses]);

  const shift = delta => {
    const date = new Date(Date.UTC(year, month + delta, 1));
    setMonth({ year: date.getUTCFullYear(), month: date.getUTCMonth() });
  };

  return (
    <div className="card">
      <div className="calendar-toolbar">
        <button type="button" className="btn btn-outline" onClick={() => setMonth(currentMonth())}>Astăzi</button>
        <button type="button" className="btn btn-outline btn-icon" onClick={() => shift(-1)} aria-label="Luna anterioară">
          <Icon name="left" />
        </button>
        <button type="button" className="btn btn-outline btn-icon" onClick={() => shift(1)} aria-label="Luna următoare">
          <Icon name="right" />
        </button>
        <h3>{formatMonth(year, month)}</h3>
      </div>

      <div className="calendar">
        {WEEKDAYS.map(name => <div key={name} className="calendar-weekday">{name}</div>)}
        {buildWeeks(year, month).flat().map(cell => (
          <div key={cell.key} className={cell.inMonth ? 'calendar-day' : 'calendar-day outside'}>
            <span className={cell.key === today ? 'calendar-date today' : 'calendar-date'}>{cell.day}</span>
            {coursesByDay.get(cell.key)?.map(course => (
              <Link
                key={course._id}
                to={`/courses/${course._id}`}
                className={isLive(course) ? 'calendar-event live' : 'calendar-event'}
                title={`${formatTime(course.startsAt)} – ${formatTime(course.endsAt)} · ${course.name} · ${course.room.name}`}
              >
                <span className="calendar-time">{formatTime(course.startsAt)}</span> {course.name}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
