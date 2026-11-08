import { useMemo, useState } from 'react';
import {
  CLIENT_226_CONSULTATION_BRANCHES,
  CLIENT_226_ETERNAL_TESTS,
  CLIENT_226_FRONTIER_RECORDS,
  CLIENT_226_HYPOTHESIS_NODES,
  CLIENT_226_REACTOR_RESULTS,
  CLIENT_226_SHARED_LEDGER,
  CLIENT_226_SIDE_EFFECT_MATRIX,
  CLIENT_226_TIMING_RESULTS,
  computeGhSecretagogueSynergy,
  computeIntranasalInsulinCurve,
  computeProcollagenBifurcation,
  computeTerazosinBiphasic,
  evaluateReactorAtHour,
} from '../client226Data.js';
import { Input, Notice, SectionHead, Select, Status, Tabs } from './ui.jsx';

export {
  computeGhSecretagogueSynergy,
  computeIntranasalInsulinCurve,
  computeProcollagenBifurcation,
  computeTerazosinBiphasic,
  evaluateReactorAtHour,
};

function cleanModeTitle(raw = '') {
  return String(raw)
    .replace(/^Branch\s+[A-Z0-9]+\s*·\s*/i, '')
    .replace(/\s*\(cc224\)/gi, '')
    .replace(/\s*\(Mandatory ERDA[^)]*\)/gi, '')
    .replace(/\s*\(Guanfacine[^)]*\)/gi, '')
    .trim();
}

function cleanLineItem(raw = '') {
  const cleaned = String(raw)
    .replace(/^NO TYRA-300 AVAILABLE:\s*/i, 'Erdafitinib Required: ')
    .replace(/^HOLD\s+/i, 'Hold ')
    .replace(/^HARD STOP\s+/i, 'Stop ')
    .replace(/\s*->\s*/g, ' to ')
    .replace(/\s*>=\s*/g, ' ≥ ')
    .replace(/\s*<=\s*/g, ' ≤ ')
    .replace(/\bw\/\s*/g, 'with ')
    .replace(/\s*\+\s*/g, ', ');

  const colonIdx = cleaned.indexOf(':');
  if (colonIdx > 0 && colonIdx < 48) {
    return {
      label: cleaned.slice(0, colonIdx).trim(),
      value: cleaned.slice(colonIdx + 1).trim(),
    };
  }
  const dashIdx = cleaned.indexOf(' — ');
  if (dashIdx > 0 && dashIdx < 48) {
    return {
      label: cleaned.slice(0, dashIdx).trim(),
      value: cleaned.slice(dashIdx + 3).trim(),
    };
  }
  return {
    label: cleaned,
    value: '',
  };
}

export default function Client226Suite({ workspace, onApplyBranch, onAddCompoundToProtocol }) {
  const [activeTab, setActiveTab] = useState('calculators');

  const [weightKg, setWeightKg] = useState('74');
  const [terazosinDoseMg, setTerazosinDoseMg] = useState('0.60');
  const [insulinDoseIu, setInsulinDoseIu] = useState('25');
  const [serumPo4, setSerumPo4] = useState('4.1');
  const [serumE2, setSerumE2] = useState('16.5');
  const [freeT4, setFreeT4] = useState('1.28');
  const [fgfrArm, setFgfrArm] = useState('arm_b');
  const [synthMult, setSynthMult] = useState('1.95');
  const [chaperonesOn] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState(
    workspace?.id === 'ws-226-height' ? 'branch-226-height-erda-minimal' : 'branch-226-cog-onhand'
  );
  const [branchNotice, setBranchNotice] = useState('');

  const [totalGhIu, setTotalGhIu] = useState('12');
  const [ghSplitMode, setGhSplitMode] = useState('70_30');
  const [cjcDoseMcg, setCjcDoseMcg] = useState('150');
  const [ipaDoseMcg, setIpaDoseMcg] = useState('150');
  const [ghScheduleMode, setGhScheduleMode] = useState('afternoon_1600');
  const [gammaSocs2, setGammaSocs2] = useState('0.65');
  const [betaCartilage, setBetaCartilage] = useState('0.45');
  const [equalTotalPeptide, setEqualTotalPeptide] = useState(true);

  const [slotDomain, setSlotDomain] = useState('all');
  const [slotQuery, setSlotQuery] = useState('');
  const [selectedStressKey, setSelectedStressKey] = useState('baseline');
  const [reactorHour, setReactorHour] = useState('150');
  const [seDomain, setSeDomain] = useState('all');

  const wKg = Math.max(35, Math.min(140, Number(weightKg) || 74));
  const dabogratinibMgDay = Number((wKg * 0.25).toFixed(2));
  const vosoritideMcgDay = Number((wKg * 15).toFixed(0));
  const vosoritideMgDay = Number((vosoritideMcgDay / 1000).toFixed(3));

  const tzCurve = computeTerazosinBiphasic(terazosinDoseMg);
  const iniCurve = computeIntranasalInsulinCurve(insulinDoseIu);
  const procollagen = computeProcollagenBifurcation({
    synthesisMultiplier: synthMult,
    tudcaActive: chaperonesOn,
    pba4Active: chaperonesOn,
    ambroxolActive: chaperonesOn,
    dnl343Active: true,
    s107Active: true,
  });
  const reactorState = evaluateReactorAtHour(reactorHour);
  const ghSynergy = computeGhSecretagogueSynergy({
    totalGhIu,
    splitMode: ghSplitMode,
    cjcDoseMcg,
    ipaDoseMcg,
    scheduleMode: ghScheduleMode,
    gammaSocs2,
    betaCartilage,
    equalTotalPeptide,
  });

  const po4Val = Number(serumPo4) || 4.1;
  const e2Val = Number(serumE2) || 16.5;
  const ft4Val = Number(freeT4) || 1.28;

  const filteredSlots = useMemo(() => {
    const q = slotQuery.trim().toLowerCase();
    return CLIENT_226_FRONTIER_RECORDS.filter((s) => {
      if (slotDomain !== 'all' && s.domain !== slotDomain) return false;
      if (!q) return true;
      const blob = `${s.id} ${s.name} ${s.function} ${s.mechanism} ${JSON.stringify(
        s.extracted_compounds || []
      )}`.toLowerCase();
      return blob.includes(q);
    });
  }, [slotDomain, slotQuery]);

  const filteredSideEffects = useMemo(() => {
    return CLIENT_226_SIDE_EFFECT_MATRIX.filter(
      (se) => seDomain === 'all' || se.domain === seDomain || se.domain === 'shared'
    );
  }, [seDomain]);

  const activeBranch =
    CLIENT_226_CONSULTATION_BRANCHES.find((b) => b.id === selectedBranchId) ||
    CLIENT_226_CONSULTATION_BRANCHES[0];

  const stressCases = CLIENT_226_REACTOR_RESULTS.stress || {};
  const activeStress = stressCases[selectedStressKey] || stressCases.baseline || {};

  function handleActivateBranch(branch) {
    setSelectedBranchId(branch.id);
    setBranchNotice(`Switched to ${cleanModeTitle(branch.name)}.`);
    if (onApplyBranch) {
      onApplyBranch(branch);
    }
  }

  return (
    <section className="studio-section client226-suite" aria-label="Client 226 Tools & Calculators">
      <SectionHead
        title="Calculators, Alternatives & Fixes"
        action={<span className="status status-configured">53 Slots · 24 Rules</span>}
      />

      <Tabs
        label="Client 226 Tools"
        value={activeTab}
        onChange={setActiveTab}
        entries={[
          ['calculators', 'Dose & GH Calculators'],
          ['slots', `Alternatives (${CLIENT_226_FRONTIER_RECORDS.length} Slots)`],
          ['side_effects', `Side Effects & Fixes (${CLIENT_226_SIDE_EFFECT_MATRIX.length})`],
          ['reactor', '14-Day Clock'],
          ['eternal', 'Rules & Tests'],
        ]}
      />

      {activeTab === 'calculators' && (
        <div className="studio-panel">
          <div className="inline-between" style={{ flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
            <h3>Active Protocol Mode</h3>
            <Select
              label="Select Mode"
              value={selectedBranchId}
              onChange={(e) => {
                const found = CLIENT_226_CONSULTATION_BRANCHES.find((b) => b.id === e.target.value);
                if (found) handleActivateBranch(found);
              }}
            >
              {CLIENT_226_CONSULTATION_BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>
                  {cleanModeTitle(b.name)}
                </option>
              ))}
            </Select>
          </div>

          <Notice kind="success">{branchNotice}</Notice>

          <article className="branch-summary-card">
            <div className="inline-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
              <h3>{cleanModeTitle(activeBranch.name)}</h3>
              <Status value="configured">{activeBranch.domain === 'height' ? 'Client 226 Height' : 'Client 226 Cognition'}</Status>
            </div>
            <div className="mode-kv-grid">
              <div>
                <h4>Active Doses</h4>
                <ul className="mode-kv-list">
                  {activeBranch.activeOverrides.featuredDoses.map((d) => {
                    const row = cleanLineItem(d);
                    return (
                      <li key={d} className="mode-kv-row">
                        <span className="mode-kv-label">{row.label}</span>
                        {row.value && <span className="mode-kv-val">{row.value}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div>
                <h4>Hold Rules</h4>
                <ul className="mode-kv-list">
                  {activeBranch.activeOverrides.holdList.map((h) => {
                    const row = cleanLineItem(h);
                    return (
                      <li key={h} className="mode-kv-row">
                        <span className="mode-kv-label">{row.label}</span>
                        {row.value && <span className="mode-kv-val">{row.value}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </article>

          <h3 style={{ marginTop: '24px', marginBottom: '12px' }}>Dose &amp; Gate Calculator</h3>
          <div className="form-grid four">
            <Input
              label="Body Mass (kg)"
              type="number"
              step="0.5"
              min="40"
              max="130"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
            <Select
              label="FGFR Inhibitor"
              value={fgfrArm}
              onChange={(e) => setFgfrArm(e.target.value)}
            >
              <option value="arm_b">Erdafitinib (Mandatory Active)</option>
              <option value="arm_a">Dabogratinib (Reference Only)</option>
            </Select>
            <Input
              label="Terazosin Bedtime (mg)"
              type="number"
              step="0.05"
              min="0.05"
              max="3.0"
              value={terazosinDoseMg}
              onChange={(e) => setTerazosinDoseMg(e.target.value)}
            />
            <Input
              label="Intranasal Insulin (IU)"
              type="number"
              step="1"
              min="5"
              max="60"
              value={insulinDoseIu}
              onChange={(e) => setInsulinDoseIu(e.target.value)}
            />
          </div>

          <div className="form-grid four">
            <Input
              label="Serum PO4 (mg/dL)"
              type="number"
              step="0.1"
              value={serumPo4}
              onChange={(e) => setSerumPo4(e.target.value)}
            />
            <Input
              label="Ultrasensitive E2 (pg/mL)"
              type="number"
              step="0.5"
              value={serumE2}
              onChange={(e) => setSerumE2(e.target.value)}
            />
            <Input
              label="Free T4 (ng/dL)"
              type="number"
              step="0.05"
              value={freeT4}
              onChange={(e) => setFreeT4(e.target.value)}
            />
            <Input
              label="Collagen Drive (×)"
              type="number"
              step="0.05"
              min="1.0"
              max="2.6"
              value={synthMult}
              onChange={(e) => setSynthMult(e.target.value)}
            />
          </div>

          <div className="dose-telemetry-grid">
            <article className="telemetry-cell">
              <span>{fgfrArm === 'arm_a' ? 'Dabogratinib' : 'Erdafitinib (ERDA)'}</span>
              <strong className="tabular-nums">{dabogratinibMgDay} mg/day</strong>
            </article>
            <article className="telemetry-cell">
              <span>Vosoritide</span>
              <strong className="tabular-nums">{vosoritideMgDay} mg SubQ</strong>
            </article>
            <article className="telemetry-cell">
              <span>Terazosin PGK1 ({tzCurve.doseMg} mg)</span>
              <strong className="tabular-nums">
                {tzCurve.atpGainPct >= 0 ? `+${tzCurve.atpGainPct}%` : `${tzCurve.atpGainPct}%`} ATP
              </strong>
            </article>
            <article className="telemetry-cell">
              <span>Intranasal Insulin ({iniCurve.doseIu} IU)</span>
              <strong className="tabular-nums">{iniCurve.efficacyPct}% Flux</strong>
            </article>
          </div>

          <div className="dose-telemetry-grid">
            <article className="telemetry-cell">
              <span>Procollagen Capacity</span>
              <strong className="tabular-nums">
                {procollagen.pCrit}× vs {procollagen.effectiveDemand}×
              </strong>
            </article>
            <article className="telemetry-cell">
              <span>PO4 Gate ({po4Val} mg/dL)</span>
              <strong className="tabular-nums">
                {po4Val < 4.5 ? 'Pass (< 4.5)' : 'Hold Calcitriol'}
              </strong>
            </article>
            <article className="telemetry-cell">
              <span>E2 Corridor ({e2Val} pg/mL)</span>
              <strong className="tabular-nums">
                {e2Val >= 10 && e2Val <= 22 ? 'Optimal (12–20)' : e2Val < 10 ? 'Low (< 10)' : 'High (> 22)'}
              </strong>
            </article>
            <article className="telemetry-cell">
              <span>Free T4 ({ft4Val} ng/dL)</span>
              <strong className="tabular-nums">
                {ft4Val >= 1.1 ? 'Pass (≥ 1.15)' : 'Add L-T4'}
              </strong>
            </article>
          </div>

          <div className="gh-calibrator-block">
            <div className="inline-between" style={{ flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
              <h3>GH (70% Night / 30% Morning) + CJC-1295 no DAC + Ipamorelin</h3>
              <Status value="configured">
                {ghSynergy.cartilageSynergyPct >= 0
                  ? `+${ghSynergy.cartilageSynergyPct}%`
                  : `${ghSynergy.cartilageSynergyPct}%`}{' '}
                IGF-1
              </Status>
            </div>

            <div className="form-grid four">
              <Input
                label="Total rhGH (IU/day)"
                type="number"
                step="1"
                min="4"
                max="20"
                value={totalGhIu}
                onChange={(e) => setTotalGhIu(e.target.value)}
              />
              <Select
                label="rhGH Split"
                value={ghSplitMode}
                onChange={(e) => setGhSplitMode(e.target.value)}
              >
                <option value="70_30">70% Night (22:15) / 30% AM (07:00)</option>
                <option value="100_0">100% Night (22:15)</option>
              </Select>
              <Input
                label="CJC-1295 no DAC (mcg)"
                type="number"
                step="25"
                min="50"
                max="300"
                value={cjcDoseMcg}
                onChange={(e) => setCjcDoseMcg(e.target.value)}
              />
              <Input
                label="Ipamorelin (mcg)"
                type="number"
                step="25"
                min="50"
                max="300"
                value={ipaDoseMcg}
                onChange={(e) => setIpaDoseMcg(e.target.value)}
              />
            </div>

            <div className="form-grid four">
              <Select
                label="Secretagogue Timing"
                value={ghScheduleMode}
                onChange={(e) => setGhScheduleMode(e.target.value)}
              >
                <option value="afternoon_1600">16:00 Afternoon Bridge</option>
                <option value="prebed_2145">21:45 Pre-Bed Primer</option>
                <option value="dual_1600_2145">16:00 + 21:45 Dual</option>
                <option value="ramp_morning_0730">07:30 Morning Trough</option>
                <option value="rhgh_only">rhGH Only</option>
              </Select>
              <Input
                label="SOCS2 Adaptation (γ)"
                type="number"
                step="0.05"
                min="0.10"
                max="1.50"
                value={gammaSocs2}
                onChange={(e) => setGammaSocs2(e.target.value)}
              />
              <Input
                label="Cartilage Gain (β)"
                type="number"
                step="0.05"
                min="0.00"
                max="1.20"
                value={betaCartilage}
                onChange={(e) => setBetaCartilage(e.target.value)}
              />
              <Select
                label="Dual Dose Mode"
                value={equalTotalPeptide ? 'iso_dose' : 'full_double'}
                onChange={(e) => setEqualTotalPeptide(e.target.value === 'iso_dose')}
              >
                <option value="iso_dose">Iso-Dose (50% + 50%)</option>
                <option value="full_double">Full Double (100% + 100%)</option>
              </Select>
            </div>

            <div className="dose-telemetry-grid">
              <div className="telemetry-cell">
                <span>Night / Morning rhGH</span>
                <strong className="tabular-nums">
                  {(Number(totalGhIu || 12) * 0.7).toFixed(1)} IU / {(Number(totalGhIu || 12) * 0.3).toFixed(1)} IU
                </strong>
              </div>
              <div className="telemetry-cell">
                <span>Cartilage IGF-1</span>
                <strong className="tabular-nums">
                  {ghSynergy.current.intLocalIgf1} ({ghSynergy.cartilageSynergyPct >= 0 ? `+${ghSynergy.cartilageSynergyPct}%` : `${ghSynergy.cartilageSynergyPct}%`})
                </strong>
              </div>
              <div className="telemetry-cell">
                <span>20 kDa Isoform Pool</span>
                <strong className="tabular-nums">{ghSynergy.current.int20kDa}</strong>
              </div>
              <div className="telemetry-cell">
                <span>Optimal Window</span>
                <strong>
                  {ghSynergy.optimalSplitSchedule === 'afternoon_1600'
                    ? '16:00 Bridge'
                    : ghSynergy.optimalSplitSchedule === 'dual_1600_2145'
                      ? '16:00 + 21:45 Dual'
                      : '21:45 Primer'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'slots' && (
        <div className="studio-panel">
          <div className="form-grid two" style={{ marginBottom: '16px' }}>
            <Select
              label="Domain"
              value={slotDomain}
              onChange={(e) => setSlotDomain(e.target.value)}
            >
              <option value="all">All Slots (Cognition + Height)</option>
              <option value="cognition">Client 226 Cognition</option>
              <option value="height">Client 226 Height</option>
            </Select>
            <Input
              label="Search Compound or Target"
              placeholder="Search TAK-653, Erdafitinib, KW-6356…"
              value={slotQuery}
              onChange={(e) => setSlotQuery(e.target.value)}
            />
          </div>

          <div className="record-list">
            {filteredSlots.map((slot) => (
              <article className="slot-card" key={slot.id}>
                <div className="inline-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span className="slot-tag">
                      {slot.id.toUpperCase()} · {slot.domain === 'height' ? 'HEIGHT' : 'COGNITION'}
                    </span>
                    <h3>{slot.name}</h3>
                  </div>
                  <Status value="configured">{(slot.extracted_compounds || []).length} Options</Status>
                </div>

                {Array.isArray(slot.extracted_compounds) && slot.extracted_compounds.length > 0 && (
                  <div className="dose-telemetry-grid" style={{ marginTop: '12px' }}>
                    {slot.extracted_compounds.map((ec, idx) => (
                      <div className="telemetry-cell" key={`${slot.id}-${ec.name}-${idx}`}>
                        <span>{ec.role === 'alternative' ? 'Alternative' : 'Primary'}</span>
                        <strong className="tabular-nums">
                          {ec.name} · {ec.dose}
                        </strong>
                        {onAddCompoundToProtocol && (
                          <div style={{ marginTop: '8px' }}>
                            <button
                              type="button"
                              className="button secondary small-button"
                              onClick={() => onAddCompoundToProtocol(ec, slot)}
                            >
                              Add {ec.name}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'side_effects' && (
        <div className="studio-panel">
          <div className="inline-between" style={{ flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
            <h3>Side Effects, Thresholds &amp; Fixes</h3>
            <Select
              label="Filter Domain"
              value={seDomain}
              onChange={(e) => setSeDomain(e.target.value)}
            >
              <option value="all">All ({CLIENT_226_SIDE_EFFECT_MATRIX.length})</option>
              <option value="height">Client 226 Height</option>
              <option value="cognition">Client 226 Cognition</option>
              <option value="shared">Shared</option>
            </Select>
          </div>

          <div className="record-list">
            {filteredSideEffects.map((item) => (
              <article className="slot-card" key={item.id}>
                <div className="inline-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
                  <h3>{item.trigger}</h3>
                  <Status value={item.severity === 'critical' ? 'due' : 'upcoming'}>
                    {item.severity}
                  </Status>
                </div>
                <div className="se-grid">
                  <div>
                    <span className="slot-tag">Cause</span>
                    <p>{item.culprit}</p>
                  </div>
                  <div>
                    <span className="slot-tag">Threshold</span>
                    <p>{item.whenToSwitch}</p>
                  </div>
                  <div>
                    <span className="slot-tag">Fix</span>
                    <p>{item.fix}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <h3 style={{ marginTop: '24px', marginBottom: '12px' }}>Shared Height × Cognition Ceiling</h3>
          <div className="dose-telemetry-grid">
            {CLIENT_226_SHARED_LEDGER.map((row) => (
              <div className="telemetry-cell" key={row.compound}>
                <span>{row.compound}</span>
                <strong className="tabular-nums">{row.unifiedCombinedDose}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reactor' && (
        <div className="studio-panel">
          <div className="inline-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
            <h3>14-Day (336-Hour) Stage Clock</h3>
            <div style={{ minWidth: '260px' }}>
              <label className="field" style={{ marginBottom: 0 }}>
                <span>
                  Hour {reactorState.hour} · Day {reactorState.day} of 14
                </span>
                <input
                  type="range"
                  min="0"
                  max="336"
                  step="6"
                  value={reactorHour}
                  onChange={(e) => setReactorHour(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="segmented-button-row" style={{ margin: '12px 0' }}>
            {[
              ['24', 'Day 2 · Stage 1'],
              ['150', 'Day 7 · Stop NAC'],
              ['168', 'Day 8 · Stage 2A'],
              ['192', 'Day 9 · Stage 2B'],
              ['288', 'Day 13 · Mineralize'],
            ].map(([hVal, label]) => (
              <button
                key={hVal}
                type="button"
                className={`button small-button ${String(reactorHour) === hVal ? 'primary' : 'secondary'}`}
                onClick={() => setReactorHour(hVal)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="dose-telemetry-grid">
            <article className="telemetry-cell">
              <span>Active Stage</span>
              <strong>{reactorState.stage}</strong>
            </article>
            <article className="telemetry-cell">
              <span>Thiol Pool</span>
              <strong className="tabular-nums">{(reactorState.thiolLevel * 100).toFixed(1)}%</strong>
            </article>
            <article className="telemetry-cell">
              <span>CaPPS Level</span>
              <strong className="tabular-nums">{(reactorState.cappsLevel * 100).toFixed(1)}%</strong>
            </article>
            <article className="telemetry-cell">
              <span>Stage 2B Remodeling</span>
              <strong className="tabular-nums">{(reactorState.tppuLevel * 100).toFixed(1)}%</strong>
            </article>
          </div>

          <h4 style={{ marginTop: '24px', marginBottom: '12px' }}>Half-Life Peak / Trough Reference</h4>
          <div className="dose-telemetry-grid">
            {(CLIENT_226_TIMING_RESULTS.periodic_table || []).slice(0, 8).map((row, idx) => (
              <div className="telemetry-cell" key={idx}>
                <span>
                  t½ {row.half_life_h}h · Every {row.interval_h}h
                </span>
                <strong className="tabular-nums">{row.peak_trough_ratio}×</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'eternal' && (
        <div className="studio-panel">
          <div className="inline-between" style={{ flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
            <h3>Schedule Stress Test</h3>
            <Select
              label="Scenario"
              value={selectedStressKey}
              onChange={(e) => setSelectedStressKey(e.target.value)}
            >
              <option value="baseline">Compliant Plan (0 Violations)</option>
              <option value="li_in_stage1">Lithium in Stage 1 (-13.5%)</option>
              <option value="thiol_in_2b">NAC Run into Stage 2B (-8.1%)</option>
              <option value="capps_in_2b">CaPPS Run into Stage 2B (-4.1%)</option>
              <option value="phytate_with_minerals">Phytate w/ Minerals (-3.6%)</option>
              <option value="daytime_b2">Daytime Salbutamol (-3.9%)</option>
              <option value="terazosin_2mg">Terazosin 2.0 mg (-7.2%)</option>
              <option value="all_stage_violations">Unstaged Stack (-41.5%)</option>
            </Select>
          </div>

          <div className="dose-telemetry-grid" style={{ marginBottom: '20px' }}>
            <div className="telemetry-cell">
              <span>14-Day Velocity</span>
              <strong className="tabular-nums">
                {activeStress.mm_14d} mm ({activeStress.cm_year} cm/yr)
              </strong>
            </div>
            <div className="telemetry-cell">
              <span>Sulfation / Mineral</span>
              <strong className="tabular-nums">
                {(Number(activeStress.sulfation || 0) * 100).toFixed(0)}% /{' '}
                {(Number(activeStress.mineralization || 0) * 100).toFixed(0)}%
              </strong>
            </div>
            <div className="telemetry-cell">
              <span>Status</span>
              <strong>{selectedStressKey === 'baseline' ? '24 / 24 PASS' : 'Violation'}</strong>
            </div>
          </div>

          <div className="profile-columns">
            <div>
              <h4>Height Rules (R01–R14)</h4>
              <div className="record-list">
                {CLIENT_226_ETERNAL_TESTS.heightValidator.map((r) => (
                  <article className="record-row" key={r.id}>
                    <div>
                      <h3>
                        {r.id}: {r.rule}
                      </h3>
                      <p>{r.detail}</p>
                    </div>
                    <Status value="configured">{r.status}</Status>
                  </article>
                ))}
              </div>
            </div>
            <div>
              <h4>Cognition Rules (C01–C10)</h4>
              <div className="record-list">
                {CLIENT_226_ETERNAL_TESTS.cognitionValidator.map((r) => (
                  <article className="record-row" key={r.id}>
                    <div>
                      <h3>
                        {r.id}: {r.rule}
                      </h3>
                      <p>{r.detail}</p>
                    </div>
                    <Status value="configured">{r.status}</Status>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <h4 style={{ marginTop: '24px', marginBottom: '12px' }}>22 Mechanistic Nodes</h4>
          <div className="dose-telemetry-grid">
            {CLIENT_226_HYPOTHESIS_NODES.map((node) => {
              const loo = (CLIENT_226_REACTOR_RESULTS.loo || []).find((l) => l.id === node.id);
              return (
                <div className="telemetry-cell" key={node.id}>
                  <span>
                    {node.id} · {node.name}
                  </span>
                  <strong className="tabular-nums">
                    {loo ? `-${loo.loss_pct}% if omitted` : node.window}
                  </strong>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
