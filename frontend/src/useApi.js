import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export default function useApi(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const reload = useCallback(
    () => api(path, { auth: true }).then(setData).catch(err => setError(err.message)),
    [path]
  );

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, reload };
}
