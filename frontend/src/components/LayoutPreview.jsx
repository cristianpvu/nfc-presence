import { useEffect, useState } from 'react';
import { api } from '../api';
import SeatMap from './SeatMap';

const NO_OCCUPANTS = new Map();
const ignore = () => {};

export default function LayoutPreview({ layout }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      api('/api/admin/layout-preview', { method: 'POST', body: { layout }, auth: true })
        .then(result => {
          if (!active) return;
          setPreview(result);
          setError('');
        })
        .catch(err => active && setError(err.message));
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [layout]);

  return (
    <div className="layout-preview">
      {error && <div className="form-error">{error}</div>}
      {preview && (
        <div className={error ? 'layout-preview-map stale' : 'layout-preview-map'}>
          <SeatMap desks={preview.desks} occupants={NO_OCCUPANTS} onSelect={ignore} />
          <p className="occupancy muted">{preview.rows} rânduri · {preview.desks.length} bănci</p>
        </div>
      )}
    </div>
  );
}
