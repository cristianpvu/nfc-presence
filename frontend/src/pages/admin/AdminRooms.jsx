import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../api';
import useApi from '../../useApi';
import Layout from '../../components/Layout';
import FormCard, { Field } from '../../components/FormCard';
import IconButton from '../../components/IconButton';
import Icon from '../../components/Icon';
import LayoutPreview from '../../components/LayoutPreview';
import SearchSelect from '../../components/SearchSelect';

const EMPTY = { name: '', layout: '5 x 4 4\n-\n4 4' };

export default function AdminRooms() {
  const { data: rooms, error: loadError, reload } = useApi('/api/admin/rooms');
  const initialRoom = useLocation().state?.room;
  const [roomFilter, setRoomFilter] = useState(initialRoom?._id ?? '');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = field => event => setForm({ ...form, [field]: event.target.value });

  function open(room) {
    setEditing(room);
    setForm(room._id ? { name: room.name, layout: room.layout } : EMPTY);
    setFormError('');
  }

  async function save() {
    setSaving(true);
    setFormError('');
    try {
      await api(editing._id ? `/api/admin/rooms/${editing._id}` : '/api/admin/rooms', {
        method: editing._id ? 'PUT' : 'POST',
        body: { name: form.name, layout: form.layout },
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
        <div className="course-filters">
          <SearchSelect
            items={rooms}
            getLabel={room => room.name}
            placeholder="Toate sălile"
            label="Sala"
            emptyText="Nicio sală găsită."
            onSelect={setRoomFilter}
            initialQuery={initialRoom?.name}
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
          title={editing._id ? 'Editează sala' : 'Sală nouă'}
          error={formError}
          saving={saving}
          onSubmit={save}
          onCancel={() => setEditing(null)}
        >
          <Field label="Nume">
            <input className="form-control" value={form.name} onChange={update('name')} autoFocus />
          </Field>
          <Field label="Configurație" wide>
            <textarea className="form-control layout-input" value={form.layout} onChange={update('layout')} rows={8} spellCheck={false} />
          </Field>
          <Field label="Previzualizare" wide>
            <LayoutPreview layout={form.layout} />
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
              {rooms.filter(room => !roomFilter || room._id === roomFilter).map(room => (
                <tr key={room._id}>
                  <td><Link to={`/admin/rooms/${room._id}`}>{room.name}</Link></td>
                  <td>
                    {room.rows} rânduri{room.aisles > 0 && ` · ${room.aisles} ${room.aisles === 1 ? 'culoar' : 'culoare'}`}
                    <div className="mono muted">{room.layout.split('\n').join(' / ')}</div>
                  </td>
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
