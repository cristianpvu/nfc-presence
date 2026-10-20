import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import useApi from '../../useApi';
import Layout from '../../components/Layout';
import Icon from '../../components/Icon';
import Pagination from '../../components/Pagination';
import { formatShortDate, formatTime } from '../../format';
import { describeUserAgent } from '../../userAgent';

const EVENTS = {
  scan_ok: { label: 'Scanare validă', tone: 'ok' },
  attendance_ok: { label: 'Prezență înregistrată', tone: 'ok' },
  link_missing: { label: 'Link fără date', tone: 'info' },
  link_invalid: { label: 'Link invalid sau copiat', tone: 'fraud' },
  tag_unknown: { label: 'Etichetă neasociată', tone: 'info' },
  no_course: { label: 'Niciun curs în sală', tone: 'info' },
  browser_used: { label: 'Browser deja folosit', tone: 'fraud' },
  seat_taken: { label: 'Bancă deja ocupată', tone: 'fraud' },
  token_invalid: { label: 'Sesiune expirată sau transferată', tone: 'fraud' },
  course_ended: { label: 'Curs încheiat', tone: 'info' },
  verify_down: { label: 'Serviciu NFC indisponibil', tone: 'info' },
};

const FLAGS = {
  multi_student: 'Browser folosit de mai mulți studenți',
  multi_browser: 'ID student folosit din mai multe browsere',
  many_invalid: 'Multe linkuri invalide din acest browser',
};

const EMPTY_FILTERS = { event: '', course: '', date: '', search: '' };

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

  const update = field => event => setFilters({ ...filters, [field]: event.target.value });
  const pageCount = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  return (
    <Layout>
      <h2 className="page-title">Log</h2>

      <div className="log-filters">
        <select className="form-control" value={filters.event} onChange={update('event')} aria-label="Eveniment">
          <option value="">Toate evenimentele</option>
          <option value="fraud">Doar suspecte</option>
          {Object.entries(EVENTS).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <select className="form-control" value={filters.course} onChange={update('course')} aria-label="Curs">
          <option value="">Toate cursurile</option>
          {courses?.map(course => (
            <option key={course._id} value={course._id}>
              {course.name} · {formatShortDate(course.startsAt)} {formatTime(course.startsAt)}
            </option>
          ))}
        </select>
        <input className="form-control" type="date" value={filters.date} onChange={update('date')} aria-label="Data" />
        <label className="search">
          <Icon name="search" />
          <input className="form-control" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Caută" aria-label="Caută" />
        </label>
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
                  <th>Ora</th>
                  <th>Eveniment</th>
                  <th>Student</th>
                  <th>Curs · Banca</th>
                  <th>Browser</th>
                  <th>Browser ID · IP</th>
                </tr>
              </thead>
              <tbody>
                {result.logs.map(log => {
                  const event = EVENTS[log.event] ?? { label: log.event, tone: 'info' };
                  return (
                    <tr key={log._id}>
                      <td>
                        {formatShortDate(log.at)}
                        <div className="muted">{formatTime(log.at)}</div>
                      </td>
                      <td>
                        <span className={`log-event ${event.tone}`}>{event.label}</span>
                        {log.flags.map(flag => <div key={flag} className="log-flag">⚠ {FLAGS[flag]}</div>)}
                      </td>
                      <td>
                        {log.studentName ?? '—'}
                        {log.studentId && <div className="muted">{log.studentId}</div>}
                      </td>
                      <td>
                        {log.course ? <Link to={`/courses/${log.course._id}`}>{log.course.name}</Link> : '—'}
                        {log.desk && <div className="muted">{log.desk.label}</div>}
                      </td>
                      <td title={log.userAgent}>{describeUserAgent(log.userAgent)}</td>
                      <td className="mono">
                        <span title={log.browserId}>{log.browserId ? log.browserId.slice(0, 8) : '—'}</span>
                        <div className="muted">{log.ip ?? '—'}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </>
      )}
    </Layout>
  );
}
