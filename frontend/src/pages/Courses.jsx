import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import Header from '../components/Header';
import { STATUS_LABELS, courseStatus, formatDate, formatInterval } from '../format';

export default function Courses() {
  const navigate = useNavigate();
  const location = useLocation();
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api('/api/courses', { auth: true })
      .then(data => {
        if (!active) return;
        const live = location.state?.fromLogin && data.find(course => courseStatus(course) === 'live');
        if (live) navigate(`/courses/${live._id}`, { replace: true });
        else setCourses(data);
      })
      .catch(err => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [location.state, navigate]);

  return (
    <>
      <Header />
      <main className="page">
        <h2 className="page-title">Cursurile mele</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        {!courses && !error && <p className="muted">Se încarcă...</p>}
        {courses?.length === 0 && <p className="muted">Nu aveți cursuri.</p>}
        {courses?.length > 0 && (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Curs</th>
                  <th>Data</th>
                  <th>Interval</th>
                  <th>Sala</th>
                  <th>Stare</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => {
                  const status = courseStatus(course);
                  return (
                    <tr key={course._id}>
                      <td><Link to={`/courses/${course._id}`}>{course.name}</Link></td>
                      <td>{formatDate(course.startsAt)}</td>
                      <td>{formatInterval(course)}</td>
                      <td>{course.room.name}</td>
                      <td><span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
