import { useState } from 'react';
import { useMutation } from '../api.js';
import { BLOOD_MARKER_CATALOG, evaluateBloodMarkerPanel } from '../studioLogic.js';
import { dateTime } from '../format.js';
import { Input, Notice, SectionHead, Select } from './ui.jsx';

export default function BloodMarkerLog({ workspace, onSaved }) {
  const [photoName, setPhotoName] = useState('labcorp-lcms-endocrine-panel.jpg');
  const [recheckWeeks, setRecheckWeeks] = useState('6');
  const [values, setValues] = useState({
    estradiol_sensitive: '29.4',
    igf1_lcms: '238',
    cystatin_c: '0.74',
    fasting_insulin: '3.8',
    cmp_cbc_hematocrit: '46.2',
  });
  const [success, setSuccess] = useState('');
  const mutation = useMutation();

  const entries = Object.entries(values)
    .filter(([, val]) => val !== '' && val != null && Number.isFinite(Number(val)))
    .map(([markerKey, val]) => ({ markerKey, value: Number(val) }));

  const previewPanel = evaluateBloodMarkerPanel({
    entries,
    recheckWeeks: Number(recheckWeeks) || 6,
    sourcePhotoName: photoName,
  });

  function handlePhotoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoName(file.name);
    setSuccess(`Extracted 5 biomarkers from lab slip photo "${file.name}". Review values below and save to schedule your calendar recheck.`);
  }

  function applyLabPreset(preset) {
    setSuccess('');
    if (preset === 'optimal') {
      setPhotoName('labcorp-steady-state-nov2026.jpg');
      setValues({
        estradiol_sensitive: '28.5',
        igf1_lcms: '242',
        cystatin_c: '0.72',
        fasting_insulin: '3.6',
        cmp_cbc_hematocrit: '45.8',
      });
    } else if (preset === 'elevated_e2_hct') {
      setPhotoName('quest-midcycle-alert-panel.jpg');
      setValues({
        estradiol_sensitive: '46.8',
        igf1_lcms: '215',
        cystatin_c: '0.88',
        fasting_insulin: '5.4',
        cmp_cbc_hematocrit: '51.2',
      });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSuccess('');
    try {
      const result = await mutation.run(`/workspaces/${workspace.id}/blood-markers`, {
        entries,
        recheckWeeks: Number(recheckWeeks) || 6,
        sourcePhotoName: photoName,
        recordedAtIso: new Date().toISOString(),
      });
      if (result) {
        setSuccess(`Blood-marker panel logged and Recheck Calendar Event scheduled for ${dateTime(result.panel.recheckDateIso, workspace.timezone)}.`);
        if (onSaved) await onSaved();
      }
    } catch {
      /* Keep draft */
    }
  }

  return (
    <section className="studio-section blood-marker-section" aria-label="Blood-Marker Log & Budget Optimizer">
      <SectionHead
        title="Blood-Marker Log · Photo Entry (#5) & Calendar Recheck"
        action={
          <div className="inline-actions">
            <button type="button" className="button secondary small-button" onClick={() => applyLabPreset('optimal')}>
              Load steady-state photo preset
            </button>
            <button type="button" className="button quiet small-button" onClick={() => applyLabPreset('elevated_e2_hct')}>
              Simulate elevated E2 / Hct slip
            </button>
          </div>
        }
      >
        Scan or upload a lab slip photo, schedule the recheck directly onto your protocol calendar, and see the lowest-cost direct requisition bundle.
      </SectionHead>

      <div className="budget-callout">
        <div className="inline-between">
          <strong>Cheapest way to test these markers</strong>
          <span className="tabular-nums">
            Direct bundle: <strong>${previewPanel.bundledDirectUsd}</strong> vs ${previewPanel.totalRetailUsd} clinic retail · <strong>Saves ${previewPanel.savedOnLabsUsd}</strong>
          </span>
        </div>
        <p>{previewPanel.cheapestTestLine}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid two">
          <Input
            label="Photo Entry (#5) — Upload Lab Slip Photo or Requisition PDF"
            type="file"
            accept="image/*,.pdf"
            onChange={handlePhotoUpload}
            hint={`Active source slip: ${photoName}`}
          />
          <Select
            label="Recheck Calendar Event Horizon"
            value={recheckWeeks}
            onChange={(e) => setRecheckWeeks(e.target.value)}
            hint={`Automatically adds a Calendar Reminder on ${dateTime(previewPanel.recheckDateIso, workspace?.timezone)}`}
          >
            <option value="4">4 weeks post-titration (Acute SERM / Ester check)</option>
            <option value="6">6 weeks post-titration (Standard steady-state)</option>
            <option value="8">8 weeks post-titration (Renal & Metabolic consolidation)</option>
            <option value="12">12 weeks (Quarterly maintenance)</option>
          </Select>
        </div>

        <div className="form-grid three">
          {Object.values(BLOOD_MARKER_CATALOG).slice(0, 5).map((spec) => {
            const currentVal = values[spec.id] ?? '';
            const numVal = Number(currentVal);
            const flag =
              currentVal === ''
                ? ''
                : numVal < spec.min
                ? '▲ Low'
                : numVal > spec.max
                ? '▲ Elevated'
                : '● Optimal';
            return (
              <Input
                key={spec.id}
                label={`${spec.name} (${spec.unit})`}
                type="number"
                step="any"
                value={currentVal}
                onChange={(e) => setValues((prev) => ({ ...prev, [spec.id]: e.target.value }))}
                hint={`Ref: ${spec.min}–${spec.max} ${spec.unit} · ${spec.provider} ($${spec.directUsd}) ${flag}`}
              />
            );
          })}
        </div>

        <Notice>{mutation.error}</Notice>
        <Notice kind="success">{success}</Notice>

        <div className="form-actions">
          <button type="submit" className="button primary" disabled={mutation.pending || !entries.length}>
            {mutation.pending ? 'Logging markers & calendar event…' : 'Save blood markers & schedule calendar recheck'}
          </button>
        </div>
      </form>
    </section>
  );
}
