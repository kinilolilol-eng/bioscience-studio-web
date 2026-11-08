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

  const [compoundName, setCompoundName] = useState('Vosoritide');
  const [vialMassMg, setVialMassMg] = useState('10');
  const [diluentMl, setDiluentMl] = useState('2');
  const [targetDoseMcg, setTargetDoseMcg] = useState('1100');
  const [activeFraction, setActiveFraction] = useState('0.96');
  const [dosesTaken, setDosesTaken] = useState('23');
  const [pinsInBox, setPinsInBox] = useState('30');
  const [bacWaterBottleMl, setBacWaterBottleMl] = useState('10');
  const [vialsReconstitutedCount] = useState('4');
  const [reconStatus, setReconStatus] = useState('');
  const reconMutation = useMutation();

  const [esterCompound, setEsterCompound] = useState('Testosterone Cypionate');
  const [esterKey, setEsterKey] = useState('cypionate');
  const [weeklyDoseMg, setWeeklyDoseMg] = useState('140');
  const [concMgMl] = useState('200');
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
    const wsId = workspace?.id || 'ws-226-height';
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
          `Saved ${recon.concMgMl} mg/mL (${recon.u100Units} U-100 units) for ${compoundName}. Remaining: ${recon.pinsLeft} syringes, ${recon.bacWaterLeftMl} mL BAC water.`
        );
        if (onRefresh) await onRefresh();
      }
    } catch {
      /* Preserve state */
    }
  }

  async function pushPinningToCalendar() {
    setPinStatus('');
    const wsId = workspace?.id || 'ws-226-height';
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
          `Scheduled ${pinSchedule.events.length} occurrences (${pinSchedule.dosePerPinMg} mg / ${pinSchedule.drawMl} mL every ${pinSchedule.intervalH}h) on the protocol calendar.`
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
    return <Empty title="Owner-only channel">Theoretical models and parameter tables are visible only to the workspace owner.</Empty>;
  }

  const models = data?.models || [];
  const filtered = domain === 'all' ? models : models.filter((m) => m.domain === domain);

  return (
    <div className="models-view">
      <Client226Suite workspace={workspace} library={null} />

      <SectionHead
        title="Reconstitution &amp; Draw Calculator"
        action={
          <button
            type="button"
            className="button primary small-button"
            onClick={saveReconstitutionToProtocol}
            disabled={reconMutation.pending}
          >
            {reconMutation.pending ? 'Saving…' : 'Save to protocol & sync supplies'}
          </button>
        }
      >
        Convert vial mass and diluent volume into U-100 syringe units and track remaining supplies.
      </SectionHead>
      <Notice kind="success">{reconStatus}</Notice>
      <Notice>{reconMutation.error}</Notice>

      <div className="studio-panel" style={{ marginBottom: '32px' }}>
        <div className="form-grid four">
          <Input label="Compound" value={compoundName} onChange={(e) => setCompoundName(e.target.value)} />
          <Input label="Vial mass (mg)" type="number" step="any" min="0" value={vialMassMg} onChange={(e) => setVialMassMg(e.target.value)} />
          <Input label="Diluent volume (mL)" type="number" step="any" min="0.01" value={diluentMl} onChange={(e) => setDiluentMl(e.target.value)} />
          <Input label="Target dose (mcg)" type="number" step="any" min="0" value={targetDoseMcg} onChange={(e) => setTargetDoseMcg(e.target.value)} />
        </div>

        <div className="form-grid four" style={{ marginTop: '8px' }}>
          <Input
            label="Active fraction"
            type="number"
            step="0.01"
            min="0.01"
            max="1"
            value={activeFraction}
            onChange={(e) => setActiveFraction(e.target.value)}
            hint="1.00 pure, 0.96 salt"
          />
          <Input label="Syringes in box" type="number" min="1" value={pinsInBox} onChange={(e) => setPinsInBox(e.target.value)} />
          <Input label="Doses drawn" type="number" min="0" value={dosesTaken} onChange={(e) => setDosesTaken(e.target.value)} />
          <Input
            label="BAC water bottle (mL)"
            type="number"
            step="any"
            min="1"
            value={bacWaterBottleMl}
            onChange={(e) => setBacWaterBottleMl(e.target.value)}
            hint={`${vialsReconstitutedCount} vials mixed (${Number(diluentMl) * Number(vialsReconstitutedCount)} mL used)`}
          />
        </div>

        <div className="dose-telemetry-grid" style={{ marginTop: '16px' }}>
          <article className="telemetry-cell">
            <span>Concentration</span>
            <strong className="tabular-nums">{recon.concMgMl.toFixed(2)} mg/mL ({recon.concMcgMl.toFixed(0)} mcg/mL)</strong>
          </article>
          <article className="telemetry-cell">
            <span>Draw volume</span>
            <strong className="tabular-nums">{recon.u100Units.toFixed(1)} U-100 units ({recon.drawMl.toFixed(3)} mL)</strong>
          </article>
          <article className="telemetry-cell">
            <span>Remaining draws</span>
            <strong className="tabular-nums">{recon.pinsLeft} pins · {recon.dosesLeftInVial}/{recon.dosesPerVial} vial</strong>
          </article>
          <article className="telemetry-cell">
            <span>BAC water left</span>
            <strong className="tabular-nums">{recon.bacWaterLeftMl} mL</strong>
          </article>
        </div>

        {recon.shoppingItems.length > 0 && (
          <div className="record-list" style={{ marginTop: '16px' }}>
            {recon.shoppingItems.map((item) => (
              <div className="record-row" key={item.id}>
                <div>
                  <h3>{item.item}</h3>
                  <p>{item.reason}</p>
                </div>
                <strong className="tabular-nums">${item.estimatedCostUsd}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      <SectionHead
        title="Ester Pinning Schedule"
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
              {pinMutation.pending ? 'Syncing…' : 'Add to calendar'}
            </button>
          </div>
        }
      >
        Calculate per-injection draw volume, peak-to-trough ratio, and calendar occurrences from ester half-life.
      </SectionHead>
      <Notice kind="success">{pinStatus}</Notice>
      <Notice>{pinMutation.error}</Notice>

      <div className="studio-panel" style={{ marginBottom: '32px' }}>
        <div className="form-grid four">
          <Input label="Compound" value={esterCompound} onChange={(e) => setEsterCompound(e.target.value)} />
          <Select label="Ester" value={esterKey} onChange={(e) => setEsterKey(e.target.value)}>
            {Object.entries(ESTER_KINETICS).map(([k, spec]) => (
              <option key={k} value={k}>
                {spec.label} (t½ {spec.halfLifeH}h · {Math.round(spec.esterWeightFraction * 100)}% base)
              </option>
            ))}
          </Select>
          <Input label="Weekly dose (mg)" type="number" step="any" min="1" value={weeklyDoseMg} onChange={(e) => setWeeklyDoseMg(e.target.value)} />
          <Select label="Cadence" value={cadenceMode} onChange={(e) => setCadenceMode(e.target.value)}>
            <option value="optimal">Optimal ({ESTER_KINETICS[esterKey]?.recommendedIntervalH || 84}h)</option>
            <option value="daily">Daily (24h)</option>
            <option value="eod">Every other day (48h)</option>
            <option value="e3_5d">Twice weekly (84h)</option>
            <option value="weekly">Weekly (168h)</option>
          </Select>
        </div>

        <div className="dose-telemetry-grid" style={{ marginTop: '16px' }}>
          <div className="telemetry-cell">
            <span>Per-pin dose</span>
            <strong className="tabular-nums">{pinSchedule.dosePerPinMg} mg · {pinSchedule.drawMl} mL ({pinSchedule.u100Units} U)</strong>
          </div>
          <div className="telemetry-cell">
            <span>Peak-to-trough ratio</span>
            <strong className="tabular-nums">{pinSchedule.peakToTroughRatio}x ({pinSchedule.fluctuationPct}% swing)</strong>
          </div>
          <div className="telemetry-cell">
            <span>Active base delivered</span>
            <strong className="tabular-nums">{pinSchedule.activeBaseWeeklyMg} mg/wk</strong>
          </div>
        </div>

        <div className="record-list" style={{ marginTop: '16px' }}>
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

      <SectionHead title="Theoretical Systems Models">
        Mechanistic ODE and conversion-sink simulations kept separate from empirical pharmacokinetic curves.
      </SectionHead>
      <Notice>{error}</Notice>
      {!data && !error && <Loading>Loading theoretical models…</Loading>}
      {data && (
        <>
          <Tabs
            label="Theoretical model domain"
            value={domain}
            onChange={setDomain}
            entries={[
              ['all', `All (${models.length})`],
              ['height_bone', 'Client 226 Height'],
              ['cognition_recovery', 'Client 226 Cognition'],
              ['anxiety_sociability', 'Autonomic & Social'],
            ]}
          />
          <div className="record-list" style={{ marginTop: '16px' }}>
            {filtered.map((model) => (
              <article className="record-row" key={model.model_id || model.id} style={{ display: 'block', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16px', flexWrap: 'wrap' }}>
                  <h3>{String(model.title || model.module || '').replace(/\s*\(cc224\)/gi, '')}</h3>
                  <Status value="configured">{model.evidence_class || 'stipulated_theoretical'}</Status>
                </div>
                <p style={{ marginTop: '8px' }}>{String(model.summary || model.caveat || '').replace(/\s*\(cc224\)/gi, '')}</p>
                {model.outputs && typeof model.outputs === 'object' && (
                  <ul className="compact-list" style={{ marginTop: '8px', paddingLeft: '16px' }}>
                    {Object.entries(model.outputs).map(([k, v]) => (
                      <li key={k} className="small tabular-nums">
                        <strong>{k}:</strong> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
