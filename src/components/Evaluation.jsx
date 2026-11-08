import { number } from '../format.js';
import { Status } from './ui.jsx';

export function Coverage({ evaluation }) {
  const coverage = evaluation?.coverage;
  return coverage ? <p className="coverage">{coverage.modeled} of {coverage.total} compounds modeled <span>·</span> {coverage.assessed_pairs} of {coverage.total_pairs} pairs assessed. {coverage.assessed_pairs < coverage.total_pairs && 'Unassessed pairs remain unknown.'}</p> : null;
}
export function Findings({ evaluation, heading = 'What matters now' }) {
  const findings = evaluation?.findings || [];
  const gates = evaluation?.gates || [];
  if (!evaluation) return null;
  return <section className="findings"><h2>{heading}</h2><Coverage evaluation={evaluation} />
    {!findings.length && !gates.length && <p className="muted">No configured findings for this evaluation.</p>}
    <div className="finding-list">{gates.map((gate, index) => <article className={`finding finding-${gate.state}`} key={gate.id || `gate-${index}`}><div className="inline-between"><h3>{gate.title}</h3><Status value={gate.state} /></div><p>{gate.description}</p>{gate.action && <small>{gate.action.replaceAll('_', ' ')}</small>}</article>)}
      {findings.map((finding, index) => <details className="finding" key={`finding-${index}`}><summary><span>{finding.title}</span><Status value="neutral">{finding.coverage || finding.kind?.replaceAll('_', ' ') || 'Finding'}</Status></summary><p>{finding.description}</p></details>)}
    </div>
  </section>;
}
export function SeriesDetails({ series, owner = false }) {
  return <details className="reason"><summary>{owner ? 'Model details and source' : 'Exposure estimate details'}</summary><dl className="definition-list"><div><dt>Exposure area</dt><dd>{number(series.auc)} {series.unit === 'mg/L' ? 'mg·h/L' : 'relative·h'}</dd></div><div><dt>Peak</dt><dd>{number(series.peak)} {series.unit}</dd></div>{series.accumulation_ratio != null && <div><dt>Accumulation ratio</dt><dd>{number(series.accumulation_ratio)}</dd></div>}{owner && series.parameter_status && <div><dt>Parameter status</dt><dd>{series.parameter_status === 'draft' ? 'Draft configuration' : 'Configured'}</dd></div>}</dl>{owner && series.parameter_status === 'draft' && <p className="muted small">A computed curve shows numerical execution, not scientific validation of these draft parameters.</p>}{owner && series.source && <p className="source">{series.source}</p>}</details>;
}
