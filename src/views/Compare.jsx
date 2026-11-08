import { useEffect, useRef, useState } from 'react';
import { request, useMutation } from '../api.js';
import { browserTimezone, dateTime, instant, localTime, nameFor, number, numeric, scopeLabel } from '../format.js';
import { Drawer, Empty, Input, Loading, Notice, SectionHead, Select, Status } from '../components/ui.jsx';
import { Coverage, Findings, SeriesDetails } from '../components/Evaluation.jsx';
import Chart from '../components/Chart.jsx';

function initialDraft(item) {
  return { item_id: item?.id || '', amount: item?.next_amount ?? item?.amount ?? '', interval_h: '', shift_h: '0', scope: 'schedule_from', effective_from: localTime(), horizon_h: '168' };
}
const percent = (value) => value == null ? 'Not computed' : `${value > 0 ? '+' : ''}${number(value)}%`;

export default function Compare({ workspace, library, owner, onRefresh }) {
  const items = workspace.protocol.items.filter((entry) => entry.due_status !== 'complete');
  const [draft, setDraft] = useState(() => initialDraft(items[0]));
  const [comparison, setComparison] = useState(null);
  const [comparedDraft, setComparedDraft] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [match, setMatch] = useState(null);
  const [matchPending, setMatchPending] = useState(false);
  const [minimum, setMinimum] = useState(items[0]?.minimum_amount ?? '');
  const [maximum, setMaximum] = useState(items[0]?.maximum_amount ?? '');
  const [target, setTarget] = useState('100');
  const currentRequest = useRef(null);
  const sequence = useRef(0);
  const effectiveEdited = useRef(false);
  const apply = useMutation();
  const item = items.find((entry) => entry.id === draft.item_id);
  const canEdit = owner || workspace.allow_plan_changes;
  function invalidate() {
    sequence.current += 1; currentRequest.current?.abort();
    setComparison(null); setComparedDraft(null); setMatch(null); setError(''); setPending(false); setMatchPending(false); setConfirm(false);
  }
  function edit(key, value) { if (key === 'effective_from') effectiveEdited.current = true; invalidate(); setSuccess(''); setDraft((current) => ({ ...current, [key]: value })); }
  function chooseItem(id) {
    invalidate(); setSuccess('');
    const chosen = items.find((entry) => entry.id === id);
    effectiveEdited.current = false; setDraft(initialDraft(chosen)); setMinimum(chosen?.minimum_amount ?? ''); setMaximum(chosen?.maximum_amount ?? '');
  }
  useEffect(() => {
    invalidate();
    if (!items.some((entry) => entry.id === draft.item_id)) setDraft(initialDraft(items[0]));
    return () => { sequence.current += 1; currentRequest.current?.abort(); };
    // A revision change invalidates every result, even when the edited item still exists.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.id, workspace.revision, library.revision]);
  function bodyFor(current) {
    return { expected_revision: workspace.revision, item_id: current.item_id, amount: Number(current.amount), interval_h: current.scope === 'next_occurrence' ? null : numeric(current.interval_h), shift_h: Number(current.shift_h || 0), scope: current.scope, effective_from: effectiveEdited.current ? instant(current.effective_from) : new Date().toISOString(), horizon_h: Number(current.horizon_h) };
  }
  async function runComparison(current = draft) {
    invalidate(); setSuccess('');
    const requestNumber = ++sequence.current;
    const controller = new AbortController(); currentRequest.current = controller;
    setPending(true);
    try {
      const body = bodyFor(current);
      const result = await request(`/workspaces/${workspace.id}/compare`, { method: 'POST', body, signal: controller.signal, key: crypto.randomUUID() });
      if (sequence.current === requestNumber && !controller.signal.aborted) { setComparison(result); setComparedDraft(body); }
    } catch (cause) { if (cause.name !== 'AbortError' && sequence.current === requestNumber) setError(cause.message); }
    finally { if (sequence.current === requestNumber) setPending(false); }
  }
  async function matchExposure(event) {
    event.preventDefault(); invalidate();
    const requestNumber = ++sequence.current;
    const controller = new AbortController(); currentRequest.current = controller; setMatchPending(true);
    try {
      const result = await request(`/workspaces/${workspace.id}/match`, { method: 'POST', body: { ...bodyFor(draft), minimum_amount: Number(minimum), maximum_amount: Number(maximum), target_percent: Number(target) }, signal: controller.signal });
      if (sequence.current === requestNumber && !controller.signal.aborted) setMatch(result);
    } catch (cause) { if (cause.name !== 'AbortError' && sequence.current === requestNumber) setError(cause.message); }
    finally { if (sequence.current === requestNumber) setMatchPending(false); }
  }
  async function applyComparison() {
    try {
      const result = await apply.run(`/workspaces/${workspace.id}/apply`, { comparison_id: comparison.id, expected_revision: workspace.revision });
      if (result) { setConfirm(false); setSuccess('The chosen change is now saved to your protocol.'); await onRefresh(); }
    } catch { /* The server rejects stale comparisons; retain the reason and require a new comparison. */ }
  }
  if (!items.length) return <Empty title={workspace.protocol.items.length ? 'No upcoming schedule to compare' : 'Add a protocol before comparing'}>{workspace.protocol.items.length ? 'Completed schedules and actual records are retained. A new future schedule must be assigned before it can be compared.' : 'A comparison changes one assigned item against the same current state. No plan is active here yet.'}</Empty>;
  return <div className="compare-layout"><section className="comparison-controls"><SectionHead title="Compare a change">Explore amount and timing. Your current plan stays unchanged until you save.</SectionHead>
    <form onSubmit={(event) => { event.preventDefault(); runComparison(); }}>
      <Select label="Compound" value={draft.item_id} onChange={(event) => chooseItem(event.target.value)}>{items.map((entry) => <option key={entry.id} value={entry.id}>{nameFor(library, entry.compound_id)} · {entry.amount} {entry.unit}</option>)}</Select>
      {item && <p className="current-plan">Current: <strong>{number(item.amount)} {item.unit}</strong> {item.interval_h == null ? 'once' : `every ${number(item.interval_h)} h`}</p>}
      <div className="form-grid two"><Input label={`Proposed amount (${item?.unit || ''})`} type="number" step="any" min="0" required value={draft.amount} onChange={(event) => edit('amount', event.target.value)} /><Input label="Interval (hours)" type="number" step="any" min="0.25" max="8760" placeholder="Keep current" disabled={draft.scope === 'next_occurrence'} value={draft.scope === 'next_occurrence' ? '' : draft.interval_h} onChange={(event) => edit('interval_h', event.target.value)} hint={draft.scope === 'next_occurrence' ? 'A next-occurrence change keeps the recurring interval.' : 'Blank keeps the current interval.'} /></div>
      <Input label="Timing shift (hours)" type="number" min="-720" max="720" step="any" required value={draft.shift_h} onChange={(event) => edit('shift_h', event.target.value)} hint="Negative moves it earlier; positive moves it later." />
      <Select label="Change scope" value={draft.scope} onChange={(event) => edit('scope', event.target.value)}><option value="schedule_from">Recurring schedule from this time</option><option value="next_occurrence">Next occurrence only</option></Select>
      <Input label="Effective from" type="datetime-local" required value={draft.effective_from} onChange={(event) => edit('effective_from', event.target.value)} hint={`Time in ${browserTimezone()}. Uses now when you compare unless you choose a time. Past actual records are not edited.`} />
      <Select label="Comparison horizon" value={draft.horizon_h} onChange={(event) => edit('horizon_h', event.target.value)}><option value="24">24 hours</option><option value="72">72 hours</option><option value="168">7 days</option><option value="336">14 days</option><option value="720">30 days</option></Select>
      <button className="button primary full-width" disabled={pending || matchPending}>{pending ? 'Comparing…' : 'Run comparison'}</button>
    </form>
    <details className="exposure-tool"><summary>Match current exposure</summary><p className="muted small">Match a percentage of this item’s current modeled exposure after your timing change, within a chosen amount range.</p>
      <form onSubmit={matchExposure}><div className="form-grid two"><Input label={`Minimum (${item?.unit || ''})`} type="number" step="any" min="0" required value={minimum} onChange={(event) => { invalidate(); setMinimum(event.target.value); }} /><Input label={`Maximum (${item?.unit || ''})`} type="number" step="any" min="0" required value={maximum} onChange={(event) => { invalidate(); setMaximum(event.target.value); }} /></div><Input label="Target exposure (%)" type="number" step="any" min="0" max="1000" required value={target} onChange={(event) => { invalidate(); setTarget(event.target.value); }} /><button className="button secondary full-width" disabled={pending || matchPending}>{matchPending ? 'Finding matches…' : 'Find exposure matches'}</button></form>
      {match && <div className="match-result"><p>{match.explanation}</p>{match.solutions.length ? <div className="match-options">{match.solutions.map((solution, index) => <button className="button secondary small-button" key={index} onClick={() => { const next = { ...draft, amount: solution }; setDraft(next); runComparison(next); }}>Compare {number(solution)} {match.unit}</button>)}</div> : <p>No solution in the chosen range.</p>}</div>}
    </details>
  </section><div className="comparison-output" aria-live="polite"><Notice>{error}</Notice><Notice kind="success">{success}</Notice>
    {(pending || matchPending) && <Loading>{pending ? 'Comparing against the current state…' : 'Searching the configured range…'}</Loading>}
    {!comparison && !pending && !matchPending && <Empty title="See what changes">Run a comparison to see exposure changes, interactions and configured conditions.</Empty>}
    {comparison && <>
      <SectionHead title="What changes" action={<Status value="neutral">Not saved</Status>}>{scopeLabel(comparedDraft.scope)} · {dateTime(comparedDraft.effective_from, workspace.timezone)}</SectionHead>
      <Coverage evaluation={comparison.proposed} />
      {comparison.changes?.length > 0 && <div className="delta-list">{comparison.changes.map((change) => <article className="delta-row" key={change.compound_id}><h3>{change.name}</h3><div><span>Exposure area</span><strong>{percent(change.auc_percent)}</strong></div><div><span>Peak</span><strong>{percent(change.peak_percent)}</strong></div></article>)}</div>}
      <div className="curve-list">{comparison.proposed.series.map((series) => {
        const baseline = comparison.baseline.series.find((entry) => entry.compound_id === series.compound_id);
        if (series.status !== 'computed') return <div className="missing-model" key={series.compound_id}><h3>{series.name}</h3><p>Not computed: {series.missing?.join('; ') || 'the required model inputs are not configured.'}</p></div>;
        return <article className="curve-result" key={series.compound_id}><Chart title={series.name} unit={series.unit} series={[...(baseline?.status === 'computed' ? [{ ...baseline, label: 'Current plan', dashed: true }] : []), { ...series, label: 'Proposed plan' }]} />{series.unit === 'relative' && <p className="microcopy">Relative exposure for this compound only; not an absolute concentration or a cross-compound total.</p>}<SeriesDetails series={series} owner={owner} /></article>;
      })}</div>
      <Findings evaluation={{ ...comparison.proposed, gates: comparison.gates || comparison.proposed.gates }} heading="Conditions and trade-offs" />
      {comparison.explanation && <details className="reason" open><summary>Why this result</summary><p>{typeof comparison.explanation === 'string' ? comparison.explanation : JSON.stringify(comparison.explanation)}</p></details>}
      <div className="save-comparison"><div><h3>Keep this change?</h3><p>{!canEdit ? 'You can compare scenarios. Your owner manages saved protocol changes.' : !comparison.can_apply ? 'The configured conditions do not permit saving this change.' : 'Saving changes the planned protocol, not your actual intake history.'}</p></div><button className="button primary" disabled={!canEdit || !comparison.can_apply} onClick={() => setConfirm(true)}>Save change</button></div>
    </>}
  </div>
    {confirm && comparison && <Drawer title="Save this protocol change?" onClose={() => { if (!apply.pending) setConfirm(false); }}><div className="drawer-content"><p className="confirmation-amount">{nameFor(library, item.compound_id)} <strong>{number(comparedDraft.amount)} {item.unit}</strong></p><dl className="definition-list"><div><dt>Scope</dt><dd>{scopeLabel(comparedDraft.scope)}</dd></div><div><dt>Effective</dt><dd>{dateTime(comparedDraft.effective_from, workspace.timezone)}</dd></div><div><dt>Interval</dt><dd>{comparedDraft.interval_h == null ? 'Keep current' : `${number(comparedDraft.interval_h)} h`}</dd></div><div><dt>Timing shift</dt><dd>{number(comparedDraft.shift_h)} h</dd></div></dl><p className="muted">Actual records remain unchanged. This saves only the scenario you just compared.</p><Notice>{apply.error}</Notice><div className="form-actions"><button className="button quiet" disabled={apply.pending} onClick={() => setConfirm(false)}>Cancel</button><button className="button primary" disabled={apply.pending} onClick={applyComparison}>{apply.pending ? 'Saving…' : 'Confirm and save'}</button></div></div></Drawer>}
  </div>;
}
