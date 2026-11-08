import { useEffect, useState } from 'react';
import { useMutation } from '../api.js';
import { nameFor, numeric } from '../format.js';
import { Drawer, Empty, Input, Notice, Select, Tabs, Textarea } from './ui.jsx';
import PublicInsightEditor from './PublicInsightEditor.jsx';

const blankCompound = () => ({ name: '', aliases: '', form: '', route: '', model: 'unconfigured', half_life_h: '', absorption_half_life_h: '', bioavailability: '', volume_l: '', unbound_fraction: '', iu_mg: '', ml_mg: '', source: '', notes: '', status: 'draft', public_visible: false });
function compoundDraft(compound) {
  return { ...blankCompound(), ...compound, aliases: (compound.aliases || []).join(', '), iu_mg: compound.mass_per_unit_mg?.IU ?? '', ml_mg: compound.mass_per_unit_mg?.mL ?? '' };
}
function CompoundEditor({ library, onSaved }) {
  const [selected, setSelected] = useState('');
  const [draft, setDraft] = useState(blankCompound);
  const [success, setSuccess] = useState('');
  const mutation = useMutation();
  useEffect(() => {
    const compound = library.compounds.find((entry) => entry.id === selected);
    setDraft(compound ? compoundDraft(compound) : blankCompound());
  }, [selected, library]);
  const edit = (key, value) => { setSuccess(''); setDraft((current) => ({ ...current, [key]: value })); };
  async function submit(event) {
    event.preventDefault();
    const body = {
      ...(selected ? { id: selected } : {}), name: draft.name,
      aliases: draft.aliases.split(/[,\n]/).map((name) => name.trim()).filter(Boolean),
      form: draft.form, route: draft.route, model: draft.model, status: draft.status,
      half_life_h: numeric(draft.half_life_h), absorption_half_life_h: numeric(draft.absorption_half_life_h), bioavailability: numeric(draft.bioavailability), volume_l: numeric(draft.volume_l), unbound_fraction: numeric(draft.unbound_fraction),
      mass_per_unit_mg: { ...(draft.iu_mg !== '' ? { IU: Number(draft.iu_mg) } : {}), ...(draft.ml_mg !== '' ? { mL: Number(draft.ml_mg) } : {}) },
      source: draft.source, notes: draft.notes, public_visible: Boolean(draft.public_visible),
    };
    try {
      const result = await mutation.run('/library/compounds', body);
      if (result) { await onSaved(); setSelected(result.id); setSuccess('Compound saved to the shared library.'); }
    } catch { /* Preserve the draft. */ }
  }
  return <div className="drawer-content"><Select label="Library entry" value={selected} onChange={(event) => { setSelected(event.target.value); setSuccess(''); mutation.clearError(); }}><option value="">Add a compound</option>{library.compounds.map((compound) => <option key={compound.id} value={compound.id}>{compound.name}</option>)}</Select>
    <form onSubmit={submit}><Input label="Compound name" required value={draft.name} maxLength="160" onChange={(event) => edit('name', event.target.value)} /><Input label="Aliases (comma separated)" value={draft.aliases} onChange={(event) => edit('aliases', event.target.value)} />
      <div className="form-grid two"><Input label="Form / active species" value={draft.form} maxLength="160" onChange={(event) => edit('form', event.target.value)} /><Input label="Route" value={draft.route} maxLength="80" onChange={(event) => edit('route', event.target.value)} /></div>
      <Select label="Exposure model" value={draft.model} onChange={(event) => edit('model', event.target.value)}><option value="unconfigured">Not configured — tracking only</option><option value="linear_bolus">Linear bolus model</option><option value="linear_oral">Linear oral model</option></Select>
      {draft.model !== 'unconfigured' && <><div className="form-grid two"><Input label="Elimination half-life (h)" type="number" min="0" max="100000" step="any" required value={draft.half_life_h ?? ''} onChange={(event) => edit('half_life_h', event.target.value)} />{draft.model === 'linear_oral' && <Input label="Absorption half-life (h)" type="number" min="0" max="100000" step="any" required value={draft.absorption_half_life_h ?? ''} onChange={(event) => edit('absorption_half_life_h', event.target.value)} />}</div><div className="form-grid two"><Input label="Bioavailability (fraction)" type="number" min="0" max="1" step="any" value={draft.bioavailability ?? ''} onChange={(event) => edit('bioavailability', event.target.value)} /><Input label="Distribution volume (L)" type="number" min="0" max="100000" step="any" value={draft.volume_l ?? ''} onChange={(event) => edit('volume_l', event.target.value)} /></div><Input label="Unbound fraction (0–1)" type="number" min="0" max="1" step="any" value={draft.unbound_fraction ?? ''} onChange={(event) => edit('unbound_fraction', event.target.value)} hint="Required for a relationship using unbound inhibitor concentration. Leave unknown values blank." /><p className="microcopy">Leave unknown parameters blank. Absolute concentration and quantitative coupling require the dimensionally compatible inputs.</p></>}
      <details className="reason"><summary>Compound-specific unit mappings</summary><p className="muted small">Use only a sourced conversion for this exact form. No generic IU or volume conversion is assumed.</p><div className="form-grid two"><Input label="mg per IU" type="number" min="0" step="any" value={draft.iu_mg} onChange={(event) => edit('iu_mg', event.target.value)} /><Input label="mg per mL" type="number" min="0" step="any" value={draft.ml_mg} onChange={(event) => edit('ml_mg', event.target.value)} /></div></details>
      <Textarea label="Parameter source / version" required={draft.model !== 'unconfigured'} value={draft.source} maxLength="3000" onChange={(event) => edit('source', event.target.value)} />
      <Textarea label="Notes" value={draft.notes} maxLength="3000" onChange={(event) => edit('notes', event.target.value)} /><Select label="Configuration status" value={draft.status} onChange={(event) => edit('status', event.target.value)}><option value="draft">Draft</option><option value="configured">Configured</option></Select>
      <label className="checkbox publication-checkbox"><input type="checkbox" checked={Boolean(draft.public_visible)} onChange={(event) => edit('public_visible', event.target.checked)} /><span>Make this compound available in the public stack check<small>Private model parameters and client records are not published.</small></span></label>
      <Notice>{mutation.error}</Notice><Notice kind="success">{success}</Notice><div className="form-actions"><button className="button primary" disabled={mutation.pending}>{mutation.pending ? 'Saving…' : 'Save compound'}</button></div>
    </form>
  </div>;
}

const blankRelation = () => ({ perpetrator_id: '', victim_id: '', kind: 'complementary', title: '', description: '', pathway: '', fraction_metabolized: '', ki_mg_l: '', concentration_basis: 'unbound', source: '', goal: '' });
const relationKinds = [['competitive_inhibition', 'Competitive inhibition (quantitative)'], ['complementary', 'Complementary'], ['duplicate', 'Duplicate / overlapping'], ['opposing', 'Opposing'], ['alternative', 'Alternative']];
function RelationEditor({ library, onSaved }) {
  const [selected, setSelected] = useState('');
  const [draft, setDraft] = useState(blankRelation);
  const [success, setSuccess] = useState('');
  const mutation = useMutation();
  useEffect(() => {
    const relation = library.relations.find((entry) => entry.id === selected);
    setDraft(relation ? { ...blankRelation(), ...relation } : blankRelation());
  }, [selected, library]);
  const edit = (key, value) => { setSuccess(''); setDraft((current) => ({ ...current, [key]: value })); };
  async function submit(event) {
    event.preventDefault();
    const body = { ...(selected ? { id: selected } : {}), perpetrator_id: draft.perpetrator_id, victim_id: draft.victim_id, kind: draft.kind, title: draft.title, description: draft.description, pathway: draft.pathway, fraction_metabolized: numeric(draft.fraction_metabolized), ki_mg_l: numeric(draft.ki_mg_l), concentration_basis: draft.concentration_basis, source: draft.source, goal: draft.goal };
    try {
      const result = await mutation.run('/library/relations', body);
      if (result) { await onSaved(); setSelected(result.id); setSuccess('Relationship saved.'); }
    } catch { /* Preserve the draft. */ }
  }
  if (library.compounds.length < 2) return <div className="drawer-content"><Empty title="Add two compounds first">Relationships link two exact library entries.</Empty></div>;
  return <div className="drawer-content"><Select label="Relationship" value={selected} onChange={(event) => { setSelected(event.target.value); setSuccess(''); mutation.clearError(); }}><option value="">Add a relationship</option>{library.relations.map((relation) => <option key={relation.id} value={relation.id}>{relation.title}</option>)}</Select>
    <form onSubmit={submit}><div className="form-grid two"><Select label="From (driver)" required value={draft.perpetrator_id} onChange={(event) => edit('perpetrator_id', event.target.value)}><option value="">Select compound</option>{library.compounds.map((compound) => <option value={compound.id} key={compound.id}>{compound.name}</option>)}</Select><Select label="To (affected compound)" required value={draft.victim_id} onChange={(event) => edit('victim_id', event.target.value)}><option value="">Select compound</option>{library.compounds.map((compound) => <option value={compound.id} key={compound.id}>{compound.name}</option>)}</Select></div>
      <Select label="Relationship type" value={draft.kind} onChange={(event) => edit('kind', event.target.value)}>{relationKinds.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Input label="Title" required value={draft.title} maxLength="200" onChange={(event) => edit('title', event.target.value)} /><Textarea label="Description and applicability" value={draft.description} maxLength="3000" onChange={(event) => edit('description', event.target.value)} />
      {draft.kind === 'competitive_inhibition' && <><Input label="Clearance pathway" required value={draft.pathway} maxLength="80" onChange={(event) => edit('pathway', event.target.value)} /><div className="form-grid two"><Input label="Fraction metabolized by this pathway" type="number" min="0" max="1" step="any" required value={draft.fraction_metabolized ?? ''} onChange={(event) => edit('fraction_metabolized', event.target.value)} /><Input label="Inhibition constant (mg/L)" type="number" min="0" step="any" required value={draft.ki_mg_l ?? ''} onChange={(event) => edit('ki_mg_l', event.target.value)} /></div><Select label="Inhibitor concentration basis" value={draft.concentration_basis} onChange={(event) => edit('concentration_basis', event.target.value)} hint="Match the concentration basis of the supplied inhibition constant."><option value="unbound">Unbound — requires the driver’s unbound fraction</option><option value="central_total">Central total — explicitly apparent / model-matched constant</option></Select><p className="microcopy">Quantitative coupling requires compatible concentration and inhibition-constant units. Other links stay qualitative.</p></>}
      <Input label="Goal / context (optional)" value={draft.goal} maxLength="200" onChange={(event) => edit('goal', event.target.value)} /><Textarea label="Source / version" required value={draft.source} maxLength="3000" onChange={(event) => edit('source', event.target.value)} />
      <Notice>{mutation.error}</Notice><Notice kind="success">{success}</Notice><div className="form-actions"><button className="button primary" disabled={mutation.pending}>{mutation.pending ? 'Saving…' : 'Save relationship'}</button></div>
    </form>
  </div>;
}

function LibraryImport({ library, onSaved }) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const mutation = useMutation();
  function review(event) {
    event.preventDefault(); setError(''); setSuccess('');
    try {
      const parsed = JSON.parse(text);
      const keys = ['compounds', 'relations', 'public_insights'];
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object' || !keys.some((key) => key in parsed)) throw new Error('JSON must contain a compounds, relations or public_insights array.');
      if (Object.keys(parsed).some((key) => !keys.includes(key))) throw new Error('Only compounds, relations and public_insights are accepted.');
      if (keys.some((key) => parsed[key] !== undefined && !Array.isArray(parsed[key]))) throw new Error('Each supplied library field must be an array.');
      setPreview(Object.fromEntries(keys.map((key) => [key, parsed[key] || []])));
    } catch (cause) { setError(cause.message); setPreview(null); }
  }
  async function apply() {
    try {
      const result = await mutation.run('/library/import', preview);
      if (result) { await onSaved(); setSuccess('Library import saved.'); setPreview(null); setText(''); }
    } catch { /* Preserve reviewed input. */ }
  }
  return <div className="drawer-content"><p className="muted">Import structured compound, relationship and public-note definitions. Exact aliases may resolve references; ambiguous identities are rejected.</p><form onSubmit={review}><Input label="Choose JSON file (optional)" type="file" accept=".json,application/json" onChange={async (event) => { const file = event.target.files?.[0]; if (file) { setText(await file.text()); setPreview(null); setSuccess(''); } }} /><Textarea label="Library JSON" rows="12" spellCheck="false" className="code-field" required value={text} onChange={(event) => { setText(event.target.value); setPreview(null); setSuccess(''); }} hint="Object with compounds, relations and/or public_insights arrays. Parameters and explicit publication flags remain as supplied." /><button className="button secondary">Review import</button></form><Notice>{error || mutation.error}</Notice><Notice kind="success">{success}</Notice>
    {preview && <section className="import-preview"><h3>Review before saving</h3><p>{preview.compounds.length} compounds · {preview.relations.length} relationships · {preview.public_insights.length} public notes</p><ul>{preview.compounds.map((compound, index) => <li key={index}>{compound.name || 'Missing compound name'} — {compound.model === 'unconfigured' || !compound.model ? 'tracking only' : compound.model.replaceAll('_', ' ')}{compound.public_visible === true ? ' · public identity' : ''}</li>)}{preview.relations.map((relation, index) => <li key={`relation-${index}`}>{relation.title || `${nameFor(library, relation.perpetrator_id)} → ${nameFor(library, relation.victim_id)}`}</li>)}{preview.public_insights.map((insight, index) => <li key={`insight-${index}`}>{insight.title || 'Missing note title'} · {insight.published === true ? 'publish publicly' : 'draft only'}</li>)}</ul>{(preview.compounds.some((compound) => compound.public_visible === true) || preview.public_insights.some((insight) => insight.published === true)) && <Notice kind="info">This import explicitly publishes: {[...preview.compounds.filter((compound) => compound.public_visible === true).map((compound) => compound.name), ...preview.public_insights.filter((insight) => insight.published === true).map((insight) => insight.title)].join(', ')}.</Notice>}<p className="microcopy">Entries with existing IDs are updated. Public visibility is off unless explicitly supplied. The server validates all fields before saving.</p><button className="button primary" onClick={apply} disabled={mutation.pending}>{mutation.pending ? 'Importing…' : 'Confirm library import'}</button></section>}
  </div>;
}

export default function LibraryDrawer({ library, onSaved, onClose }) {
  const [tab, setTab] = useState('compounds');
  return <Drawer title="Shared library" subtitle="Reusable definitions for every workspace." onClose={onClose}><Tabs label="Library sections" value={tab} onChange={setTab} entries={[[ 'compounds', 'Compounds'], ['relations', 'Relationships'], ['public', 'Public notes'], ['import', 'Import']]} />{tab === 'compounds' && <CompoundEditor library={library} onSaved={onSaved} />}{tab === 'relations' && <RelationEditor library={library} onSaved={onSaved} />}{tab === 'public' && <PublicInsightEditor library={library} onSaved={onSaved} />}{tab === 'import' && <LibraryImport library={library} onSaved={onSaved} />}</Drawer>;
}
