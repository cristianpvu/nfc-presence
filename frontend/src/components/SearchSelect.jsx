import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { searchable } from '../names';

const MAX_SUGGESTIONS = 8;

const matches = (text, words) => words.every(word => text.includes(word));

export default function SearchSelect({ items, getLabel, placeholder, label, emptyText, onSelect }) {
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

  const words = searchable(query.trim()).split(/\s+/).filter(Boolean);
  const suggestions = (items ?? [])
    .filter(item => matches(searchable(getLabel(item)), words))
    .slice(0, MAX_SUGGESTIONS);

  function choose(item) {
    setQuery(getLabel(item));
    setOpen(false);
    onSelect(item._id);
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
    <div className="search-select" ref={wrapRef}>
      <label className="search">
        <Icon name="search" />
        <input
          className="form-control"
          type="search"
          value={query}
          onChange={change}
          onFocus={() => setOpen(true)}
          onKeyDown={keyDown}
          placeholder={placeholder}
          aria-label={label}
          autoComplete="off"
        />
      </label>
      {open && (
        <ul className="suggestions" role="listbox">
          {suggestions.length === 0 && <li className="suggestion muted">{emptyText}</li>}
          {suggestions.map((item, index) => (
            <li
              key={item._id}
              role="option"
              aria-selected={index === active}
              className={index === active ? 'suggestion active' : 'suggestion'}
              onMouseDown={event => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(item)}
            >
              {getLabel(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
