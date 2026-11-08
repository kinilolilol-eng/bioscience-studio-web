import { useEffect, useRef, useState } from 'react';
import { request, useMutation } from '../api.js';
import { dateTime, nameFor, number, sortRecent } from '../format.js';
import { computeCostAndWasteAnalysis, createIcsCalendar } from '../studioLogic.js';
import { Empty, Icon, Loading, Notice, SectionHead, Status } from '../components/ui.jsx';
import { Findings } from '../components/Evaluation.jsx';
import IntakeEditor from '../components/IntakeEditor.jsx';
import CheckIn from '../components/CheckIn.jsx';
import FunctionalProfiles from '../components/FunctionalProfiles.jsx';
import BloodMarkerLog from '../components/BloodMarkerLog.jsx';
import ReceptorMap from '../components/ReceptorMap.jsx';
import Client226Suite from '../components/Client226Suite.jsx';

export default function Today({ workspace, library, onRefresh, owner, onManage, onOpenConsult }) {
  const [evaluation, setEvaluation] = useState(null);
  const [evaluationError, setEvaluationError] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [editor, setEditor] = useState(null);
  const [success, setSuccess] = useState('');
  const [windowFilter, setWindowFilter] = useState('all');
  const [calendarStatus, setCalendarStatus] = useState('');
  const mutation = useMutation();
  const quickIntent = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    setEvaluation(null); setEvaluationError(''); setEvaluating(false);
    if (!workspace.protocol.items.length) return () => controller.abort();
    setEvaluating(true);
    request(`/workspaces/${workspace.id}/evaluate`, { method: 'POST', body: { expected_revision: workspace.revision, horizon_h: 168 }, signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setEvaluation(result); })
      .catch((cause) => { if (cause.name !== 'AbortError') setEvaluationError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setEvaluating(false); });
    return () => controller.abort();
  }, [workspace.id, workspace.revision, workspace.protocol.items.length, library.revision]);
  async function quickRecord(item, status) {
    if (mutation.pending) return;
    const intentId = `${item.id}:${status}`;
    if (quickIntent.current?.id !== intentId) quickIntent.current = { id: intentId, body: {
      item_id: item.id, status, amount: status === 'taken' ? item.next_amount ?? item.amount : null,
      unit: item.unit, occurred_at: new Date().toISOString(), scheduled_at: item.next_scheduled_at || item.next_at || null, note: '',
    } };
    try {
      const result = await mutation.run(`/workspaces/${workspace.id}/events`, quickIntent.current.body);
      if (result) { quickIntent.current = null; setSuccess(status === 'taken' ? 'Actual intake recorded.' : 'Occurrence marked skipped.'); await onRefresh(); }
    } catch { /* Stable body and key allow a retry without a duplicate. */ }
  }
  const events = sortRecent(workspace.events);
  const currentItems = workspace.protocol.items.filter((entry) => entry.due_status !== 'complete');
  const completedItems = workspace.protocol.items.filter((entry) => entry.due_status === 'complete');

  const filteredCurrentItems = currentItems.filter((item) => {
    if (windowFilter === 'all') return true;
    const w = (item.window_label || item.notes || '').toLowerCase();
    if (windowFilter === 'morning') return w.includes('morning') || w.includes('am') || w.includes('waking');
    if (windowFilter === 'midday') return w.includes('midday') || w.includes('circadian') || w.includes('meal');
    if (windowFilter === 'pinning') return w.includes('pin') || w.includes('subq') || w.includes('e3.5d') || Boolean(item.reconstitution);
    return true;
  });

  const calendarEvents = workspace.calendar_events || [];
  const costAndShopping = currentItems.length > 0
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
    link.download = `${workspace.id || 'bioscience'}-protocol-calendar.ics`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setCalendarStatus(`Exported ${allCalendarEvents.length} protocol, ester pinning, and blood-marker recheck events to your calendar (.ics).`);
  }

  return <div className="today-layout"><div className="today-main">
    <section className="protocol-list"><SectionHead title="Your protocol" action={<div className="inline-actions">{currentItems.length > 0 && <button type="button" className="button secondary small-button" onClick={exportCalendarReminders}><Icon name="download" />Calendar reminders (.ics)</button>}{owner && onOpenConsult && <button type="button" className="button secondary small-button" onClick={onOpenConsult}>Consultation intake</button>}{owner && <button className="text-button" onClick={onManage}>Edit protocol</button>}</div>}>Planned amounts are separate from what you actually take. Calendar is the reminder system — no push notifications needed.</SectionHead>
      <Notice kind="success">{calendarStatus}</Notice>
      {currentItems.length > 1 && (
        <div className="timeline-window-bar" role="group" aria-label="Filter daily administration windows">
          {[
            ['all', `All windows (${currentItems.length})`],
            ['morning', 'Morning / Waking'],
            ['midday', 'Midday / Circadian'],
            ['pinning', 'Pinning & Reconstituted'],
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
      {!workspace.protocol.items.length ? <Empty title="No protocol assigned yet">{owner ? 'Add items from the shared library or review a structured import.' : 'Your protocol will appear here when it is assigned.'}</Empty> : !currentItems.length ? <Empty title="No remaining scheduled occurrences">Completed schedules and your actual records are retained below.</Empty> : <div className="stack-list">{filteredCurrentItems.map((item) => {
        const compound = library.compounds.find((entry) => entry.id === item.compound_id);
        return <article className="stack-row" key={item.id}><div className="stack-info"><div className="stack-name"><h3>{compound?.name || item.name || nameFor(library, item.compound_id)}</h3>{item.due_status && <Status value={item.due_status}>{item.due_status === 'complete' ? 'Schedule complete' : item.due_status === 'due' ? 'Due' : 'Upcoming'}</Status>}{item.window_label && <span className="muted small">· {item.window_label}</span>}</div><p className="stack-amount">{number(item.next_amount ?? item.amount)} <span>{item.unit}</span>{item.interval_h != null && <small>every {number(item.interval_h)} h</small>}</p><p className="stack-time">{item.next_at ? `Next: ${dateTime(item.next_at, workspace.timezone)}` : item.due_status === 'complete' ? 'No remaining scheduled occurrence' : `Starts ${dateTime(item.first_at, workspace.timezone)}`}</p>{(compound?.form || compound?.route) && <p className="muted small">{[compound.form, compound.route].filter(Boolean).join(' · ')}</p>}{item.notes && <p className="small">{item.notes}</p>}</div><div className="stack-actions"><button className="button primary small-button" disabled={mutation.pending || item.due_status === 'complete'} onClick={() => quickRecord(item, 'taken')} title={`Record ${item.next_amount ?? item.amount} ${item.unit} actually taken now`}>Taken</button><button className="button quiet small-button" disabled={mutation.pending || item.due_status === 'complete'} onClick={() => quickRecord(item, 'skipped')}>Skip</button><button className="text-button" disabled={mutation.pending} onClick={() => { setSuccess(''); setEditor({ item }); }}>Adjust</button></div></article>;
      })}</div>}
      {workspace.protocol.items.length > 0 && <p className="microcopy">Taken records the displayed amount now. Use Adjust to change the actual amount or time. Schedule times use {workspace.timezone}.</p>}
      {completedItems.length > 0 && <details className="completed-schedules"><summary>Completed schedules ({completedItems.length})</summary><div className="record-list">{completedItems.map((item) => <article className="record-row" key={item.id}><div><h3>{nameFor(library, item.compound_id)}</h3><p>{number(item.amount)} {item.unit}{item.interval_h != null ? ` every ${number(item.interval_h)} h` : ' once'} · no remaining occurrence</p></div><Status value="complete">Complete</Status></article>)}</div></details>}
      <Notice>{mutation.error}</Notice><Notice kind="success">{success}</Notice>
    </section>

    {calendarEvents.length > 0 && (
      <section className="studio-section calendar-schedule-section" aria-label="Protocol Calendar Pinning and Lab Recheck Events">
        <SectionHead
          title="Protocol Calendar · Ester Pinning &amp; Lab Recheck Events"
          action={
            <button type="button" className="text-button" onClick={exportCalendarReminders}>
              Sync all to Calendar (.ics)
            </button>
          }
        >
          Generated directly from your Ester Frequency calculator and Blood-Marker Photo Log.
        </SectionHead>
        <div className="record-list">
          {calendarEvents.slice(0, 6).map((ev) => (
            <article className="record-row" key={ev.id}>
              <div>
                <h3>{ev.title}</h3>
                <p>{ev.note}</p>
              </div>
              <span className="tabular-nums small muted">{dateTime(ev.scheduled_at || ev.occurred_at, workspace.timezone)}</span>
            </article>
          ))}
        </div>
      </section>
    )}

    {evaluating && <Loading>Checking your configured models…</Loading>}<Notice>{evaluationError}</Notice>{evaluation && <Findings evaluation={evaluation} />}

    {currentItems.length > 0 && (
      <Client226Suite
        workspace={workspace}
        library={library}
        onAddCompoundToProtocol={async (ec, slot) => {
          const name = ec?.name || 'Client 226 Actuator';
          const doseText = ec?.dose || '';
          const amtMatch = String(doseText).match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g|iu|ml)/i);
          const amount = amtMatch ? Number(amtMatch[1]) : 10;
          const unit = amtMatch ? amtMatch[2].replace(/^iu$/i, 'IU').replace(/^ml$/i, 'mL') : 'mg';
          const res = await mutation.run(`/workspaces/${workspace.id}/protocol-item`, {
            name,
            amount,
            unit,
            interval_h: 24,
            window_label: slot?.name || 'Client 226 Mechanistic Window',
            notes: `${doseText ? `Dose: ${doseText} · ` : ''}${ec?.context || slot?.function || ''}`.slice(0, 260),
          });
          if (res) {
            setSuccess(`Added ${name} (${amount} ${unit}) from Client 226 Explorer into active protocol.`);
            await onRefresh();
          }
        }}
      />
    )}

    {currentItems.length > 0 && <FunctionalProfiles />}

    {currentItems.length > 0 && <BloodMarkerLog workspace={workspace} onSaved={onRefresh} />}

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

    <section className="recent-records"><SectionHead title="Recent intake" />{!events.length ? <p className="muted">No actual intake has been recorded yet.</p> : <div className="record-list">{events.slice(0, 12).map((event) => <article className="record-row" key={event.id}><div><h3>{event.name || nameFor(library, event.compound_id)}</h3><p>{event.status === 'taken' ? `${number(event.amount)} ${event.unit} taken` : event.status === 'void' ? 'Voided' : event.status} <span>·</span> {dateTime(event.occurred_at, workspace.timezone)}</p>{event.note && <p className="small muted">{event.note}</p>}{event.supersedes_id && <small className="muted">Corrected record</small>}</div><button className="text-button" onClick={() => setEditor({ event })}>Correct</button></article>)}</div>}</section>
  </div><aside className="today-side"><CheckIn workspace={workspace} onSaved={onRefresh} />{!workspace.protocol.measures.length && <div className="quiet-note"><h3>No check-in configured</h3><p>{owner ? 'Add a measure in Setup to begin recording observations.' : 'Your assigned check-in will appear here.'}</p>{owner && <button className="text-button" onClick={onManage}>Configure check-in</button>}</div>}
    {costAndShopping && (
      <section className="studio-side-card" aria-label="Money Wasted vs Saved and Auto-Fed Shopping List">
        <h3>Money Wasted / Money Saved</h3>
        <p className="side-metric tabular-nums">${costAndShopping.monthlySavedUsd}/mo saved · ${costAndShopping.annualSavedUsd}/yr</p>
        <p className="muted small">
          Active protocol spend: ${costAndShopping.optimizedMonthlyUsd}/mo (vs ${costAndShopping.currentMonthlyUsd}/mo unoptimized retail).
        </p>
        <div className="shopping-ledger">
          <h4>Auto-Fed Shopping List (Reconstitution &amp; Depletion)</h4>
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
            <p className="muted small">Pins &amp; BAC water inventory sufficient (&gt;10 pins, &gt;3 mL BAC water remaining).</p>
          )}
        </div>
      </section>
    )}
  </aside>
    {editor && <IntakeEditor workspace={workspace} library={library} {...editor} onSaved={onRefresh} onClose={() => setEditor(null)} />}
  </div>;
}
