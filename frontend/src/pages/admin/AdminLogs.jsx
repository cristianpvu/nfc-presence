import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import useApi from '../../useApi';
import Layout from '../../components/Layout';
import Icon from '../../components/Icon';
import Pagination from '../../components/Pagination';
import CourseSearch from '../../components/CourseSearch';
import { formatShortDate, formatTime } from '../../format';

const EMPTY_FILTERS = { course: '', date: '', search: '' };

export default function AdminLogs() {
  const { data: courses } = useApi('/api/admin/courses');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setFilters(current => (current.search === search ? current : { ...current, search })), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ ...filters, page: String(page) });
    api(`/api/admin/logs?${query}`, { auth: true })
      .then(data => active && setResult(data))
      .catch(err => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [filters, page]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const setFilter = (field, value) => setFilters(current => (current[field] === value ? current : { ...current, [field]: value }));
  const pageCount = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  return (
    <Layout>
      <div className="page-header">
        <h2 className="page-title">Log</h2>
        <div className="page-filters">
          <CourseSearch courses={courses} onSelect={value => setFilter('course', value)} />
          <input
            className="form-control"
            type="date"
            value={filters.date}
            onChange={event => setFilter('date', event.target.value)}
            aria-label="Data"
          />
          <label className="search">
            <Icon name="search" />
            <input className="form-control" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Caută" aria-label="Caută" />
          </label>
        </div>
      </div>

      {error && <div className="alert alert-danger page-alert">{error}</div>}
      {!result && !error && <p className="muted">Se încarcă...</p>}
      {result?.total === 0 && <p className="muted">Nicio înregistrare.</p>}

      {result?.total > 0 && (
        <>
          <p className="muted log-total">{result.total} înregistrări</p>
          <div className="card">
            <table className="table log-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Eveniment</th>
                  <th>Student</th>
                  <th>Curs, Banca</th>
                  <th>Browser</th>
                  <th>Browser ID, IP</th>
                </tr>
              </thead>
              <tbody>
                {result.logs.map(log => (
                  <tr key={log._id}>
                    <td>
                      {formatShortDate(log.at)}
                      <div className="muted">{formatTime(log.at)}</div>
                    </td>
                    <td>{log.eventLabel}</td>
                    <td>
                      {log.studentName ?? '—'}
                      {log.studentId && <div className="muted">{log.studentId}</div>}
                    </td>
                    <td>
                      {log.course ? <Link to={`/courses/${log.course._id}`}>{log.course.name}</Link> : '—'}
                      {log.desk && <div className="muted">{log.desk.label}</div>}
                    </td>
                    <td title={log.userAgent}>{log.browser}</td>
                    <td className="mono">
                      <span title={log.browserId}>{log.browserId ? log.browserId.slice(0, 8) : '—'}</span>
                      <div className="muted">{log.ip ?? '—'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </>
      )}
    </Layout>
  );
}
