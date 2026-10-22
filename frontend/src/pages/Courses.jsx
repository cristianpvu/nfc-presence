import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import CourseCalendar from '../components/CourseCalendar';
import Icon from '../components/Icon';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
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

  const view = searchParams.get('view') === 'list' ? 'list' : 'calendar';

  const goTo = target => setSearchParams({ view: 'list', page: String(target) });
  const showView = target => setSearchParams(target === 'list' ? { view: 'list' } : {});

  return (
    <Layout>
      <div className="page-header">
        <h2 className="page-title">Cursurile mele</h2>
        <div className="view-toggle" role="group" aria-label="Mod de afișare">
          <button
            type="button"
            className={view === 'calendar' ? 'btn btn-outline btn-icon active' : 'btn btn-outline btn-icon'}
            onClick={() => showView('calendar')}
            title="Calendar"
            aria-label="Calendar"
            aria-pressed={view === 'calendar'}
          >
            <Icon name="courses" />
          </button>
          <button
            type="button"
            className={view === 'list' ? 'btn btn-outline btn-icon active' : 'btn btn-outline btn-icon'}
            onClick={() => showView('list')}
            title="Listă"
            aria-label="Listă"
            aria-pressed={view === 'list'}
          >
            <Icon name="list" />
          </button>
        </div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {!courses && !error && <p className="muted">Se încarcă...</p>}
      {courses && view === 'calendar' && <CourseCalendar courses={courses} />}
      {courses?.length === 0 && view === 'list' && <p className="muted">Nu aveți cursuri.</p>}
      {courses?.length > 0 && view === 'list' && (
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

          <Pagination page={page} pageCount={pageCount} onChange={goTo} />
        </>
      )}
    </Layout>
  );
}
