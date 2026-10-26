import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../api';
import useApi from '../../useApi';
import Layout from '../../components/Layout';
import FormCard, { Field } from '../../components/FormCard';
import IconButton from '../../components/IconButton';
import Icon from '../../components/Icon';
import { MIN_PASSWORD_LENGTH, PASSWORD_ERROR } from '../../password';
import { searchable } from '../../names';

const ROLE_LABELS = { professor: 'Profesor', admin: 'Administrator' };
const EMPTY = { name: '', email: '', role: 'professor', password: '' };

export default function AdminUsers() {
  const { data: users, error: loadError, reload } = useApi('/api/admin/users');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const initialSearch = useLocation().state?.search ?? '';
  const [search, setSearch] = useState(initialSearch);

  const update = field => event => setForm({ ...form, [field]: event.target.value });
  const words = searchable(search.trim()).split(/\s+/).filter(Boolean);
  const visible = users?.filter(user => {
    const text = searchable(`${user.name} ${user.email}`);
    return words.every(word => text.includes(word));
  });

  function open(user) {
    setEditing(user);
    setForm(user._id ? { name: user.name, email: user.email, role: user.role, password: '' } : EMPTY);
    setFormError('');
  }

  async function save() {
    if (!editing._id && !form.password) return setFormError('Introdu o parolă.');
    if (form.password && form.password.length < MIN_PASSWORD_LENGTH) return setFormError(PASSWORD_ERROR);

    setSaving(true);
    setFormError('');
    try {
      await api(editing._id ? `/api/admin/users/${editing._id}` : '/api/admin/users', {
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

  async function remove(user) {
    if (!window.confirm(`Ștergi utilizatorul „${user.name}”?`)) return;
    setError('');
    try {
      await api(`/api/admin/users/${user._id}`, { method: 'DELETE', auth: true });
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <h2 className="page-title">Utilizatori</h2>
        <div className="page-filters">
          <label className="search">
            <Icon name="search" />
            <input className="form-control" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Caută" aria-label="Caută" />
          </label>
          <button type="button" className="btn btn-primary btn-with-icon" onClick={() => open({})}>
            <Icon name="plus" />
            Adaugă
          </button>
        </div>
      </div>

      {(error || loadError) && <div className="alert alert-danger page-alert">{error || loadError}</div>}

      {editing && (
        <FormCard
          title={editing._id ? 'Editează utilizatorul' : 'Utilizator nou'}
          error={formError}
          saving={saving}
          onSubmit={save}
          onCancel={() => setEditing(null)}
        >
          <Field label="Nume complet">
            <input className="form-control" value={form.name} onChange={update('name')} autoFocus />
          </Field>
          <Field label="Email">
            <input className="form-control" type="email" value={form.email} onChange={update('email')} />
          </Field>
          <Field label="Rol">
            <select className="form-control" value={form.role} onChange={update('role')}>
              <option value="professor">Profesor</option>
              <option value="admin">Administrator</option>
            </select>
          </Field>
          <Field label="Parolă">
            <input
              className="form-control"
              type="password"
              value={form.password}
              onChange={update('password')}
              placeholder={editing._id ? 'Lasă gol pentru a o păstra' : ''}
              autoComplete="new-password"
            />
          </Field>
        </FormCard>
      )}

      {visible?.length === 0 && <p className="muted">Niciun utilizator găsit.</p>}

      {visible?.length > 0 && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Nume complet</th>
                <th>Email</th>
                <th>Rol</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map(user => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{ROLE_LABELS[user.role]}</td>
                  <td className="table-actions">
                    <IconButton icon="edit" label="Editează" onClick={() => open(user)} />
                    <IconButton icon="trash" label="Șterge" onClick={() => remove(user)} danger />
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
