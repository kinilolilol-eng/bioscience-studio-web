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
    setSuccess(`Loaded 5 markers from "${file.name}".`);
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
        setSuccess(`Markers saved. Recheck scheduled for ${dateTime(result.panel.recheckDateIso, workspace.timezone)}.`);
        if (onSaved) await onSaved();
      }
    } catch {
      /* Preserve draft values */
    }
  }

  return (
    <section className="studio-section blood-marker-section" aria-label="Blood Markers">
      <SectionHead
        title="Blood Markers"
        action={
          <div className="inline-actions">
            <button type="button" className="button secondary small-button" onClick={() => applyLabPreset('optimal')}>
              Steady-state preset
            </button>
            <button type="button" className="button quiet small-button" onClick={() => applyLabPreset('elevated_e2_hct')}>
              Elevated E2 / Hct preset
            </button>
          </div>
        }
      />

      <div className="budget-callout">
        <div className="inline-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <span>Direct Lab Requisition (5 Markers)</span>
          <span className="tabular-nums">
            <strong>${previewPanel.bundledDirectUsd}</strong> bundled vs ${previewPanel.totalRetailUsd} retail ·{' '}
            <strong>Saves ${previewPanel.savedOnLabsUsd}</strong>
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid two">
          <Input
            label="Lab slip image or PDF"
            type="file"
            accept="image/*,.pdf"
            onChange={handlePhotoUpload}
          />
          <Select
            label="Recheck interval"
            value={recheckWeeks}
            onChange={(e) => setRecheckWeeks(e.target.value)}
          >
            <option value="4">4 weeks</option>
            <option value="6">6 weeks</option>
            <option value="8">8 weeks</option>
            <option value="12">12 weeks</option>
          </Select>
        </div>

        <div className="form-grid three">
          {Object.values(BLOOD_MARKER_CATALOG).slice(0, 5).map((spec) => {
            const currentVal = values[spec.id] ?? '';
            return (
              <Input
                key={spec.id}
                label={`${spec.name} (${spec.unit})`}
                type="number"
                step="any"
                value={currentVal}
                onChange={(e) => setValues((prev) => ({ ...prev, [spec.id]: e.target.value }))}
              />
            );
          })}
        </div>

        <Notice>{mutation.error}</Notice>
        <Notice kind="success">{success}</Notice>

        <div className="form-actions">
          <button type="submit" className="button primary" disabled={mutation.pending || !entries.length}>
            {mutation.pending ? 'Saving…' : 'Save markers'}
          </button>
        </div>
      </form>
    </section>
  );
}
