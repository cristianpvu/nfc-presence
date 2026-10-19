export default function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;

  return (
    <nav className="pagination" aria-label="Paginare">
      <button type="button" className="page-link" disabled={page === 1} onClick={() => onChange(page - 1)}>«</button>
      {Array.from({ length: pageCount }, (_, index) => index + 1).map(number => (
        <button
          key={number}
          type="button"
          className={number === page ? 'page-link active' : 'page-link'}
          onClick={() => onChange(number)}
        >
          {number}
        </button>
      ))}
      <button type="button" className="page-link" disabled={page === pageCount} onClick={() => onChange(page + 1)}>»</button>
    </nav>
  );
}
