import { useState } from 'react';
import { api } from '../api';
import { MIN_PASSWORD_LENGTH, PASSWORD_ERROR } from '../password';
import Modal from './Modal';

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const update = field => event => setForm({ ...form, [field]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    if (!form.currentPassword) return setError('Introdu parola curentă.');
    if (form.newPassword.length < MIN_PASSWORD_LENGTH) return setError(PASSWORD_ERROR);
    if (form.newPassword !== form.confirmPassword) return setError('Parolele noi nu coincid.');

    setSaving(true);
    setError('');
    try {
      await api('/api/auth/password', {
        method: 'POST',
        body: { currentPassword: form.currentPassword, newPassword: form.newPassword },
        auth: true,
      });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Schimbare parolă" onClose={onClose}>
      {done ? (
        <div className="modal-body">
          <div className="alert alert-success form-alert">Parola a fost schimbată.</div>
          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={onClose}>Închide</button>
          </div>
        </div>
      ) : (
        <form className="modal-body" onSubmit={submit} noValidate>
          {error && <div className="alert alert-danger form-alert">{error}</div>}
          <label className="field">
            <span className="field-label">Parola curentă</span>
            <input
              className="form-control"
              type="password"
              value={form.currentPassword}
              onChange={update('currentPassword')}
              autoComplete="current-password"
              autoFocus
            />
          </label>
          <label className="field">
            <span className="field-label">Parola nouă</span>
            <input
              className="form-control"
              type="password"
              value={form.newPassword}
              onChange={update('newPassword')}
              autoComplete="new-password"
            />
          </label>
          <label className="field">
            <span className="field-label">Confirmă parola nouă</span>
            <input
              className="form-control"
              type="password"
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              autoComplete="new-password"
            />
          </label>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Anulează</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Se salvează...' : 'Salvează'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
