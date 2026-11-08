import { useCallback, useEffect, useRef, useState } from 'react';
import { request } from '../api.js';

export default function useWorkspace(initialId) {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedId, setSelectedId] = useState(initialId || '');
  const selected = useRef(initialId || '');
  const [workspace, setWorkspace] = useState(null);
  const [library, setLibrary] = useState({ compounds: [], relations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const workspaceRequest = useRef(null);
  const select = useCallback((id) => {
    workspaceRequest.current?.abort();
    selected.current = id; setSelectedId(id); setWorkspace(null); setError('');
  }, []);
  const refreshList = useCallback(async (signal) => {
    const result = await request('/workspaces', { signal });
    setWorkspaces(result.workspaces);
    if (!selected.current && result.workspaces.length) select(result.workspaces[0].id);
    return result.workspaces;
  }, [select]);
  const refreshLibrary = useCallback(async (signal) => {
    const result = await request('/library', { signal }); setLibrary(result); return result;
  }, []);
  const refresh = useCallback(async () => {
    const id = selected.current;
    if (!id) { setLoading(false); return; }
    workspaceRequest.current?.abort();
    const controller = new AbortController(); workspaceRequest.current = controller;
    setLoading(true); setError('');
    try {
      const result = await request(`/workspaces/${id}`, { signal: controller.signal });
      if (selected.current === id && !controller.signal.aborted) setWorkspace(result);
      return result;
    } catch (cause) { if (cause.name !== 'AbortError' && selected.current === id) setError(cause.message); }
    finally { if (selected.current === id && !controller.signal.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([refreshList(controller.signal), refreshLibrary(controller.signal)])
      .catch((cause) => { if (cause.name !== 'AbortError') setError(cause.message); })
      .finally(() => { if (!controller.signal.aborted && !selected.current) setLoading(false); });
    return () => { controller.abort(); workspaceRequest.current?.abort(); };
  }, [refreshList, refreshLibrary]);
  useEffect(() => { if (selectedId) refresh(); }, [selectedId, refresh]);
  return { workspaces, selectedId, workspace, library, loading, error, select, refresh, refreshList, refreshLibrary };
}
