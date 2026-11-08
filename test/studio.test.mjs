import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EPISTEMIC_TIERS,
  FUNCTIONAL_EFFECT_PROFILES,
  INTERACTION_POLARITIES,
  buildPctAncillaryPlan,
  calculateReconstitutionAndInventory,
  computeCausalCascadeGraph,
  computeCostAndWasteAnalysis,
  computeReceptorOverlapMap,
  createIcsCalendar,
  evaluateBloodMarkerPanel,
  evaluateDoseAdjustmentAdvisor,
  findGoalProtocol,
  generateEsterPinningSchedule,
} from '../src/studioLogic.js';
import {
  CLIENT_226_COMPOUNDS,
  CLIENT_226_CONSULTATION_BRANCHES,
  CLIENT_226_ETERNAL_TESTS,
  CLIENT_226_FRONTIER_RECORDS,
  CLIENT_226_HYPOTHESIS_NODES,
  CLIENT_226_REACTOR_RESULTS,
  CLIENT_226_SHARED_LEDGER,
  CLIENT_226_SIDE_EFFECT_MATRIX,
  computeIntranasalInsulinCurve,
  computeProcollagenBifurcation,
  computeTerazosinBiphasic,
  evaluateReactorAtHour,
} from '../src/client226Data.js';

test('Functional Effect Profiles cover Telmisartan, Memantine, Endoxifen, and FGFR3/CNP', () => {
  const names = FUNCTIONAL_EFFECT_PROFILES.map((p) => p.name).join(' · ');
  assert.match(names, /Telmisartan/);
  assert.match(names, /Memantine/);
  assert.match(names, /Endoxifen/);
  assert.match(names, /FGFR3 \/ CNP/);
  assert.equal(FUNCTIONAL_EFFECT_PROFILES.length, 4);
});

test('Reconstitution & draw computes concentration, U-100 units, pins left, BAC water left, and feeds shopping list automatically', () => {
  const result = calculateReconstitutionAndInventory({
    compoundName: 'Vosoritide (CNP-38)',
    vialMassMg: 10,
    diluentMl: 2,
    targetDoseMcg: 1000,
    activeFraction: 1.0,
    dosesTaken: 25,
    pinsInBox: 30,
    bacWaterBottleMl: 10,
    vialsReconstitutedCount: 4,
  });
  assert.equal(result.concMgMl, 5);
  assert.equal(result.drawMl, 0.2);
  assert.equal(result.u100Units, 20);
  assert.equal(result.pinsLeft, 5);
  assert.equal(result.bacWaterLeftMl, 2);
  // Both pinsLeft (5 <= 10) and bacWaterLeftMl (2 <= 3) trigger automatic shopping list items
  assert.equal(result.shoppingItems.length >= 2, true);
  assert.match(JSON.stringify(result.shoppingItems), /Syringes/);
  assert.match(JSON.stringify(result.shoppingItems), /Bacteriostatic Water/);
});

test('Frequency from ester outputs a concrete calendar pinning schedule with draw volumes and peak-to-trough ratio', () => {
  const schedule = generateEsterPinningSchedule({
    compoundName: 'Testosterone Cypionate',
    ester: 'cypionate',
    weeklyDoseMg: 140,
    concentrationMgMl: 200,
    cadenceMode: 'e3_5d',
    startDateIso: '2026-11-08T08:00:00.000Z',
    weeks: 2,
  });
  assert.equal(schedule.intervalH, 84);
  assert.equal(schedule.dosePerPinMg, 70);
  assert.equal(schedule.drawMl, 0.35);
  assert.equal(schedule.u100Units, 35);
  assert.equal(schedule.events.length, 4);
  assert.match(schedule.events[0].title, /Testosterone Cypionate.*Pin #1/);
});

test('Cost & shopping list flips into Money Wasted / Money Saved headline numbers', () => {
  const analysis = computeCostAndWasteAnalysis(
    [{ id: 'cmp-tamoxifen', name: 'Tamoxifen Citrate' }, { id: 'cmp-mgoxide', name: 'Magnesium Oxide' }],
    [],
    [],
    [{ compound_id: 'cmp-tamoxifen', replacement_name: 'Endoxifen' }]
  );
  assert.equal(analysis.wastedMonthlyUsd > 0, true);
  assert.equal(analysis.annualSavedUsd, analysis.monthlySavedUsd * 12);
});

test('Blood-marker log computes recheck calendar event and cheapest way to test budget line', () => {
  const panel = evaluateBloodMarkerPanel({
    recordedAtIso: '2026-11-08T09:00:00.000Z',
    recheckWeeks: 6,
    sourcePhotoName: 'slip.jpg',
    entries: [
      { markerKey: 'estradiol_sensitive', value: 29.4 },
      { markerKey: 'igf1_lcms', value: 235 },
      { markerKey: 'cystatin_c', value: 0.75 },
    ],
  });
  assert.equal(panel.calendarEvent.kind, 'lab_recheck');
  assert.match(panel.cheapestTestLine, /Cheapest way to test these 3 markers/);
  assert.equal(panel.savedOnLabsUsd > 0, true);
});

test('Dose-adjustment advisor stays locked until BOTH real labs and symptom attributions exist, then unlocks inside reviewer', () => {
  const locked = evaluateDoseAdjustmentAdvisor({ labs: [], symptomAttributions: [] });
  assert.equal(locked.unlocked, false);
  assert.equal(locked.missingRequirements.length, 2);

  const unlocked = evaluateDoseAdjustmentAdvisor({
    labs: [{ evaluated: [{ id: 'estradiol_sensitive', value: 48, unit: 'pg/mL', status: 'elevated', referenceRange: '20–38 pg/mL' }] }],
    symptomAttributions: [{ attributedChange: 'Weekly bolus', observation: 'Evening water retention' }],
  });
  assert.equal(unlocked.unlocked, true);
  assert.equal(unlocked.recommendations.length > 0, true);
});

test('Goal -> protocol finder ends in a pre-filled consult intake so nothing gets typed twice', () => {
  const finder = findGoalProtocol('height', 'Tamoxifen 20 mg, Vosoritide 1.1 mg');
  assert.equal(finder.goalKey, 'height');
  assert.match(finder.prefilledIntake.enteredStack, /Tamoxifen 20 mg/);
  assert.match(finder.prefilledIntake.biomarkerTargets, /Collagen X Marker/);
});

test('PCT / ancillary builder computes ester washout countdown and SERM schedule', () => {
  const pct = buildPctAncillaryPlan({ ester: 'enanthate', weeklyDoseMg: 200, cycleWeeks: 12, sermChoice: 'endoxifen' });
  assert.equal(pct.washoutDays > 5, true);
  assert.match(pct.selectedSerm.name, /Endoxifen/);
  assert.equal(pct.ancillaryGuardrails.length, 3);
});

test('Receptor-overlap map and ICS calendar generator produce valid outputs', () => {
  const map = computeReceptorOverlapMap(['Telmisartan', 'Memantine', 'Endoxifen', 'Vosoritide']);
  assert.equal(map.nodes.length, 8);
  assert.equal(map.edges.length >= 4, true);

  const ics = createIcsCalendar([{ id: 'ev-1', title: 'Telmisartan 40 mg', scheduled_at: '2026-11-08T08:00:00.000Z' }], 'BioScience');
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /SUMMARY:Telmisartan 40 mg/);
});

test('4-Layer Causal Cascade Tree encodes epistemic tiers, bidirectional traces, counterfactual swaps, and temporal adaptation', () => {
  assert.equal(Object.keys(EPISTEMIC_TIERS).length, 4);
  assert.equal(Object.keys(INTERACTION_POLARITIES).length, 6);

  // 1. Forward trace with prodrug bottlenecks and poor CYP2D6 metabolizer phenotype
  const baselineCascade = computeCausalCascadeGraph(
    ['Tamoxifen 20 mg', 'Alpha-GPC 600 mg', 'Memantine 10 mg', 'Vosoritide 1.1 mg'],
    {
      direction: 'forward',
      cyp2d6Genotype: 'poor',
      temporalPhase: 'acute_d1_5',
    }
  );
  assert.equal(baselineCascade.layers.compounds.length, 4);
  assert.equal(baselineCascade.layers.targets.length, 8);
  assert.equal(baselineCascade.layers.mechanisms.length, 8);
  assert.equal(baselineCascade.layers.phenotypes.length, 5);
  assert.equal(baselineCascade.bottlenecks.some((b) => b.id === 'bn-cyp2d6-tamox'), true);
  assert.equal(baselineCascade.bottlenecks.some((b) => b.id === 'bn-memantine-acute-fog'), true);

  // 2. Counterfactual swap (Tamoxifen -> Endoxifen, Alpha-GPC -> Citicoline) + Chronic steady state
  const counterfactualCascade = computeCausalCascadeGraph(
    ['Tamoxifen 20 mg', 'Alpha-GPC 600 mg', 'Memantine 10 mg', 'Vosoritide 1.1 mg'],
    {
      direction: 'backward',
      targetGoalId: 'goal-epiphyseal',
      cyp2d6Genotype: 'poor',
      temporalPhase: 'chronic_d14_plus',
      counterfactuals: {
        swapTamoxifenToEndoxifen: true,
        swapAlphaGpcToCiticoline: true,
      },
    }
  );
  assert.equal(counterfactualCascade.bottlenecks.some((b) => b.id === 'bn-cyp2d6-tamox'), false);
  assert.equal(counterfactualCascade.synergies.some((s) => s.id === 'syn-epiph-dual'), true);
  assert.equal(counterfactualCascade.synergies.some((s) => s.id === 'syn-glut-ach'), true);
  const epiphGoal = counterfactualCascade.layers.phenotypes.find((p) => p.id === 'goal-epiphyseal');
  const baselineEpiphGoal = baselineCascade.layers.phenotypes.find((p) => p.id === 'goal-epiphyseal');
  assert.equal(epiphGoal.netScore > baselineEpiphGoal.netScore, true);
});

test('Browser-adapted Obsidian vault access resolves supplied compound descriptions and full passages', async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { createBrowserVaultApp, resolveCompoundPassage } = await server.ssrLoadModule('/src/atlas/browserVault.ts');
    const { buildAtlasModel } = await server.ssrLoadModule('/src/atlas/model.ts');
    const { AtlasReviewLedger } = await server.ssrLoadModule('/src/atlas/ledger.ts');

    const suppliedText = 'Telmisartan 40 mg — Insurmountable AT1R shield and selective PPAR-gamma modulator taken on waking.\nMemantine 10 mg — Uncompetitive NMDA open-channel blocker.';
    const app = createBrowserVaultApp({ suppliedText });

    const files = app.vault.getMarkdownFiles();
    assert.equal(files.length >= 10, true);

    const telmiPassage = resolveCompoundPassage({ name: 'Telmisartan' }, { suppliedText });
    assert.match(telmiPassage.description, /Telmisartan 40 mg — Insurmountable AT1R shield/);
    assert.match(telmiPassage.fullPassage, /Telmisartan 40 mg — Insurmountable AT1R shield/);
    assert.match(telmiPassage.fullPassage, /Mechanistic Signaling Axes/);

    const model = await buildAtlasModel(app);
    assert.equal(model.nodes.length >= 10, true);
    assert.equal(model.edges.length > 0, true);
    const telmiNode = model.nodes.find((n) => n.title === 'Telmisartan');
    assert.ok(telmiNode);
    assert.match(telmiNode.excerpt, /Telmisartan 40 mg — Insurmountable AT1R shield/);

    const fileRecord = app.vault.getAbstractFileByPath(telmiNode.path);
    assert.ok(fileRecord);
    const cachedText = await app.vault.cachedRead(fileRecord);
    assert.match(cachedText, /# Telmisartan/);

    const ledger = new AtlasReviewLedger(app);
    await ledger.load();
    assert.equal(Array.isArray(ledger.allEvents()), true);
  } finally {
    await server.close();
  }
});

test('Client 226 (cc224) complete suite: 85 frontier records (53 functional slots + 32 phase/reactor records), 170 compounds, 24 Eternal Tests, dose calculators, 336h reactor, and side-effect matrix', () => {
  assert.equal(CLIENT_226_FRONTIER_RECORDS.length, 85);
  assert.equal(CLIENT_226_COMPOUNDS.length >= 165, true);
  assert.equal(
    (CLIENT_226_ETERNAL_TESTS.height_rules?.length || 0) + (CLIENT_226_ETERNAL_TESTS.cognition_rules?.length || 0),
    24
  );
  assert.equal(CLIENT_226_HYPOTHESIS_NODES.length, 22);
  assert.equal(CLIENT_226_SIDE_EFFECT_MATRIX.length, 12);
  assert.equal(CLIENT_226_CONSULTATION_BRANCHES.length, 7);
  assert.equal(CLIENT_226_SHARED_LEDGER.length, 7);

  // Biphasic Terazosin PGK1 calculator: 0.6 mg optimal (> 2.0 mg high-dose inhibition)
  const tzOpt = computeTerazosinBiphasic(0.6);
  const tzHigh = computeTerazosinBiphasic(2.0);
  assert.match(tzOpt.regime, /Optimal Hormetic PGK1 Window/);
  assert.equal(tzOpt.atpGainPct > tzHigh.atpGainPct, true);

  // Intranasal Insulin PBPK & S6K1 desensitization ceiling
  const insOpt = computeIntranasalInsulinCurve(25);
  const insOveruse = computeIntranasalInsulinCurve(45);
  assert.match(insOpt.irs1DesensitizationRisk, /Minimal/);
  assert.equal(insOpt.efficacyPct > insOveruse.efficacyPct, true);

  // Procollagen Saddle-Node Bifurcation
  const procolSafe = computeProcollagenBifurcation({ synthesisMultiplier: 1.85, tudcaActive: true, pba4Active: true });
  const procolCollapse = computeProcollagenBifurcation({ synthesisMultiplier: 2.6, tudcaActive: false, pba4Active: false, ambroxolActive: false });
  assert.equal(procolSafe.state, 'SAFE_LAMINAR_EXPORT');
  assert.equal(procolCollapse.state, 'BACKLOG_UPR_APOPTOSIS_WARNING');

  // 336-hour Staged Epiphyseal Reactor & Thiol-Clutch washout
  const stage1 = evaluateReactorAtHour(72);
  const washout = evaluateReactorAtHour(168);
  const stage2B = evaluateReactorAtHour(264);
  assert.match(stage1.stage, /Stage 1/);
  assert.match(washout.stage, /Stage 2A/);
  assert.match(stage2B.stage, /Stage 2B/);
  assert.equal(stage2B.thiolSafeForStage2B, true);
  assert.equal(CLIENT_226_REACTOR_RESULTS.arm_a_14d.height_mm > CLIENT_226_REACTOR_RESULTS.arm_b_14d.height_mm, true);
});


