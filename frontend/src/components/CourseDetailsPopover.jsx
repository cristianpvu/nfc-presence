import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import { formatDate, formatInterval, isLive } from '../format';

const GAP = 8;
const MARGIN = 12;

export default function CourseDetailsPopover({ course, anchor, onClose }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({ visibility: 'hidden' });

  const place = useCallback(() => {
    const target = anchor.getBoundingClientRect();
    const { width, height } = ref.current.getBoundingClientRect();
    const fitsRight = target.right + GAP + width <= window.innerWidth - MARGIN;
    const left = fitsRight ? target.right + GAP : Math.max(MARGIN, target.left - GAP - width);
    const top = Math.max(MARGIN, Math.min(target.top, window.innerHeight - MARGIN - height));
    setStyle({ top, left });
  }, [anchor]);

  useLayoutEffect(() => {
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [place]);

  useEffect(() => {
    const close = event => !ref.current.contains(event.target) && !anchor.contains(event.target) && onClose();
    const closeOnEscape = event => event.key === 'Escape' && onClose();
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [anchor, onClose]);

  return (
    <div ref={ref} className="modal course-popover" style={style} role="dialog" aria-label={course.name}>
      <div className="modal-header">
        <h3>{course.name}</h3>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Închide">
          <Icon name="close" />
        </button>
      </div>
      <div className="modal-body">
        {isLive(course) && <span className="live-badge">În desfășurare</span>}
        <ul className="course-details">
          <li><Icon name="courses" />{formatDate(course.startsAt)}</li>
          <li><Icon name="clock" />{formatInterval(course)}</li>
          <li><Icon name="pin" />{course.room.name}</li>
        </ul>
        <div className="form-actions">
          <Link to={`/courses/${course._id}`} className="btn btn-primary">Deschide cursul</Link>
        </div>
      </div>
    </div>
  );
}
