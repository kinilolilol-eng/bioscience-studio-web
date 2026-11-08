import { useState } from 'react';
import { useMutation } from '../api.js';
import { dateTime } from '../format.js';
import { Drawer, Input, Notice, Textarea } from './ui.jsx';

export default function ConsultationDrawer({ workspace, prefilled = null, onSaved, onClose }) {
  const [clientCode, setClientCode] = useState(
    prefilled?.clientCode ? String(prefilled.clientCode).replace(/\s*\(cc224\)/gi, '') : 'Client 226'
  );
  const [biologicalBaseline, setBiologicalBaseline] = useState(
    prefilled?.biologicalBaseline
      ? String(prefilled.biologicalBaseline).replace(/\s*\(cc224\)/gi, '')
      : prefilled
      ? `Goal: ${prefilled.goalLabel} · Stack: ${prefilled.enteredStack} · BP ${prefilled.baselineBp || '116/74 mmHg'} · Weight ${prefilled.baselineWeightKg || '74'} kg`
      : 'Client 226 · 74.0 kg · Client 226 Height & Client 226 Cognition · Seated BP 114/72 mmHg · CYP2D6 *4/*10'
  );
  const [biomarkerTargets, setBiomarkerTargets] = useState(
    prefilled?.biomarkerTargets ||
      'Serum PO4 <= 4.5 mg/dL · Sensitive E2 (LC-MS/MS) 12 to 20 pg/mL · Free T4 1.3 to 1.7 ng/dL · CXM > 42 ng/mL'
  );
  const [titrationAdjustments, setTitrationAdjustments] = useState(
    prefilled?.titrationNotes ||
      'Client 226 Height: Dabogratinib 18.5 mg + Vosoritide 1.11 mg + Somatropin staged (1.25x Stage 1, 0.80x Stage 2B) + 36h washout before Day 9. Client 226 Cognition: TAK-653 0.5 mg + ACD856 10 mg + OV350 25 mg + AUT00206 50 mg + Basmisanil 5 mg + Terazosin 0.6 mg.'
  );
  const [clinicianSignoff, setClinicianSignoff] = useState('Client 226 Protocol Studio');
  const [success, setSuccess] = useState('');
  const mutation = useMutation();

  async function handleSubmit(event) {
    event.preventDefault();
    setSuccess('');
    try {
      const wsId = workspace?.id || 'ws-226-cognition';
      const result = await mutation.run(`/workspaces/${wsId}/consultation`, {
        clientCode,
        biologicalBaseline,
        biomarkerTargets,
        titrationAdjustments,
        clinicianSignoff,
        goalLabel: prefilled?.goalLabel,
      });
      if (result) {
        setSuccess('Consultation record saved to workspace.');
        if (onSaved) await onSaved();
      }
    } catch {
      /* Preserve draft on error */
    }
  }

  const notes = workspace?.consultation_notes || [];

  return (
    <Drawer
      title="Consultation Notes"
      subtitle={prefilled ? `Pre-filled from ${prefilled.goalLabel}` : workspace?.label || 'Client 226 baseline and titration log'}
      onClose={onClose}
      wide
    >
      <div className="drawer-content">
        {prefilled && (
          <Notice kind="info">
            Pre-filled from your stack check. Review and save to the workspace.
          </Notice>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid two">
            <Input
              label="Client reference"
              required
              value={clientCode}
              onChange={(e) => setClientCode(e.target.value)}
            />
            <Input
              label="Studio attribution"
              required
              value={clinicianSignoff}
              onChange={(e) => setClinicianSignoff(e.target.value)}
            />
          </div>

          <Textarea
            label="Biological baseline"
            required
            rows="3"
            value={biologicalBaseline}
            onChange={(e) => setBiologicalBaseline(e.target.value)}
            hint="Weight, metabolizer status, seated blood pressure, and active domain."
          />

          <Textarea
            label="Biomarker targets"
            required
            rows="3"
            value={biomarkerTargets}
            onChange={(e) => setBiomarkerTargets(e.target.value)}
            hint="Target ranges and assay methods (LC-MS/MS E2, IGF-1, Cystatin C, PO4)."
          />

          <Textarea
            label="Titration schedule"
            required
            rows="3"
            value={titrationAdjustments}
            onChange={(e) => setTitrationAdjustments(e.target.value)}
            hint="Dosing intervals, washout windows, and prodrug substitutions."
          />

          <Notice>{mutation.error}</Notice>
          <Notice kind="success">{success}</Notice>

          <div className="form-actions">
            <button type="button" className="button quiet" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="button primary" disabled={mutation.pending}>
              {mutation.pending ? 'Saving…' : 'Save consultation record'}
            </button>
          </div>
        </form>

        {notes.length > 0 && (
          <section className="recent-records" style={{ marginTop: '24px' }}>
            <h3>Saved records ({notes.length})</h3>
            <div className="record-list" style={{ marginTop: '8px' }}>
              {notes.map((entry) => (
                <article className="record-row" key={entry.id} style={{ alignItems: 'flex-start' }}>
                  <div>
                    <h3>
                      {String(entry.clientCode || 'Client 226').replace(/\s*\(cc224\)/gi, '')} <span>·</span>{' '}
                      <span className="muted">{dateTime(entry.createdAt, workspace?.timezone)}</span>
                    </h3>
                    <ul className="compact-list" style={{ margin: '8px 0 0', paddingLeft: '16px' }}>
                      <li><strong>Baseline:</strong> {String(entry.biologicalBaseline || '').replace(/\s*\(cc224\)/gi, '')}</li>
                      <li><strong>Targets:</strong> {entry.biomarkerTargets}</li>
                      <li><strong>Titration:</strong> {entry.titrationAdjustments}</li>
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </Drawer>
  );
}
