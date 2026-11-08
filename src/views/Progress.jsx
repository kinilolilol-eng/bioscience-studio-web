import { useEffect, useState } from 'react';
import { downloadWorkspace } from '../api.js';
import { dateTime, number, sortRecent } from '../format.js';
import Chart from '../components/Chart.jsx';
import { Empty, Icon, Notice, SectionHead, Select } from '../components/ui.jsx';

export default function Progress({ workspace }) {
  const measures = workspace.protocol.measures;
  const [measureId, setMeasureId] = useState(measures[0]?.id || '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (!measures.some((measure) => measure.id === measureId)) setMeasureId(measures[0]?.id || ''); }, [measures, measureId]);
  const measure = measures.find((entry) => entry.id === measureId);
  const records = sortRecent(workspace.observations).filter((record) => record.measure_id === measureId);
  const chronological = [...records].reverse();
  async function exportData() {
    setPending(true); setError('');
    try { await downloadWorkspace(workspace.id); } catch (cause) { setError(cause.message); } finally { setPending(false); }
  }
  return <div className="progress-view"><SectionHead title="Your progress" action={<button className="button secondary" onClick={exportData} disabled={pending}><Icon name="download" />{pending ? 'Exporting…' : 'Export records'}</button>}>Your recorded observations, alongside protocol changes.</SectionHead><Notice>{error}</Notice>
    {!measures.length ? <Empty title="No measures configured">Your recorded measures will appear here after a check-in is configured.</Empty> : <><div className="measure-picker"><Select label="Measure" value={measureId} onChange={(event) => setMeasureId(event.target.value)}>{measures.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}{entry.unit ? ` (${entry.unit})` : ''}</option>)}</Select></div>
      {!records.length ? <Empty title="No observations yet">Record this measure in Today to begin your timeline.</Empty> : <><Chart title={measure.name} unit={measure.unit} observations series={[{ label: 'Observed', times: chronological.map((record) => record.occurred_at), values: chronological.map((record) => record.value) }]} markers={workspace.protocol_changes || []} /><div className="record-list observations">{records.map((record) => <article className="record-row" key={record.id}><div><h3>{dateTime(record.occurred_at, workspace.timezone)}</h3>{record.note && <p>{record.note}</p>}</div><strong>{number(record.value)} <span className="muted">{record.unit || measure.unit}</span></strong></article>)}</div></>}
    </>}
    {workspace.protocol_changes?.length > 0 && <section className="protocol-history"><h2>Protocol changes</h2><div className="record-list">{sortRecent(workspace.protocol_changes).map((change) => <article className="record-row" key={change.id}><div><h3>{change.title}</h3><p>{dateTime(change.occurred_at, workspace.timezone)}</p></div></article>)}</div></section>}
  </div>;
}
