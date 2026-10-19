import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import Header from '../components/Header';
import { formatDate, formatInterval, hasEnded, isLive } from '../format';

const PAGE_SIZE = 15;

export default function Courses() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api('/api/courses', { auth: true })
      .then(data => {
        if (!active) return;
        const live = location.state?.fromLogin && data.find(course => isLive(course));
        if (live) navigate(`/courses/${live._id}`, { replace: true });
        else setCourses(data);
      })
      .catch(err => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [location.state, navigate]);

  const pageCount = Math.max(1, Math.ceil((courses?.length ?? 0) / PAGE_SIZE));
  const firstCurrent = courses ? courses.findIndex(course => !hasEnded(course)) : -1;
  const defaultPage = firstCurrent === -1 ? pageCount : Math.floor(firstCurrent / PAGE_SIZE) + 1;
  const requested = Number(searchParams.get('page'));
  const page = Number.isInteger(requested) && requested >= 1 && requested <= pageCount ? requested : defaultPage;
  const visible = courses?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? [];

  const goTo = target => setSearchParams({ page: String(target) });

  return (
    <>
      <Header />
      <main className="page">
        <h2 className="page-title">Cursurile mele</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        {!courses && !error && <p className="muted">Se încarcă...</p>}
        {courses?.length === 0 && <p className="muted">Nu aveți cursuri.</p>}
        {courses?.length > 0 && (
          <>
            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Curs</th>
                    <th>Data</th>
                    <th>Interval</th>
                    <th>Sala</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(course => (
                    <tr key={course._id} className={isLive(course) ? 'row-live' : undefined}>
                      <td><Link to={`/courses/${course._id}`}>{course.name}</Link></td>
                      <td>{formatDate(course.startsAt)}</td>
                      <td>{formatInterval(course)}</td>
                      <td>{course.room.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pageCount > 1 && (
              <nav className="pagination" aria-label="Paginare">
                <button type="button" className="page-link" disabled={page === 1} onClick={() => goTo(page - 1)}>«</button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map(number => (
                  <button
                    key={number}
                    type="button"
                    className={number === page ? 'page-link active' : 'page-link'}
                    onClick={() => goTo(number)}
                  >
                    {number}
                  </button>
                ))}
                <button type="button" className="page-link" disabled={page === pageCount} onClick={() => goTo(page + 1)}>»</button>
              </nav>
            )}
          </>
        )}
      </main>
    </>
  );
}
