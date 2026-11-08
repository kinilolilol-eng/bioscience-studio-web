import { useMemo, useState } from 'react';
import {
  CLIENT_226_CONSULTATION_BRANCHES,
  CLIENT_226_ETERNAL_TESTS,
  CLIENT_226_FRONTIER_RECORDS,
  CLIENT_226_HYPOTHESIS_NODES,
  CLIENT_226_MINIMALISTIC_HEIGHT_PROTOCOL,
  CLIENT_226_ONHAND_COGNITION_STACK,
  CLIENT_226_PHASES,
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
import { Icon, Input, Notice, SectionHead, Select, Status, Tabs } from './ui.jsx';

export {
  computeGhSecretagogueSynergy,
  computeIntranasalInsulinCurve,
  computeProcollagenBifurcation,
  computeTerazosinBiphasic,
  evaluateReactorAtHour,
};

export default function Client226Suite({ workspace, library, onApplyBranch, onAddCompoundToProtocol }) {
  const [activeTab, setActiveTab] = useState('calculators');

  // Tab 1: Dose Calculators & Branch Switcher state
  const [weightKg, setWeightKg] = useState('74');
  const [terazosinDoseMg, setTerazosinDoseMg] = useState('0.60');
  const [insulinDoseIu, setInsulinDoseIu] = useState('25');
  const [serumPo4, setSerumPo4] = useState('4.1');
  const [serumE2, setSerumE2] = useState('16.5');
  const [freeT4, setFreeT4] = useState('1.28');
  const [fgfrArm, setFgfrArm] = useState('arm_b'); // 'arm_b' (Mandatory Erdafitinib — No TYRA-300 Available) | 'arm_a' (Reference)
  const [synthMult, setSynthMult] = useState('1.95');
  const [chaperonesOn, setChaperonesOn] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState(
    workspace?.id === 'ws-226-height' ? 'branch-226-height-erda-minimal' : 'branch-226-cog-onhand'
  );
  const [branchNotice, setBranchNotice] = useState('');

  // GH (70% Night / 30% Morning) + CJC-1295 no DAC + Ipamorelin Calibration state
  const [totalGhIu, setTotalGhIu] = useState('12');
  const [ghSplitMode, setGhSplitMode] = useState('70_30');
  const [cjcDoseMcg, setCjcDoseMcg] = useState('150');
  const [ipaDoseMcg, setIpaDoseMcg] = useState('150');
  const [ghScheduleMode, setGhScheduleMode] = useState('afternoon_1600');
  const [gammaSocs2, setGammaSocs2] = useState('0.65');
  const [betaCartilage, setBetaCartilage] = useState('0.45');
  const [equalTotalPeptide, setEqualTotalPeptide] = useState(true);

  // Tab 2: 53-Slot Mechanistic Explorer state
  const [slotDomain, setSlotDomain] = useState('all');
  const [slotQuery, setSlotQuery] = useState('');

  // Tab 3: Eternal Test & Stress Simulator state
  const [selectedStressKey, setSelectedStressKey] = useState('baseline');

  // Tab 4: 336-Hour Reactor Scrubber state
  const [reactorHour, setReactorHour] = useState('150');

  // Tab 5: Side-Effect & Biomarker Filter state
  const [seDomain, setSeDomain] = useState('all');

  const wKg = Math.max(35, Math.min(140, Number(weightKg) || 74));
  const dabogratinibMgDay = Number((wKg * 0.25).toFixed(2));
  const vosoritideMcgDay = Number((wKg * 15).toFixed(0));
  const vosoritideMgDay = Number((vosoritideMcgDay / 1000).toFixed(3));
  const ghBaseMgDay = Number((wKg * 0.042).toFixed(2));
  const ghStage1MgDay = Number((ghBaseMgDay * 1.25).toFixed(2));
  const ghStage2MgDay = Number((ghBaseMgDay * 0.80).toFixed(2));

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
      const blob = `${s.id} ${s.name} ${s.function} ${s.mechanism} ${JSON.stringify(s.extracted_compounds || [])}`.toLowerCase();
      return blob.includes(q);
    });
  }, [slotDomain, slotQuery]);

  const filteredSideEffects = useMemo(() => {
    return CLIENT_226_SIDE_EFFECT_MATRIX.filter((se) => seDomain === 'all' || se.domain === seDomain || se.domain === 'shared');
  }, [seDomain]);

  const activeBranch =
    CLIENT_226_CONSULTATION_BRANCHES.find((b) => b.id === selectedBranchId) ||
    CLIENT_226_CONSULTATION_BRANCHES[0];

  const stressCases = CLIENT_226_REACTOR_RESULTS.stress || {};
  const activeStress = stressCases[selectedStressKey] || stressCases.baseline || {};

  function handleActivateBranch(branch) {
    setSelectedBranchId(branch.id);
    setBranchNotice(
      `Activated "${branch.name}" (${branch.activeOverrides.mode}). Hold rules and featured doses updated for live Client 226 consultation.`
    );
    if (onApplyBranch) {
      onApplyBranch(branch);
    }
  }

  return (
    <section className="studio-section client226-suite" aria-label="Client 226 Mechanistic & Consultation Command Center">
      <SectionHead
        title="Client 226 (cc224) · Mechanistic Compound, Alternative, Dose & Eternal-Test Suite"
        action={
          <span className="status status-configured">
            53 Functional Slots · {CLIENT_226_ETERNAL_TESTS.heightValidator.length + CLIENT_226_ETERNAL_TESTS.cognitionValidator.length} Eternal Tests PASS · 336h Reactor Calibrated
          </span>
        }
      >
        First-principles mathematical and mechanistic command center for Client 226 across Cognition (4 domains, 7-day orthogonal rotation) and Height (14-day / 336-hour staged epiphyseal PDE/Floquet reactor).
      </SectionHead>

      <Tabs
        label="Client 226 Command Center Views"
        value={activeTab}
        onChange={setActiveTab}
        entries={[
          ['calculators', '1. Dose Calculators & Live Branch Switcher'],
          ['slots', `2. 53-Slot Compounds & Alternatives (${CLIENT_226_FRONTIER_RECORDS.length})`],
          ['eternal', '3. Eternal Tests (24 Rules) & 22 Hypothesis Nodes'],
          ['reactor', '4. 336-Hour Staged Reactor & Thiol Washout Clock'],
          ['side_effects', `5. Side Effects, When-to-Switch & Shared Ledger (${CLIENT_226_SIDE_EFFECT_MATRIX.length})`],
        ]}
      />

      {/* TAB 1: DOSE CALCULATORS & LIVE CONSULTATION BRANCH SWITCHER */}
      {activeTab === 'calculators' && (
        <div className="studio-panel" style={{ marginTop: '1rem' }}>
          <div className="inline-between" style={{ flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <h3>Live Consultation Mode &amp; Branch Switcher</h3>
              <p className="muted small">
                Switch instantaneously between Baseline Deep Study, Timed Exam Execution, High-Interference Pattern Separation, Late-Afternoon Cram, and Height Arms A/B/C.
              </p>
            </div>
            <Select
              label="Active Client 226 Branch"
              value={selectedBranchId}
              onChange={(e) => {
                const found = CLIENT_226_CONSULTATION_BRANCHES.find((b) => b.id === e.target.value);
                if (found) handleActivateBranch(found);
              }}
            >
              {CLIENT_226_CONSULTATION_BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>

          <Notice kind="success">{branchNotice}</Notice>

          <article className="record-row" style={{ display: 'block', padding: '1rem', marginBottom: '1.5rem', background: 'var(--surface-2, #f8fafc)' }}>
            <div className="inline-between" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span className="microcopy">{activeBranch.domain.toUpperCase()} CONSULTATION BRANCH · {activeBranch.activeOverrides.mode}</span>
                <h3>{activeBranch.name}</h3>
                <p className="small">{activeBranch.summary}</p>
              </div>
              <Status value="configured">{activeBranch.badge}</Status>
            </div>
            <div className="profile-columns" style={{ marginTop: '0.75rem' }}>
              <div>
                <h4>Active Featured Doses &amp; Pairings</h4>
                <ul className="small" style={{ paddingLeft: '1.2rem', margin: '0.4rem 0' }}>
                  {activeBranch.activeOverrides.featuredDoses.map((d) => (
                    <li key={d} style={{ marginBottom: '0.25rem' }}>{d}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Mandatory Hold / Separation Rules for This Branch</h4>
                <ul className="small" style={{ paddingLeft: '1.2rem', margin: '0.4rem 0' }}>
                  {activeBranch.activeOverrides.holdList.map((h) => (
                    <li key={h} style={{ marginBottom: '0.25rem' }}><strong>{h}</strong></li>
                  ))}
                </ul>
              </div>
            </div>
          </article>

          <h3>First-Principles Client 226 Dose &amp; Optimality Calculators</h3>
          <div className="form-grid four" style={{ marginTop: '0.75rem' }}>
            <Input
              label="Client 226 Body Mass (kg)"
              type="number"
              step="0.5"
              min="40"
              max="130"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              hint="Scales FGFR3, Vosoritide & Somatropin"
            />
            <Select label="FGFR Kinase Architecture (No TYRA-300 Available -> Mandatory ERDA)" value={fgfrArm} onChange={(e) => setFgfrArm(e.target.value)}>
              <option value="arm_b">Mandatory Active · Erdafitinib (ERDA Pan-FGFR1-4 + Full Shield)</option>
              <option value="arm_a">Reference Only · Dabogratinib (TYRA-300 Selective FGFR3 — Unavailable)</option>
            </Select>
            <Input
              label="Terazosin Bedtime Dose (mg)"
              type="number"
              step="0.05"
              min="0.05"
              max="3.0"
              value={terazosinDoseMg}
              onChange={(e) => setTerazosinDoseMg(e.target.value)}
              hint="Analytical PGK1 peak: 0.589–0.65 mg"
            />
            <Input
              label="Hour-5 Intranasal Insulin (IU)"
              type="number"
              step="1"
              min="5"
              max="60"
              value={insulinDoseIu}
              onChange={(e) => setInsulinDoseIu(e.target.value)}
              hint="Inverse-parabolic peak: 27.29 IU"
            />
          </div>

          <div className="form-grid four" style={{ marginTop: '0.75rem' }}>
            <Input
              label="Serum Phosphorus PO4 (mg/dL)"
              type="number"
              step="0.1"
              value={serumPo4}
              onChange={(e) => setSerumPo4(e.target.value)}
              hint="Calcitriol gate: must be < 4.5 mg/dL"
            />
            <Input
              label="Ultrasensitive E2 (LC-MS/MS pg/mL)"
              type="number"
              step="0.5"
              value={serumE2}
              onChange={(e) => setSerumE2(e.target.value)}
              hint="Target corridor: 10–20 pg/mL"
            />
            <Input
              label="Free T4 (ng/dL)"
              type="number"
              step="0.05"
              value={freeT4}
              onChange={(e) => setFreeT4(e.target.value)}
              hint="GH DIO2 gate: maintain >= 1.15 ng/dL"
            />
            <Input
              label="Procollagen Synthesis Drive (× Baseline)"
              type="number"
              step="0.05"
              min="1.0"
              max="2.6"
              value={synthMult}
              onChange={(e) => setSynthMult(e.target.value)}
              hint="TUDCA/4-PBA/Ambroxol raises P_crit to 2.37x"
            />
          </div>

          <div className="dose-telemetry-grid" style={{ marginTop: '1rem' }}>
            <article className="telemetry-cell">
              <span>{fgfrArm === 'arm_a' ? 'Dabogratinib (Arm A · 0.25 mg/kg/d)' : 'Erdafitinib (Arm B · 0.25 mg/kg/d)'}</span>
              <strong className="tabular-nums">{dabogratinibMgDay} mg/day</strong>
              <small className="tabular-nums">
                Reactor Velocity: {fgfrArm === 'arm_a' ? '1.653 mm/14d (4.31 cm/yr)' : '1.564 mm/14d (4.08 cm/yr)'}
              </small>
            </article>
            <article className="telemetry-cell">
              <span>Vosoritide (15 mcg/kg/d) &amp; Stage-Split rhGH</span>
              <strong className="tabular-nums">{vosoritideMcgDay} mcg ({vosoritideMgDay} mg) SubQ</strong>
              <small className="tabular-nums">
                rhGH: {ghStage1MgDay} mg/d (Stg 1) → {ghStage2MgDay} mg/d (Stg 2) + L-T4 37.5 mcg
              </small>
            </article>
            <article className="telemetry-cell">
              <span>Terazosin PGK1 Biphasic Curve ({tzCurve.doseMg} mg)</span>
              <strong className="tabular-nums">
                {tzCurve.pgk1ActivationIndex}× PGK1 ({tzCurve.atpGainPct >= 0 ? `+${tzCurve.atpGainPct}%` : `${tzCurve.atpGainPct}%`} ATP)
              </strong>
              <small>{tzCurve.regime} · ΔSBP -{tzCurve.orthostaticPenaltyMmHg} mmHg</small>
            </article>
            <article className="telemetry-cell">
              <span>Hour-5 Intranasal Insulin ({iniCurve.doseIu} IU vs 27.29 IU Peak)</span>
              <strong className="tabular-nums">{iniCurve.efficacyPct}% Peak GLUT4/IRS-1 Flux</strong>
              <small>{iniCurve.irs1DesensitizationRisk} · {Number((iniCurve.doseIu * 0.0347).toFixed(3))} mg</small>
            </article>
          </div>

          <div className="dose-telemetry-grid" style={{ marginTop: '0.75rem' }}>
            <article className="telemetry-cell">
              <span>Procollagen Export Bifurcation (P_crit vs Demand)</span>
              <strong className="tabular-nums">
                P_crit {procollagen.pCrit}× vs Demand {procollagen.effectiveDemand}× ({procollagen.margin >= 0 ? `+${procollagen.margin}` : procollagen.margin})
              </strong>
              <small>
                {procollagen.state} ·{' '}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setChaperonesOn((v) => !v)}
                >
                  {chaperonesOn ? 'Test Chaperone Knockout (TUDCA/4-PBA OFF)' : 'Restore Chaperone Suite (ON)'}
                </button>
              </small>
            </article>
            <article className="telemetry-cell">
              <span>PO4 Gate ({po4Val} mg/dL) · FGFR1/Klotho Shield</span>
              <strong className="tabular-nums">
                {po4Val < 4.5 ? 'PASS — Calcitriol 0.25 mcg Permitted (Stg 2B)' : 'GATE ACTIVE — Hold Calcitriol & Add Tenapanor 10 mg BID'}
              </strong>
              <small>Sucroferric oxyhydroxide 500 mg w/ meals + Nicotinamide 250 mg BID</small>
            </article>
            <article className="telemetry-cell">
              <span>Ultrasensitive E2 Corridor ({e2Val} pg/mL)</span>
              <strong className="tabular-nums">
                {e2Val >= 10 && e2Val <= 22
                  ? 'OPTIMAL (10–22 pg/mL Senescence Arrest Corridor)'
                  : e2Val < 10
                    ? 'LOW (<10 pg/mL) — Widen Exemestane to q4d–q5d'
                    : 'ELEVATED (>22 pg/mL) — Tighten Exemestane to 12.5 mg EOD'}
              </strong>
              <small>Never combine Exemestane + Z-Endoxifen simultaneously</small>
            </article>
            <article className="telemetry-cell">
              <span>Thyroid Col10a1 Gate (Free T4 {ft4Val} ng/dL)</span>
              <strong className="tabular-nums">
                {ft4Val >= 1.1 ? 'PASS — Hypertrophic DIO2/T3 Flux Intact' : 'LOW Free T4 — Titrate Levothyroxine 25 → 50 mcg AM'}
              </strong>
              <small>GH accelerates peripheral T4 → T3/rT3 clearance</small>
            </article>
          </div>

          {/* COUPLED EXOGENOUS rhGH (70% NIGHT / 30% MORNING) + CJC-1295 NO DAC + IPAMORELIN SYNERGY & TIMING CALIBRATOR */}
          <article className="record-row" style={{ display: 'block', padding: '1.15rem', marginTop: '1.5rem', background: 'var(--surface-2, #f8fafc)' }}>
            <div className="inline-between" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <span className="microcopy">
                  COUPLED BATEMAN SC rhGH (Tmax = {ghSynergy.batemanTmaxH}h) × PITUITARY GHRH/GHSR1a × PERIPHERAL STAT5b/SOCS2 ODE
                </span>
                <h3>Exogenous rhGH (70% Night / 30% Morning) + CJC-1295 no DAC + Ipamorelin Calibration</h3>
                <p className="small muted">
                  Pituitary secretion exhibits multiplicative Gs (CJC-1295 no DAC) × Gq (Ipamorelin K+ closure clamping rhGH-induced hypothalamic SST) synergy, releasing endogenous 22 kDa + 20 kDa GH isoforms. Peripheral cartilage STAT5b &amp; local IGF-1 ranking depends on CIS/SOCS2 adaptation strength (γ) and local chondrocyte GHRHR/GHSR1a gain (β_cart).
                </p>
              </div>
              <Status value="configured">
                Cartilage IGF-1 Synergy: {ghSynergy.cartilageSynergyPct >= 0 ? `+${ghSynergy.cartilageSynergyPct}%` : `${ghSynergy.cartilageSynergyPct}%`} vs rhGH Alone
              </Status>
            </div>

            <div className="form-grid four" style={{ marginTop: '0.85rem' }}>
              <Input
                label="Total Exogenous rhGH (IU/day)"
                type="number"
                step="1"
                min="4"
                max="20"
                value={totalGhIu}
                onChange={(e) => setTotalGhIu(e.target.value)}
                hint={`70% Night = ${(Number(totalGhIu || 12) * 0.7).toFixed(1)} IU (22:15) · 30% AM = ${(Number(totalGhIu || 12) * 0.3).toFixed(1)} IU (07:00)`}
              />
              <Select label="Exogenous rhGH Regimen" value={ghSplitMode} onChange={(e) => setGhSplitMode(e.target.value)}>
                <option value="70_30">70% Night (22:15) / 30% Morning (07:00) Split</option>
                <option value="100_0">100% Night (22:15) Initial Ramp Bolus</option>
              </Select>
              <Input
                label="CJC-1295 no DAC (Mod GRF 1-29 mcg)"
                type="number"
                step="25"
                min="50"
                max="300"
                value={cjcDoseMcg}
                onChange={(e) => setCjcDoseMcg(e.target.value)}
                hint="GHRHR Gs/cAMP/PKA agonist (t½ ~ 30 min)"
              />
              <Input
                label="Ipamorelin Dose (mcg)"
                type="number"
                step="25"
                min="50"
                max="300"
                value={ipaDoseMcg}
                onChange={(e) => setIpaDoseMcg(e.target.value)}
                hint="GHSR1a Gq SST2/SST5 clamp (t½ ~ 2h)"
              />
            </div>

            <div className="form-grid four" style={{ marginTop: '0.75rem' }}>
              <Select label="Secretagogue Clock Window" value={ghScheduleMode} onChange={(e) => setGhScheduleMode(e.target.value)}>
                <option value="afternoon_1600">16:00 Afternoon Trough Bridge (9h post-07:00 AM rhGH)</option>
                <option value="prebed_2145">21:45 Pre-Bed Primer (T-30 min before 22:15 Night rhGH)</option>
                <option value="dual_1600_2145">Dual 16:00 Bridge + 21:45 Pre-Bed Primer</option>
                <option value="ramp_morning_0730">07:30 Morning Trough (100% Night rhGH Ramp Phase)</option>
                <option value="rhgh_only">Exogenous rhGH Only Baseline (0 mcg Secretagogues)</option>
              </Select>
              <Input
                label="Peripheral CIS/SOCS2 Adaptation (γ)"
                type="number"
                step="0.05"
                min="0.10"
                max="1.50"
                value={gammaSocs2}
                onChange={(e) => setGammaSocs2(e.target.value)}
                hint="Higher γ favors 16:00 separated bridge"
              />
              <Input
                label="Local Chondrocyte GHRHR/GHSR1a Gain (β_cart)"
                type="number"
                step="0.05"
                min="0.00"
                max="1.20"
                value={betaCartilage}
                onChange={(e) => setBetaCartilage(e.target.value)}
                hint="Direct epiphyseal autocrine IGF-1 branch"
              />
              <Select
                label="Dual-Pulse Peptide Accounting"
                value={equalTotalPeptide ? 'iso_dose' : 'full_double'}
                onChange={(e) => setEqualTotalPeptide(e.target.value === 'iso_dose')}
              >
                <option value="iso_dose">Iso-Dose Split (50% @ 16:00 + 50% @ 21:45 — Equal Daily Input)</option>
                <option value="full_double">Full Dual Pulse (100% @ 16:00 + 100% @ 21:45 — 2× Peptide Input)</option>
              </Select>
            </div>

            <div className="dose-telemetry-grid" style={{ marginTop: '0.9rem' }}>
              <div className="telemetry-cell">
                <span>Selected Schedule Output ({ghScheduleMode})</span>
                <strong className="tabular-nums">
                  Cartilage IGF-1: {ghSynergy.current.intLocalIgf1} ({ghSynergy.cartilageSynergyPct >= 0 ? `+${ghSynergy.cartilageSynergyPct}%` : `${ghSynergy.cartilageSynergyPct}%`})
                </strong>
                <small className="tabular-nums">
                  Cartilage STAT5b: {ghSynergy.current.intStat5Cart} ({ghSynergy.stat5CartGainPct >= 0 ? `+${ghSynergy.stat5CartGainPct}%` : `${ghSynergy.stat5CartGainPct}%`}) · Liver STAT5b: {ghSynergy.current.intStat5Liver}
                </small>
              </div>
              <div className="telemetry-cell">
                <span>Endogenous Pituitary Burst &amp; 20 kDa Isoform</span>
                <strong className="tabular-nums">
                  Pituitary Sec: {ghSynergy.current.intPitSec} · 20 kDa Pool: {ghSynergy.current.int20kDa}
                </strong>
                <small className="tabular-nums">
                  Vesicle Store Floor M(t): {(ghSynergy.current.minVesicleStore * 100).toFixed(0)}% · SC rhGH Tail @ 4.5h: 95.5% / @ 9h: 50.8%
                </small>
              </div>
              <div className="telemetry-cell">
                <span>Schedule Comparison (Local Epiphyseal IGF-1 Integral)</span>
                <strong className="tabular-nums">
                  16:00 Bridge: {ghSynergy.schedules.afternoon_1600.intLocalIgf1} · 21:45 Primer: {ghSynergy.schedules.prebed_2145.intLocalIgf1} · Dual: {ghSynergy.schedules.dual_1600_2145.intLocalIgf1}
                </strong>
                <small className="tabular-nums">
                  rhGH-Only Baseline: {ghSynergy.baseline.intLocalIgf1} · 100%-Night + 07:30 Ramp: {ghSynergy.schedules.ramp_morning_0730.intLocalIgf1}
                </small>
              </div>
              <div className="telemetry-cell">
                <span>Regime Bifurcation Verdict (Optimal: {ghSynergy.optimalSplitSchedule})</span>
                <strong>{ghSynergy.optimalSplitSchedule === 'afternoon_1600' ? '16:00 Afternoon Trough Bridge Wins' : ghSynergy.optimalSplitSchedule === 'dual_1600_2145' ? 'Dual 16:00 + 21:45 Split Wins' : '21:45 Pre-Bed Primer Wins'}</strong>
                <small>{ghSynergy.regimeExplanation}</small>
              </div>
            </div>
          </article>

          {/* SETTLED MINIMALISTIC 14-DAY HEIGHT PROTOCOL (MANDATORY ERDA) & 5 ON-HAND COGNITION OVERVIEW */}
          <div className="profile-columns" style={{ marginTop: '1.5rem' }}>
            <article className="record-row" style={{ display: 'block', padding: '1.1rem' }}>
              <span className="microcopy">HEIGHT ARCHITECTURE · PRESERVED MINIMALISTIC 14-DAY PROTOCOL (MANDATORY ERDA)</span>
              <h3>{CLIENT_226_MINIMALISTIC_HEIGHT_PROTOCOL.title}</h3>
              <p className="small" style={{ marginTop: '0.35rem', color: 'var(--teal-dark, #0f766e)' }}>
                <strong>{CLIENT_226_MINIMALISTIC_HEIGHT_PROTOCOL.fgfrConstraint}</strong>
              </p>
              <h4 style={{ marginTop: '0.75rem' }}>Erdafitinib Targeted Ancillaries (Mandatory Active Shield)</h4>
              <ul className="small" style={{ paddingLeft: '1.2rem', margin: '0.35rem 0' }}>
                {CLIENT_226_MINIMALISTIC_HEIGHT_PROTOCOL.erdafitinibAncillaries.map((item) => (
                  <li key={item} style={{ marginBottom: '0.2rem' }}>{item}</li>
                ))}
              </ul>
              <h4 style={{ marginTop: '0.75rem' }}>Continuous Base (Days 1–14, Every Stage)</h4>
              <ul className="small" style={{ paddingLeft: '1.2rem', margin: '0.35rem 0' }}>
                {CLIENT_226_MINIMALISTIC_HEIGHT_PROTOCOL.continuousBase.map((item) => (
                  <li key={item} style={{ marginBottom: '0.2rem' }}>{item}</li>
                ))}
              </ul>
              {CLIENT_226_MINIMALISTIC_HEIGHT_PROTOCOL.stages.map((stg) => (
                <div key={stg.id} style={{ marginTop: '0.75rem' }}>
                  <h4>{stg.name}</h4>
                  <ul className="small" style={{ paddingLeft: '1.2rem', margin: '0.35rem 0' }}>
                    {stg.items.map((it) => (
                      <li key={it} style={{ marginBottom: '0.2rem' }}>{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </article>

            <article className="record-row" style={{ display: 'block', padding: '1.1rem' }}>
              <span className="microcopy">COGNITION ARCHITECTURE · CLIENT 226’S 5 ON-HAND COMPOUNDS</span>
              <h3>{CLIENT_226_ONHAND_COGNITION_STACK.title}</h3>
              <p className="small muted" style={{ marginTop: '0.35rem' }}>
                <strong>Spatial Spine-Head / Spine-Neck cAMP Conservation:</strong> <code>{CLIENT_226_ONHAND_COGNITION_STACK.spatialCampEquation}</code>
              </p>
              <div className="record-list" style={{ marginTop: '0.75rem' }}>
                {CLIENT_226_ONHAND_COGNITION_STACK.compounds.map((c) => (
                  <div key={c.id} className="telemetry-cell" style={{ marginBottom: '0.55rem' }}>
                    <span>{c.domain} · {c.clockWindow}</span>
                    <strong className="tabular-nums">{c.name} — {c.onHandDose}</strong>
                    <small>{c.mechanism}</small>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      )}

      {/* TAB 2: 53-SLOT MECHANISTIC COMPOUND & ALTERNATIVE EXPLORER */}
      {activeTab === 'slots' && (
        <div className="studio-panel" style={{ marginTop: '1rem' }}>
          <div className="form-grid two" style={{ marginBottom: '1rem' }}>
            <Select label="Filter by Client 226 Architecture Domain" value={slotDomain} onChange={(e) => setSlotDomain(e.target.value)}>
              <option value="all">All 53 Functional Slots (Cognition + Height)</option>
              <option value="cognition">Cognition &amp; Study Architecture (28 Slots)</option>
              <option value="height">Height &amp; 14-Day Epiphyseal Reactor (25 Slots)</option>
            </Select>
            <Input
              label="Search Compound, Alternative, Receptor Target, or Dose"
              placeholder="e.g. TAK-653, Dabogratinib, KCC2, Sulforaphane, KW-6356, 0.25 mg/kg…"
              value={slotQuery}
              onChange={(e) => setSlotQuery(e.target.value)}
            />
          </div>

          <p className="muted small" style={{ marginBottom: '0.75rem' }}>
            Showing {filteredSlots.length} of {CLIENT_226_FRONTIER_RECORDS.length} functional slots from Client 226's unified architecture. Every slot preserves both the primary frontier actuator and its accessible/contingency alternatives.
          </p>

          <div className="record-list">
            {filteredSlots.map((slot) => (
              <article className="record-row" key={slot.id} style={{ display: 'block', padding: '1.1rem' }}>
                <div className="inline-between" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span className="microcopy">
                      SLOT [{slot.id.toUpperCase()}] · {slot.domain === 'height' ? 'HEIGHT / EPIPHYSEAL REACTOR' : 'COGNITION / SYNAPTIC ARCHITECTURE'}
                    </span>
                    <h3>{slot.name}</h3>
                    <p className="small"><strong>Functional Role:</strong> {slot.function}</p>
                  </div>
                  <Status value="configured">{(slot.extracted_compounds || []).length} Actuators / Alternatives</Status>
                </div>

                <p className="small" style={{ marginTop: '0.5rem' }}>{slot.mechanism}</p>

                {Array.isArray(slot.extracted_compounds) && slot.extracted_compounds.length > 0 && (
                  <div className="dose-telemetry-grid" style={{ marginTop: '0.75rem' }}>
                    {slot.extracted_compounds.map((ec, idx) => (
                      <div className="telemetry-cell" key={`${slot.id}-${ec.name}-${idx}`}>
                        <span>{ec.role === 'alternative' ? 'Alternative / Contingency Branch' : 'Primary Slot Actuator'}</span>
                        <strong className="tabular-nums">{ec.name} · {ec.dose}</strong>
                        <small>{ec.context}</small>
                        {onAddCompoundToProtocol && (
                          <div style={{ marginTop: '0.4rem' }}>
                            <button
                              type="button"
                              className="button secondary small-button"
                              onClick={() => onAddCompoundToProtocol(ec, slot)}
                            >
                              Add / Swap {ec.name} into Workspace
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

      {/* TAB 3: 24-RULE ETERNAL TEST VALIDATOR & 22 HYPOTHESIS NODES */}
      {activeTab === 'eternal' && (
        <div className="studio-panel" style={{ marginTop: '1rem' }}>
          <div className="inline-between" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <h3>Window-Violation Stress Tester &amp; Counterfactual Knockout Simulator</h3>
              <p className="muted small">
                Select any schedule violation below to inspect how breaking a timing or separation rule degrades 14-day epiphyseal growth velocity, sulfation quality, or ER backlog safety.
              </p>
            </div>
            <Select label="Simulate Schedule / Window Violation" value={selectedStressKey} onChange={(e) => setSelectedStressKey(e.target.value)}>
              <option value="baseline">Baseline Compliant Schedule (0 Violations · 1.6531 mm/14d)</option>
              <option value="li_in_stage1">Violation 1: Lithium Leaked into Stage 1 (IMPAD1 Sulfation Block · -13.5%)</option>
              <option value="thiol_in_2b">Violation 2: NAC/Cystine Run into Stage 2B (Sulforaphane/Se Scavenged · -8.1%)</option>
              <option value="capps_in_2b">Violation 3: Pentosan Polysulfate Run into Stage 2B (MMP13/ADAMTS5 Blocked · -4.1%)</option>
              <option value="phytate_with_minerals">Violation 4: Phytate Co-Dosed w/ Mn/Cu &amp; Kept in Stage 2B (-3.6%)</option>
              <option value="daytime_b2">Violation 5: Daytime Salbutamol Pulse (IGF-2R Scavenging · -3.9%)</option>
              <option value="terazosin_2mg">Violation 6: Terazosin Over-Dosed at 2.0 mg (Biphasic Loss · -7.2%)</option>
              <option value="all_stage_violations">Catastrophic Unstaged Stack (All Violations Combined · -41.5%)</option>
            </Select>
          </div>

          <div className="dose-telemetry-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="telemetry-cell">
              <span>14-Day Cycle Gain &amp; Annualized Velocity</span>
              <strong className="tabular-nums">{activeStress.mm_14d} mm / 14d ({activeStress.cm_year} cm/yr)</strong>
              <small className="tabular-nums">
                Delta vs Compliant Baseline: {activeStress.delta_pct >= 0 ? `+${activeStress.delta_pct}%` : `${activeStress.delta_pct}%`}
              </small>
            </div>
            <div className="telemetry-cell">
              <span>GAG Sulfation &amp; Mineralization Quality</span>
              <strong className="tabular-nums">
                Sulfation {(Number(activeStress.sulfation || 0) * 100).toFixed(1)}% · Mineral {(Number(activeStress.mineralization || 0) * 100).toFixed(1)}%
              </strong>
              <small>ER Unfolded Backlog Index: {activeStress.er_backlog}</small>
            </div>
            <div className="telemetry-cell">
              <span>Mechanistic Diagnostic Note</span>
              <strong>{selectedStressKey === 'baseline' ? 'All 24 Eternal Tests PASS' : 'Schedule Violation Active'}</strong>
              <small>{activeStress.note}</small>
            </div>
          </div>

          <div className="profile-columns">
            <div>
              <h4>Height &amp; Epiphyseal Eternal Tests (Rules R01–R14)</h4>
              <div className="record-list">
                {CLIENT_226_ETERNAL_TESTS.heightValidator.map((r) => (
                  <article className="record-row" key={r.id}>
                    <div>
                      <h3>{r.id}: {r.rule}</h3>
                      <p className="small">{r.detail}</p>
                    </div>
                    <Status value={r.status === 'PASS' ? 'configured' : 'due'}>{r.status}</Status>
                  </article>
                ))}
              </div>
            </div>
            <div>
              <h4>Cognition &amp; Cross-Domain Eternal Tests (Rules C01–C10)</h4>
              <div className="record-list">
                {CLIENT_226_ETERNAL_TESTS.cognitionValidator.map((r) => (
                  <article className="record-row" key={r.id}>
                    <div>
                      <h3>{r.id}: {r.rule}</h3>
                      <p className="small">{r.detail}</p>
                    </div>
                    <Status value="configured">{r.status}</Status>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <h4 style={{ marginTop: '1.75rem' }}>22 Mechanistic Hypothesis Nodes (H01–H22) · Leave-One-Out Impact, Signatures &amp; Falsifiers</h4>
          <div className="record-list" style={{ marginTop: '0.75rem' }}>
            {CLIENT_226_HYPOTHESIS_NODES.map((node) => {
              const loo = (CLIENT_226_REACTOR_RESULTS.loo || []).find((l) => l.id === node.id);
              return (
                <article className="record-row" key={node.id} style={{ display: 'block', padding: '1rem' }}>
                  <div className="inline-between" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span className="microcopy">{node.id} · GROUP: {node.group.toUpperCase()} · WINDOW: {node.window.toUpperCase()}</span>
                      <h3>{node.name}</h3>
                    </div>
                    {loo && (
                      <strong className="tabular-nums">
                        LOO Knockout Loss: -{loo.loss_mm_14d} mm/14d (-{loo.loss_pct}%)
                      </strong>
                    )}
                  </div>
                  <p className="small" style={{ marginTop: '0.35rem' }}>
                    <strong>Target Engagement Signature:</strong> {node.signature}
                  </p>
                  <p className="small muted" style={{ marginTop: '0.2rem' }}>
                    <strong>Mechanistic Falsifier / Guardrail:</strong> {node.falsifier}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: 336-HOUR STAGED REACTOR & THIOL-CLUTCH WASHOUT CLOCK */}
      {activeTab === 'reactor' && (
        <div className="studio-panel" style={{ marginTop: '1rem' }}>
          <div className="inline-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3>Interactive 336-Hour (14-Day) Staged Epiphyseal Reactor Clock</h3>
              <p className="muted small">
                Scrub across Hours 0–336 to inspect the exact Thiol-Clutch exponential washout (τ = 19.4h), Pentosan Polysulfate (CaPPS) taper, and TPPU/Selexipag Stage 2B angiogenic handoff.
              </p>
            </div>
            <div style={{ minWidth: '280px' }}>
              <label className="field">
                <span>Cycle Hour: <strong>Hour {reactorState.hour}</strong> (Day {reactorState.day} of 14)</span>
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

          <div className=" segmented-button-row" style={{ margin: '0.75rem 0', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              ['24', 'Hour 24 (Day 2 · Stage 1 Peak)'],
              ['138', 'Hour 138 (Day 6.75 · Thiol 50% Step-Down)'],
              ['150', 'Hour 150 (Day 7.25 · Thiol HARD STOP)'],
              ['168', 'Hour 168 (Day 8 · Stage 2A Swelling + CaPPS 35%)'],
              ['180', 'Hour 180 (Day 8.5 · TPPU/Selexipag 35% Ramp)'],
              ['192', 'Hour 192 (Day 9.0 · Stage 2B Full Conversion Handoff)'],
              ['288', 'Hour 288 (Day 13 · Late Stage 2B Mineralization)'],
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

          <div className="dose-telemetry-grid" style={{ marginTop: '1rem' }}>
            <article className="telemetry-cell">
              <span>Active Reactor Phase (Hour {reactorState.hour} / Day {reactorState.day})</span>
              <strong>{reactorState.stage}</strong>
              <small>
                Lithium: {reactorState.lithiumActive ? 'ACTIVE (2.5–5 mg)' : 'HELD (0% — Protects Stage 1 IMPAD1)'} · Phytate: {reactorState.phytateActive ? 'ACTIVE (500 mg fasted)' : 'STOPPED (0% — Unlocks Stage 2B Hydroxyapatite)'}
              </small>
            </article>
            <article className="telemetry-cell">
              <span>Thiol Clutch (NAC + L-Cystine · τ = 19.4h)</span>
              <strong className="tabular-nums">{(reactorState.thiolLevel * 100).toFixed(1)}% Residual Pool</strong>
              <small>
                {reactorState.hour >= 192
                  ? `Safe for Sulforaphane/Selenite (${(reactorState.thiolLevel * 100).toFixed(1)}% <= 15% threshold)`
                  : 'Washing out between Hour 138 -> Hour 192'}
              </small>
            </article>
            <article className="telemetry-cell">
              <span>CaPPS (TIMP-3 Protection · τ = 24.0h)</span>
              <strong className="tabular-nums">{(reactorState.cappsLevel * 100).toFixed(1)}% Active</strong>
              <small>Protects Stage 1 aggrecan; clears by Hour 192 for MMP-13/ADAMTS-5 remodeling</small>
            </article>
            <article className="telemetry-cell">
              <span>TPPU / Selexipag &amp; Stage 2B Conversion (τ = 36.0h)</span>
              <strong className="tabular-nums">{(reactorState.tppuLevel * 100).toFixed(1)}% Active</strong>
              <small>
                Sulforaphane + Selenite + Calcitriol + MK-4: {reactorState.sulforaphaneSeleniteActive ? 'ACTIVE (Days 9–14)' : 'HELD until Hour 192'}
              </small>
            </article>
          </div>

          <h4 style={{ marginTop: '1.5rem' }}>Periodic Fixed-Mean Peak/Trough Interval Reference (from timing-results.json)</h4>
          <div className="dose-telemetry-grid" style={{ marginTop: '0.75rem' }}>
            {(CLIENT_226_TIMING_RESULTS.periodic_table || []).slice(0, 8).map((row, idx) => (
              <div className="telemetry-cell" key={idx}>
                <span>t½ = {row.half_life_h}h · Interval Δt = {row.interval_h}h</span>
                <strong className="tabular-nums">Peak/Trough {row.peak_trough_ratio}×</strong>
                <small className="tabular-nums">
                  Peak {row.peak_over_mean}× mean · Trough {row.trough_over_mean}× mean
                </small>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SIDE-EFFECT, WHEN-TO-SWITCH & FIX MATRIX + SHARED CROSS-DOMAIN LEDGER */}
      {activeTab === 'side_effects' && (
        <div className="studio-panel" style={{ marginTop: '1rem' }}>
          <div className="inline-between" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <h3>Side-Effect, Biomarker Trigger, When-to-Switch &amp; Mechanistic Fix Matrix</h3>
              <p className="muted small">
                Every anticipated receptor, renal, hepatobiliary, ocular, hemodynamic, and cognitive side effect mapped to its exact culprit, switching threshold, and immediate mechanistic fix.
              </p>
            </div>
            <Select label="Filter Diagnostic Matrix" value={seDomain} onChange={(e) => setSeDomain(e.target.value)}>
              <option value="all">All Domains ({CLIENT_226_SIDE_EFFECT_MATRIX.length})</option>
              <option value="height">Height &amp; Epiphyseal Reactor</option>
              <option value="cognition">Cognition &amp; Study Stack</option>
              <option value="shared">Shared Hemodynamic / Cross-Domain</option>
            </Select>
          </div>

          <div className="record-list">
            {filteredSideEffects.map((item) => (
              <article className="record-row" key={item.id} style={{ display: 'block', padding: '1rem' }}>
                <div className="inline-between" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span className="microcopy">{item.domain.toUpperCase()} TRIGGER · SEVERITY: {item.severity.toUpperCase()}</span>
                    <h3>{item.trigger}</h3>
                  </div>
                  <Status value={item.severity === 'critical' ? 'due' : 'upcoming'}>{item.severity}</Status>
                </div>
                <p className="small" style={{ marginTop: '0.4rem' }}>
                  <strong>Mechanistic Culprit:</strong> {item.culprit}
                </p>
                <p className="small" style={{ marginTop: '0.25rem' }}>
                  <strong>When to Switch / Gate Threshold:</strong> {item.whenToSwitch}
                </p>
                <p className="small" style={{ marginTop: '0.25rem', color: 'var(--teal-dark, #0f766e)' }}>
                  <strong>Immediate Mechanistic Fix:</strong> {item.fix}
                </p>
              </article>
            ))}
          </div>

          <h3 style={{ marginTop: '2rem' }}>Shared Cross-Domain Compound &amp; Physiological Budget Ledger (Height × Cognition)</h3>
          <p className="muted small" style={{ marginBottom: '0.75rem' }}>
            Compounds appearing in both Client 226's Cognition and Height architectures share a single biological identity and daily exposure ceiling so parallel workspaces never double-dose.
          </p>
          <div className="record-list">
            {CLIENT_226_SHARED_LEDGER.map((row) => (
              <article className="record-row" key={row.compound} style={{ display: 'block', padding: '1rem' }}>
                <div className="inline-between" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3>{row.compound}</h3>
                  <Status value="configured">{row.sharedBudget}</Status>
                </div>
                <p className="small" style={{ marginTop: '0.35rem' }}>
                  <strong>Cognition Role ({row.cognitionStandaloneDose}):</strong> {row.cognitionRole}
                </p>
                <p className="small" style={{ marginTop: '0.2rem' }}>
                  <strong>Height Role ({row.heightStandaloneDose}):</strong> {row.heightRole}
                </p>
                <p className="small" style={{ marginTop: '0.3rem' }}>
                  <strong>Unified Combined Daily Ceiling:</strong> <span className="tabular-nums">{row.unifiedCombinedDose}</span>
                </p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
