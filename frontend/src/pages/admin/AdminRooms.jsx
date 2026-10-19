import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import useApi from '../../useApi';
import Layout from '../../components/Layout';
import FormCard, { Field } from '../../components/FormCard';
import IconButton from '../../components/IconButton';
import Icon from '../../components/Icon';

const EMPTY = { name: '', rows: '5', groups: '4, 4' };

const parseGroups = value => value.split(/[\s,+]+/).filter(Boolean).map(Number);

export default function AdminRooms() {
  const { data: rooms, error: loadError, reload } = useApi('/api/admin/rooms');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = field => event => setForm({ ...form, [field]: event.target.value });

  function open(room) {
    setEditing(room);
    setForm(room._id ? { name: room.name, rows: String(room.rows), groups: room.groups.join(', ') } : EMPTY);
    setFormError('');
  }

  async function save() {
    setSaving(true);
    setFormError('');
    try {
      await api(editing._id ? `/api/admin/rooms/${editing._id}` : '/api/admin/rooms', {
        method: editing._id ? 'PUT' : 'POST',
        body: { name: form.name, rows: Number(form.rows), groups: parseGroups(form.groups) },
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

  async function remove(room) {
    if (!window.confirm(`Ștergi sala „${room.name}”?`)) return;
    setError('');
    try {
      await api(`/api/admin/rooms/${room._id}`, { method: 'DELETE', auth: true });
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <h2 className="page-title">Săli</h2>
        <button type="button" className="btn btn-primary btn-with-icon" onClick={() => open({})}>
          <Icon name="plus" />
          Adaugă
        </button>
      </div>

      {(error || loadError) && <div className="alert alert-danger page-alert">{error || loadError}</div>}

      {editing && (
        <FormCard
          title={editing._id ? 'Editează sala' : 'Sală nouă'}
          error={formError}
          saving={saving}
          onSubmit={save}
          onCancel={() => setEditing(null)}
        >
          <Field label="Nume">
            <input className="form-control" value={form.name} onChange={update('name')} autoFocus />
          </Field>
          <Field label="Rânduri">
            <input className="form-control" type="number" min="1" max="50" value={form.rows} onChange={update('rows')} />
          </Field>
          <Field label="Bănci pe rând, pe grupuri (ex. 4, 4)">
            <input className="form-control" value={form.groups} onChange={update('groups')} />
          </Field>
        </FormCard>
      )}

      {rooms && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Nume</th>
                <th>Configurație</th>
                <th>Bănci</th>
                <th>Etichete NFC</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => (
                <tr key={room._id}>
                  <td><Link to={`/admin/rooms/${room._id}`}>{room.name}</Link></td>
                  <td>{room.rows} rânduri · {room.groups.join(' + ')}</td>
                  <td>{room.deskCount}</td>
                  <td>{room.taggedCount} / {room.deskCount}</td>
                  <td className="table-actions">
                    <IconButton icon="edit" label="Editează" onClick={() => open(room)} />
                    <IconButton icon="trash" label="Șterge" onClick={() => remove(room)} danger />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
