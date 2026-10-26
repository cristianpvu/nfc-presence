import { useMemo, useState } from 'react';
import { api } from '../../api';
import useApi from '../../useApi';
import Layout from '../../components/Layout';
import CourseCalendar from '../../components/CourseCalendar';
import SearchSelect from '../../components/SearchSelect';
import FormCard, { Field } from '../../components/FormCard';
import Icon from '../../components/Icon';
import MultiDatePicker from '../../components/MultiDatePicker';
import { dayKey, formatDate, formatTime } from '../../format';

const EMPTY = { name: '', room: '', professor: '', date: '', start: '', end: '' };

export default function AdminCourses() {
  const { data: courses, error: loadError, reload } = useApi('/api/admin/courses');
  const { data: rooms } = useApi('/api/admin/rooms');
  const { data: users } = useApi('/api/admin/users');
  const [professorFilter, setProfessorFilter] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [dates, setDates] = useState([]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const professors = users?.filter(user => user.role === 'professor') ?? [];
  const update = field => event => setForm({ ...form, [field]: event.target.value });

  const filtered = useMemo(
    () => courses?.filter(course => (!professorFilter || course.professor._id === professorFilter) && (!roomFilter || course.room._id === roomFilter)),
    [courses, professorFilter, roomFilter]
  );

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
    setDates([]);
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save() {
    setSaving(true);
    setFormError('');
    try {
      await api(editing._id ? `/api/admin/courses/${editing._id}` : '/api/admin/courses', {
        method: editing._id ? 'PUT' : 'POST',
        body: editing._id ? form : { ...form, dates },
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
        <div className="page-filters stretch">
          <SearchSelect
            items={professors}
            getLabel={user => user.name}
            placeholder="Toți profesorii"
            label="Profesor"
            emptyText="Niciun profesor găsit."
            onSelect={setProfessorFilter}
          />
          <SearchSelect
            items={rooms}
            getLabel={room => room.name}
            placeholder="Toate sălile"
            label="Sala"
            emptyText="Nicio sală găsită."
            onSelect={setRoomFilter}
          />
          <button type="button" className="btn btn-primary btn-with-icon" onClick={() => open({})}>
            <Icon name="plus" />
            Adaugă
          </button>
        </div>
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
          {editing._id ? (
            <Field label="Data">
              <input className="form-control" type="date" value={form.date} onChange={update('date')} />
            </Field>
          ) : (
            <div className="field">
              <span className="field-label">Date</span>
              <MultiDatePicker value={dates} onChange={setDates} />
            </div>
          )}
          <Field label="Ora de început">
            <input className="form-control" type="time" value={form.start} onChange={update('start')} />
          </Field>
          <Field label="Ora de sfârșit">
            <input className="form-control" type="time" value={form.end} onChange={update('end')} />
          </Field>
        </FormCard>
      )}

      {filtered && <CourseCalendar courses={filtered} onEdit={open} onDelete={remove} />}
    </Layout>
  );
}
