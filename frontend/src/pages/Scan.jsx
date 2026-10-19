import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { getDeviceId } from '../session';
import { formatInterval } from '../format';

const TAP_AGAIN = 'Atinge eticheta NFC de pe banca ta.';

function readScanParams() {
  const query = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(['picc', 'uid', 'ctr', 'cmac'].map(key => [key, query.get(key)]).filter(([, value]) => value));
  window.history.replaceState(null, '', window.location.pathname);
  return params.cmac ? params : null;
}

export default function Scan() {
  const started = useRef(false);
  const [state, setState] = useState({ step: 'loading' });
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = readScanParams();
    if (!params) {
      setState({ step: 'error', message: TAP_AGAIN });
      return;
    }

    api('/api/scan', { method: 'POST', body: { ...params, deviceId: getDeviceId() } })
      .then(scan => setState({ step: 'form', scan }))
      .catch(err => setState({ step: 'error', message: err.message }));
  }, []);

  async function submit(event) {
    event.preventDefault();
    const studentName = name.trim().replace(/\s+/g, ' ');
    if (studentName.length < 3) {
      setFormError('Introdu numele și prenumele.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      await api('/api/attendance', {
        method: 'POST',
        body: { token: state.scan.token, studentName, deviceId: getDeviceId() },
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
        <h1 className="scan-title">Înregistrare prezență</h1>

        {state.step === 'loading' && <p className="muted">Se verifică eticheta...</p>}

        {state.step === 'error' && <div className="alert alert-danger">{state.message}</div>}

        {(state.step === 'form' || state.step === 'done') && (
          <dl className="details">
            <dt>Curs</dt>
            <dd>{state.scan.course.name}</dd>
            <dt>Interval</dt>
            <dd>{formatInterval(state.scan.course)}</dd>
            <dt>Sala</dt>
            <dd>{state.scan.room}</dd>
            <dt>Banca</dt>
            <dd>{state.scan.desk}</dd>
          </dl>
        )}

        {state.step === 'form' && (
          <form onSubmit={submit} noValidate>
            <label className="form-label" htmlFor="studentName">Nume și prenume</label>
            <input
              id="studentName"
              className="form-control"
              value={name}
              onChange={event => setName(event.target.value)}
              autoComplete="name"
              maxLength={100}
              autoFocus
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
