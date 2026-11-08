import { useEffect, useRef, useState } from 'react';
import { request, useMutation } from '../api.js';
import { dateTime, nameFor, number, sortRecent } from '../format.js';
import { computeCostAndWasteAnalysis, createIcsCalendar } from '../studioLogic.js';
import { GDOCS_SOURCES, applyGoogleDocsOverrides } from '../gdocsSync.js';
import { Empty, Icon, Loading, Notice, SectionHead, Status } from '../components/ui.jsx';
import { Findings } from '../components/Evaluation.jsx';
import IntakeEditor from '../components/IntakeEditor.jsx';
import CheckIn from '../components/CheckIn.jsx';
import FunctionalProfiles from '../components/FunctionalProfiles.jsx';
import BloodMarkerLog from '../components/BloodMarkerLog.jsx';
import ReceptorMap from '../components/ReceptorMap.jsx';
import Client226Suite from '../components/Client226Suite.jsx';

const HEIGHT_PLAN_COLUMNS = [
  {
    id: 'clock',
    stageKey: 'all',
    step: '01',
    title: 'Daily Clock',
    window: 'Days 1–14 Core',
    rows: [
      { tag: '07:00', name: 'Somatropin (30% AM)', dose: '3.6–4.5 IU' },
      { tag: '07:00', name: 'Levothyroxine (T4)', dose: '25–50 mcg' },
      { tag: '08:00', name: 'Erdafitinib (ERDA)', dose: '18.5 mg' },
      { tag: '08:00', name: 'Racecadotril + Cilostazol', dose: '100 + 25 mg' },
      { tag: 'Meals', name: 'Velphoro / Sevelamer', dose: '500–800 mg' },
      { tag: 'Meals', name: 'TUDCA + Rebamipide', dose: '250 + 100 mg' },
      { tag: '16:00', name: 'CJC-1295 no DAC + Ipamorelin', dose: '150 + 150 mcg' },
      { tag: '22:15', name: 'Somatropin (70% Night)', dose: '8.4–10.5 IU' },
      { tag: 'Q48h', name: 'Aromasin (Exemestane)', dose: '12.5 mg' },
    ],
  },
  {
    id: 'stage1',
    stageKey: 'stage1',
    step: '02',
    title: 'Stage 1 · Build',
    window: 'Days 1–6',
    rows: [
      { tag: 'Matrix', name: 'L-Glutamine', dose: '5,000 mg × 2' },
      { tag: 'Helix', name: 'L-Proline + Glycine', dose: '920 mg + 6 g' },
      { tag: 'GAG', name: 'Glucosamine / NAG', dose: '500 mg × 2' },
      { tag: 'Thiol', name: 'L-Cystine + NAC', dose: '1,000 + 300 mg' },
      { tag: 'Sulfate', name: 'MSM', dose: '1,500 mg' },
      { tag: 'Citrate', name: 'Potassium Citrate', dose: '10 mEq × 2' },
      { tag: 'Enzymes', name: 'Manganese + Copper', dose: '2 mg + 2 mg' },
      { tag: 'Cofactor', name: 'Vitamin C + B6 (P5P)', dose: '500 + 10 mg' },
      { tag: 'ATP', name: 'Creatine Monohydrate', dose: '5,000 mg' },
    ],
  },
  {
    id: 'stage2a',
    stageKey: 'stage2a',
    step: '03',
    title: 'Stage 2A · Lower Load',
    window: 'Days 7–8',
    rows: [
      { tag: 'Gate', name: 'Stop NAC & L-Cystine', dose: 'Washout' },
      { tag: 'Matrix', name: 'Hydrolyzed Collagen', dose: '5,000 mg' },
      { tag: 'Flow', name: 'L-Citrulline', dose: '3,000 mg' },
      { tag: 'Citrate', name: 'Potassium Citrate', dose: '10 mEq × 2' },
      { tag: 'Gla', name: 'Vitamin K2 (MK-4)', dose: '15 mg × 3' },
      { tag: 'Mineral', name: 'Magnesium + Boron', dose: '300 + 3 mg' },
      { tag: 'Trace', name: 'Vitamin C + Zinc', dose: '500 + 15 mg' },
      { tag: 'Shield', name: 'Finerenone + Dorzolamide', dose: '10 mg + gtt' },
      { tag: '35 Hz', name: 'LMHF Vibration', dose: '0.15 g · 2×10m' },
    ],
  },
  {
    id: 'stage2b',
    stageKey: 'stage2b',
    step: '04',
    title: 'Stage 2B · Higher Load',
    window: 'Days 9–14',
    rows: [
      { tag: 'Mineral', name: 'Dietary Calcium', dose: '1,000 mg' },
      { tag: 'Gla', name: 'Vitamin K2 (MK-4)', dose: '15 mg × 3' },
      { tag: 'Matrix', name: 'Hydrolyzed Collagen', dose: '5,000 mg' },
      { tag: 'Flow', name: 'L-Citrulline', dose: '3,000 mg' },
      { tag: 'Nrf2', name: 'Sulforaphane + Selenite', dose: '20 mg + 100 mcg' },
      { tag: 'PO4 < 4.5', name: 'Calcitriol (Conditional)', dose: '0.25 mcg' },
      { tag: 'Citrate', name: 'Potassium Citrate', dose: '10 mEq × 2' },
      { tag: 'PGK1', name: 'Terazosin (Bedtime)', dose: '0.6 mg' },
      { tag: '35 Hz', name: 'LMHF Vibration', dose: '0.25 g · 2×10m' },
    ],
  },
];

const COGNITION_ONHAND_STRIP = [
  { time: '07:30', name: 'KW-6356', dose: '1.5 mg', role: 'Effort Drive (A2A)' },
  { time: '07:30', name: 'Armodafinil', dose: '75 mg', role: 'Wakefulness (DAT)' },
  { time: '08:00', name: 'ASP4345', dose: '7.5 mg', role: 'Working Memory (D1)' },
  { time: '08:00', name: 'Guanfacine', dose: '0.5 mg', role: 'Focus Lock (α2A)' },
  { time: '08:30 · 11:30 · 14:00', name: 'Intranasal Insulin', dose: '25 IU × 3', role: 'Clear Brain Fog' },
];

const COGNITION_PLAN_COLUMNS = [
  {
    id: 'dom1',
    modeKey: 'study',
    step: '01',
    title: 'Conceptualization',
    window: 'dlPFC Working Memory',
    rows: [
      { tag: 'On-Hand', name: 'ASP4345 (D1 PAM)', dose: '7.5 mg' },
      { tag: 'On-Hand', name: 'Guanfacine ER (α2A)', dose: '0.5 mg' },
      { tag: 'Upgrade', name: 'TAK-653 (AMPA PAM)', dose: '0.5 mg' },
      { tag: 'Upgrade', name: 'Tropisetron (α7 Partial)', dose: '5 mg' },
      { tag: 'Upgrade', name: 'CVL-871 (D1 PAM Alt)', dose: '2 mg' },
      { tag: 'Rule', name: 'Spine-Neck HCN Clamp', dose: '0.25–0.5 mg' },
    ],
  },
  {
    id: 'dom2',
    modeKey: 'interf',
    step: '02',
    title: 'Information Retention',
    window: 'Encoding & Sleep Consolidation',
    rows: [
      { tag: 'On-Hand', name: 'Intranasal Insulin', dose: '25 IU' },
      { tag: 'On-Hand', name: 'ASP4345 (Tagging)', dose: '7.5 mg' },
      { tag: 'Upgrade', name: 'ACD856 (TrkB PAM)', dose: '10 mg' },
      { tag: 'Upgrade', name: 'Basmisanil (α5-GABA NAM)', dose: '5 mg' },
      { tag: 'Night', name: 'Daridorexant (QHS)', dose: '25 mg' },
      { tag: 'Rule', name: 'Stop HDACi Before Exam', dose: '≥ 6h Prior' },
    ],
  },
  {
    id: 'dom3',
    modeKey: 'exam',
    step: '03',
    title: 'Motivation',
    window: 'Effort Initiation & Tonic Drive',
    rows: [
      { tag: 'On-Hand', name: 'KW-6356 (A2A Inverse)', dose: '1.5 mg' },
      { tag: 'On-Hand', name: 'Armodafinil (DAT)', dose: '50–100 mg' },
      { tag: 'Cycle', name: 'Pitolisant (H3 Inverse)', dose: '17.8 mg' },
      { tag: 'Upgrade', name: 'BPAP (Impulse Release)', dose: '0.1 mg' },
      { tag: 'Support', name: 'ALCAR + CoQ10', dose: '1 g + 200 mg' },
      { tag: 'Rule', name: 'Trim Armodafinil w/ ASP', dose: '50 mg' },
    ],
  },
  {
    id: 'dom4',
    modeKey: 'core',
    step: '04',
    title: 'Brain Fog & Durability',
    window: 'Hour-5 Rescue & ATP Buffer',
    rows: [
      { tag: 'On-Hand', name: 'Intranasal Insulin (×3)', dose: '25 IU × 3' },
      { tag: 'On-Hand', name: 'Guanfacine ER', dose: '0.5 mg' },
      { tag: 'Bedtime', name: 'Terazosin (PGK1 Peak)', dose: '0.6 mg' },
      { tag: 'Shared', name: 'Creatine + GAA', dose: '5 g + 1 g' },
      { tag: 'Shared', name: 'Betaine (TMG)', dose: '1.5 g' },
      { tag: 'Rule', name: 'Terazosin Ceiling', dose: '≤ 1.0 mg' },
    ],
  },
];

export default function Today({ workspace, library, onRefresh, owner, onManage, onOpenConsult }) {
  const [evaluation, setEvaluation] = useState(null);
  const [evaluationError, setEvaluationError] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [editor, setEditor] = useState(null);
  const [success, setSuccess] = useState('');
  const [windowFilter, setWindowFilter] = useState('all');
  const [calendarStatus, setCalendarStatus] = useState('');
  const [stageHighlight, setStageHighlight] = useState('all');
  const [cogModeHighlight, setCogModeHighlight] = useState('all');
  const [gdocsSync, setGdocsSync] = useState(null);
  const mutation = useMutation();
  const quickIntent = useRef(null);

  const isHeight226 = workspace.id === 'ws-226-height';
  const isCognition226 = workspace.id === 'ws-226-cognition';
  const isClient226 = isHeight226 || isCognition226;

  async function pullGoogleDocsSync() {
    if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;
    try {
      const res = await window.fetch(`/gdocs-sync.json?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setGdocsSync(data);
      }
    } catch {
      /* Offline or SSR environment */
    }
  }

  useEffect(() => {
    if (!isClient226) return undefined;
    pullGoogleDocsSync();
    const timer = window.setInterval(pullGoogleDocsSync, 15000);
    return () => window.clearInterval(timer);
  }, [isClient226, workspace.id]);

  useEffect(() => {
    const controller = new AbortController();
    setEvaluation(null);
    setEvaluationError('');
    setEvaluating(false);
    if (!workspace.protocol.items.length) return () => controller.abort();
    setEvaluating(true);
    request(`/workspaces/${workspace.id}/evaluate`, {
      method: 'POST',
      body: { expected_revision: workspace.revision, horizon_h: 168 },
      signal: controller.signal,
    })
      .then((result) => {
        if (!controller.signal.aborted) setEvaluation(result);
      })
      .catch((cause) => {
        if (cause.name !== 'AbortError') setEvaluationError(cause.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setEvaluating(false);
      });
    return () => controller.abort();
  }, [workspace.id, workspace.revision, workspace.protocol.items.length, library.revision]);

  async function quickRecord(item, status) {
    if (mutation.pending) return;
    const intentId = `${item.id}:${status}`;
    if (quickIntent.current?.id !== intentId) {
      quickIntent.current = {
        id: intentId,
        body: {
          item_id: item.id,
          status,
          amount: status === 'taken' ? item.next_amount ?? item.amount : null,
          unit: item.unit,
          occurred_at: new Date().toISOString(),
          scheduled_at: item.next_scheduled_at || item.next_at || null,
          note: '',
        },
      };
    }
    try {
      const result = await mutation.run(`/workspaces/${workspace.id}/events`, quickIntent.current.body);
      if (result) {
        quickIntent.current = null;
        setSuccess(status === 'taken' ? 'Actual intake recorded.' : 'Occurrence marked skipped.');
        await onRefresh();
      }
    } catch {
      /* Preserve intent key for retry. */
    }
  }

  const events = sortRecent(workspace.events);
  const currentItems = workspace.protocol.items.filter((entry) => entry.due_status !== 'complete');
  const completedItems = workspace.protocol.items.filter((entry) => entry.due_status === 'complete');

  const filteredCurrentItems = currentItems.filter((item) => {
    if (windowFilter === 'all') return true;
    const w = (item.window_label || item.notes || '').toLowerCase();
    if (windowFilter === 'morning') return w.includes('morning') || w.includes('am') || w.includes('07:') || w.includes('08:');
    if (windowFilter === 'midday') return w.includes('midday') || w.includes('16:00') || w.includes('meal');
    if (windowFilter === 'pinning') return w.includes('pin') || w.includes('subq') || w.includes('22:15') || Boolean(item.reconstitution);
    return true;
  });

  const calendarEvents = workspace.calendar_events || [];
  const costAndShopping =
    currentItems.length > 0
      ? computeCostAndWasteAnalysis(currentItems, [], [], [], workspace.reconstitutions || [])
      : null;

  function exportCalendarReminders() {
    const allCalendarEvents = [
      ...currentItems.map((item) => ({
        id: item.id,
        title: `${nameFor(library, item.compound_id)} · ${number(item.next_amount ?? item.amount)} ${item.unit}`,
        scheduled_at: item.next_at || item.first_at || new Date().toISOString(),
        note: `${item.window_label ? `${item.window_label} · ` : ''}${item.notes || ''}`,
      })),
      ...calendarEvents,
    ];
    const icsText = createIcsCalendar(allCalendarEvents, workspace.label);
    const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workspace.id || 'client-226'}-plan.ics`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setCalendarStatus(`Exported ${allCalendarEvents.length} events to calendar (.ics).`);
  }

  const { columns: activePlanColumns, onHandStrip: activeOnHandStrip } = applyGoogleDocsOverrides(
    isHeight226 ? HEIGHT_PLAN_COLUMNS : COGNITION_PLAN_COLUMNS,
    COGNITION_ONHAND_STRIP,
    gdocsSync,
    isHeight226
  );

  const primaryDoc = isHeight226 ? GDOCS_SOURCES.height : GDOCS_SOURCES.cognition;

  return (
    <div className="today-shell">
      {isClient226 && (
        <section className="plan-board-viewport" aria-label={`${workspace.label} Master Plan`}>
          <div className="plan-top-bar">
            <div className="plan-title-group">
              <h1>{workspace.label}</h1>
              <p className="plan-subtitle">
                {isHeight226
                  ? '14-Day Staged Protocol · Mandatory Erdafitinib · 70/30 GH + CJC-1295 no DAC + Ipamorelin'
                  : '5 On-Hand Core · 4-Domain Study Plan'}
              </p>
            </div>

            <div className="plan-filter-bar" role="group" aria-label="Filter Plan">
              {isHeight226
                ? [
                    ['all', 'All 14 Days'],
                    ['stage1', 'Days 1–6 · Build'],
                    ['stage2a', 'Days 7–8 · Lower Load'],
                    ['stage2b', 'Days 9–14 · Higher Load'],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      className={`plan-filter-pill ${stageHighlight === key ? 'active' : ''}`}
                      onClick={() => setStageHighlight(key)}
                    >
                      {label}
                    </button>
                  ))
                : [
                    ['all', 'All 4 Domains'],
                    ['study', 'Conceptualization'],
                    ['interf', 'Retention'],
                    ['exam', 'Motivation'],
                    ['core', 'Brain Fog'],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      className={`plan-filter-pill ${cogModeHighlight === key ? 'active' : ''}`}
                      onClick={() => setCogModeHighlight(key)}
                    >
                      {label}
                    </button>
                  ))}
            </div>
          </div>

          <div className="gdocs-sync-bar" aria-label="Google Docs Live Sync">
            <div className="gdocs-sync-left">
              <span className="gdocs-dot" aria-hidden="true" />
              <span>Google Docs Auto-Sync Active</span>
              <span>·</span>
              <a
                href={primaryDoc.url}
                target="_blank"
                rel="noreferrer"
                className="gdocs-doc-link"
              >
                {primaryDoc.title} ↗
              </a>
              <span>·</span>
              <a
                href={GDOCS_SOURCES.master.url}
                target="_blank"
                rel="noreferrer"
                className="gdocs-doc-link"
              >
                {GDOCS_SOURCES.master.title} ↗
              </a>
            </div>
            <div className="inline-actions">
              <button
                type="button"
                className="text-button"
                onClick={pullGoogleDocsSync}
              >
                Sync now
              </button>
            </div>
          </div>

          {isCognition226 && (
            <div className="onhand-five-strip" aria-label="Client 226 5 On-Hand Compounds">
              {activeOnHandStrip.map((item) => (
                <article className="onhand-card" key={item.name}>
                  <div className="onhand-card-top">
                    <span className="onhand-time tabular-nums">{item.time}</span>
                    <span className="onhand-role">{item.role}</span>
                  </div>
                  <div className="onhand-card-main">
                    <h3>{item.name}</h3>
                    <strong className="onhand-dose tabular-nums">{item.dose}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="plan-grid-four">
            {activePlanColumns.map((col) => {
              const dimmed = isHeight226
                ? stageHighlight !== 'all' && col.stageKey !== 'all' && col.stageKey !== stageHighlight
                : cogModeHighlight !== 'all' && col.modeKey !== cogModeHighlight;
              return (
                <article
                  key={col.id}
                  className={`plan-column-card ${dimmed ? 'plan-column-dimmed' : ''}`}
                >
                  <header className="plan-column-head">
                    <div>
                      <span className="plan-step-index tabular-nums">{col.step}</span>
                      <h2>{col.title}</h2>
                    </div>
                    <span className="plan-window-badge">{col.window}</span>
                  </header>
                  <ul className="plan-item-list">
                    {col.rows.map((row) => (
                      <li key={`${col.id}-${row.name}`} className="plan-item-row">
                        <span className="plan-row-tag">{row.tag}</span>
                        <span className="plan-row-name">{row.name}</span>
                        <strong className="plan-row-dose tabular-nums">{row.dose}</strong>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>

          <footer className="plan-footer-strip">
            <div className="plan-guardrail-pills">
              {isHeight226 ? (
                <>
                  <span className="guardrail-pill">PO4 &lt; 4.5 mg/dL</span>
                  <span className="guardrail-pill">E2 12–20 pg/mL</span>
                  <span className="guardrail-pill">Free T4 ≥ 1.15 ng/dL</span>
                  <span className="guardrail-pill">Hold Oral D3 on ERDA</span>
                </>
              ) : (
                <>
                  <span className="guardrail-pill">Terazosin 0.6 mg Peak (Max 1.0 mg)</span>
                  <span className="guardrail-pill">Intranasal Insulin 25 IU × 3</span>
                  <span className="guardrail-pill">Armodafinil 50 mg on High ASP Days</span>
                  <span className="guardrail-pill">Hold HDACi 6h Before Exam</span>
                </>
              )}
            </div>
            <div className="plan-jump-links">
              <a href="#details-suite" className="plan-jump-link">
                Calculators &amp; Alternatives ↓
              </a>
              <a href="#blood-markers-section" className="plan-jump-link">
                Blood Markers ↓
              </a>
            </div>
          </footer>
        </section>
      )}

      <div id="details-suite" className="today-layout">
        <div className="today-main">
          {currentItems.length > 0 && (
            <Client226Suite
              workspace={workspace}
              library={library}
              onAddCompoundToProtocol={async (ec, slot) => {
                const name = ec?.name || 'Client 226 Compound';
                const doseText = ec?.dose || '';
                const amtMatch = String(doseText).match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g|iu|ml)/i);
                const amount = amtMatch ? Number(amtMatch[1]) : 10;
                const unit = amtMatch
                  ? amtMatch[2].replace(/^iu$/i, 'IU').replace(/^ml$/i, 'mL')
                  : 'mg';
                const res = await mutation.run(`/workspaces/${workspace.id}/protocol-item`, {
                  name,
                  amount,
                  unit,
                  interval_h: 24,
                  window_label: slot?.name || 'Client 226 Window',
                  notes: `${doseText ? `Dose: ${doseText} · ` : ''}${ec?.context || slot?.function || ''}`.slice(0, 260),
                });
                if (res) {
                  setSuccess(`Added ${name} (${amount} ${unit}) to active plan.`);
                  await onRefresh();
                }
              }}
            />
          )}

          <section className="protocol-list" id="schedule-checklist">
            <SectionHead
              title="Your protocol"
              action={
                <div className="inline-actions">
                  {currentItems.length > 0 && (
                    <button
                      type="button"
                      className="button secondary small-button"
                      onClick={exportCalendarReminders}
                    >
                      <Icon name="download" />
                      Calendar (.ics)
                    </button>
                  )}
                  {owner && onOpenConsult && (
                    <button
                      type="button"
                      className="button secondary small-button"
                      onClick={onOpenConsult}
                    >
                      Consultation intake
                    </button>
                  )}
                  {owner && (
                    <button className="text-button" onClick={onManage}>
                      Edit protocol
                    </button>
                  )}
                </div>
              }
            >
              Record daily doses or export to your calendar.
            </SectionHead>
            <Notice kind="success">{calendarStatus}</Notice>
            {currentItems.length > 1 && (
              <div className="timeline-window-bar" role="group" aria-label="Filter daily administration windows">
                {[
                  ['all', `All (${currentItems.length})`],
                  ['morning', 'Morning'],
                  ['midday', 'Afternoon / Meals'],
                  ['pinning', 'Evening / SubQ'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`button small-button ${windowFilter === key ? 'primary' : 'quiet'}`}
                    onClick={() => setWindowFilter(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            {!workspace.protocol.items.length ? (
              <Empty title="No protocol assigned yet">
                {owner
                  ? 'Add items from the shared library or review a structured import.'
                  : 'Your protocol will appear here when it is assigned.'}
              </Empty>
            ) : !currentItems.length ? (
              <Empty title="No remaining scheduled occurrences">
                Completed schedules and your actual records are retained below.
              </Empty>
            ) : (
              <div className="stack-list">
                {filteredCurrentItems.map((item) => {
                  const compound = library.compounds.find((entry) => entry.id === item.compound_id);
                  return (
                    <article className="stack-row" key={item.id}>
                      <div className="stack-info">
                        <div className="stack-name">
                          <h3>{compound?.name || item.name || nameFor(library, item.compound_id)}</h3>
                          {item.due_status && (
                            <Status value={item.due_status}>
                              {item.due_status === 'complete'
                                ? 'Schedule complete'
                                : item.due_status === 'due'
                                  ? 'Due'
                                  : 'Upcoming'}
                            </Status>
                          )}
                          {item.window_label && <span className="muted small">· {item.window_label}</span>}
                        </div>
                        <p className="stack-amount tabular-nums">
                          {number(item.next_amount ?? item.amount)} <span>{item.unit}</span>
                          {item.interval_h != null && <small>every {number(item.interval_h)} h</small>}
                        </p>
                        <p className="stack-time">
                          {item.next_at
                            ? `Next: ${dateTime(item.next_at, workspace.timezone)}`
                            : item.due_status === 'complete'
                              ? 'No remaining scheduled occurrence'
                              : `Starts ${dateTime(item.first_at, workspace.timezone)}`}
                        </p>
                      </div>
                      <div className="stack-actions">
                        <button
                          className="button primary small-button"
                          disabled={mutation.pending || item.due_status === 'complete'}
                          onClick={() => quickRecord(item, 'taken')}
                          title={`Record ${item.next_amount ?? item.amount} ${item.unit} actually taken now`}
                        >
                          Taken
                        </button>
                        <button
                          className="button quiet small-button"
                          disabled={mutation.pending || item.due_status === 'complete'}
                          onClick={() => quickRecord(item, 'skipped')}
                        >
                          Skip
                        </button>
                        <button
                          className="text-button"
                          disabled={mutation.pending}
                          onClick={() => {
                            setSuccess('');
                            setEditor({ item });
                          }}
                        >
                          Adjust
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            {completedItems.length > 0 && (
              <details className="completed-schedules">
                <summary>Completed schedules ({completedItems.length})</summary>
                <div className="record-list">
                  {completedItems.map((item) => (
                    <article className="record-row" key={item.id}>
                      <div>
                        <h3>{nameFor(library, item.compound_id)}</h3>
                        <p>
                          {number(item.amount)} {item.unit}
                          {item.interval_h != null ? ` every ${number(item.interval_h)} h` : ' once'} · no remaining occurrence
                        </p>
                      </div>
                      <Status value="complete">Complete</Status>
                    </article>
                  ))}
                </div>
              </details>
            )}
            <Notice>{mutation.error}</Notice>
            <Notice kind="success">{success}</Notice>
          </section>

          {evaluating && <Loading>Checking configured models…</Loading>}
          <Notice>{evaluationError}</Notice>
          {evaluation && <Findings evaluation={evaluation} />}

          {currentItems.length > 0 && (
            <div id="blood-markers-section">
              <BloodMarkerLog workspace={workspace} onSaved={onRefresh} />
            </div>
          )}

          {currentItems.length > 0 && <FunctionalProfiles />}

          {currentItems.length > 0 && (
            <ReceptorMap
              items={currentItems.map((i) => ({
                id: i.compound_id,
                name: nameFor(library, i.compound_id) || i.name,
                notes: i.notes || '',
              }))}
              library={library}
            />
          )}

          <section className="recent-records">
            <SectionHead title="Recent intake" />
            {!events.length ? (
              <p className="muted">No actual intake has been recorded yet.</p>
            ) : (
              <div className="record-list">
                {events.slice(0, 12).map((event) => (
                  <article className="record-row" key={event.id}>
                    <div>
                      <h3>{event.name || nameFor(library, event.compound_id)}</h3>
                      <p>
                        {event.status === 'taken'
                          ? `${number(event.amount)} ${event.unit} taken`
                          : event.status === 'void'
                            ? 'Voided'
                            : event.status}{' '}
                        <span>·</span> {dateTime(event.occurred_at, workspace.timezone)}
                      </p>
                    </div>
                    <button className="text-button" onClick={() => setEditor({ event })}>
                      Correct
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="today-side">
          <CheckIn workspace={workspace} onSaved={onRefresh} />
          {!workspace.protocol.measures.length && (
            <div className="quiet-note">
              <h3>No check-in configured</h3>
              <p>
                {owner
                  ? 'Add a measure in Setup to begin recording observations.'
                  : 'Your assigned check-in will appear here.'}
              </p>
              {owner && (
                <button className="text-button" onClick={onManage}>
                  Configure check-in
                </button>
              )}
            </div>
          )}
          {costAndShopping && (
            <section className="studio-side-card" aria-label="Supply & Inventory">
              <h3>Inventory &amp; Supply</h3>
              <p className="side-metric tabular-nums">
                ${costAndShopping.monthlySavedUsd}/mo saved
              </p>
              <div className="shopping-ledger">
                <h4>Supplies</h4>
                {costAndShopping.autoShoppingList.length ? (
                  <div className="record-list">
                    {costAndShopping.autoShoppingList.map((entry) => (
                      <div className="record-row" key={entry.id}>
                        <div>
                          <h3>{entry.item}</h3>
                          <p>{entry.reason}</p>
                        </div>
                        <strong className="tabular-nums">${entry.estimatedCostUsd}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted small">Syringes and bacteriostatic water in stock.</p>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>

      {editor && (
        <IntakeEditor
          workspace={workspace}
          library={library}
          {...editor}
          onSaved={onRefresh}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
}
