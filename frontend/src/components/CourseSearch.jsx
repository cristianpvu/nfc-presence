import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { formatShortDate, formatTime } from '../format';
import { searchable } from '../names';

const MAX_SUGGESTIONS = 8;

export const courseLabel = course => `${course.name}, ${formatShortDate(course.startsAt)} ${formatTime(course.startsAt)}`;

export default function CourseSearch({ courses, onSelect }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = event => !wrapRef.current?.contains(event.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const term = searchable(query.trim());
  const suggestions = (courses ?? [])
    .filter(course => !term || searchable(courseLabel(course)).includes(term))
    .slice(0, MAX_SUGGESTIONS);

  function choose(course) {
    setQuery(courseLabel(course));
    setOpen(false);
    onSelect(course._id);
  }

  function change(event) {
    setQuery(event.target.value);
    setActive(0);
    setOpen(true);
    onSelect('');
  }

  function keyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive(index => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(index => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && open && suggestions[active]) {
      event.preventDefault();
      choose(suggestions[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="course-search" ref={wrapRef}>
      <label className="search">
        <Icon name="search" />
        <input
          className="form-control"
          type="search"
          value={query}
          onChange={change}
          onFocus={() => setOpen(true)}
          onKeyDown={keyDown}
          placeholder="Toate cursurile"
          aria-label="Curs"
          autoComplete="off"
        />
      </label>
      {open && (
        <ul className="suggestions" role="listbox">
          {suggestions.length === 0 && <li className="suggestion muted">Niciun curs găsit.</li>}
          {suggestions.map((course, index) => (
            <li
              key={course._id}
              role="option"
              aria-selected={index === active}
              className={index === active ? 'suggestion active' : 'suggestion'}
              onMouseDown={event => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(course)}
            >
              {courseLabel(course)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
