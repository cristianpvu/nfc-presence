import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import { isAdmin } from '../session';
import { formatDate, formatInterval } from '../format';

const GAP = 8;
const MARGIN = 12;

export default function CourseDetailsPopover({ course, anchor, onClose, onEdit, onDelete }) {
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
        <div className="course-popover-actions">
          <Link to={`/courses/${course._id}`} className="modal-close course-popover-open" title="Deschide cursul" aria-label="Deschide cursul">
            <Icon name="open" />
          </Link>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Închide">
            <Icon name="close" />
          </button>
        </div>
      </div>
      <div className="modal-body">
        <ul className="course-details">
          <li><Icon name="courses" />{formatDate(course.startsAt)}</li>
          <li><Icon name="clock" />{formatInterval(course)}</li>
          <li>
            <Icon name="pin" />
            {isAdmin() ? <Link to={`/admin/rooms/${course.room._id}`}>{course.room.name}</Link> : course.room.name}
          </li>
        </ul>
        {onEdit && onDelete && (
          <div className="course-popover-tools">
            <button type="button" className="modal-close" onClick={onEdit} title="Editează" aria-label="Editează">
              <Icon name="edit" />
            </button>
            <button type="button" className="modal-close course-popover-delete" onClick={onDelete} title="Șterge" aria-label="Șterge">
              <Icon name="trash" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
