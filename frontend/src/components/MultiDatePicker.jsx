import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { buildWeeks } from './CourseCalendar';
import { dayKey, formatMonth } from '../format';

const WEEKDAYS = ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'];
const MARGIN = 12;

const shortDay = date => date.split('-').reverse().join('.');

function monthOf(key) {
  const [year, month] = key.split('-').map(Number);
  return { year, month: month - 1 };
}

function summary(dates) {
  if (dates.length === 0) return 'Alege datele';
  if (dates.length === 1) return shortDay(dates[0]);
  return `${dates.length} date selectate`;
}

export default function MultiDatePicker({ value, onChange }) {
  const [draft, setDraft] = useState(null);
  const [{ year, month }, setMonth] = useState(() => monthOf(dayKey(Date.now())));
  const [style, setStyle] = useState({ visibility: 'hidden' });
  const wrapRef = useRef(null);
  const toggleRef = useRef(null);
  const popoverRef = useRef(null);
  const open = draft !== null;
  const today = dayKey(Date.now());

  const place = useCallback(() => {
    const target = toggleRef.current.getBoundingClientRect();
    const { width, height } = popoverRef.current.getBoundingClientRect();
    const fitsBelow = target.bottom + 4 + height <= window.innerHeight - MARGIN;
    const top = fitsBelow ? target.bottom + 4 : Math.max(MARGIN, target.top - 4 - height);
    const left = Math.max(MARGIN, Math.min(target.left, window.innerWidth - MARGIN - width));
    setStyle({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const close = event => !wrapRef.current.contains(event.target) && setDraft(null);
    const closeOnEscape = event => event.key === 'Escape' && setDraft(null);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  function show() {
    setMonth(monthOf(value[0] ?? today));
    setStyle({ visibility: 'hidden' });
    setDraft(value);
  }

  function shift(delta) {
    const date = new Date(Date.UTC(year, month + delta, 1));
    setMonth({ year: date.getUTCFullYear(), month: date.getUTCMonth() });
  }

  const toggle = key => setDraft(draft.includes(key) ? draft.filter(item => item !== key) : [...draft, key]);

  function save() {
    onChange([...draft].sort());
    setDraft(null);
  }

  function dayClass(cell) {
    return ['multi-date-day', !cell.inMonth && 'outside', cell.key === today && 'today', draft.includes(cell.key) && 'selected']
      .filter(Boolean)
      .join(' ');
  }

  return (
    <div className="multi-date" ref={wrapRef}>
      <button
        ref={toggleRef}
        type="button"
        className="form-control multi-date-toggle"
        onClick={() => (open ? setDraft(null) : show())}
        aria-expanded={open}
      >
        <span>{summary(value)}</span>
        <Icon name="courses" />
      </button>

      {value.length > 1 && (
        <div className="date-chips">
          {value.map(date => (
            <span key={date} className="date-chip">
              {shortDay(date)}
              <button type="button" onClick={() => onChange(value.filter(item => item !== date))} aria-label={`Elimină ${shortDay(date)}`}>
                <Icon name="close" />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div ref={popoverRef} className="multi-date-popover" style={style} role="dialog" aria-label="Alege datele">
          <div className="multi-date-header">
            <strong>{formatMonth(year, month)}</strong>
            <div className="multi-date-nav">
              <button type="button" className="modal-close" onClick={() => shift(-1)} aria-label="Luna anterioară">
                <Icon name="left" />
              </button>
              <button type="button" className="modal-close" onClick={() => shift(1)} aria-label="Luna următoare">
                <Icon name="right" />
              </button>
            </div>
          </div>
          <div className="multi-date-grid">
            {WEEKDAYS.map(name => <span key={name} className="multi-date-weekday">{name}</span>)}
            {buildWeeks(year, month).flat().map(cell => (
              <button
                key={cell.key}
                type="button"
                className={dayClass(cell)}
                onClick={() => toggle(cell.key)}
                aria-pressed={draft.includes(cell.key)}
              >
                {cell.day}
              </button>
            ))}
          </div>
          <div className="multi-date-footer">
            <span className="muted">{draft.length} selectate</span>
            <button type="button" className="btn btn-outline" onClick={() => setDraft(null)}>Anulează</button>
            <button type="button" className="btn btn-primary" onClick={save}>Salvează</button>
          </div>
        </div>
      )}
    </div>
  );
}
