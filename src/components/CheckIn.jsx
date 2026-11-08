import { useRef, useState } from 'react';
import { request } from '../api.js';
import { browserTimezone, instant, localTime } from '../format.js';
import { Input, Notice, Textarea } from './ui.jsx';

export default function CheckIn({ workspace, onSaved }) {
  const measures = workspace.protocol.measures;
  const [values, setValues] = useState({});
  const [time, setTime] = useState(localTime());
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saved, setSaved] = useState([]);
  const intentions = useRef(new Map());
  const busy = useRef(false);
  const timeEdited = useRef(false);
  const batchTime = useRef(null);
  if (!measures.length) return null;
  async function submit(event) {
    event.preventDefault();
    if (busy.current) return;
    const entries = measures.filter((measure) => values[measure.id] !== '' && values[measure.id] != null && !saved.includes(measure.id));
    if (!entries.length) { setError('Enter at least one check-in value.'); return; }
    busy.current = true; setPending(true); setError(''); setSuccess('');
    if (!batchTime.current) batchTime.current = timeEdited.current ? instant(time) : new Date().toISOString();
    const completed = [...saved];
    try {
      for (const measure of entries) {
        const body = { measure_id: measure.id, value: Number(values[measure.id]), occurred_at: batchTime.current, note };
        const fingerprint = JSON.stringify(body);
        if (!intentions.current.has(fingerprint)) intentions.current.set(fingerprint, crypto.randomUUID());
        await request(`/workspaces/${workspace.id}/observations`, { method: 'POST', body, key: intentions.current.get(fingerprint) });
        completed.push(measure.id); setSaved([...completed]);
      }
      setValues({}); setSaved([]); setNote(''); setTime(localTime()); intentions.current.clear(); timeEdited.current = false; batchTime.current = null;
      setSuccess('Check-in saved.'); await onSaved();
    } catch (cause) {
      setError(`${cause.message}${completed.length ? ' The marked values are already saved; retry will save only the remaining values.' : ''}`);
      if (completed.length) await onSaved();
    } finally { busy.current = false; setPending(false); }
  }
  const hasPartial = saved.length > 0;
  return <section className="check-in"><div className="section-head"><div><h2>Your check-in</h2><p>Record what you observed. Leave unmeasured values blank.</p></div></div>
    <form onSubmit={submit}><div className="form-grid two">{measures.map((measure) => <Input key={measure.id} label={`${measure.name}${measure.unit ? ` (${measure.unit})` : ''}`} type="number" step="any" min={measure.minimum ?? undefined} max={measure.maximum ?? undefined} value={values[measure.id] ?? ''} disabled={pending || saved.includes(measure.id)} hint={saved.includes(measure.id) ? 'Saved' : undefined} onChange={(event) => { setSuccess(''); if (!saved.length) batchTime.current = null; setValues((current) => ({ ...current, [measure.id]: event.target.value })); }} />)}</div>
      <details className="check-in-details"><summary>Time and note</summary><Input label="Observed at" type="datetime-local" required value={time} disabled={pending || hasPartial} onChange={(event) => { timeEdited.current = true; batchTime.current = null; setTime(event.target.value); }} hint={`Time in ${browserTimezone()}. Uses now when you save unless changed.`} /><Textarea label="Note (optional)" value={note} disabled={pending || hasPartial} onChange={(event) => { batchTime.current = null; setNote(event.target.value); }} maxLength="3000" /></details>
      <Notice>{error}</Notice><Notice kind="success">{success}</Notice><button className="button primary" disabled={pending}>{pending ? 'Saving check-in…' : hasPartial ? 'Retry remaining values' : 'Save check-in'}</button>
    </form>
  </section>;
}
