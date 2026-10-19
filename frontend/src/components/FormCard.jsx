export function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

export default function FormCard({ title, error, saving, onSubmit, onCancel, children }) {
  function submit(event) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="card-header">
        <h3>{title}</h3>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-danger form-alert">{error}</div>}
        <div className="form-grid">{children}</div>
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel}>Anulează</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Se salvează...' : 'Salvează'}
          </button>
        </div>
      </div>
    </form>
  );
}
