import { Link } from 'react-router-dom';
import Icon from './Icon';
import Modal from './Modal';
import { formatDate, formatInterval, isLive } from '../format';

export default function CourseDetailsModal({ course, onClose }) {
  return (
    <Modal title={course.name} onClose={onClose}>
      <div className="modal-body">
        {isLive(course) && <span className="live-badge">În desfășurare</span>}
        <ul className="course-details">
          <li><Icon name="courses" />{formatDate(course.startsAt)}</li>
          <li><Icon name="clock" />{formatInterval(course)}</li>
          <li><Icon name="pin" />{course.room.name}</li>
        </ul>
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Închide</button>
          <Link to={`/courses/${course._id}`} className="btn btn-primary">Deschide cursul</Link>
        </div>
      </div>
    </Modal>
  );
}
