import { useEffect, useState } from 'react';
import { api } from '../api';
import { collectSignals } from '../deviceSignals';
import { createPasskey, getPasskey, passkeyCapabilities } from '../passkeyTest';
import { formatDate, formatTime } from '../format';

const SIGNAL_LABELS = {
  cores: 'Nuclee CPU',
  memory: 'Memorie (GB)',
  screen: 'Ecran',
  colorDepth: 'Adâncime culoare',
  touchPoints: 'Puncte touch',
  timezone: 'Fus orar',
  webglImage: 'Imagine GPU (WebGL)',
  webglParams: 'Limite GPU',
  audio: 'Procesare audio',
  fonts: 'Fonturi',
  userAgent: 'User agent',
  renderer: 'GPU raportat',
  canvas2d: 'Canvas 2D',
  languages: 'Limbi',
  model: 'Model (Chrome Android)',
};

const swatch = value => (value ? { background: `hsl(${parseInt(String(value).slice(0, 4), 16) % 360} 70% 88%)` } : undefined);

function describePasskey(result) {
  if (!result) return '—';
  if (result.outcome === 'found') return `găsită · ${result.credentialId}`;
  return `${result.outcome} · ${result.ms} ms`;
}

function SignalTable({ title, values }) {
  return (
    <>
      <h4 className="test-subtitle">{title}</h4>
      <dl className="test-signals">
        {Object.entries(values).map(([key, value]) => (
          <div key={key}>
            <dt>{SIGNAL_LABELS[key] ?? key}</dt>
            <dd>{value === null || value === '' ? '—' : String(value)}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

export default function TestDevice() {
  const [signals, setSignals] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const [passkey, setPasskey] = useState(null);
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState('');
  const [message, setMessage] = useState('');
  const [reports, setReports] = useState([]);

  const loadReports = () => api('/api/device-test').then(setReports).catch(() => {});

  useEffect(() => {
    collectSignals().then(setSignals).catch(err => setMessage(`Eroare la semnale: ${err.message}`));
    passkeyCapabilities().then(setCapabilities);
    loadReports();
  }, []);

  async function run(action) {
    setBusy(true);
    setMessage('');
    try {
      setPasskey(await action());
    } catch (err) {
      setPasskey({ outcome: err.name, ms: 0 });
    } finally {
      setBusy(false);
    }
  }

  async function save(event) {
    event.preventDefault();
    setMessage('');
    try {
      await api('/api/device-test', {
        method: 'POST',
        body: { label, data: { ...signals, passkey, capabilities: capabilities && { ...capabilities, capabilities: undefined } } },
      });
      setLabel('');
      setMessage('Salvat.');
      loadReports();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <main className="test-page">
      <h1 className="page-title">Test dispozitiv</h1>

      <section className="card">
        <div className="card-header"><h3>Cheie de acces (passkey)</h3></div>
        <div className="card-body">
          {capabilities && (
            <p className="test-line">
              WebAuthn: <strong>{capabilities.supported ? 'da' : 'nu'}</strong> ·
              {' '}Immediate UI: <strong>{capabilities.immediateGet ? 'da' : 'nu'}</strong> ·
              {' '}Autentificator în telefon: <strong>{capabilities.platform ? 'da' : 'nu'}</strong>
            </p>
          )}
          <div className="test-buttons">
            <button type="button" className="btn btn-primary" disabled={busy || !capabilities?.immediateGet} onClick={() => run(() => getPasskey(true))}>
              Verifică instant
            </button>
            <button type="button" className="btn btn-outline" disabled={busy || !capabilities?.supported} onClick={() => run(() => getPasskey(false))}>
              Alege cheia
            </button>
            <button type="button" className="btn btn-outline" disabled={busy || !capabilities?.supported} onClick={() => run(async () => ({ outcome: 'created', ...(await createPasskey()) }))}>
              Creează cheie
            </button>
          </div>
          <p className="test-line">
            Rezultat: <strong>{passkey ? (passkey.outcome === 'created' ? `creată · ${passkey.credentialId}` : describePasskey(passkey)) : '—'}</strong>
          </p>
        </div>
      </section>

      <section className="card">
        <div className="card-header"><h3>Semnale</h3></div>
        <div className="card-body">
          {!signals && <p className="muted">Se calculează...</p>}
          {signals && (
            <>
              <div className="test-hashes">
                <span>Între browsere: <strong className="mono" style={swatch(signals.hashes.crossBrowser)}>{signals.hashes.crossBrowser}</strong></span>
                <span>Doar hardware: <strong className="mono" style={swatch(signals.hashes.hardwareOnly)}>{signals.hashes.hardwareOnly}</strong></span>
                <span>Acest browser: <strong className="mono" style={swatch(signals.hashes.perBrowser)}>{signals.hashes.perBrowser}</strong></span>
              </div>
              <SignalTable title="Ar trebui să fie la fel în orice browser" values={signals.stable} />
              <SignalTable title="Diferă de la un browser la altul" values={signals.perBrowser} />
            </>
          )}
        </div>
      </section>

      <form className="card" onSubmit={save}>
        <div className="card-header"><h3>Salvează rezultatul</h3></div>
        <div className="card-body test-save">
          <input
            className="form-control"
            value={label}
            onChange={event => setLabel(event.target.value)}
            placeholder="ex. S23 Andrei · Chrome"
            maxLength={80}
          />
          <button type="submit" className="btn btn-primary" disabled={!signals || !label.trim()}>Salvează</button>
        </div>
        {message && <p className="test-message">{message}</p>}
      </form>

      <section className="card">
        <div className="card-header"><h3>Rezultate salvate</h3></div>
        {reports.length === 0 ? (
          <p className="card-body muted">Niciun rezultat salvat.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Denumire</th>
                <th>Între browsere</th>
                <th>Doar hardware</th>
                <th>Acest browser</th>
                <th>Passkey</th>
                <th>Salvat</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(report => (
                <tr key={report._id}>
                  <td>{report.label}</td>
                  <td><span className="mono test-chip" style={swatch(report.data.hashes?.crossBrowser)}>{report.data.hashes?.crossBrowser}</span></td>
                  <td><span className="mono test-chip" style={swatch(report.data.hashes?.hardwareOnly)}>{report.data.hashes?.hardwareOnly}</span></td>
                  <td><span className="mono test-chip" style={swatch(report.data.hashes?.perBrowser)}>{report.data.hashes?.perBrowser}</span></td>
                  <td className="mono">{report.data.passkey?.outcome === 'created' ? `creată · ${report.data.passkey.credentialId}` : describePasskey(report.data.passkey)}</td>
                  <td>{formatDate(report.createdAt).split(',').slice(1).join(',').trim()} {formatTime(report.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
