import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { getDeviceId } from '../session';
import { formatInterval } from '../format';
import logo from '../assets/ase-logo.png';

const normalize = value => value.trim().replace(/\s+/g, ' ');

function readScanParams() {
  const query = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(['picc', 'uid', 'ctr', 'cmac'].map(key => [key, query.get(key)]).filter(([, value]) => value));
  window.history.replaceState(null, '', window.location.pathname);
  return params;
}

export default function Scan() {
  const started = useRef(false);
  const [state, setState] = useState({ step: 'loading' });
  const [name, setName] = useState('');
  const [studentIdValue, setStudentIdValue] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    api('/api/scan', { method: 'POST', body: { ...readScanParams(), deviceId: getDeviceId() } })
      .then(scan => setState({ step: 'form', scan }))
      .catch(err => setState({ step: 'error', message: err.message }));
  }, []);

  async function submit(event) {
    event.preventDefault();
    const studentName = normalize(name);
    const studentId = normalize(studentIdValue);
    if (studentName.length < 3) {
      setFormError('Introdu numele complet.');
      return;
    }
    if (!studentId) {
      setFormError('Introdu ID-ul de student.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      await api('/api/attendance', {
        method: 'POST',
        body: { token: state.scan.token, studentName, studentId, deviceId: getDeviceId() },
      });
      setState({ step: 'done', scan: state.scan, studentName });
    } catch (err) {
      if (err.status === 400 || err.status === 0) setFormError(err.message);
      else setState({ step: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="scan-page">
      <div className="card scan-card">
        <img className="scan-logo" src={logo} alt="Academia de Studii Economice din București" />
        <h1 className="scan-title">Înregistrare prezență</h1>

        {(state.step === 'form' || state.step === 'done') && (
          <p className="scan-course">{state.scan.course.name} {formatInterval(state.scan.course)}</p>
        )}

        {state.step === 'loading' && <p className="scan-course muted">Se verifică eticheta NFC...</p>}

        {state.step === 'error' && <div className="alert alert-danger">{state.message}</div>}

        {state.step === 'form' && (
          <form onSubmit={submit} noValidate>
            <label className="form-label" htmlFor="studentName">Nume complet</label>
            <input
              id="studentName"
              className="form-control"
              value={name}
              onChange={event => setName(event.target.value)}
              autoComplete="name"
              maxLength={100}
              autoFocus
            />
            <label className="form-label" htmlFor="studentId">ID student</label>
            <input
              id="studentId"
              className="form-control"
              value={studentIdValue}
              onChange={event => setStudentIdValue(event.target.value)}
              autoComplete="off"
              maxLength={50}
            />
            {formError && <div className="form-error">{formError}</div>}
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Se înregistrează...' : 'Înregistrează prezența'}
            </button>
          </form>
        )}

        {state.step === 'done' && (
          <div className="alert alert-success">
            Prezența a fost înregistrată pentru <strong>{state.studentName}</strong>.
          </div>
        )}
      </div>
    </main>
  );
}
