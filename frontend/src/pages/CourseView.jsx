import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API_URL, api } from '../api';
import { getSession } from '../session';
import Layout from '../components/Layout';
import SeatMap from '../components/SeatMap';
import { formatDate, formatInterval, formatTime } from '../format';

export default function CourseView() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const load = () => api(`/api/courses/${id}`, { auth: true })
      .then(result => active && setData(result))
      .catch(err => active && setError(err.message));

    load();

    const socket = io(API_URL || window.location.origin, { auth: { token: getSession()?.token } });
    socket.on('connect', () => socket.emit('join', id, () => load()));
    socket.on('attendance', entry => {
      setData(current => {
        if (!current || current.attendances.some(item => item._id === entry._id)) return current;
        return { ...current, attendances: [...current.attendances, entry] };
      });
    });

    return () => {
      active = false;
      socket.disconnect();
    };
  }, [id]);

  const occupants = useMemo(
    () => new Map(data?.attendances.map(item => [item.desk, item.studentName])),
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

  return (
    <Layout>
      <nav className="breadcrumb">
        <Link to="/">Cursurile mele</Link>
        <span>/</span>
        <span>{course.name}</span>
      </nav>

      <h2 className="page-title">{course.name}</h2>
      <p className="course-meta">
        {formatDate(course.startsAt)} · {formatInterval(course)} · {course.room.name}
      </p>

      <section className="card">
        <div className="card-body">
          <SeatMap desks={desks} occupants={occupants} />
          <p className="occupancy muted">{attendances.length} din {desks.length} bănci ocupate</p>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Studenți prezenți</h3>
        </div>
        {attendances.length === 0 ? (
          <p className="card-body muted">Niciun student nu și-a înregistrat încă prezența.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nume și prenume</th>
                <th>Banca</th>
                <th>Ora</th>
              </tr>
            </thead>
            <tbody>
              {attendances.map((item, index) => (
                <tr key={item._id}>
                  <td>{index + 1}</td>
                  <td>{item.studentName}</td>
                  <td>{deskLabels.get(item.desk)}</td>
                  <td>{formatTime(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </Layout>
  );
}
