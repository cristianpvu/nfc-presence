import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import CourseCalendar from '../components/CourseCalendar';
import Layout from '../components/Layout';
import { isLive } from '../format';

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
        const live = location.state?.fromLogin && data.find(course => isLive(course));
        if (live) navigate(`/courses/${live._id}`, { replace: true });
        else setCourses(data);
      })
      .catch(err => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [location.state, navigate]);

  return (
    <Layout>
      <div className="page-header">
        <h2 className="page-title">Cursurile mele</h2>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {!courses && !error && <p className="muted">Se încarcă...</p>}
      {courses && <CourseCalendar courses={courses} />}
    </Layout>
  );
}
