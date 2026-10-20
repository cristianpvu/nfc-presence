import { useEffect } from 'react';
import Icon from './Icon';

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const closeOnEscape = event => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={event => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Închide">
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
