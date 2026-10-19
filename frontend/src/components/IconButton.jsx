import Icon from './Icon';

export default function IconButton({ icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      className={danger ? 'btn btn-outline btn-icon btn-danger' : 'btn btn-outline btn-icon'}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <Icon name={icon} />
    </button>
  );
}
