import { useEffect, useRef, useState } from 'react';
import { request } from '../api.js';
import { savePhoneCard } from '../phoneCard.js';
import { goalName, publicGoals, publicItemLabel, resolveStackPhrase, stackAfterSwap } from '../publicStack.js';
import { computeCostAndWasteAnalysis, findGoalProtocol } from '../studioLogic.js';
import ReceptorMap from '../components/ReceptorMap.jsx';
import { Brand, Icon, Input, Loading, Notice, Textarea } from '../components/ui.jsx';

function InsightList({ title, insights, kind = '' }) {
  if (!insights?.length) return null;
  return <section className={`public-insights public-insights-${kind}`}><h2>{title}</h2>{insights.map((insight) => <article className="public-insight" key={insight.id}><h3>{insight.title}</h3><p>{insight.explanation}</p>{insight.source && <details className="public-source"><summary>Source</summary><p>{insight.source}</p></details>}</article>)}</section>;
}

export function PublicAuditResult({ audit, suppliedText = '', onResolve, onSwap, pending, onSave, saving, saveStatus, saveError, onOpenFinder }) {
  const swapsRef = useRef(null);
  const guide = audit.timing_guide || [];
  const costSummary = audit.cost_analysis || computeCostAndWasteAnalysis(audit.items || [], audit.conflicts || [], audit.waste || [], audit.swaps || []);
  function showSwaps() { swapsRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); swapsRef.current?.focus({ preventScroll: true }); }
  return <div className="public-results"><section className="public-verdict"><div><span className="public-goal-label">{goalName(audit.goal)}</span><h2>{audit.verdict.title}</h2><p>{audit.verdict.summary}</p></div><p className="coverage">{audit.coverage.recognized} of {audit.coverage.total} entries recognized</p></section>
    <section className="waste-savings-banner" aria-label="Money wasted and money saved">
      <div className="waste-metric-primary">
        <span>Money Wasted / Money Saved</span>
        <strong className="tabular-nums">${costSummary.wastedMonthlyUsd}/mo wasted · ${costSummary.annualSavedUsd}/yr saved</strong>
        <p>Current estimated spend: ${costSummary.currentMonthlyUsd}/mo → Optimized spend: ${costSummary.optimizedMonthlyUsd}/mo ({costSummary.wastePct}% waste eliminated).</p>
      </div>
      {onOpenFinder && (
        <button type="button" className="button secondary small-button" onClick={onOpenFinder}>
          Open Goal → Protocol Finder &amp; Pre-Filled Consult Intake
        </button>
      )}
    </section>
    <section className="recognized-stack" aria-label="Recognized stack">{audit.items.map((item, index) => <div className="recognized-item" key={`${item.id}-${index}`}><span>{publicItemLabel(item)}</span>{audit.swaps.some((swap) => swap.compound_id === item.id) && <button type="button" className="text-button" onClick={showSwaps}>See smarter swap</button>}</div>)}</section>
    {(audit.unknown.length > 0 || audit.ambiguous.length > 0) && <section className="public-unresolved"><h2>Check these names</h2>{audit.unknown.length > 0 && <><p>These entries were not recognized. They have not been cleared for interactions or timing.</p><ul>{audit.unknown.map((name, index) => <li key={index}>{name}</li>)}</ul></>}{audit.ambiguous.map((entry, index) => <div className="ambiguous-entry" key={index}><h3>{entry.text}</h3><p>Which exact compound did you mean?</p><div className="resolution-options">{entry.options.map((option) => <button type="button" className="button secondary small-button" disabled={pending} key={option.id} onClick={() => onResolve(entry.text, option.name)}>{option.name}</button>)}</div></div>)}</section>}
    <div className="public-analysis"><InsightList title="What is fighting itself" kind="conflict" insights={audit.conflicts} /><InsightList title="What may be wasted" insights={audit.waste} /><InsightList title="Trade-offs for your goal" insights={audit.goal_tradeoffs} /><InsightList title="Label truth" insights={audit.label_truth} /></div>
    {audit.swaps.length > 0 && <section className="public-swaps" id="smarter-swaps" ref={swapsRef} tabIndex="-1"><h2>Smarter swaps</h2>{audit.swaps.map((swap) => <article className="public-insight" key={swap.id}><h3>{swap.title}</h3><p>{swap.explanation}</p><div className="swap-action"><span>Try <strong>{swap.replacement_name}</strong></span><button type="button" className="button secondary small-button" disabled={pending} onClick={() => onSwap(swap)}>Try this swap<Icon name="arrow" /></button></div><p className="microcopy">This changes only your entered stack. No amount is carried over to the replacement.</p>{swap.source && <details className="public-source"><summary>Source</summary><p>{swap.source}</p></details>}</article>)}</section>}
    <ReceptorMap items={audit.items} suppliedText={suppliedText} title="Your Stack's Map · Receptor & Pathway Overlap" />
    <section className="public-timing"><div className="section-head">{guide.length > 0 && <div><h2>Timing guide</h2><p>Timing notes for the stack you entered.</p></div>}<button className="button primary" onClick={onSave} disabled={saving || pending}><Icon name="download" />{saving ? 'Creating card…' : 'Save phone card'}</button></div>
      {guide.length > 0 && <div className="timing-guide">{guide.map((item, index) => <article className="timing-guide-row" key={`${item.id}-${index}`}><div><h3>{publicItemLabel(item)}</h3><span className={`timing-guide-label${item.timing ? '' : ' timing-guide-pending'}`}>{item.timing || 'Timing to confirm'}</span></div><p>{item.reason || (!item.timing ? 'Timing is not specified for this entry.' : '')}</p></article>)}</div>}
      {audit.conflicts.length > 0 && guide.some((item) => item.timing) && <Notice kind="info">Timing notes do not clear the conflicts listed above.</Notice>}<Notice>{saveError}</Notice><Notice kind="success">{saveStatus}</Notice><p className="microcopy">Items still needing clarification stay on your saved card.</p>
    </section>
  </div>;
}

export default function PublicStack({ onPrivate, onPrefillConsult, signedIn = false }) {
  const [goal, setGoal] = useState('');
  const [text, setText] = useState('');
  const [audit, setAudit] = useState(null);
  const [showFinder, setShowFinder] = useState(false);
  const [finderBp, setFinderBp] = useState('116/74 mmHg');
  const [finderWeight, setFinderWeight] = useState('76.5 kg');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [saveError, setSaveError] = useState('');
  const controller = useRef(null);
  const sequence = useRef(0);
  useEffect(() => () => { sequence.current += 1; controller.current?.abort(); }, []);
  function invalidate() { sequence.current += 1; controller.current?.abort(); setAudit(null); setPending(false); setError(''); setSaveStatus(''); setSaveError(''); }
  async function checkStack(nextText = text, nextGoal = goal) {
    if (!nextGoal || !nextText.trim()) { setError('Pick a goal and enter your stack.'); return; }
    invalidate(); const requestNumber = ++sequence.current;
    const abort = new AbortController(); controller.current = abort; setPending(true);
    try {
      const result = await request('/public/audit', { method: 'POST', body: { text: nextText, goal: nextGoal }, signal: abort.signal });
      if (sequence.current === requestNumber && !abort.signal.aborted) setAudit(result);
    } catch (cause) { if (cause.name !== 'AbortError' && sequence.current === requestNumber) setError(cause.message); }
    finally { if (sequence.current === requestNumber) setPending(false); }
  }
  function resolve(phrase, choice) {
    try { const next = resolveStackPhrase(text, phrase, choice); setText(next); checkStack(next); } catch (cause) { setError(cause.message); }
  }
  function swap(record) {
    try { const next = stackAfterSwap(audit, record); setText(next); checkStack(next); } catch (cause) { setError(cause.message); }
  }
  async function save() {
    if (!audit || saving) return;
    const current = sequence.current; setSaving(true); setSaveError(''); setSaveStatus('');
    try { const outcome = await savePhoneCard(audit); if (current === sequence.current) setSaveStatus(outcome === 'shared' ? 'Phone card shared.' : outcome === 'downloaded' ? 'Phone card downloaded.' : 'Sharing cancelled.'); }
    catch (cause) { if (current === sequence.current) setSaveError(cause.message); }
    finally { setSaving(false); }
  }
  function loadSampleRoast() {
    const sampleGoal = goal || 'cognition';
    const sampleText = 'Tamoxifen 20 mg\nAlpha-GPC 600 mg\nMagnesium Oxide 400 mg\nMemantine 10 mg\nTelmisartan 40 mg';
    setGoal(sampleGoal);
    setText(sampleText);
    checkStack(sampleText, sampleGoal);
  }
  const activeFinder = showFinder ? findGoalProtocol(goal || 'cognition', text, audit) : null;

  function launchPrefilledConsult() {
    if (!activeFinder) return;
    const payload = {
      ...activeFinder.prefilledIntake,
      baselineBp: finderBp,
      baselineWeightKg: finderWeight,
    };
    if (onPrefillConsult) onPrefillConsult(payload);
    else onPrivate();
  }

  return <div className="app-shell public-shell"><a className="skip-link" href="#public-main">Skip to stack check</a><header className="site-header"><div className="header-inner"><Brand subtitle="Stack check" /><div className="header-actions"><button type="button" className="utility-button" onClick={() => setShowFinder((v) => !v)}>{showFinder ? 'Hide protocol finder' : 'Goal → Protocol finder'}</button><button className="button secondary public-private-button" onClick={onPrivate}>{signedIn ? 'Open private workspace' : 'Client / Pro sign in'}</button></div></div></header>
    <main id="public-main" className="main-content public-main"><div className="public-heading"><h1>Check your stack</h1><p>Pick a goal. Paste your stack. See conflicts, overlap, label notes, money wasted vs saved, and your shareable receptor-overlap map.</p></div>
      <form className="public-stack-form" onSubmit={(event) => { event.preventDefault(); checkStack(); }}><fieldset className="goal-picker"><legend>1. Pick your goal</legend><div>{publicGoals.map(([key, label]) => <button type="button" aria-pressed={goal === key} className="goal-button" key={key} onClick={() => { invalidate(); setGoal(key); }}>{label}</button>)}</div></fieldset><Textarea label="2. Enter your stack" rows="4" value={text} required maxLength="10000" placeholder="Paste compound names and any amounts from your labels." onChange={(event) => { invalidate(); setText(event.target.value); }} hint="A messy list is fine. No account or daily logging needed." /><div className="public-submit-row"><button className="button primary" disabled={pending || !goal || !text.trim()}>{pending ? 'Checking stack…' : 'Check stack'}<Icon name="arrow" /></button><button type="button" className="button secondary" onClick={loadSampleRoast}>Load sample stack roast</button><button type="button" className="text-button" onClick={() => { if (!goal) setGoal('height'); setShowFinder(true); }}>Or use Goal → Protocol Finder (Free)</button></div></form>
      <Notice>{error}</Notice>{pending && <Loading>Checking your stack…</Loading>}{audit && <PublicAuditResult audit={audit} suppliedText={text} onResolve={resolve} onSwap={swap} pending={pending} onSave={save} saving={saving} saveStatus={saveStatus} saveError={saveError} onOpenFinder={() => setShowFinder(true)} />}

      {activeFinder && (
        <section className="studio-section goal-finder-section" aria-label="Goal to Protocol Finder and Pre-Filled Consultation Intake">
          <div className="section-head">
            <div>
              <span className="public-goal-label">Free Lead Magnet · Goal → Protocol Finder</span>
              <h2>{activeFinder.goalLabel}: {activeFinder.headline}</h2>
              <p>{activeFinder.mechanisticThesis}</p>
            </div>
            <span className="status status-due">Saves ~${activeFinder.estimatedMonthlySavedUsd}/mo vs retail</span>
          </div>

          <div className="record-list">
            {activeFinder.coreStack.map((item) => (
              <article className="record-row" key={item.name}>
                <div>
                  <h3>{item.name} · <span className="tabular-nums">{item.dose}</span></h3>
                  <p>{item.role}</p>
                </div>
                <span className="muted small">{item.window}</span>
              </article>
            ))}
          </div>

          <div className="prefilled-consult-handoff">
            <h3>Pre-Filled Consultation Intake (Zero Double-Typing)</h3>
            <p className="muted small">
              Your selected goal ({activeFinder.goalLabel}), entered compounds ({activeFinder.prefilledIntake.enteredStack}), flagged conflicts, and required baseline biomarkers ({activeFinder.prefilledIntake.biomarkerTargets}) are pre-populated below for your private studio workspace.
            </p>
            <div className="form-grid two" style={{ marginTop: '14px' }}>
              <Input label="Resting Seated BP Baseline" value={finderBp} onChange={(e) => setFinderBp(e.target.value)} />
              <Input label="Body Mass Baseline" value={finderWeight} onChange={(e) => setFinderWeight(e.target.value)} />
            </div>
            <div className="form-actions" style={{ marginTop: '14px' }}>
              <button type="button" className="button primary" onClick={launchPrefilledConsult}>
                Open Pre-Filled Consultation Intake in Studio
                <Icon name="arrow" />
              </button>
            </div>
          </div>
        </section>
      )}
    </main><footer className="site-footer"><span>BioScience</span><span>Stack check · receptor-overlap map · private client tools</span></footer>
  </div>;
}
