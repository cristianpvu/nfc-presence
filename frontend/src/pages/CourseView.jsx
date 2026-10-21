import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API_URL, api } from '../api';
import { getSession, isAdmin } from '../session';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import IconButton from '../components/IconButton';
import Pagination from '../components/Pagination';
import SeatMap from '../components/SeatMap';
import AddAttendanceModal from '../components/AddAttendanceModal';
import { formatDate, formatInterval, formatTime } from '../format';
import { exportAttendance } from '../exportCsv';
import { searchable } from '../names';

const PAGE_SIZE = 15;

export default function CourseView() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selection, setSelection] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [adding, setAdding] = useState(false);
  const mapRef = useRef(null);
  const selectFromMap = useCallback(deskId => setSelection(deskId && { deskId, fromList: false }), []);
  const addAttendance = useCallback(entry => {
    setData(current => {
      if (!current || current.attendances.some(item => item._id === entry._id)) return current;
      return { ...current, attendances: [entry, ...current.attendances] };
    });
  }, []);
  const closeAddModal = useCallback(() => setAdding(false), []);

  useEffect(() => {
    let active = true;

    const load = () => api(`/api/courses/${id}`, { auth: true })
      .then(result => active && setData(result))
      .catch(err => active && setError(err.message));

    load();

    const socket = io(API_URL || window.location.origin, { auth: { token: getSession()?.token } });
    socket.on('connect', () => socket.emit('join', id, () => load()));
    socket.on('attendance-removed', ({ _id }) => {
      setData(current => current && { ...current, attendances: current.attendances.filter(item => item._id !== _id) });
    });
    socket.on('attendance', addAttendance);

    return () => {
      active = false;
      socket.disconnect();
    };
  }, [id, addAttendance]);

  const occupants = useMemo(
    () => new Map(data?.attendances.filter(item => item.desk).map(item => [item.desk, item])),
    [data]
  );

  const deskLabels = useMemo(
    () => new Map(data?.desks.map(desk => [desk._id, desk.label])),
    [data]
  );

  if (!data) {
    return (
      <Layout>
        {error ? <div className="alert alert-danger">{error}</div> : <p className="muted">Se încarcă...</p>}
      </Layout>
    );
  }

  const { course, desks, attendances } = data;
  const admin = isAdmin();

  async function removeAttendance(item) {
    if (!window.confirm(`Ștergi prezența lui ${item.studentName}?`)) return;
    try {
      await api(`/api/admin/attendances/${item._id}`, { method: 'DELETE', auth: true });
      setData(current => ({ ...current, attendances: current.attendances.filter(entry => entry._id !== item._id) }));
    } catch (err) {
      window.alert(err.message);
    }
  }

  function showOnMap(item) {
    if (!item.desk) return;
    setSelection({ deskId: item.desk, fromList: true });
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function updateSearch(event) {
    setSearch(event.target.value);
    setPage(1);
  }

  const query = searchable(search.trim());
  const rows = attendances
    .map((item, index) => ({ item, number: attendances.length - index }))
    .filter(({ item }) => !query || searchable(item.studentName).includes(query) || searchable(item.studentId).includes(query));
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const firstIndex = (currentPage - 1) * PAGE_SIZE;

  return (
    <Layout>
      <nav className="breadcrumb">
        <Link to={admin ? '/admin/courses' : '/'}>{admin ? 'Cursuri' : 'Cursurile mele'}</Link>
        <span>/</span>
        <span>{course.name}</span>
      </nav>

      <div className="title-row">
        <h2 className="page-title">{course.name}</h2>
        {attendances.length > 0 && (
          <button
            type="button"
            className="btn btn-outline btn-icon"
            onClick={() => exportAttendance(course, attendances, deskLabels)}
            title="Exportă prezența (CSV)"
            aria-label="Exportă prezența (CSV)"
          >
            <Icon name="export" />
          </button>
        )}
      </div>
      <p className="course-meta">
        {formatDate(course.startsAt)} · {formatInterval(course)} · {course.room.name}
      </p>

      <section className="card" ref={mapRef}>
        <div className="card-body">
          <SeatMap
            desks={desks}
            occupants={occupants}
            selectedId={selection?.deskId}
            highlighted={selection?.fromList}
            onSelect={selectFromMap}
            flipped={flipped}
          />
          <div className="map-footer">
            <button
              type="button"
              className="map-flip"
              onClick={() => setFlipped(!flipped)}
              title={flipped ? 'Catedra jos' : 'Catedra sus'}
              aria-label={flipped ? 'Catedra jos' : 'Catedra sus'}
              aria-pressed={flipped}
            >
              <Icon name="flip" />
            </button>
            <p className="occupancy muted">{occupants.size} din {desks.length} locuri ocupate</p>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Studenți prezenți</h3>
          <div className="card-actions">
            <IconButton icon="plus" label="Adaugă prezență" onClick={() => setAdding(true)} />
            {attendances.length > 0 && (
              <label className="search">
                <Icon name="search" />
                <input className="form-control" type="search" value={search} onChange={updateSearch} placeholder="Caută" aria-label="Caută" />
              </label>
            )}
          </div>
        </div>
        {attendances.length === 0 && <p className="card-body muted">Niciun student nu și-a înregistrat încă prezența.</p>}
        {attendances.length > 0 && rows.length === 0 && <p className="card-body muted">Niciun student găsit.</p>}
        {rows.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nume complet</th>
                <th>ID student</th>
                <th>Banca</th>
                <th>Ora</th>
                {admin && <th />}
              </tr>
            </thead>
            <tbody>
              {rows.slice(firstIndex, firstIndex + PAGE_SIZE).map(({ item, number }) => (
                <tr
                  key={item._id}
                  className={selection?.fromList && item.desk === selection.deskId ? 'attendance-row selected' : 'attendance-row'}
                  onClick={() => showOnMap(item)}
                  onKeyDown={event => event.key === 'Enter' && showOnMap(item)}
                  tabIndex={0}
                >
                  <td>{number}</td>
                  <td>{item.studentName}</td>
                  <td>{item.studentId || '—'}</td>
                  <td>{deskLabels.get(item.desk) ?? '—'}</td>
                  <td>{formatTime(item.createdAt)}</td>
                  {admin && (
                    <td className="table-actions" onClick={event => event.stopPropagation()}>
                      <IconButton icon="trash" label="Șterge prezența" onClick={() => removeAttendance(item)} danger />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />

      {adding && <AddAttendanceModal courseId={course._id} onAdded={addAttendance} onClose={closeAddModal} />}
    </Layout>
  );
}
