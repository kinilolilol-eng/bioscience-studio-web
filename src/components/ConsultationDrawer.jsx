import { useState } from 'react';
import { useMutation } from '../api.js';
import { dateTime } from '../format.js';
import { Drawer, Input, Notice, Textarea } from './ui.jsx';

export default function ConsultationDrawer({ workspace, prefilled = null, onSaved, onClose }) {
  const [clientCode, setClientCode] = useState(
    prefilled?.clientCode || 'CL-2026-226 (cc224)'
  );
  const [biologicalBaseline, setBiologicalBaseline] = useState(
    prefilled?.biologicalBaseline ||
      (prefilled
        ? `Goal: ${prefilled.goalLabel} · Entered Stack: ${prefilled.enteredStack} · BP ${prefilled.baselineBp || '116/74 mmHg'} · Weight ${prefilled.baselineWeightKg || '74'} kg.`
        : 'Client 226 (cc224) · 74.0 kg · Dual-Domain Architecture (53-Slot Cognition + 14-Day Staged Epiphyseal Height Reactor) · Resting BP 114/72 mmHg · CYP2D6 *4/*10.')
  );
  const [biomarkerTargets, setBiomarkerTargets] = useState(
    prefilled?.biomarkerTargets ||
      'Serum PO4 <= 4.5 mg/dL (R03) · Ultrasensitive E2 (LC-MS/MS) 12–20 pg/mL (R01) · Free T4 1.3–1.7 ng/dL (R02) · Collagen X (CXM) > 42 ng/mL.'
  );
  const [titrationAdjustments, setTitrationAdjustments] = useState(
    prefilled?.titrationNotes ||
      'Height Arm A: Dabogratinib 18.5 mg (0.25 mg/kg/d) + Vosoritide 1.11 mg (15 mcg/kg/d) + Staged Somatropin (1.25x Stage 1 / 0.80x Stage 2B) + Thiol-Clutch 36h before Day 9. Cognition: TAK-653 0.5 mg + ACD856 10 mg + OV350 25 mg + AUT00206 50 mg + Basmisanil 5 mg + Terazosin 0.6 mg.'
  );
  const [clinicianSignoff, setClinicianSignoff] = useState('Protocol Studio — Client 226 Mechanistic Architecture');
  const [success, setSuccess] = useState('');
  const mutation = useMutation();

  async function handleSubmit(event) {
    event.preventDefault();
    setSuccess('');
    try {
      const wsId = workspace?.id || 'ws-client-01';
      const result = await mutation.run(`/workspaces/${wsId}/consultation`, {
        clientCode,
        biologicalBaseline,
        biomarkerTargets,
        titrationAdjustments,
        clinicianSignoff,
        goalLabel: prefilled?.goalLabel,
      });
      if (result) {
        setSuccess('Consultation intake & titration baseline saved to workspace.');
        if (onSaved) await onSaved();
      }
    } catch {
      /* Preserve draft on error */
    }
  }

  const notes = workspace?.consultation_notes || [];

  return (
    <Drawer
      title="Consultation Notes & Client Intake"
      subtitle={prefilled ? `Pre-filled from Goal → Protocol Finder (${prefilled.goalLabel})` : workspace?.label || 'Private clinical baseline & titration log'}
      onClose={onClose}
      wide
    >
      <div className="drawer-content">
        {prefilled && (
          <Notice kind="info">
            Pre-filled directly from your Goal → Protocol Finder & Stack Check result so nothing gets typed twice. Review and save to lock into the client workspace.
          </Notice>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid two">
            <Input
              label="Client Reference Code"
              required
              value={clientCode}
              onChange={(e) => setClientCode(e.target.value)}
            />
            <Input
              label="Clinician / Studio Attribution"
              required
              value={clinicianSignoff}
              onChange={(e) => setClinicianSignoff(e.target.value)}
            />
          </div>

          <Textarea
            label="Client Biological Baselines (Anthropometrics, Pharmacogenomics, Hemodynamics, Current Stack)"
            required
            rows="3"
            value={biologicalBaseline}
            onChange={(e) => setBiologicalBaseline(e.target.value)}
            hint="Include CYP2D6 / UGT metabolizer status, resting seated BP, epiphyseal status, and prior compound history."
          />

          <Textarea
            label="Biomarker Targets & Guardrail Thresholds"
            required
            rows="3"
            value={biomarkerTargets}
            onChange={(e) => setBiomarkerTargets(e.target.value)}
            hint="Specify exact assay methodology (e.g., LC-MS/MS for Estradiol & IGF-1, Cystatin C for glomerular filtration)."
          />

          <Textarea
            label="Titration Adjustments & Mechanistic Protocol Notes"
            required
            rows="3"
            value={titrationAdjustments}
            onChange={(e) => setTitrationAdjustments(e.target.value)}
            hint="Document compound intervals, α7-nAChR adaptation bridges, or CYP2D6 prodrug substitutions."
          />

          <Notice>{mutation.error}</Notice>
          <Notice kind="success">{success}</Notice>

          <div className="form-actions">
            <button type="button" className="button quiet" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="button primary" disabled={mutation.pending}>
              {mutation.pending ? 'Saving intake…' : 'Save consultation intake'}
            </button>
          </div>
        </form>

        {notes.length > 0 && (
          <section className="recent-records" style={{ marginTop: '28px' }}>
            <h3>Recorded Consultation Intakes ({notes.length})</h3>
            <div className="record-list" style={{ marginTop: '10px' }}>
              {notes.map((entry) => (
                <article className="record-row" key={entry.id} style={{ alignItems: 'flex-start' }}>
                  <div>
                    <h3>
                      {entry.clientCode} <span>·</span> <span className="muted">{dateTime(entry.createdAt, workspace?.timezone)}</span>
                    </h3>
                    <p><strong>Baseline:</strong> {entry.biologicalBaseline}</p>
                    <p><strong>Targets:</strong> {entry.biomarkerTargets}</p>
                    <p><strong>Titration:</strong> {entry.titrationAdjustments}</p>
                    <small className="muted">{entry.clinicianSignoff}</small>
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
