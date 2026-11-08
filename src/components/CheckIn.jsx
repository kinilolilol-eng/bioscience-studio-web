import { useRef, useState } from 'react';
import { request, useMutation } from '../api.js';
import { browserTimezone, instant, localTime } from '../format.js';
import { Input, Notice, Select, Textarea } from './ui.jsx';

export default function CheckIn({ workspace, onSaved }) {
  const measures = workspace.protocol.measures;
  const [entryMode, setEntryMode] = useState('mini_experiment'); // 'mini_experiment' (#4) | 'voice_checkin' (#6) | 'measures'
  const [attributedChange, setAttributedChange] = useState(
    workspace.protocol_changes?.[0]?.title || 'Shifted Memantine HCl 10 mg titration to morning window'
  );
  const [hypothesis, setHypothesis] = useState('7-day wash-in crossover to isolate cognitive signal-to-noise vs afternoon fatigue');
  const [observation, setObservation] = useState('');
  const [verdict, setVerdict] = useState('Confirmed causal link (Keep current change)');
  const [voiceActive, setVoiceActive] = useState(false);

  const [values, setValues] = useState({});
  const [time, setTime] = useState(localTime());
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saved, setSaved] = useState([]);
  const intentions = useRef(new Map());
  const busy = useRef(false);
  const timeEdited = useRef(false);
  const batchTime = useRef(null);
  const causalMutation = useMutation();

  if (!measures.length) return null;

  const recentChanges = workspace.protocol_changes?.length
    ? workspace.protocol_changes.map((c) => c.title)
    : [
        'Swapped Tamoxifen 20 mg → Direct (Z)-Endoxifen 4 mg (CYP2D6 bypass)',
        'Shifted Memantine HCl 10 mg titration to morning window',
        'Split Testosterone Cypionate 140 mg/wk into 70 mg E3.5D pinning schedule',
        'Initiated Telmisartan 40 mg AM (AT1R / PPAR-γ)',
      ];

  function simulateVoiceTranscript() {
    setVoiceActive(true);
    setSuccess('');
    setError('');
    setTimeout(() => {
      setVoiceActive(false);
      setEntryMode('voice_checkin');
      setObservation(
        'Voice Check-In (#6): Morning seated BP stabilized at 114/72 mmHg and afternoon glutamate brain fog cleared 4 days after shifting Memantine 10 mg to morning window.'
      );
      if (measures[0]) {
        setValues((prev) => ({ ...prev, [measures[0].id]: '114' }));
      }
    }, 120);
  }

  async function submitCausalAttribution(event) {
    event.preventDefault();
    if (!observation.trim()) {
      setError('Describe what changed or use Voice Check-In (#6) to dictate your observation.');
      return;
    }
    setError('');
    setSuccess('');
    const firstFilledMeasure = measures.find((m) => values[m.id] !== '' && values[m.id] != null);
    try {
      const res = await causalMutation.run(`/workspaces/${workspace.id}/symptom-attribution`, {
        entryMode,
        attributedChange,
        hypothesis: entryMode === 'mini_experiment' ? hypothesis : 'Voice Check-In (#6) dictated causal log',
        observation,
        verdict,
        measureId: firstFilledMeasure?.id || null,
        measureValue: firstFilledMeasure ? Number(values[firstFilledMeasure.id]) : null,
        occurred_at: timeEdited.current ? instant(time) : new Date().toISOString(),
      });
      if (res) {
        setObservation('');
        setSuccess(
          entryMode === 'voice_checkin'
            ? 'Voice Check-In (#6) attributed to protocol change.'
            : 'Mini-Experiment (#4) causal attribution saved.'
        );
        if (onSaved) await onSaved();
      }
    } catch {
      /* Preserve draft */
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (busy.current) return;
    const entries = measures.filter((measure) => values[measure.id] !== '' && values[measure.id] != null && !saved.includes(measure.id));
    if (!entries.length) { setError('Enter at least one check-in value.'); return; }
    busy.current = true; setPending(true); setError(''); setSuccess('');
    if (!batchTime.current) batchTime.current = timeEdited.current ? instant(time) : new Date().toISOString();
    const completed = [...saved];
    try {
      const attributedNote = note || (attributedChange ? `[Attributed to: ${attributedChange}]` : '');
      for (const measure of entries) {
        const body = { measure_id: measure.id, value: Number(values[measure.id]), occurred_at: batchTime.current, note: attributedNote };
        const fingerprint = JSON.stringify(body);
        if (!intentions.current.has(fingerprint)) intentions.current.set(fingerprint, crypto.randomUUID());
        await request(`/workspaces/${workspace.id}/observations`, { method: 'POST', body, key: intentions.current.get(fingerprint) });
        completed.push(measure.id); setSaved([...completed]);
      }
      setValues({}); setSaved([]); setNote(''); setTime(localTime()); intentions.current.clear(); timeEdited.current = false; batchTime.current = null;
      setSuccess('Check-in saved.'); await onSaved();
    } catch (cause) {
      setError(`${cause.message}${completed.length ? ' The marked values are already saved; retry will save only the remaining values.' : ''}`);
      if (completed.length) await onSaved();
    } finally { busy.current = false; setPending(false); }
  }

  const hasPartial = saved.length > 0;

  return (
    <section className="check-in">
      <div className="section-head">
        <div>
          <h2>Which change did this?</h2>
          <p>Causal symptom &amp; biomarker attribution — link effects to a specific protocol change instead of mindless daily logging.</p>
        </div>
      </div>

      <div className="checkin-mode-switch" role="group" aria-label="Symptom attribution entry points">
        <button
          type="button"
          className={`button small-button ${entryMode === 'mini_experiment' ? 'primary' : 'secondary'}`}
          onClick={() => setEntryMode('mini_experiment')}
        >
          Mini-Experiment (#4)
        </button>
        <button
          type="button"
          className={`button small-button ${entryMode === 'voice_checkin' ? 'primary' : 'secondary'}`}
          onClick={() => setEntryMode('voice_checkin')}
        >
          Voice Check-In (#6)
        </button>
      </div>

      <form onSubmit={submitCausalAttribution} className="causal-attribution-form">
        <Select
          label="1. Which protocol change are you testing?"
          value={attributedChange}
          onChange={(e) => setAttributedChange(e.target.value)}
        >
          {recentChanges.map((chg) => (
            <option key={chg} value={chg}>
              {chg}
            </option>
          ))}
        </Select>

        {entryMode === 'mini_experiment' ? (
          <Input
            label="Mini-Experiment (#4) Hypothesis / Wash-In Window"
            value={hypothesis}
            onChange={(e) => setHypothesis(e.target.value)}
            hint="Isolate one variable at a time across at least 3–5 half-lives."
          />
        ) : (
          <div className="voice-prompt-box">
            <div className="inline-between">
              <span className="small"><strong>Voice Check-In (#6)</strong> · Dictate what shifted since this change</span>
              <button
                type="button"
                className="button secondary small-button"
                onClick={simulateVoiceTranscript}
                disabled={voiceActive}
              >
                {voiceActive ? 'Listening…' : 'Dictate / Transcribe sample'}
              </button>
            </div>
          </div>
        )}

        <Textarea
          label={entryMode === 'voice_checkin' ? 'Transcribed Voice Observation (#6)' : 'Observed Effect / Symptom Shift'}
          rows="2"
          value={observation}
          placeholder="e.g., Afternoon brain fog cleared on Day 4; seated BP dropped 6 mmHg with zero orthostatic dizziness."
          onChange={(e) => setObservation(e.target.value)}
        />

        <Select label="Causal Verdict" value={verdict} onChange={(e) => setVerdict(e.target.value)}>
          <option value="Confirmed causal link (Keep current change)">Confirmed causal link (Keep current change)</option>
          <option value="Transient adaptation window (Continue monitoring)">Transient adaptation window (Continue monitoring)</option>
          <option value="Adverse / off-target shift (Flag for Reviewer titration)">Adverse / off-target shift (Flag for Reviewer titration)</option>
        </Select>

        <button type="submit" className="button secondary full-width" disabled={causalMutation.pending}>
          {causalMutation.pending ? 'Saving attribution…' : entryMode === 'voice_checkin' ? 'Log Voice Check-In (#6)' : 'Log Mini-Experiment (#4)'}
        </button>
      </form>

      <form onSubmit={submit} style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
        <p className="microcopy" style={{ marginBottom: '10px' }}>
          <strong>Quantitative Measure Check-In:</strong> Record observed numbers alongside your causal attribution.
        </p>
        <div className="form-grid two">
          {measures.map((measure) => (
            <Input
              key={measure.id}
              label={`${measure.name}${measure.unit ? ` (${measure.unit})` : ''}`}
              type="number"
              step="any"
              min={measure.minimum ?? undefined}
              max={measure.maximum ?? undefined}
              value={values[measure.id] ?? ''}
              disabled={pending || saved.includes(measure.id)}
              hint={saved.includes(measure.id) ? 'Saved' : undefined}
              onChange={(event) => {
                setSuccess('');
                if (!saved.length) batchTime.current = null;
                setValues((current) => ({ ...current, [measure.id]: event.target.value }));
              }}
            />
          ))}
        </div>
        <details className="check-in-details">
          <summary>Time and note</summary>
          <Input
            label="Observed at"
            type="datetime-local"
            required
            value={time}
            disabled={pending || hasPartial}
            onChange={(event) => {
              timeEdited.current = true;
              batchTime.current = null;
              setTime(event.target.value);
            }}
            hint={`Time in ${browserTimezone()}. Uses now when you save unless changed.`}
          />
          <Textarea
            label="Note (optional)"
            value={note}
            disabled={pending || hasPartial}
            onChange={(event) => {
              batchTime.current = null;
              setNote(event.target.value);
            }}
            maxLength="3000"
          />
        </details>
        <Notice>{error || causalMutation.error}</Notice>
        <Notice kind="success">{success}</Notice>
        <button className="button primary full-width" disabled={pending}>
          {pending ? 'Saving check-in…' : hasPartial ? 'Retry remaining values' : 'Save check-in'}
        </button>
      </form>
    </section>
  );
}
