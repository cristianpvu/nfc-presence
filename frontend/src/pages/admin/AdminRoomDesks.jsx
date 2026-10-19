import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api';
import useApi from '../../useApi';
import Layout from '../../components/Layout';
import IconButton from '../../components/IconButton';

export default function AdminRoomDesks() {
  const { id } = useParams();
  const { data, error: loadError, reload } = useApi(`/api/admin/rooms/${id}/desks`);
  const [editingId, setEditingId] = useState(null);
  const [tagUid, setTagUid] = useState('');
  const [error, setError] = useState('');

  function edit(desk) {
    setEditingId(desk._id);
    setTagUid(desk.tagUid ?? '');
    setError('');
  }

  async function save(desk, value) {
    setError('');
    try {
      await api(`/api/admin/desks/${desk._id}`, { method: 'PUT', body: { tagUid: value }, auth: true });
      setEditingId(null);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  function clear(desk) {
    if (window.confirm(`Elimini eticheta NFC de pe banca ${desk.label}?`)) save(desk, '');
  }

  function submit(event, desk) {
    event.preventDefault();
    save(desk, tagUid);
  }

  return (
    <Layout>
      <nav className="breadcrumb">
        <Link to="/admin/rooms">Săli</Link>
        <span>/</span>
        <span>{data?.room.name}</span>
      </nav>
      <h2 className="page-title">{data?.room.name ?? 'Sala'}</h2>

      {(error || loadError) && <div className="alert alert-danger page-alert">{error || loadError}</div>}

      {data && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Banca</th>
                <th>Etichetă NFC (UID)</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.desks.map(desk => (
                <tr key={desk._id}>
                  <td>{desk.label}</td>
                  <td>
                    {editingId === desk._id ? (
                      <form className="inline-form" onSubmit={event => submit(event, desk)}>
                        <input
                          className="form-control"
                          value={tagUid}
                          onChange={event => setTagUid(event.target.value)}
                          placeholder="04AABBCCDDEEFF"
                          maxLength={14}
                          autoFocus
                        />
                        <button type="submit" className="btn btn-primary">Salvează</button>
                        <button type="button" className="btn btn-outline" onClick={() => setEditingId(null)}>Anulează</button>
                      </form>
                    ) : (
                      <span className={desk.tagUid ? 'mono' : 'muted'}>{desk.tagUid ?? '—'}</span>
                    )}
                  </td>
                  <td className="table-actions">
                    {editingId !== desk._id && (
                      <>
                        <IconButton icon="edit" label="Editează eticheta" onClick={() => edit(desk)} />
                        {desk.tagUid && <IconButton icon="trash" label="Elimină eticheta" onClick={() => clear(desk)} danger />}
                      </>
                    )}
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
