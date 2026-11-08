import { useCallback, useRef, useState } from 'react';
import { handleLocalApi } from './studioEngine.js';

let sessionGeneration = 0;
export function resetSessionScope() { sessionGeneration += 1; }

function detailText(detail) {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((entry) => {
    if (typeof entry === 'string') return entry;
    const path = (entry.loc || []).filter((part) => part !== 'body').join(' · ');
    return `${path ? `${path}: ` : ''}${entry.msg || JSON.stringify(entry)}`;
  }).join('\n');
  return detail ? JSON.stringify(detail) : 'The request could not be completed.';
}

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

export async function request(path, { method = 'GET', body, signal, key, download = false } = {}) {
  const generation = sessionGeneration;
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const localDirect = await handleLocalApi(path, { method, body, download });
  if (localDirect !== null) return localDirect;
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method, signal, credentials: 'same-origin', cache: 'no-store',
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(key ? { 'Idempotency-Key': key } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Connection interrupted. Your draft is still here; retry to finish the same save.', 0);
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    if (response.status === 401 && generation === sessionGeneration) window.dispatchEvent(new Event('companion:unauthorized'));
    throw new ApiError(detailText(data?.detail || `Request failed (${response.status}).`), response.status);
  }
  if (download) return { blob: await response.blob(), filename: response.headers.get('Content-Disposition')?.match(/filename="?([^";]+)"?/)?.[1] };
  return response.status === 204 ? null : response.json();
}

// Only a failed network intention retains its key. A fresh successful action is a new intention.
export function useMutation() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const retry = useRef(null);
  const run = useCallback(async (path, body, method = 'POST') => {
    if (busy.current) return undefined;
    busy.current = true;
    setPending(true); setError('');
    const fingerprint = JSON.stringify([method, path, body]);
    const intention = retry.current?.fingerprint === fingerprint
      ? retry.current : { fingerprint, key: crypto.randomUUID() };
    retry.current = intention;
    try {
      const result = await request(path, { method, body, key: intention.key });
      retry.current = null;
      return result;
    } catch (cause) {
      setError(cause.message);
      throw cause;
    } finally { busy.current = false; setPending(false); }
  }, []);
  return { run, pending, error, clearError: () => setError('') };
}

export async function downloadWorkspace(id) {
  const { blob, filename } = await request(`/workspaces/${id}/export`, { download: true });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename || 'bioscience-protocol.json';
  document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
