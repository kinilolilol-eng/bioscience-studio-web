import { useEffect, useState } from 'react';
import { useMutation } from '../api.js';
import { publicGoals, timingLabel } from '../publicStack.js';
import { Empty, Input, Notice, Select, Textarea } from './ui.jsx';

const blankInsight = () => ({ kind: 'conflict', compound_ids: [], goals: [], title: '', explanation: '', source: '', replacement_id: null, target_id: null, bucket: null, published: false });
const kinds = [['conflict', 'Conflict'], ['waste', 'Wasted overlap'], ['goal_tradeoff', 'Goal trade-off'], ['label', 'Label truth'], ['swap', 'Smarter swap'], ['timing', 'Timing placement']];

export default function PublicInsightEditor({ library, onSaved }) {
  const [selected, setSelected] = useState('');
  const [draft, setDraft] = useState(blankInsight);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const mutation = useMutation();
  const insights = library.public_insights || [];
  useEffect(() => {
    const record = insights.find((entry) => entry.id === selected);
    setDraft(record ? { ...blankInsight(), ...record, bucket: timingLabel(record.bucket) } : blankInsight());
  }, [selected, library]);
  const edit = (key, value) => { setSuccess(''); setError(''); setDraft((current) => ({ ...current, [key]: value })); };
  function toggle(key, value) { edit(key, draft[key].includes(value) ? draft[key].filter((entry) => entry !== value) : [...draft[key], value]); }
  const targetCompounds = library.compounds.filter((compound) => draft.compound_ids.includes(compound.id));
  const unpublished = targetCompounds.filter((compound) => !compound.public_visible);
  const replacement = library.compounds.find((compound) => compound.id === draft.replacement_id);
  const cannotPublish = unpublished.length > 0 || (draft.kind === 'swap' && !replacement?.public_visible);
  async function submit(event) {
    event.preventDefault(); setError('');
    if (!draft.compound_ids.length) { setError('Choose the compounds this note applies to.'); return; }
    if (draft.published && cannotPublish) { setError('Publish the selected compounds separately before publishing this note.'); return; }
    const targeting = draft.kind === 'timing' || draft.kind === 'swap';
    const body = { ...(selected ? { id: selected } : {}), kind: draft.kind, compound_ids: draft.compound_ids, goals: draft.goals, title: draft.title, explanation: draft.explanation, source: draft.source, replacement_id: draft.kind === 'swap' ? draft.replacement_id : null, target_id: targeting ? draft.target_id : null, bucket: draft.kind === 'timing' ? draft.bucket : null, published: Boolean(draft.published) };
    try {
      const result = await mutation.run('/library/public-insights', body);
      if (result) { await onSaved(); setSelected(result.id); setSuccess(draft.published ? 'Public note saved and published.' : 'Draft saved. It is not visible in the public stack check.'); }
    } catch { /* Keep the exact publication draft. */ }
  }
  if (!library.compounds.length) return <div className="drawer-content"><Empty title="Add compounds first">Public notes refer to exact library entries. Nothing is published automatically.</Empty></div>;
  return <div className="drawer-content"><p className="muted">Public notes are separate from private model parameters and client records. Publication is explicit for each compound and each note.</p>
    <Select label="Public note" value={selected} disabled={mutation.pending} onChange={(event) => { setSelected(event.target.value); setSuccess(''); setError(''); mutation.clearError(); }}><option value="">Add a public note</option>{insights.map((entry) => <option key={entry.id} value={entry.id}>{entry.title} · {entry.published ? 'Published' : 'Draft'}</option>)}</Select>
    <form onSubmit={submit}><fieldset className="form-fields" disabled={mutation.pending}><Select label="Note type" value={draft.kind} onChange={(event) => edit('kind', event.target.value)}>{kinds.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select>
      <fieldset className="checkbox-group"><legend>Applies when these compounds are present</legend>{library.compounds.map((compound) => <label className="checkbox" key={compound.id}><input type="checkbox" checked={draft.compound_ids.includes(compound.id)} onChange={() => toggle('compound_ids', compound.id)} /><span>{compound.name}{!compound.public_visible && <small> · not public</small>}</span></label>)}</fieldset>
      <fieldset className="checkbox-group goal-checkboxes"><legend>Relevant goals</legend><p className="microcopy">Leave unselected to apply across all goals.</p>{publicGoals.map(([key, label]) => <label className="checkbox" key={key}><input type="checkbox" checked={draft.goals.includes(key)} onChange={() => toggle('goals', key)} /><span>{label}</span></label>)}</fieldset>
      {(draft.kind === 'timing' || draft.kind === 'swap') && <Select label={draft.kind === 'swap' ? 'Compound to replace' : 'Compound to place'} required value={draft.target_id || ''} onChange={(event) => edit('target_id', event.target.value || null)}><option value="">Select an applicable compound</option>{targetCompounds.map((compound) => <option value={compound.id} key={compound.id}>{compound.name}</option>)}</Select>}
      {draft.kind === 'swap' && <Select label="Replacement compound" required value={draft.replacement_id || ''} onChange={(event) => edit('replacement_id', event.target.value || null)}><option value="">Select replacement</option>{library.compounds.filter((compound) => compound.id !== draft.target_id).map((compound) => <option value={compound.id} key={compound.id}>{compound.name}{!compound.public_visible ? ' · not public' : ''}</option>)}</Select>}
      {draft.kind === 'timing' && <Input label="Timing label" required maxLength="120" value={draft.bucket || ''} onChange={(event) => edit('bucket', event.target.value || null)} hint="Use the timing supported by the source, such as With lunch or After training." />}
      <Input label="Public title" required maxLength="180" value={draft.title} onChange={(event) => edit('title', event.target.value)} /><Textarea label="Public explanation / timing reason" required rows="4" maxLength="2000" value={draft.explanation} onChange={(event) => edit('explanation', event.target.value)} /><Textarea label="Public source / applicability" required maxLength="2000" value={draft.source} onChange={(event) => edit('source', event.target.value)} />
      {unpublished.length > 0 && <p className="microcopy">Not yet public: {unpublished.map((compound) => compound.name).join(', ')}. Use each compound’s visibility setting to publish its identity first.</p>}
      <label className="checkbox publication-checkbox"><input type="checkbox" checked={draft.published} onChange={(event) => edit('published', event.target.checked)} /><span>Publish this note in the public stack check</span></label><Notice>{error || mutation.error}</Notice><Notice kind="success">{success}</Notice><div className="form-actions"><button className="button primary" disabled={mutation.pending || (draft.published && cannotPublish)}>{mutation.pending ? 'Saving…' : draft.published ? 'Save and publish note' : 'Save draft'}</button></div>
    </fieldset></form>
  </div>;
}
