function pageItems(page, count) {
  if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, 'end', count];
  if (page >= count - 3) return [1, 'start', count - 4, count - 3, count - 2, count - 1, count];
  return [1, 'start', page - 1, page, page + 1, 'end', count];
}

export default function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;

  return (
    <nav className="pagination" aria-label="Paginare">
      <button type="button" className="page-link" disabled={page === 1} onClick={() => onChange(page - 1)}>«</button>
      {pageItems(page, pageCount).map(item => (typeof item === 'string' ? (
        <span key={item} className="page-link page-gap">…</span>
      ) : (
        <button
          key={item}
          type="button"
          className={item === page ? 'page-link active' : 'page-link'}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      )))}
      <button type="button" className="page-link" disabled={page === pageCount} onClick={() => onChange(page + 1)}>»</button>
    </nav>
  );
}
