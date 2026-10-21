import { useState } from 'react';
import { api } from '../api';
import Modal from './Modal';

export default function AddAttendanceModal({ courseId, onAdded, onClose }) {
  const [form, setForm] = useState({ studentName: '', studentId: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = field => event => setForm({ ...form, [field]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    if (form.studentName.trim().length < 3) return setError('Introdu numele complet.');

    setSaving(true);
    setError('');
    try {
      const entry = await api(`/api/courses/${courseId}/attendances`, { method: 'POST', body: form, auth: true });
      onAdded(entry);
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal title="Adaugă prezență" onClose={onClose}>
      <form className="modal-body" onSubmit={submit} noValidate>
        {error && <div className="alert alert-danger form-alert">{error}</div>}
        <label className="field">
          <span className="field-label">Nume complet</span>
          <input
            className="form-control"
            value={form.studentName}
            onChange={update('studentName')}
            maxLength={100}
            autoComplete="off"
            autoFocus
          />
        </label>
        <label className="field">
          <span className="field-label">ID student</span>
          <input
            className="form-control"
            value={form.studentId}
            onChange={update('studentId')}
            maxLength={50}
            autoComplete="off"
          />
        </label>
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Anulează</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Se salvează...' : 'Salvează'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
