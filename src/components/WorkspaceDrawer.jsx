import { useState } from 'react';
import { useMutation } from '../api.js';
import { browserTimezone, dateTime, itemPayload, numeric } from '../format.js';
import { Drawer, Input, Notice, Tabs, Textarea } from './ui.jsx';
import { GatesEditor, ItemsEditor, MeasuresEditor } from './ProtocolEditor.jsx';

export function CreateWorkspace({ onCreated, onClose }) {
  const [label, setLabel] = useState('');
  const [goal, setGoal] = useState('');
  const [timezone, setTimezone] = useState(browserTimezone());
  const [allow, setAllow] = useState(false);
  const mutation = useMutation();
  async function submit(event) {
    event.preventDefault();
    try {
      const result = await mutation.run('/workspaces', { label, goal, timezone, allow_plan_changes: allow });
      if (result) { await onCreated(result); onClose(); }
    } catch { /* Preserve the draft. */ }
  }
  return <Drawer title="Create a private workspace" onClose={onClose}><form className="drawer-content" onSubmit={submit}><Input label="Workspace name" required maxLength="100" value={label} onChange={(event) => setLabel(event.target.value)} /><Textarea label="Current goal" maxLength="300" value={goal} onChange={(event) => setGoal(event.target.value)} /><Input label="Schedule timezone" required value={timezone} onChange={(event) => setTimezone(event.target.value)} hint="An IANA timezone, such as Europe/Berlin." /><label className="checkbox"><input type="checkbox" checked={allow} onChange={(event) => setAllow(event.target.checked)} /><span>Allow the assigned client to save compared protocol changes</span></label><Notice>{mutation.error}</Notice><div className="form-actions"><button type="button" className="button quiet" disabled={mutation.pending} onClick={onClose}>Cancel</button><button className="button primary" disabled={mutation.pending}>{mutation.pending ? 'Creating…' : 'Create workspace'}</button></div></form></Drawer>;
}

function ProtocolImport({ workspace, onSaved, onClose }) {
  const [text, setText] = useState('');
  const [format, setFormat] = useState('csv');
  const [preview, setPreview] = useState(null);
  const [replace, setReplace] = useState(false);
  const mutation = useMutation();
  async function review(event) {
    event.preventDefault();
    try {
      const result = await mutation.run(`/workspaces/${workspace.id}/import/preview`, { text, format });
      if (result) setPreview({ ...result, text, format, revision: workspace.revision });
    } catch { setPreview(null); }
  }
  async function apply() {
    try {
      const result = await mutation.run(`/workspaces/${workspace.id}/import`, { text: preview.text, format: preview.format, expected_revision: preview.revision, replace });
      if (result) { await onSaved(); onClose(); }
    } catch { /* Keep the preview and the same retry intention. */ }
  }
  return <div className="drawer-content"><p className="muted">Review a structured protocol before assigning it. Unknown names become tracking-only library entries; model parameters are never guessed.</p><form onSubmit={review}><div className="format-choice" role="group" aria-label="Import format">{['csv', 'json'].map((value) => <label className="radio" key={value}><input type="radio" name="protocol-format" value={value} checked={format === value} onChange={() => { setFormat(value); setPreview(null); }} />{value.toUpperCase()}</label>)}</div><Input label="Choose file (optional)" type="file" accept=".csv,.json,text/csv,application/json" onChange={async (event) => { const file = event.target.files?.[0]; if (file) { setText(await file.text()); setFormat(file.name.toLowerCase().endsWith('.json') ? 'json' : 'csv'); setPreview(null); } }} /><Textarea label="Protocol data" className="code-field" rows="10" required value={text} spellCheck="false" onChange={(event) => { setText(event.target.value); setPreview(null); }} hint={format === 'csv' ? 'CSV columns: name,amount,unit,interval_h,first_at. Times require an explicit UTC offset; blank interval means once.' : 'JSON item array, or an object with an items array. Each item needs name, amount, unit, interval_h and first_at with a UTC offset.'} /><button className="button secondary" disabled={mutation.pending}>{mutation.pending ? 'Checking…' : 'Preview import'}</button></form><Notice>{mutation.error}</Notice>
    {preview && <section className="import-preview"><h3>Import preview</h3>{preview.errors?.length > 0 && <Notice>{preview.errors.map((error) => typeof error === 'string' ? error : JSON.stringify(error)).join('\n')}</Notice>}{preview.items.length > 0 && <ul className="preview-items">{preview.items.map((item, index) => <li key={index}><strong>{item.name}</strong> · {item.amount} {item.unit}{item.interval_h == null ? ' once' : ` every ${item.interval_h} h`}<small>{dateTime(item.first_at, workspace.timezone)}</small></li>)}</ul>}{preview.new_compounds?.length > 0 && <Notice kind="info">New tracking-only entries: {preview.new_compounds.join(', ')}. No scientific model will be inferred.</Notice>}<label className="checkbox"><input type="checkbox" checked={replace} onChange={(event) => setReplace(event.target.checked)} /><span>Replace all currently assigned items ({workspace.protocol.items.length}); otherwise append these items</span></label><p className="microcopy">Measures, conditions and actual records are retained. {replace ? 'The existing item list will be replaced.' : 'These items will be added to the existing protocol.'}</p><button className="button primary" disabled={mutation.pending || !preview.items.length || preview.errors?.length > 0} onClick={apply}>{mutation.pending ? 'Importing…' : replace ? 'Confirm replacement' : 'Confirm and append'}</button></section>}
  </div>;
}

function ShareWorkspace({ workspace }) {
  const [invitation, setInvitation] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const mutation = useMutation();
  const url = invitation ? new URL(`?invite=${encodeURIComponent(invitation.token)}`, window.location.href).href : '';
  async function create() {
    try { const result = await mutation.run(`/workspaces/${workspace.id}/invite`); if (result) { setInvitation(result); setCopied(false); } } catch { /* Show API error. */ }
  }
  async function copy() { try { await navigator.clipboard.writeText(url); setCopied(true); setError(''); } catch { setError('Copy is unavailable in this browser. Select and copy the link below.'); } }
  return <div className="drawer-content"><h3>Invite the assigned client</h3><p className="muted">The recipient creates a private account. The link is an invitation, not a public view of this workspace.</p><button className="button primary" disabled={mutation.pending} onClick={create}>{mutation.pending ? 'Creating invitation…' : invitation ? 'Create another invitation' : 'Create invitation link'}</button><Notice>{mutation.error || error}</Notice>{invitation && <div className="invite-result"><Input label="Private invitation link" readOnly value={url} onFocus={(event) => event.target.select()} /><p className="small muted">Expires {dateTime(invitation.expires_at, workspace.timezone)}</p><button className="button secondary" onClick={copy}>{copied ? 'Copied' : 'Copy invitation link'}</button></div>}</div>;
}

export default function WorkspaceDrawer({ workspace, library, onSaved, onClose }) {
  const [tab, setTab] = useState('protocol');
  const [baseRevision] = useState(workspace.revision);
  const [draft, setDraft] = useState(() => structuredClone(workspace.protocol));
  const [localError, setLocalError] = useState('');
  const mutation = useMutation();
  const edit = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  async function save(event) {
    event.preventDefault(); setLocalError('');
    const body = {
      expected_revision: baseRevision,
      items: draft.items.map((entry) => ({ ...itemPayload(entry), amount: Number(entry.amount), interval_h: numeric(entry.interval_h), minimum_amount: numeric(entry.minimum_amount), maximum_amount: numeric(entry.maximum_amount) })),
      measures: draft.measures.map((entry) => ({ ...entry, minimum: numeric(entry.minimum), maximum: numeric(entry.maximum), target: numeric(entry.target) })),
      gates: draft.gates.map((entry) => ({ ...entry, threshold: numeric(entry.threshold), max_age_h: numeric(entry.max_age_h), maximum_amount: numeric(entry.maximum_amount) })),
    };
    if (body.gates.some((gate) => !body.measures.some((measure) => measure.id === gate.measure_id))) { setLocalError('A condition references a removed measure. Update or remove that condition before saving.'); setTab('gates'); return; }
    try {
      const result = await mutation.run(`/workspaces/${workspace.id}/protocol`, body, 'PUT');
      if (result) { await onSaved(); onClose(); }
    } catch { /* Preserve all sections of the draft. */ }
  }
  const editing = ['protocol', 'measures', 'gates'].includes(tab);
  return <Drawer title="Workspace setup" subtitle={workspace.label} onClose={onClose} wide><Tabs label="Workspace setup sections" value={tab} onChange={setTab} entries={[[ 'protocol', 'Protocol'], ['measures', 'Check-in'], ['gates', 'Conditions'], ['import', 'Import'], ['share', 'Invite']]} />
    {editing && <form onSubmit={save}><div className="drawer-content"><p className="microcopy">Changes in these three sections become active only when you save.</p>{tab === 'protocol' && <ItemsEditor items={draft.items} library={library} onChange={(value) => edit('items', value)} />}{tab === 'measures' && <MeasuresEditor measures={draft.measures} onChange={(value) => edit('measures', value)} />}{tab === 'gates' && <GatesEditor gates={draft.gates} measures={draft.measures} library={library} onChange={(value) => edit('gates', value)} />}<Notice>{localError || mutation.error}</Notice></div><footer className="drawer-footer"><button type="button" className="button quiet" onClick={onClose} disabled={mutation.pending}>Cancel</button><button className="button primary" disabled={mutation.pending}>{mutation.pending ? 'Saving…' : 'Save protocol configuration'}</button></footer></form>}
    {tab === 'import' && <ProtocolImport workspace={workspace} onSaved={onSaved} onClose={onClose} />}{tab === 'share' && <ShareWorkspace workspace={workspace} />}
  </Drawer>;
}
