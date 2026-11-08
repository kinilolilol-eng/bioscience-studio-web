import { useEffect, useRef, useState } from 'react';
import { request, useMutation } from '../api.js';
import { dateTime, nameFor, number, sortRecent } from '../format.js';
import { Empty, Loading, Notice, SectionHead, Status } from '../components/ui.jsx';
import { Findings } from '../components/Evaluation.jsx';
import IntakeEditor from '../components/IntakeEditor.jsx';
import CheckIn from '../components/CheckIn.jsx';

export default function Today({ workspace, library, onRefresh, owner, onManage }) {
  const [evaluation, setEvaluation] = useState(null);
  const [evaluationError, setEvaluationError] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [editor, setEditor] = useState(null);
  const [success, setSuccess] = useState('');
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
  return <div className="today-layout"><div className="today-main">
    <section className="protocol-list"><SectionHead title="Your protocol" action={owner && <button className="text-button" onClick={onManage}>Edit protocol</button>}>Planned amounts are separate from what you actually take.</SectionHead>
      {!workspace.protocol.items.length ? <Empty title="No protocol assigned yet">{owner ? 'Add items from the shared library or review a structured import.' : 'Your protocol will appear here when it is assigned.'}</Empty> : !currentItems.length ? <Empty title="No remaining scheduled occurrences">Completed schedules and your actual records are retained below.</Empty> : <div className="stack-list">{currentItems.map((item) => {
        const compound = library.compounds.find((entry) => entry.id === item.compound_id);
        return <article className="stack-row" key={item.id}><div className="stack-info"><div className="stack-name"><h3>{compound?.name || item.name || nameFor(library, item.compound_id)}</h3>{item.due_status && <Status value={item.due_status}>{item.due_status === 'complete' ? 'Schedule complete' : item.due_status === 'due' ? 'Due' : 'Upcoming'}</Status>}</div><p className="stack-amount">{number(item.next_amount ?? item.amount)} <span>{item.unit}</span>{item.interval_h != null && <small>every {number(item.interval_h)} h</small>}</p><p className="stack-time">{item.next_at ? `Next: ${dateTime(item.next_at, workspace.timezone)}` : item.due_status === 'complete' ? 'No remaining scheduled occurrence' : `Starts ${dateTime(item.first_at, workspace.timezone)}`}</p>{(compound?.form || compound?.route) && <p className="muted small">{[compound.form, compound.route].filter(Boolean).join(' · ')}</p>}{item.notes && <p className="small">{item.notes}</p>}</div><div className="stack-actions"><button className="button primary small-button" disabled={mutation.pending || item.due_status === 'complete'} onClick={() => quickRecord(item, 'taken')} title={`Record ${item.next_amount ?? item.amount} ${item.unit} actually taken now`}>Taken</button><button className="button quiet small-button" disabled={mutation.pending || item.due_status === 'complete'} onClick={() => quickRecord(item, 'skipped')}>Skip</button><button className="text-button" disabled={mutation.pending} onClick={() => { setSuccess(''); setEditor({ item }); }}>Adjust</button></div></article>;
      })}</div>}
      {workspace.protocol.items.length > 0 && <p className="microcopy">Taken records the displayed amount now. Use Adjust to change the actual amount or time. Schedule times use {workspace.timezone}.</p>}
      {completedItems.length > 0 && <details className="completed-schedules"><summary>Completed schedules ({completedItems.length})</summary><div className="record-list">{completedItems.map((item) => <article className="record-row" key={item.id}><div><h3>{nameFor(library, item.compound_id)}</h3><p>{number(item.amount)} {item.unit}{item.interval_h != null ? ` every ${number(item.interval_h)} h` : ' once'} · no remaining occurrence</p></div><Status value="complete">Complete</Status></article>)}</div></details>}
      <Notice>{mutation.error}</Notice><Notice kind="success">{success}</Notice>
    </section>
    {evaluating && <Loading>Checking your configured models…</Loading>}<Notice>{evaluationError}</Notice>{evaluation && <Findings evaluation={evaluation} />}
    <section className="recent-records"><SectionHead title="Recent intake" />{!events.length ? <p className="muted">No actual intake has been recorded yet.</p> : <div className="record-list">{events.slice(0, 12).map((event) => <article className="record-row" key={event.id}><div><h3>{event.name || nameFor(library, event.compound_id)}</h3><p>{event.status === 'taken' ? `${number(event.amount)} ${event.unit} taken` : event.status === 'void' ? 'Voided' : event.status} <span>·</span> {dateTime(event.occurred_at, workspace.timezone)}</p>{event.note && <p className="small muted">{event.note}</p>}{event.supersedes_id && <small className="muted">Corrected record</small>}</div><button className="text-button" onClick={() => setEditor({ event })}>Correct</button></article>)}</div>}</section>
  </div><aside className="today-side"><CheckIn workspace={workspace} onSaved={onRefresh} />{!workspace.protocol.measures.length && <div className="quiet-note"><h3>No check-in configured</h3><p>{owner ? 'Add a measure in Setup to begin recording observations.' : 'Your assigned check-in will appear here.'}</p>{owner && <button className="text-button" onClick={onManage}>Configure check-in</button>}</div>}</aside>
    {editor && <IntakeEditor workspace={workspace} library={library} {...editor} onSaved={onRefresh} onClose={() => setEditor(null)} />}
  </div>;
}
