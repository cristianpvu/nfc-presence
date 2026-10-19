import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import useApi from '../../useApi';
import Layout from '../../components/Layout';
import Pagination from '../../components/Pagination';
import FormCard, { Field } from '../../components/FormCard';
import IconButton from '../../components/IconButton';
import Icon from '../../components/Icon';
import { dayKey, formatDate, formatInterval, formatTime, hasEnded, isLive } from '../../format';

const PAGE_SIZE = 15;
const EMPTY = { name: '', room: '', professor: '', date: '', start: '', end: '' };

export default function AdminCourses() {
  const { data: courses, error: loadError, reload } = useApi('/api/admin/courses');
  const { data: rooms } = useApi('/api/admin/rooms');
  const { data: users } = useApi('/api/admin/users');
  const [searchParams, setSearchParams] = useSearchParams();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const professors = users?.filter(user => user.role === 'professor') ?? [];
  const update = field => event => setForm({ ...form, [field]: event.target.value });

  const pageCount = Math.max(1, Math.ceil((courses?.length ?? 0) / PAGE_SIZE));
  const firstCurrent = courses ? courses.findIndex(course => !hasEnded(course)) : -1;
  const defaultPage = firstCurrent === -1 ? pageCount : Math.floor(firstCurrent / PAGE_SIZE) + 1;
  const requested = Number(searchParams.get('page'));
  const page = Number.isInteger(requested) && requested >= 1 && requested <= pageCount ? requested : defaultPage;
  const visible = courses?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? [];

  function open(course) {
    setEditing(course);
    setForm(course._id
      ? {
        name: course.name,
        room: course.room._id,
        professor: course.professor._id,
        date: dayKey(course.startsAt),
        start: formatTime(course.startsAt),
        end: formatTime(course.endsAt),
      }
      : EMPTY);
    setFormError('');
  }

  async function save() {
    setSaving(true);
    setFormError('');
    try {
      await api(editing._id ? `/api/admin/courses/${editing._id}` : '/api/admin/courses', {
        method: editing._id ? 'PUT' : 'POST',
        body: form,
        auth: true,
      });
      setEditing(null);
      reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(course) {
    if (!window.confirm(`Ștergi cursul „${course.name}” din ${formatDate(course.startsAt)}? Se vor șterge și prezențele aferente.`)) return;
    setError('');
    try {
      await api(`/api/admin/courses/${course._id}`, { method: 'DELETE', auth: true });
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <h2 className="page-title">Cursuri</h2>
        <button type="button" className="btn btn-primary btn-with-icon" onClick={() => open({})}>
          <Icon name="plus" />
          Adaugă
        </button>
      </div>

      {(error || loadError) && <div className="alert alert-danger page-alert">{error || loadError}</div>}

      {editing && (
        <FormCard
          title={editing._id ? 'Editează cursul' : 'Curs nou'}
          error={formError}
          saving={saving}
          onSubmit={save}
          onCancel={() => setEditing(null)}
        >
          <Field label="Nume curs">
            <input className="form-control" value={form.name} onChange={update('name')} autoFocus />
          </Field>
          <Field label="Sala">
            <select className="form-control" value={form.room} onChange={update('room')}>
              <option value="">Alege sala</option>
              {rooms?.map(room => <option key={room._id} value={room._id}>{room.name}</option>)}
            </select>
          </Field>
          <Field label="Profesor">
            <select className="form-control" value={form.professor} onChange={update('professor')}>
              <option value="">Alege profesorul</option>
              {professors.map(user => <option key={user._id} value={user._id}>{user.name}</option>)}
            </select>
          </Field>
          <Field label="Data">
            <input className="form-control" type="date" value={form.date} onChange={update('date')} />
          </Field>
          <Field label="Ora de început">
            <input className="form-control" type="time" value={form.start} onChange={update('start')} />
          </Field>
          <Field label="Ora de sfârșit">
            <input className="form-control" type="time" value={form.end} onChange={update('end')} />
          </Field>
        </FormCard>
      )}

      {courses?.length === 0 && <p className="muted">Nu există cursuri.</p>}

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
                  <th>Profesor</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map(course => (
                  <tr key={course._id} className={isLive(course) ? 'row-live' : undefined}>
                    <td><Link to={`/courses/${course._id}`}>{course.name}</Link></td>
                    <td>{formatDate(course.startsAt)}</td>
                    <td>{formatInterval(course)}</td>
                    <td>{course.room?.name}</td>
                    <td>{course.professor?.name}</td>
                    <td className="table-actions">
                      <IconButton icon="edit" label="Editează" onClick={() => open(course)} />
                      <IconButton icon="trash" label="Șterge" onClick={() => remove(course)} danger />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pageCount={pageCount} onChange={target => setSearchParams({ page: String(target) })} />
        </>
      )}
    </Layout>
  );
}
