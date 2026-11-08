import { useRef, useState } from 'react';
import { useMutation } from '../api.js';
import { browserTimezone, instant, localTime, nameFor, numeric } from '../format.js';
import { Drawer, Input, Notice, Select, Textarea, UnitOptions } from './ui.jsx';

export default function IntakeEditor({ workspace, library, item, event: record, onSaved, onClose }) {
  const original = record || item;
  const [status, setStatus] = useState(record?.status || 'taken');
  const [amount, setAmount] = useState(record?.amount ?? item?.next_amount ?? item?.amount ?? '');
  const [unit, setUnit] = useState(original.unit || 'mg');
  const [time, setTime] = useState(localTime(record?.occurred_at));
  const [timeEdited, setTimeEdited] = useState(false);
  const saveInstant = useRef(null);
  const [note, setNote] = useState(record?.note || '');
  const { run, pending, error } = useMutation();
  async function submit(event) {
    event.preventDefault();
    if (!saveInstant.current) saveInstant.current = new Date().toISOString();
    const body = {
      item_id: record?.item_id || item.id, status,
      amount: status === 'taken' ? numeric(amount) : null, unit,
      occurred_at: timeEdited ? instant(time) : record?.occurred_at || saveInstant.current, scheduled_at: record?.scheduled_at || item?.next_scheduled_at || item?.next_at || null, note,
    };
    try {
      const result = await run(`/workspaces/${workspace.id}/events${record ? `/${record.id}/correct` : ''}`, body);
      if (result) { await onSaved(); onClose(); }
    } catch { /* Preserve this draft. */ }
  }
  return <Drawer title={record ? 'Correct intake record' : 'Record actual intake'} subtitle={record?.name || nameFor(library, original.compound_id)} onClose={onClose}>
    <form className="drawer-content" onSubmit={submit}>
      {record && <p className="muted">This adds a correction. The original stays in the audit history and is not counted twice.</p>}
      <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="taken">Taken</option><option value="skipped">Skipped</option><option value="held">Held</option>{record && <option value="void">Void this record</option>}</Select>
      {status === 'taken' && <div className="form-grid two"><Input label="Amount actually taken" type="number" min="0" step="any" required value={amount} onChange={(event) => setAmount(event.target.value)} /><Select label="Unit" value={unit} onChange={(event) => setUnit(event.target.value)}><UnitOptions /></Select></div>}
      <Input label="When" type="datetime-local" required value={time} onChange={(event) => { setTimeEdited(true); setTime(event.target.value); }} hint={`Time in ${browserTimezone()}.${record ? ' Original instant is preserved unless changed.' : ' Uses now when you save unless changed.'}`} />
      <Textarea label="Note (optional)" value={note} maxLength="3000" onChange={(event) => setNote(event.target.value)} />
      <Notice>{error}</Notice><div className="form-actions"><button type="button" className="button quiet" onClick={onClose} disabled={pending}>Cancel</button><button className="button primary" disabled={pending}>{pending ? 'Saving…' : record ? 'Save correction' : 'Save actual intake'}</button></div>
    </form>
  </Drawer>;
}
