import { useEffect, useState } from 'react';
import { request, useMutation } from '../api.js';
import {
  ESTER_KINETICS,
  calculateReconstitutionAndInventory,
  createIcsCalendar,
  generateEsterPinningSchedule,
} from '../studioLogic.js';
import { dateTime } from '../format.js';
import { Empty, Icon, Input, Loading, Notice, SectionHead, Select, Status, Tabs } from '../components/ui.jsx';
import Client226Suite from '../components/Client226Suite.jsx';

export default function Models({ owner, workspace, onRefresh }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [domain, setDomain] = useState('all');

  // 1. Reconstitution & Unit-Mapping Calculator + Inventory ("pins left / BAC water left" -> Shopping List)
  const [compoundName, setCompoundName] = useState('Vosoritide (CNP-38)');
  const [vialMassMg, setVialMassMg] = useState('10');
  const [diluentMl, setDiluentMl] = useState('2');
  const [targetDoseMcg, setTargetDoseMcg] = useState('1100');
  const [activeFraction, setActiveFraction] = useState('0.96');
  const [dosesTaken, setDosesTaken] = useState('23');
  const [pinsInBox, setPinsInBox] = useState('30');
  const [bacWaterBottleMl, setBacWaterBottleMl] = useState('10');
  const [vialsReconstitutedCount, setVialsReconstitutedCount] = useState('4');
  const [reconStatus, setReconStatus] = useState('');
  const reconMutation = useMutation();

  // 2. Frequency from Ester -> Calendar Pinning Schedule
  const [esterCompound, setEsterCompound] = useState('Testosterone Cypionate');
  const [esterKey, setEsterKey] = useState('cypionate');
  const [weeklyDoseMg, setWeeklyDoseMg] = useState('140');
  const [concMgMl, setConcMgMl] = useState('200');
  const [cadenceMode, setCadenceMode] = useState('e3_5d');
  const [pinStatus, setPinStatus] = useState('');
  const pinMutation = useMutation();

  useEffect(() => {
    if (!owner) return undefined;
    const controller = new AbortController();
    setError('');
    request('/models/theoretical', { signal: controller.signal })
      .then((res) => { if (!controller.signal.aborted) setData(res); })
      .catch((cause) => { if (cause.name !== 'AbortError') setError(cause.message); });
    return () => controller.abort();
  }, [owner]);

  const recon = calculateReconstitutionAndInventory({
    compoundName,
    vialMassMg,
    diluentMl,
    targetDoseMcg,
    activeFraction,
    dosesTaken,
    pinsInBox,
    bacWaterBottleMl,
    vialsReconstitutedCount,
  });

  const pinSchedule = generateEsterPinningSchedule({
    compoundName: esterCompound,
    ester: esterKey,
    weeklyDoseMg,
    concentrationMgMl: concMgMl,
    cadenceMode,
    startDateIso: new Date().toISOString(),
    weeks: 3,
  });

  async function saveReconstitutionToProtocol() {
    setReconStatus('');
    const wsId = workspace?.id || 'ws-client-01';
    try {
      const res = await reconMutation.run(`/workspaces/${wsId}/reconstitution`, {
        compoundName,
        vialMassMg: Number(vialMassMg),
        diluentMl: Number(diluentMl),
        targetDoseMcg: Number(targetDoseMcg),
        activeFraction: Number(activeFraction),
        dosesTaken: Number(dosesTaken),
        pinsInBox: Number(pinsInBox),
        bacWaterBottleMl: Number(bacWaterBottleMl),
        vialsReconstitutedCount: Number(vialsReconstitutedCount),
        createProtocolItem: true,
      });
      if (res) {
        setReconStatus(
          `Saved ${recon.concMgMl} mg/mL (${recon.u100Units} U-100 units draw) to protocol item "${compoundName}" and synced ${recon.pinsLeft} pins left / ${recon.bacWaterLeftMl} mL BAC water left to the Shopping List.`
        );
        if (onRefresh) await onRefresh();
      }
    } catch {
      /* Preserve state */
    }
  }

  async function pushPinningToCalendar() {
    setPinStatus('');
    const wsId = workspace?.id || 'ws-client-01';
    try {
      const res = await pinMutation.run(`/workspaces/${wsId}/pinning-schedule`, {
        compoundName: esterCompound,
        ester: esterKey,
        weeklyDoseMg: Number(weeklyDoseMg),
        concentrationMgMl: Number(concMgMl),
        cadenceMode,
        startDateIso: new Date().toISOString(),
        weeks: 3,
      });
      if (res) {
        setPinStatus(
          `Pushed ${pinSchedule.events.length} pinning occurrences (${pinSchedule.dosePerPinMg} mg / ${pinSchedule.drawMl} mL every ${pinSchedule.intervalH}h) straight into the Protocol Calendar.`
        );
        if (onRefresh) await onRefresh();
      }
    } catch {
      /* Preserve state */
    }
  }

  function downloadPinningIcs() {
    const ics = createIcsCalendar(pinSchedule.events, `${esterCompound} Pinning Schedule`);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${esterKey}-pinning-schedule.ics`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (!owner) {
    return <Empty title="Owner-only channel">Stipulated theoretical models and parameter tables are visible only to the workspace owner.</Empty>;
  }

  const models = data?.models || [];
  const filtered = domain === 'all' ? models : models.filter((m) => m.domain === domain);

  return (
    <div className="models-view">
      <Client226Suite workspace={workspace} library={null} />

      <SectionHead
        title="Reconstitution &amp; Draw Calculator · Auto-Fed Shopping List"
        action={
          <button
            type="button"
            className="button primary small-button"
            onClick={saveReconstitutionToProtocol}
            disabled={reconMutation.pending}
          >
            {reconMutation.pending ? 'Saving to protocol…' : 'Save to protocol item & sync shopping list'}
          </button>
        }
      >
        Closed-form dimensional conversion for lyophilized vials, salt-to-base active fractions, U-100 syringe graduations, and "pins left / BAC water left" inventory tracking.
      </SectionHead>
      <Notice kind="success">{reconStatus}</Notice>
      <Notice>{reconMutation.error}</Notice>

      <div className="studio-panel" style={{ marginBottom: '2.5rem' }}>
        <div className="form-grid four">
          <Input label="Protocol compound / peptide" value={compoundName} onChange={(e) => setCompoundName(e.target.value)} />
          <Input label="Vial labeled mass (mg)" type="number" step="any" min="0" value={vialMassMg} onChange={(e) => setVialMassMg(e.target.value)} />
          <Input label="Bacteriostatic water / diluent (mL)" type="number" step="any" min="0.01" value={diluentMl} onChange={(e) => setDiluentMl(e.target.value)} />
          <Input label="Target active dose (mcg)" type="number" step="any" min="0" value={targetDoseMcg} onChange={(e) => setTargetDoseMcg(e.target.value)} />
        </div>

        <div className="form-grid four" style={{ marginTop: '0.5rem' }}>
          <Input
            label="Active free-base fraction (0–1)"
            type="number"
            step="0.01"
            min="0.01"
            max="1"
            value={activeFraction}
            onChange={(e) => setActiveFraction(e.target.value)}
            hint="1.00 pure; e.g. 0.96 salt correction"
          />
          <Input label="Pins in box (starting count)" type="number" min="1" value={pinsInBox} onChange={(e) => setPinsInBox(e.target.value)} />
          <Input label="Doses / pins drawn so far" type="number" min="0" value={dosesTaken} onChange={(e) => setDosesTaken(e.target.value)} />
          <Input
            label="BAC water bottle (mL) / Vials mixed"
            type="number"
            step="any"
            min="1"
            value={bacWaterBottleMl}
            onChange={(e) => setBacWaterBottleMl(e.target.value)}
            hint={`${vialsReconstitutedCount} vials mixed (${Number(diluentMl) * Number(vialsReconstitutedCount)} mL used)`}
          />
        </div>

        <div className="dose-telemetry-grid" style={{ marginTop: '1rem' }}>
          <article className="telemetry-cell">
            <span>Active concentration · C = (m × f) / V</span>
            <strong className="tabular-nums">{recon.concMgMl.toFixed(3)} mg/mL</strong>
            <small className="tabular-nums">{recon.concMcgMl.toFixed(0)} mcg/mL</small>
          </article>
          <article className="telemetry-cell">
            <span>Draw volume · V_draw = D / C</span>
            <strong className="tabular-nums">{recon.drawMl.toFixed(4)} mL</strong>
            <small className="tabular-nums">{recon.u100Units.toFixed(1)} IU (U-100 units)</small>
          </article>
          <article className="telemetry-cell">
            <span>Pins left &amp; Vial draws left</span>
            <strong className="tabular-nums">{recon.pinsLeft} pins left</strong>
            <small className="tabular-nums">{recon.dosesLeftInVial} of {recon.dosesPerVial} draws left in vial</small>
          </article>
          <article className="telemetry-cell">
            <span>BAC water left (feeds shopping list)</span>
            <strong className="tabular-nums">{recon.bacWaterLeftMl} mL left</strong>
            <small>{recon.shoppingItems.length ? `${recon.shoppingItems.length} reorder item(s) queued` : 'Supply nominal'}</small>
          </article>
        </div>

        {recon.shoppingItems.length > 0 && (
          <div className="record-list" style={{ marginTop: '1rem' }}>
            {recon.shoppingItems.map((item) => (
              <div className="record-row" key={item.id}>
                <div>
                  <h3>Auto-Fed Shopping List: {item.item}</h3>
                  <p>{item.reason}</p>
                </div>
                <strong className="tabular-nums">${item.estimatedCostUsd}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      <SectionHead
        title="Frequency from Ester · Direct Calendar Pinning Schedule"
        action={
          <div className="inline-actions">
            <button type="button" className="button secondary small-button" onClick={downloadPinningIcs}>
              <Icon name="download" />
              Export .ics
            </button>
            <button
              type="button"
              className="button primary small-button"
              onClick={pushPinningToCalendar}
              disabled={pinMutation.pending}
            >
              {pinMutation.pending ? 'Syncing calendar…' : 'Push pinning schedule to Protocol Calendar'}
            </button>
          </div>
        }
      >
        Outputs directly into the calendar as a concrete pinning schedule with per-pin draw volumes and peak-to-trough fluctuation, not just a single number on screen.
      </SectionHead>
      <Notice kind="success">{pinStatus}</Notice>
      <Notice>{pinMutation.error}</Notice>

      <div className="studio-panel" style={{ marginBottom: '2.5rem' }}>
        <div className="form-grid four">
          <Input label="Compound Label" value={esterCompound} onChange={(e) => setEsterCompound(e.target.value)} />
          <Select label="Ester Chain (t½)" value={esterKey} onChange={(e) => setEsterKey(e.target.value)}>
            {Object.entries(ESTER_KINETICS).map(([k, spec]) => (
              <option key={k} value={k}>
                {spec.label} (t½ {spec.halfLifeH}h · {Math.round(spec.esterWeightFraction * 100)}% base)
              </option>
            ))}
          </Select>
          <Input label="Weekly Total Dose (mg/wk)" type="number" step="any" min="1" value={weeklyDoseMg} onChange={(e) => setWeeklyDoseMg(e.target.value)} />
          <Select label="Pinning Cadence" value={cadenceMode} onChange={(e) => setCadenceMode(e.target.value)}>
            <option value="optimal">Optimal for ester ({ESTER_KINETICS[esterKey]?.recommendedIntervalH || 84}h)</option>
            <option value="daily">Daily Micro-Admin (Every 24h)</option>
            <option value="eod">Every Other Day · EOD (Every 48h)</option>
            <option value="e3_5d">Twice Weekly · E3.5D (Every 84h)</option>
            <option value="weekly">Once Weekly (Every 168h)</option>
          </Select>
        </div>

        <div className="dose-telemetry-grid" style={{ marginTop: '1rem' }}>
          <div className="telemetry-cell">
            <span>Per-Pin Dose &amp; Draw Volume</span>
            <strong className="tabular-nums">{pinSchedule.dosePerPinMg} mg / pin</strong>
            <small className="tabular-nums">{pinSchedule.drawMl} mL ({pinSchedule.u100Units} U-100 units @ {concMgMl} mg/mL)</small>
          </div>
          <div className="telemetry-cell">
            <span>Steady-State Peak / Trough Ratio</span>
            <strong className="tabular-nums">{pinSchedule.peakToTroughRatio}×</strong>
            <small className="tabular-nums">{pinSchedule.fluctuationPct}% inter-pin decay</small>
          </div>
          <div className="telemetry-cell">
            <span>Active Unesterified Base Delivered</span>
            <strong className="tabular-nums">{pinSchedule.activeBaseWeeklyMg} mg/wk</strong>
            <small>After {pinSchedule.esterLabel} ester cleavage</small>
          </div>
        </div>

        <div className="record-list" style={{ marginTop: '1rem' }}>
          {pinSchedule.events.slice(0, 6).map((ev) => (
            <article className="record-row" key={ev.id}>
              <div>
                <h3>{ev.title}</h3>
                <p>{ev.note}</p>
              </div>
              <span className="tabular-nums small muted">{dateTime(ev.scheduled_at)}</span>
            </article>
          ))}
        </div>
      </div>

      <SectionHead title="Stipulated Theoretical Systems Models">
        Explicitly isolated from empirical DailyMed/PubMed pharmacokinetic curves. All outputs below represent stipulated mechanistic ODE, Monte Carlo, and PDE/conversion-sink simulations.
      </SectionHead>
      <Notice>{error}</Notice>
      {!data && !error && <Loading>Loading theoretical models channel…</Loading>}
      {data && (
        <>
          <Tabs
            label="Theoretical model domain"
            value={domain}
            onChange={setDomain}
            entries={[
              ['all', `All (${models.length})`],
              ['height_bone', 'Height & Epiphyseal'],
              ['cognition_recovery', 'Cognition & Recovery'],
              ['anxiety_sociability', 'Anxiety & Sociability'],
            ]}
          />
          <div className="record-list" style={{ marginTop: '1rem' }}>
            {filtered.map((model) => (
              <article className="record-row" key={model.model_id || model.id} style={{ display: 'block', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
                  <h3>{model.title || model.module}</h3>
                  <Status value="configured">{model.evidence_class || 'stipulated_theoretical'}</Status>
                </div>
                <p style={{ marginTop: '0.35rem' }}>{model.summary || model.caveat}</p>
                {model.outputs && (
                  <pre style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--surface-2, #f5f5f4)', borderRadius: '6px', overflowX: 'auto', fontSize: '0.8rem' }}>
                    {JSON.stringify(model.outputs, null, 2)}
                  </pre>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
