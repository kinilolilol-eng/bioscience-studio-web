// Pure, deterministic domain logic for BioScience Consultation & Protocol Studio.
// Decoupled from UI components for fast unit testing and zero-drift state calculation.

export const FUNCTIONAL_EFFECT_PROFILES = [
  {
    id: 'profile-telmisartan',
    compoundId: 'cmp-telmisartan',
    name: 'Telmisartan',
    subtitle: 'AT1R Insurmountable Antagonism & Selective PPAR-γ Modulation',
    classification: 'Angiotensin II Receptor Blocker (ARB) / Partial PPAR-γ Agonist',
    standardWindow: '20–80 mg · Once daily (Morning or split AM/PM)',
    halfLifeH: 24,
    mechanisticSummary:
      'Uniquely lipophilic benzimidazole ARB that exhibits insurmountable AT1 receptor blockade (slow dissociation t½ ~ 213 min) alongside selective partial PPAR-γ agonism (~25–30% maximal rosiglitazone activation) without adipogenic fluid retention.',
    pathways: [
      {
        axis: 'AT1R Insurmountable Blockade',
        target: 'Vascular & Adrenal AT1 Receptor',
        kinetics: 'Ki = 3.7 nM · Dissociation t½ = 213 min',
        effect: 'Attenuates angiotensin II-mediated vasoconstriction, aldosterone secretion, sympathetic tone, and left-ventricular remodeling under supraphysiological androgen or catecholamine load.',
      },
      {
        axis: 'Selective PPAR-γ Co-Regulator Recruitment',
        target: 'Nuclear PPAR-γ1 / PPAR-γ2 Ligand-Binding Domain',
        kinetics: 'EC50 = 4.5 µM · 27% Partial Agonism',
        effect: 'Recruits PGC-1α and TIF2 while sparing DRIP205/TRAP220, upregulating adiponectin, GLUT4 translocation, and hepatic fatty-acid oxidation without renal ENaC sodium/water retention.',
      },
      {
        axis: 'Endothelial & Renal Hemodynamics',
        target: 'eNOS / Glomerular Efferent Arteriole',
        kinetics: 'Steady-state trough coverage > 24 h',
        effect: 'Reduces intraglomerular hypertension, lowers hs-CRP and Cystatin C drift, and preserves endothelial nitric oxide bioavailability.',
      },
    ],
    biomarkerTargets: [
      { marker: 'Resting BP', target: '< 118/76 mmHg', rationale: 'Primary hemodynamic endpoint for AT1R saturation' },
      { marker: 'Fasting Insulin / HOMA-IR', target: '< 5.0 uIU/mL', rationale: 'Reflects partial PPAR-γ insulin sensitization' },
      { marker: 'Cystatin C / eGFR', target: '< 0.85 mg/L', rationale: 'Monitors glomerular filtration & renal protection' },
      { marker: 'Serum Potassium & Hematocrit', target: 'K+ 4.0–4.8 mEq/L · Hct < 49%', rationale: 'Aldosterone suppression & erythropoiesis modulation' },
    ],
    doseResponsePoints: [
      { doseMg: 10, at1BlockadePct: 52, pparGammaPct: 6 },
      { doseMg: 20, at1BlockadePct: 74, pparGammaPct: 14 },
      { doseMg: 40, at1BlockadePct: 88, pparGammaPct: 24 },
      { doseMg: 80, at1BlockadePct: 95, pparGammaPct: 31 },
    ],
    source: 'Benson et al., Hypertension 2004 (PMID: 14757770); Schupp et al., Circulation 2004; DailyMed Telmisartan Monograph.',
  },
  {
    id: 'profile-memantine',
    compoundId: 'cmp-memantine',
    name: 'Memantine',
    subtitle: 'Extrasynaptic NMDA Antagonism vs Synaptic Phasic LTP Preservation',
    classification: 'Uncompetitive, Low-Affinity, Voltage-Dependent Open-Channel NMDA Blocker',
    standardWindow: '5–20 mg · Morning or Bedtime (7-day upward titration)',
    halfLifeH: 65,
    mechanisticSummary:
      'Fast on/off open-channel kinetics and strong voltage dependence allow Memantine to selectively block pathological tonic (extrasynaptic) Ca²⁺ influx while vacating the NMDA pore during high-frequency synaptic depolarization (preserving physiological phasic LTP).',
    pathways: [
      {
        axis: 'Extrasynaptic NR2B Tonic Noise Suppression',
        target: 'Extrasynaptic GluN1/GluN2B Channel Pore',
        kinetics: 'IC50 = 1.1 µM at -70 mV · Open-channel trapping',
        effect: 'Blocks chronic low-level glutamate spillover and excitotoxic Ca²⁺ overload that drives CREB shut-off, mitochondrial stress, and stimulant/dopaminergic tolerance.',
      },
      {
        axis: 'Synaptic Phasic LTP Preservation',
        target: 'Synaptic GluN2A/2B under AMPA Depolarization',
        kinetics: 'τ_off = 0.8 s at -20 mV (Rapid Voltage Unblock)',
        effect: 'During transient ~100 Hz synaptic cleft glutamate pulses (>1 mM), rapid postsynaptic depolarization expels Memantine alongside Mg²⁺, leaving physiological hippocampal LTP intact.',
      },
      {
        axis: 'α7-nAChR Biphasic Adaptation',
        target: 'Neuronal α7 Nicotinic Acetylcholine Receptor',
        kinetics: 'Transient antagonism (Days 1–5) → Upregulation',
        effect: 'Initial α7-nAChR blockade causes transient "brain fog" during Days 1–4, followed by compensatory receptor upregulation and sharpened signal-to-noise ratio by Day 10.',
      },
    ],
    biomarkerTargets: [
      { marker: 'Cognitive Signal-to-Noise (Subjective)', target: '>= 8 / 10 post Day-10', rationale: 'Tracks clearance of initial α7-nAChR adaptation window' },
      { marker: 'Stimulant / Dopaminergic Dose Stability', target: '0% dose escalation', rationale: 'Extrasynaptic NMDA blockade prevents ΔFosB/AMPA receptor sensitization drift' },
      { marker: 'Urinary pH Stability', target: 'pH 6.0–7.0', rationale: 'Alkaline urine (pH > 7.5) reduces renal tubular clearance by up to 80%' },
    ],
    doseResponsePoints: [
      { doseMg: 5, extrasynapticBlockPct: 48, synapticLtpPreservedPct: 98 },
      { doseMg: 10, extrasynapticBlockPct: 72, synapticLtpPreservedPct: 95 },
      { doseMg: 20, extrasynapticBlockPct: 86, synapticLtpPreservedPct: 90 },
      { doseMg: 40, extrasynapticBlockPct: 94, synapticLtpPreservedPct: 72 },
    ],
    source: 'Lipton, Nature Reviews Drug Discovery 2006 (PMID: 16424917); Xia et al., J Neurosci 2010; Parsons et al., Neuropharmacology 2007.',
  },
  {
    id: 'profile-endoxifen',
    compoundId: 'cmp-endoxifen',
    name: 'Endoxifen',
    subtitle: 'Targeted ERα/ERβ Co-Regulator Recruitment & CYP2D6-Independent Kinetics',
    classification: 'Active Secondary Selective Estrogen Receptor Modulator (4-OH-N-desmethyltamoxifen)',
    standardWindow: '2–4 mg · Once daily (Direct active metabolite)',
    halfLifeH: 52,
    mechanisticSummary:
      'Direct administration of (Z)-Endoxifen bypasses hepatic CYP2D6 bioactivation polymorphisms completely, achieving 30–100× higher ERα/ERβ binding affinity than parent tamoxifen with tissue-selective AF-1/AF-2 co-repressor recruitment.',
    pathways: [
      {
        axis: 'AF-2 Helix-12 Conformational Antagonism',
        target: 'Mammary & Hypothalamic ERα LBD (IC50 = 3.0 nM)',
        kinetics: 'Direct active species · Zero CYP2D6 bottleneck',
        effect: 'Displaces Helix-12 over the co-activator groove, recruiting NCoR/SMRT corepressors in breast/pituitary tissue to prevent gynecomastia and disinhibit GnRH/LH/FSH pulsatility.',
      },
      {
        axis: 'Epiphyseal & Trabecular AF-1 Partial Agonism',
        target: 'Osteoblast & Growth Plate Chondrocyte ERα/ERβ',
        kinetics: 'Selective SRC-1 recruitment · ERα Proteasomal Degradation',
        effect: 'Preserves trabecular bone mineral density while avoiding supraphysiological E2-driven premature chondrocyte senescence when titrated against ultrasensitive LC-MS/MS estradiol.',
      },
      {
        axis: 'PKC-β1 & Non-Genomic Signaling',
        target: 'Protein Kinase C-β1 Allosteric Site',
        kinetics: 'IC50 = 0.8 µM (4× potency vs 4-OHT)',
        effect: 'Inhibits PKC-β signaling independent of estrogen receptor occupancy, stabilizing mood and endothelial barrier tone.',
      },
    ],
    biomarkerTargets: [
      { marker: 'LH / FSH Pulsatility', target: 'LH 4.5–8.5 mIU/mL', rationale: 'Confirms hypothalamic-pituitary estrogen negative-feedback disinhibition' },
      { marker: 'Estradiol (Sensitive LC-MS/MS)', target: '22–38 pg/mL', rationale: 'Prevents silent serum E2 runaway behind ER blockade' },
      { marker: 'SHBG & IGF-1', target: 'IGF-1 Z-score preserved', rationale: 'Direct Z-Endoxifen avoids first-pass hepatic IGF-1 suppression seen with oral tamoxifen prodrug' },
    ],
    doseResponsePoints: [
      { doseMg: 1, erAlphaOccupancyPct: 58, cyp2d6VariancePct: 4 },
      { doseMg: 2, erAlphaOccupancyPct: 79, cyp2d6VariancePct: 4 },
      { doseMg: 4, erAlphaOccupancyPct: 92, cyp2d6VariancePct: 5 },
      { doseMg: 8, erAlphaOccupancyPct: 97, cyp2d6VariancePct: 5 },
    ],
    source: 'Wu et al., Cancer Research 2009 (PMID: 19244106); Goetz et al., J Clin Oncol 2017; Ahmad et al., Clin Pharmacol Ther 2010.',
  },
  {
    id: 'profile-fgfr3-cnp',
    compoundId: 'cmp-vosoritide',
    name: 'FGFR3 / CNP Epiphyseal Kinetics',
    subtitle: 'NPR-B / cGMP / PKGII Signaling vs FGFR3 MAPK Growth-Plate Arrest',
    classification: 'C-Type Natriuretic Peptide Analog (Vosoritide / CNP-38) · Epiphyseal Kinetics',
    standardWindow: '15 mcg/kg · Daily SubQ bolus (Synchronized to circadian chondrocyte window)',
    halfLifeH: 0.75,
    mechanisticSummary:
      'Binds transmembrane guanylyl cyclase NPR-B on proliferating and pre-hypertrophic growth-plate chondrocytes, elevating intracellular cGMP and activating PKGII to phosphorylate RAF-1 at Ser43—directly unblocking FGFR3-driven MEK1/2–ERK1/2 MAPK inhibition of endochondral ossification.',
    pathways: [
      {
        axis: 'NPR-B → cGMP → PKGII Cascade',
        target: 'Chondrocyte Transmembrane Guanylyl Cyclase B (NPR2)',
        kinetics: 'EC50 = 12 nM · Peak plasma cGMP at T+25 min',
        effect: 'Drives a 6–8× surge in intracellular and urinary cGMP/creatinine ratio, sustaining chondrocyte column architecture for 18–24 hours despite rapid plasma peptide clearance (t½ ~ 28–45 min).',
      },
      {
        axis: 'RAF-1 (Ser43) Cross-Inhibition of FGFR3 MAPK',
        target: 'FGFR3 → RAS → RAF-1 → MEK1/2 → ERK1/2 Axis',
        kinetics: '78% suppression of p-ERK1/2 nuclear translocation',
        effect: 'PKGII phosphorylation of RAF-1 halts constitutive FGFR3 signaling, restoring chondrocyte proliferation, extracellular matrix (aggrecan / Collagen X) synthesis, and hypertrophic cell volume.',
      },
      {
        axis: 'SOX9 & STAT1 Gatekeeping',
        target: 'Pre-hypertrophic to Hypertrophic Transition Zone',
        kinetics: 'Circadian osteogenic window coupling',
        effect: 'Prevents premature SOX9 stabilization and STAT1-mediated cell-cycle arrest while avoiding NPR-C clearance sink saturation via modified N-terminal Pro-Gly resistance to neutral endopeptidase (NEP).',
      },
    ],
    biomarkerTargets: [
      { marker: 'Collagen X Marker (CXM) / PINP', target: '+35–60% over baseline', rationale: 'Direct real-time serum biomarker of active hypertrophic growth-plate ossification velocity' },
      { marker: 'Urinary cGMP / Creatinine', target: 'Peak 2h post-dose > 2.5x baseline', rationale: 'Confirms target engagement at NPR-B guanylyl cyclase' },
      { marker: 'Bone Age / Epiphyseal Status & Orthostatic BP', target: 'Open physis · ΔBP < 8 mmHg', rationale: 'Requires open epiphyseal plates; monitors transient vascular smooth-muscle cGMP vasodilation' },
    ],
    doseResponsePoints: [
      { doseMcgKg: 2.5, mapkInhibitionPct: 28, cxmVelocityPct: 18 },
      { doseMcgKg: 7.5, mapkInhibitionPct: 56, cxmVelocityPct: 42 },
      { doseMcgKg: 15.0, mapkInhibitionPct: 78, cxmVelocityPct: 68 },
      { doseMcgKg: 30.0, mapkInhibitionPct: 84, cxmVelocityPct: 71 },
    ],
    source: 'Lorget et al., Am J Hum Genet 2012 (PMID: 23200862); Savarirayan et al., NEJM 2019 & Lancet 2020; Yasoda et al., Nat Med 2004.',
  },
];

// 1. Reconstitution & Draw + Inventory ("pins left / BAC water left" -> Shopping List)
export function calculateReconstitutionAndInventory({
  compoundName = 'Lyophilized Peptide',
  vialMassMg = 10,
  diluentMl = 2,
  targetDoseMcg = 250,
  activeFraction = 1.0,
  dosesTaken = 0,
  pinsInBox = 30,
  bacWaterBottleMl = 10,
  vialsReconstitutedCount = 1,
} = {}) {
  const mass = Math.max(0, Number(vialMassMg) || 0);
  const vol = Math.max(0, Number(diluentMl) || 0);
  const doseMcg = Math.max(0, Number(targetDoseMcg) || 0);
  const fraction = Math.min(1, Math.max(0.01, Number(activeFraction) || 1));
  const taken = Math.max(0, Math.floor(Number(dosesTaken) || 0));
  const totalPins = Math.max(0, Math.floor(Number(pinsInBox) || 0));
  const bottleMl = Math.max(0, Number(bacWaterBottleMl) || 0);
  const vialsUsed = Math.max(1, Math.floor(Number(vialsReconstitutedCount) || 1));

  const concMgMl = vol > 0 ? (mass * fraction) / vol : 0;
  const concMcgMl = concMgMl * 1000;
  const drawMl = concMcgMl > 0 ? doseMcg / concMcgMl : 0;
  const u100Units = drawMl * 100;

  const dosesPerVial = doseMcg > 0 ? Math.floor((mass * fraction * 1000) / doseMcg) : 0;
  const dosesLeftInVial = Math.max(0, dosesPerVial - (taken % (dosesPerVial || 1)));
  const pinsLeft = Math.max(0, totalPins - taken);
  const bacWaterLeftMl = Math.max(0, Number((bottleMl - vol * vialsUsed).toFixed(2)));

  const shoppingItems = [];
  if (pinsLeft <= 10) {
    shoppingItems.push({
      id: `shop-pins-${compoundName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      item: 'U-100 Insulin Syringes (31G 8mm, 0.3 mL / 0.5 mL, Box of 100)',
      urgency: pinsLeft <= 3 ? 'critical' : 'reorder_soon',
      reason: `${pinsLeft} pins remaining for ${compoundName} schedule`,
      estimatedCostUsd: 24,
    });
  }
  if (bacWaterLeftMl <= 3) {
    shoppingItems.push({
      id: `shop-bac-${compoundName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      item: 'USP Bacteriostatic Water (0.9% Benzyl Alcohol, 30 mL Vial)',
      urgency: bacWaterLeftMl <= 1.5 ? 'critical' : 'reorder_soon',
      reason: `${bacWaterLeftMl} mL BAC water remaining (${vol} mL needed per reconstitution)`,
      estimatedCostUsd: 16,
    });
  }
  if (dosesLeftInVial <= 4 && dosesPerVial > 0) {
    shoppingItems.push({
      id: `shop-vial-${compoundName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      item: `${compoundName} (${mass} mg Lyophilized Vial)`,
      urgency: dosesLeftInVial <= 2 ? 'critical' : 'reorder_soon',
      reason: `${dosesLeftInVial} draws left in current reconstituted vial`,
      estimatedCostUsd: 58,
    });
  }

  return {
    compoundName,
    vialMassMg: mass,
    diluentMl: vol,
    targetDoseMcg: doseMcg,
    activeFraction: fraction,
    concMgMl: Number(concMgMl.toFixed(4)),
    concMcgMl: Number(concMcgMl.toFixed(1)),
    drawMl: Number(drawMl.toFixed(4)),
    u100Units: Number(u100Units.toFixed(1)),
    dosesPerVial,
    dosesLeftInVial,
    pinsLeft,
    bacWaterLeftMl,
    shoppingItems,
  };
}

// 2. Frequency from Ester -> Calendar Pinning Schedule
export const ESTER_KINETICS = {
  suspension: { label: 'Aqueous / Unesterified', halfLifeH: 12, recommendedIntervalH: 12, esterWeightFraction: 1.0 },
  acetate: { label: 'Acetate', halfLifeH: 28, recommendedIntervalH: 24, esterWeightFraction: 0.87 },
  propionate: { label: 'Propionate', halfLifeH: 48, recommendedIntervalH: 48, esterWeightFraction: 0.83 },
  phenylpropionate: { label: 'Phenylpropionate', halfLifeH: 72, recommendedIntervalH: 72, esterWeightFraction: 0.69 },
  isocaproate: { label: 'Isocaproate', halfLifeH: 96, recommendedIntervalH: 72, esterWeightFraction: 0.72 },
  enanthate: { label: 'Enanthate', halfLifeH: 108, recommendedIntervalH: 84, esterWeightFraction: 0.72 },
  cypionate: { label: 'Cypionate', halfLifeH: 120, recommendedIntervalH: 84, esterWeightFraction: 0.70 },
  decanoate: { label: 'Decanoate', halfLifeH: 192, recommendedIntervalH: 168, esterWeightFraction: 0.64 },
  undecanoate: { label: 'Undecanoate', halfLifeH: 504, recommendedIntervalH: 168, esterWeightFraction: 0.61 },
};

export function generateEsterPinningSchedule({
  compoundName = 'Testosterone Cypionate',
  ester = 'cypionate',
  weeklyDoseMg = 140,
  concentrationMgMl = 200,
  cadenceMode = 'optimal', // 'optimal' | 'daily' | 'eod' | 'e3_5d' | 'weekly'
  startDateIso = '2026-11-08T08:00:00.000Z',
  weeks = 4,
} = {}) {
  const profile = ESTER_KINETICS[ester] || ESTER_KINETICS.cypionate;
  const cadenceMap = {
    optimal: profile.recommendedIntervalH,
    daily: 24,
    eod: 48,
    e3_5d: 84,
    weekly: 168,
  };
  const intervalH = cadenceMap[cadenceMode] || profile.recommendedIntervalH;
  const pinsPerWeek = 168 / intervalH;
  const dosePerPinMg = Number((Number(weeklyDoseMg) / pinsPerWeek).toFixed(2));
  const conc = Math.max(1, Number(concentrationMgMl) || 200);
  const drawMl = Number((dosePerPinMg / conc).toFixed(3));
  const u100Units = Number((drawMl * 100).toFixed(1));
  const activeBaseWeeklyMg = Number((Number(weeklyDoseMg) * profile.esterWeightFraction).toFixed(1));

  // Peak-to-trough ratio C_max / C_min at steady state for first-order elimination: exp(k_e * tau)
  const ke = Math.LN2 / profile.halfLifeH;
  const peakToTroughRatio = Number(Math.exp(ke * intervalH).toFixed(2));
  const fluctuationPct = Number(((1 - Math.exp(-ke * intervalH)) * 100).toFixed(1));

  const startMs = new Date(startDateIso).getTime();
  const totalOccurrences = Math.max(1, Math.min(60, Math.round((weeks * 168) / intervalH)));
  const events = [];

  for (let i = 0; i < totalOccurrences; i += 1) {
    const atMs = startMs + i * intervalH * 3600 * 1000;
    const atIso = new Date(atMs).toISOString();
    events.push({
      id: `pin-${ester}-${i + 1}`,
      kind: 'pinning',
      title: `${compoundName} (${profile.label}) — Pin #${i + 1}`,
      compoundName,
      ester: profile.label,
      occurred_at: atIso,
      scheduled_at: atIso,
      doseMg: dosePerPinMg,
      drawMl,
      u100Units,
      intervalH,
      note: `${dosePerPinMg} mg (${drawMl} mL / ${u100Units} U-100 units) · Steady-state peak/trough ${peakToTroughRatio}x`,
    });
  }

  return {
    compoundName,
    esterKey: ester,
    esterLabel: profile.label,
    halfLifeH: profile.halfLifeH,
    intervalH,
    intervalDays: Number((intervalH / 24).toFixed(2)),
    pinsPerWeek: Number(pinsPerWeek.toFixed(2)),
    weeklyDoseMg: Number(weeklyDoseMg),
    activeBaseWeeklyMg,
    dosePerPinMg,
    drawMl,
    u100Units,
    peakToTroughRatio,
    fluctuationPct,
    events,
  };
}

// 3. Cost & Shopping List ("Money Wasted / Money Saved")
const COMPOUND_COST_CATALOG = {
  telmisartan: { monthlyUsd: 18, optimalMonthlyUsd: 12, category: 'Hemodynamic / PPAR-γ', wasteRisk: 'low' },
  memantine: { monthlyUsd: 24, optimalMonthlyUsd: 16, category: 'Glutamatergic / LTP', wasteRisk: 'low' },
  endoxifen: { monthlyUsd: 64, optimalMonthlyUsd: 48, category: 'SERM / ERα-β', wasteRisk: 'low' },
  tamoxifen: { monthlyUsd: 38, optimalMonthlyUsd: 0, category: 'Prodrug SERM (CYP2D6 bottleneck)', wasteRisk: 'high', wasteReason: 'CYP2D6 polymorphism bottleneck & hepatic IGF-1 suppression vs direct Endoxifen' },
  vosoritide: { monthlyUsd: 290, optimalMonthlyUsd: 240, category: 'NPR-B / Epiphyseal', wasteRisk: 'low' },
  'ashwagandha': { monthlyUsd: 34, optimalMonthlyUsd: 0, category: 'Adaptogen', wasteRisk: 'high', wasteReason: '5-HT1A desensitization / blunted drive reward tradeoff for studying & cognition' },
  'magnesium oxide': { monthlyUsd: 22, optimalMonthlyUsd: 0, category: 'Low-bioavailability mineral', wasteRisk: 'high', wasteReason: '~4% intestinal fractional absorption; 96% osmotic GI waste vs Magnesium Glycinate/L-Threonate' },
  'alpha-gpc': { monthlyUsd: 42, optimalMonthlyUsd: 24, category: 'Cholinergic', wasteRisk: 'medium', wasteReason: 'Overpriced retail markup & TMAO conversion spike at >600 mg vs Citicoline (CDP-Choline)' },
  'citicoline': { monthlyUsd: 24, optimalMonthlyUsd: 22, category: 'Cholinergic / Uridine', wasteRisk: 'low' },
  'bpc-157': { monthlyUsd: 68, optimalMonthlyUsd: 52, category: 'Cytoprotective / Angiogenic', wasteRisk: 'low' },
  ' oral bpc-157': { monthlyUsd: 85, optimalMonthlyUsd: 52, category: 'Peptide', wasteRisk: 'medium', wasteReason: 'Unverified retail capsule markup vs reconstituted lyophilized vial' },
  'testosterone cypionate': { monthlyUsd: 45, optimalMonthlyUsd: 32, category: 'Androgen', wasteRisk: 'low' },
  'testosterone enanthate': { monthlyUsd: 45, optimalMonthlyUsd: 32, category: 'Androgen', wasteRisk: 'low' },
  'enclomiphene': { monthlyUsd: 55, optimalMonthlyUsd: 40, category: 'HPTA SERM', wasteRisk: 'low' },
  'clomiphene': { monthlyUsd: 48, optimalMonthlyUsd: 0, category: 'Mixed isomer SERM', wasteRisk: 'high', wasteReason: 'Zuclomiphene isomer (t½ > 14 days) accumulates as estrogenic agonist causing mood/visual sides' },
};

export function computeCostAndWasteAnalysis(items = [], auditConflicts = [], auditWaste = [], auditSwaps = [], inventoryReconstitutions = []) {
  let currentMonthlyUsd = 0;
  let wastedMonthlyUsd = 0;
  let optimizedMonthlyUsd = 0;
  const lineItems = [];

  for (const rawItem of items) {
    const name = String(rawItem.name || rawItem.title || rawItem || '').trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const matchedKey = Object.keys(COMPOUND_COST_CATALOG).find((k) => key.includes(k));
    const entry = matchedKey ? COMPOUND_COST_CATALOG[matchedKey] : { monthlyUsd: 36, optimalMonthlyUsd: 26, category: 'Protocol Entry', wasteRisk: 'medium' };

    const isSwappable = auditSwaps.some((s) => s.compound_id === rawItem.id || (s.title && s.title.toLowerCase().includes(key)));
    const isConflicting = auditConflicts.some((c) => (c.compound_ids || []).includes(rawItem.id) || (c.title && c.title.toLowerCase().includes(key)));
    const isWasteFlagged = auditWaste.some((w) => (w.compound_ids || []).includes(rawItem.id) || (w.title && w.title.toLowerCase().includes(key)));

    const monthlyCost = entry.monthlyUsd;
    let itemWaste = 0;
    let reason = entry.wasteReason || '';

    if (entry.wasteRisk === 'high' || isWasteFlagged || isSwappable) {
      itemWaste = Math.max(12, monthlyCost - entry.optimalMonthlyUsd);
      if (!reason) {
        reason = isSwappable
          ? 'Suboptimal form or bioavailability; smarter swap eliminates wasted spend'
          : 'Redundant receptor overlap or low fractional absorption';
      }
    } else if (isConflicting) {
      itemWaste = Math.round(monthlyCost * 0.5);
      reason = reason || 'Pharmacodynamic opposition cancels downstream effect';
    } else {
      itemWaste = Math.max(0, monthlyCost - entry.optimalMonthlyUsd);
      reason = reason || 'Direct clinical sourcing vs retail bottle markup';
    }

    currentMonthlyUsd += monthlyCost;
    wastedMonthlyUsd += itemWaste;
    optimizedMonthlyUsd += Math.max(0, monthlyCost - itemWaste);

    lineItems.push({
      name,
      category: entry.category,
      monthlyCostUsd: monthlyCost,
      wastedUsd: itemWaste,
      optimizedUsd: Math.max(0, monthlyCost - itemWaste),
      reason,
      flagged: itemWaste >= 12,
    });
  }

  // Merge auto-fed shopping list items from reconstitution inventory
  const autoShoppingList = [];
  for (const recon of inventoryReconstitutions) {
    if (Array.isArray(recon?.shoppingItems)) {
      autoShoppingList.push(...recon.shoppingItems);
    }
  }

  const monthlySavedUsd = wastedMonthlyUsd;
  const annualSavedUsd = monthlySavedUsd * 12;

  return {
    currentMonthlyUsd,
    wastedMonthlyUsd,
    monthlySavedUsd,
    annualSavedUsd,
    optimizedMonthlyUsd,
    wastePct: currentMonthlyUsd > 0 ? Math.round((wastedMonthlyUsd / currentMonthlyUsd) * 100) : 0,
    lineItems,
    autoShoppingList,
  };
}

// 4. Receptor-Overlap Map ("Your Stack's Map" — Shareable Moat)
const RECEPTOR_NODES = [
  { id: 'node-at1r', label: 'AT1R / RAAS', system: 'Vascular & Renal', x: 170, y: 110 },
  { id: 'node-ppar', label: 'PPAR-γ / GLUT4', system: 'Metabolic & Endothelial', x: 400, y: 90 },
  { id: 'node-nmda', label: 'Extrasynaptic NMDA', system: 'Glutamatergic Noise', x: 630, y: 110 },
  { id: 'node-ltp', label: 'Synaptic AMPA / LTP', system: 'Plasticity & Encoding', x: 760, y: 230 },
  { id: 'node-er', label: 'ERα / ERβ Co-Regulators', system: 'Endocrine & Epiphyseal', x: 630, y: 360 },
  { id: 'node-nprb', label: 'NPR-B / cGMP / FGFR3', system: 'Chondrocyte MAPK', x: 400, y: 380 },
  { id: 'node-cyp2d6', label: 'CYP2D6 / Hepatic Sink', system: 'Metabolic Clearance', x: 170, y: 360 },
  { id: 'node-hpta', label: 'AR / GnRH / HPTA', system: 'Gonadal Axis', x: 90, y: 230 },
];

const COMPOUND_RECEPTOR_LINKS = [
  {
    match: ['telmisartan'],
    name: 'Telmisartan',
    targets: [
      { nodeId: 'node-at1r', mode: 'antagonist', potency: 'Insurmountable (t½ 213m)' },
      { nodeId: 'node-ppar', mode: 'partial_agonist', potency: '27% Selective Agonism' },
    ],
  },
  {
    match: ['memantine'],
    name: 'Memantine',
    targets: [
      { nodeId: 'node-nmda', mode: 'antagonist', potency: 'Open-Channel Block' },
      { nodeId: 'node-ltp', mode: 'preserved', potency: 'Phasic Unblock (-20mV)' },
    ],
  },
  {
    match: ['endoxifen'],
    name: 'Endoxifen',
    targets: [
      { nodeId: 'node-er', mode: 'modulator', potency: 'AF-2 NCoR Recruitment' },
      { nodeId: 'node-hpta', mode: 'synergy', potency: 'GnRH Disinhibition' },
    ],
  },
  {
    match: ['tamoxifen'],
    name: 'Tamoxifen (Prodrug)',
    targets: [
      { nodeId: 'node-cyp2d6', mode: 'bottleneck', potency: 'Requires CYP2D6 4-OH/N-demethyl' },
      { nodeId: 'node-er', mode: 'modulator', potency: 'Variable Active Metabolite' },
    ],
  },
  {
    match: ['vosoritide', 'cnp', 'fgfr3'],
    name: 'Vosoritide (CNP-38)',
    targets: [
      { nodeId: 'node-nprb', mode: 'agonist', potency: 'cGMP → PKGII → RAF-1 Ser43' },
    ],
  },
  {
    match: ['testosterone', 'enanthate', 'cypionate', 'androgen'],
    name: 'Testosterone Ester',
    targets: [
      { nodeId: 'node-hpta', mode: 'agonist', potency: 'AR Saturation / LH Suppression' },
      { nodeId: 'node-at1r', mode: 'overlap_stress', potency: 'RAAS / Erythropoiesis Load' },
      { nodeId: 'node-er', mode: 'overlap_stress', potency: 'CYP19A1 Aromatization → E2' },
    ],
  },
  {
    match: ['enclomiphene', 'clomiphene', 'raloxifene'],
    name: 'Enclomiphene / SERM',
    targets: [
      { nodeId: 'node-er', mode: 'antagonist', potency: 'Pituitary ERα Blockade' },
      { nodeId: 'node-hpta', mode: 'synergy', potency: 'LH / FSH Pulse Amplification' },
    ],
  },
  {
    match: ['citicoline', 'alpha-gpc', 'choline', 'semax'],
    name: 'Cholinergic / Neurotrophic',
    targets: [
      { nodeId: 'node-ltp', mode: 'synergy', potency: 'ACh / BDNF TrkB Potentiation' },
    ],
  },
  {
    match: ['magnesium', 'threonate', 'glycinate', 'agmatine'],
    name: 'Magnesium / NMDA Co-Factor',
    targets: [
      { nodeId: 'node-nmda', mode: 'modulator', potency: 'Physiological Resting Pore Block' },
      { nodeId: 'node-ltp', mode: 'synergy', potency: 'Synaptic Density Support' },
    ],
  },
  {
    match: ['fluoxetine', 'paroxetine', 'bupropion', 'berberine'],
    name: 'CYP2D6 Inhibitor',
    targets: [
      { nodeId: 'node-cyp2d6', mode: 'overlap_stress', potency: 'Competitive CYP2D6 Blockade' },
    ],
  },
];

export function computeReceptorOverlapMap(rawEntries = []) {
  const normalized = rawEntries.map((item) => String(item?.name || item?.title || item || '').toLowerCase()).filter(Boolean);
  const matchedCompounds = [];

  for (const rule of COMPOUND_RECEPTOR_LINKS) {
    if (normalized.some((text) => rule.match.some((token) => text.includes(token)))) {
      matchedCompounds.push(rule);
    }
  }

  // Default showcase stack if empty so the Receptor Map always renders a meaningful scientific topology
  const activeRules = matchedCompounds.length > 0
    ? matchedCompounds
    : COMPOUND_RECEPTOR_LINKS.slice(0, 4);

  const nodeOccupancy = new Map();
  const edges = [];

  activeRules.forEach((compound, cIdx) => {
    compound.targets.forEach((t) => {
      const current = nodeOccupancy.get(t.nodeId) || [];
      current.push({ compound: compound.name, mode: t.mode, potency: t.potency });
      nodeOccupancy.set(t.nodeId, current);
      edges.push({
        id: `${compound.name}-${t.nodeId}`,
        compound: compound.name,
        compoundIndex: cIdx,
        nodeId: t.nodeId,
        mode: t.mode,
        potency: t.potency,
      });
    });
  });

  const nodes = RECEPTOR_NODES.map((node) => {
    const bindings = nodeOccupancy.get(node.id) || [];
    const hasConflict = bindings.some((b) => b.mode === 'overlap_stress' || b.mode === 'bottleneck') && bindings.length >= 2;
    const hasMitigation =
      (node.id === 'node-at1r' && bindings.some((b) => b.compound === 'Telmisartan') && bindings.some((b) => b.mode === 'overlap_stress')) ||
      (node.id === 'node-er' && bindings.some((b) => b.compound === 'Endoxifen' || b.compound.includes('SERM')));
    return {
      ...node,
      bindings,
      hitCount: bindings.length,
      state: hasMitigation ? 'protected_synergy' : hasConflict ? 'conflict_hotspot' : bindings.length > 0 ? 'engaged' : 'idle',
    };
  });

  const hotspots = nodes
    .filter((n) => n.hitCount >= 2 || n.bindings.some((b) => b.mode === 'bottleneck'))
    .map((n) => ({
      nodeId: n.id,
      receptor: n.label,
      system: n.system,
      status: n.state,
      summary:
        n.state === 'protected_synergy'
          ? `${n.bindings.map((b) => b.compound).join(' + ')}: Targeted receptor shielding active on ${n.label}.`
          : `${n.bindings.map((b) => `${b.compound} (${b.potency})`).join(' · ')} converge on ${n.label}.`,
    }));

  return {
    isDefaultSample: matchedCompounds.length === 0,
    compounds: activeRules.map((r) => r.name),
    nodes,
    edges,
    hotspots,
  };
}

// 4B. Epistemic Edge Encoding & 4-Layer Causal Cascade Tree Engine
// Layers: L1 (Compound & Route) -> L2 (Primary Target) -> L3 (Subcellular Mechanism) -> L4 (Phenotypic Goal)
export const EPISTEMIC_TIERS = {
  quantitative_pkpd: {
    id: 'quantitative_pkpd',
    label: 'Established Quantitative PK/PD',
    shortLabel: 'Quant PK/PD',
    strokeDasharray: 'none',
    uncertaintyLabel: '±4–8% · Calibrated Clinical Monograph / PBPK',
    confidenceRange: [90, 98],
    description: 'Direct human pharmacokinetic and receptor binding constants (Ki, IC50, t½) verified in FDA DailyMed monographs or randomized clinical trials.',
  },
  supported_mechanistic: {
    id: 'supported_mechanistic',
    label: 'Supported Qualitative Mechanism',
    shortLabel: 'Supported Mech',
    strokeDasharray: '8 3',
    uncertaintyLabel: '±12–15% · Peer-Reviewed Cellular / Translational',
    confidenceRange: [76, 89],
    description: 'Receptor-to-second-messenger cascade confirmed in primary human tissue or translational physiology, with individual variance in downstream magnitude.',
  },
  theoretical_frontier: {
    id: 'theoretical_frontier',
    label: 'Theoretical Frontier Hypothesis',
    shortLabel: 'Frontier ODE',
    strokeDasharray: '3 3',
    uncertaintyLabel: '±25–35% · Stipulated Mechanistic ODE / Extrapolated',
    confidenceRange: [52, 72],
    description: 'Mechanistic systems-pharmacology hypothesis or multi-agent synergy model extrapolated from biophysical Markov/ODE simulations without dedicated combination RCTs.',
  },
  contextual_association: {
    id: 'contextual_association',
    label: 'Contextual / Homeostatic Association',
    shortLabel: 'Contextual',
    strokeDasharray: '1.5 3.5',
    uncertaintyLabel: '±30–45% · Indirect / Environment-Dependent',
    confidenceRange: [40, 62],
    description: 'Downstream homeostatic correlate influenced by diet, sleep architecture, urinary pH, or baseline endocrine state.',
  },
};

export const INTERACTION_POLARITIES = {
  agonist: {
    id: 'agonist',
    label: 'Direct Agonism / Activation',
    glyph: '→',
    color: '#087d7a',
    bgTint: '#e6f7f5',
  },
  antagonist: {
    id: 'antagonist',
    label: 'Insurmountable / Open-Channel Blockade',
    glyph: '⊣',
    color: '#1d4ed8',
    bgTint: '#eff6ff',
  },
  partial_agonist: {
    id: 'partial_agonist',
    label: 'Selective Co-Regulator / Partial Modulation',
    glyph: '◈',
    color: '#0e7490',
    bgTint: '#ecfeff',
  },
  shielding_mitigation: {
    id: 'shielding_mitigation',
    label: 'Protective Receptor Shielding',
    glyph: '⊕',
    color: '#047857',
    bgTint: '#ecfdf5',
  },
  metabolic_bottleneck: {
    id: 'metabolic_bottleneck',
    label: 'Metabolic Sink / Competitive Bottleneck',
    glyph: '⊗',
    color: '#b45309',
    bgTint: '#fffbeb',
  },
  spillover_load: {
    id: 'spillover_load',
    label: 'Off-Target Spillover / Allostatic Load',
    glyph: '⚡',
    color: '#be123c',
    bgTint: '#fff1f2',
  },
};

const CASCADE_COMPOUND_CATALOG = [
  {
    id: 'l1-telmisartan',
    match: ['telmisartan', 'micardis'],
    name: 'Telmisartan',
    route: 'Oral · Benzimidazole Free Acid',
    halfLifeH: 24,
    tmaxH: 1.0,
    bioavailability: 0.43,
    defaultDose: '40 mg',
    circadianSlot: 'morning',
    windowHours: [7, 10],
    speciesType: 'Direct Active ARB / PPAR-γ Ligand',
  },
  {
    id: 'l1-memantine',
    match: ['memantine', 'namenda'],
    name: 'Memantine HCl',
    route: 'Oral · Uncompetitive Open-Channel Blocker',
    halfLifeH: 65,
    tmaxH: 4.5,
    bioavailability: 0.99,
    defaultDose: '10 mg',
    circadianSlot: 'morning',
    windowHours: [8, 12],
    speciesType: 'Direct Active Voltage-Dependent Blocker',
  },
  {
    id: 'l1-endoxifen',
    match: ['endoxifen', 'z-endoxifen'],
    name: 'Endoxifen ((Z)-Isomer)',
    route: 'Oral · Enteric Active SERM Metabolite',
    halfLifeH: 52,
    tmaxH: 3.0,
    bioavailability: 0.88,
    defaultDose: '4 mg',
    circadianSlot: 'midday',
    windowHours: [11, 15],
    speciesType: 'Direct Active Metabolite (CYP2D6-Independent)',
  },
  {
    id: 'l1-vosoritide',
    match: ['vosoritide', 'cnp', 'fgfr3'],
    name: 'Vosoritide (CNP-38)',
    route: 'SubQ Bolus · Modified rhCNP-38 Peptide',
    halfLifeH: 0.75,
    tmaxH: 0.45,
    bioavailability: 0.85,
    defaultDose: '1.1 mg (15 mcg/kg)',
    circadianSlot: 'midday',
    windowHours: [10, 12],
    speciesType: 'NEP-Resistant Peptide Agonist',
  },
  {
    id: 'l1-test-cyp',
    match: ['testosterone', 'cypionate', 'enanthate', 'test cyp', 'androgen'],
    name: 'Testosterone Cypionate',
    route: 'IM / SubQ Depot · 17β-Ester',
    halfLifeH: 120,
    tmaxH: 36,
    bioavailability: 0.95,
    defaultDose: '70 mg E3.5D',
    circadianSlot: 'morning',
    windowHours: [8, 11],
    speciesType: 'Ester Depot (Cleaved to Bioidentical T)',
  },
  {
    id: 'l1-tamoxifen',
    match: ['tamoxifen', 'nolvadex'],
    name: 'Tamoxifen Citrate',
    route: 'Oral · Triphenylethylene Prodrug',
    halfLifeH: 140,
    tmaxH: 5.0,
    bioavailability: 0.75,
    defaultDose: '20 mg',
    circadianSlot: 'morning',
    windowHours: [8, 12],
    speciesType: 'Hepatic Prodrug (Requires CYP2D6 → Endoxifen)',
  },
  {
    id: 'l1-citicoline',
    match: ['citicoline', 'cdp-choline', 'cognizin'],
    name: 'Citicoline (CDP-Choline)',
    route: 'Oral · Dual Choline + Cytidine Donor',
    halfLifeH: 56,
    tmaxH: 2.5,
    bioavailability: 0.92,
    defaultDose: '250 mg',
    circadianSlot: 'morning',
    windowHours: [7, 11],
    speciesType: 'Biphasic Metabolic Precursor',
  },
  {
    id: 'l1-alphagpc',
    match: ['alpha-gpc', 'alpha gpc'],
    name: 'Alpha-GPC',
    route: 'Oral · Choline Alfoscerate Bolus',
    halfLifeH: 5,
    tmaxH: 1.2,
    bioavailability: 0.85,
    defaultDose: '600 mg',
    circadianSlot: 'morning',
    windowHours: [8, 12],
    speciesType: 'Rapid Choline Donor (Gut TMA/TMAO Substrate)',
  },
  {
    id: 'l1-mgthreonate',
    match: ['magnesium l-threonate', 'threonate', 'magtein', 'glycinate'],
    name: 'Magnesium L-Threonate',
    route: 'Oral · Chelated CSF-Penetrant Mineral',
    halfLifeH: 12,
    tmaxH: 2.0,
    bioavailability: 0.65,
    defaultDose: '144 mg elemental',
    circadianSlot: 'evening',
    windowHours: [20, 23],
    speciesType: 'Bioavailable Allosteric Pore Co-Factor',
  },
  {
    id: 'l1-mgoxide',
    match: ['magnesium oxide', 'mg oxide'],
    name: 'Magnesium Oxide',
    route: 'Oral · Inorganic Oxide Salt',
    halfLifeH: 4,
    tmaxH: 1.5,
    bioavailability: 0.04,
    defaultDose: '400 mg',
    circadianSlot: 'evening',
    windowHours: [20, 23],
    speciesType: 'Poorly Soluble Salt (~4% Absorption)',
  },
];

const CASCADE_TARGETS_L2 = [
  { id: 'l2-at1r', label: 'AT1R Vascular & Adrenal', sublabel: 'Angiotensin II Type 1 Receptor', system: 'RAAS / Hemodynamic', y: 68 },
  { id: 'l2-ppar', label: 'PPAR-γ1/2 Nuclear LBD', sublabel: 'Selective Helix-12 Docking', system: 'Metabolic / Endothelial', y: 146 },
  { id: 'l2-glun2b', label: 'Extrasynaptic GluN2B Pore', sublabel: 'Resting -70 mV NMDA Channel', system: 'Glutamatergic Noise', y: 224 },
  { id: 'l2-ampa-nachr', label: 'Synaptic AMPA & α7-nAChR', sublabel: 'Phasic Depolarization Complex', system: 'Cholinergic / Plasticity', y: 302 },
  { id: 'l2-era-erb', label: 'ERα / ERβ LBD (AF-1/AF-2)', sublabel: 'Estrogen Co-Regulator Groove', system: 'Endocrine & Epiphyseal', y: 380 },
  { id: 'l2-nprb', label: 'NPR-B Guanylyl Cyclase', sublabel: 'Chondrocyte Transmembrane NPR2', system: 'Epiphyseal Growth Plate', y: 458 },
  { id: 'l2-cyp2d6', label: 'Hepatic CYP2D6 & First-Pass', sublabel: 'Microsomal Bioactivation / TMAO', system: 'Hepatic Clearance Sink', y: 536 },
  { id: 'l2-ar-hpta', label: 'Androgen Receptor & CYP19A1', sublabel: 'Myonuclear AR & Aromatase', system: 'Gonadal / Anabolic Axis', y: 614 },
];

const CASCADE_MECHANISMS_L3 = [
  { id: 'l3-enos-raas', label: 'Aldosterone & Vasoconstriction Clamp', sublabel: 'Efferent arteriolar decompression + eNOS preservation', y: 68 },
  { id: 'l3-pgc1a-glut4', label: 'PGC-1α & GLUT4 Translocation', sublabel: 'Adiponectin upregulation without ENaC Na⁺/fluid edema', y: 146 },
  { id: 'l3-ca2-filter', label: 'Tonic Ca²⁺ Excitotoxicity Filter', sublabel: 'Blocks chronic glutamate leak; prevents ΔFosB tolerance', y: 224 },
  { id: 'l3-ltp-ach', label: 'Phasic 100Hz LTP & Phospholipid Flux', sublabel: 'Rapid -20 mV Mg²⁺/Memantine unblock + Kennedy pathway', y: 302 },
  { id: 'l3-ncor-epiphysis', label: 'AF-2 NCoR Recruitment & Senescence Delay', sublabel: 'Restrains ERα chondrocyte exhaustion; disinhibits GnRH', y: 380 },
  { id: 'l3-cgmp-pkgii', label: 'cGMP → PKGII → RAF-1 Ser43 Block', sublabel: 'Halts FGFR3 MEK1/2–ERK1/2 growth-plate arrest for 22h', y: 458 },
  { id: 'l3-hepatic-sink', label: 'First-Pass IGF-1 & TMAO Metabolic Sink', sublabel: 'CYP2D6 prodrug bottleneck or gut TMA → hepatic FMO3 load', y: 536 },
  { id: 'l3-anabolic-epo', label: 'Myofibrillar Synthesis vs E2/Hct Spillover', sublabel: 'AR transcriptional drive paired with EPO & E2 aromatization', y: 614 },
];

const CASCADE_PHENOTYPES_L4 = [
  {
    id: 'goal-hemodynamic',
    goalKey: 'recovery',
    label: 'Hemodynamic & Renal Resilience',
    biomarker: 'Systolic BP < 118 mmHg · Cystatin C < 0.82 mg/L',
    y: 88,
  },
  {
    id: 'goal-metabolic',
    goalKey: 'fat_loss',
    label: 'Insulin Sensitivity & Endothelial Tone',
    biomarker: 'Fasting Insulin < 4.5 uIU/mL · 0% ENaC Edema',
    y: 196,
  },
  {
    id: 'goal-cognition',
    goalKey: 'cognition',
    label: 'Cortical Signal-to-Noise & LTP Encoding',
    biomarker: 'SNR Score ≥ 8.5/10 · 0% Dopaminergic Escalation',
    y: 304,
  },
  {
    id: 'goal-epiphyseal',
    goalKey: 'height',
    label: 'Epiphyseal Chondrocyte Velocity',
    biomarker: 'Collagen X (CXM) +48% · Preserved Hepatic IGF-1',
    y: 412,
  },
  {
    id: 'goal-endocrine',
    goalKey: 'bone',
    label: 'HPTA Autonomy & Anabolic Remodeling',
    biomarker: 'Sensitive E2 22–36 pg/mL · LH 4.5–8.5 mIU/mL',
    y: 530,
  },
];

const CASCADE_BASE_EDGES = [
  // Telmisartan cascade
  {
    id: 'e-telmi-at1r',
    fromId: 'l1-telmisartan',
    toId: 'l2-at1r',
    layerSpan: 'L1_L2',
    interactionType: 'antagonist',
    epistemicTier: 'quantitative_pkpd',
    confidencePct: 97,
    baseFlux: 88,
    quantitativeMetric: 'Ki = 3.7 nM · Dissociation t½ = 213 min',
    mechanismNote: 'Insurmountable non-competitive AT1 receptor docking via lipophilic benzimidazole tail.',
    temporalNote: {
      acute_d1_5: 'Immediate first-dose arteriolar vasodilation within 60–120 min; monitor seated BP.',
      subacute_d6_13: 'Plasma steady-state plateau reached by Day 5–7 with >85% 24h trough receptor occupancy.',
      chronic_d14_plus: 'Sustained regression of vascular smooth-muscle hypertrophy and glomerular efferent decompression.',
    },
    limitationNote: 'Does not block renin release directly; excessive sodium depletion can exaggerate first-dose hypotension.',
    source: 'DailyMed Telmisartan Monograph · Stangier et al., J Int Med Res 2000',
  },
  {
    id: 'e-telmi-ppar',
    fromId: 'l1-telmisartan',
    toId: 'l2-ppar',
    layerSpan: 'L1_L2',
    interactionType: 'partial_agonist',
    epistemicTier: 'supported_mechanistic',
    confidencePct: 86,
    baseFlux: 64,
    quantitativeMetric: 'EC50 = 4.5 µM · 27% Selective Partial Agonism',
    mechanismNote: 'Wraps around PPAR-γ Helix-3/Helix-12 differently than thiazolidinediones, recruiting PGC-1α while sparing DRIP205.',
    temporalNote: {
      acute_d1_5: 'Minimal metabolic shift in Days 1–5; nuclear receptor transcription requires cumulative occupancy.',
      subacute_d6_13: 'Early upregulation of adiponectin mRNA and skeletal muscle AMPK/GLUT4 trafficking.',
      chronic_d14_plus: 'Full partial PPAR-γ insulin sensitization and hs-CRP reduction established after 3–6 weeks.',
    },
    limitationNote: 'At 20 mg oral dosing, unbound tissue concentration barely reaches PPAR-γ EC50; 40–80 mg is required for robust nuclear activation.',
    source: 'Benson et al., Hypertension 2004 (PMID: 14757770) · Schupp et al., Circulation 2004',
  },
  // Memantine cascade
  {
    id: 'e-mem-glun2b',
    fromId: 'l1-memantine',
    toId: 'l2-glun2b',
    layerSpan: 'L1_L2',
    interactionType: 'antagonist',
    epistemicTier: 'quantitative_pkpd',
    confidencePct: 95,
    baseFlux: 82,
    quantitativeMetric: 'IC50 = 1.1 µM (-70 mV) · Uncompetitive Open-Channel Block',
    mechanismNote: 'Enters the NMDA pore only when opened by tonic extrasynaptic glutamate leak, blocking chronic Ca²⁺ influx.',
    temporalNote: {
      acute_d1_5: 'Accumulating plasma concentration (t½ = 65h); ~45% steady-state GluN2B block by Day 3.',
      subacute_d6_13: 'Approaching 90% steady-state CSF equilibrium by Day 10–12.',
      chronic_d14_plus: 'Stable 24h extrasynaptic GluN2B noise suppression preventing excitotoxic CREB shut-off.',
    },
    limitationNote: 'Renal clearance is strongly pH-dependent; urinary pH > 7.5 can reduce Memantine excretion by 80% and double plasma exposure.',
    source: 'Lipton, Nat Rev Drug Discov 2006 (PMID: 16424917) · Parsons et al., Neuropharmacology 2007',
  },
  {
    id: 'e-mem-ampa-nachr',
    fromId: 'l1-memantine',
    toId: 'l2-ampa-nachr',
    layerSpan: 'L1_L2',
    interactionType: 'partial_agonist',
    epistemicTier: 'supported_mechanistic',
    confidencePct: 82,
    baseFlux: 74,
    quantitativeMetric: 'τ_unblock = 0.8 s (-20 mV) · α7-nAChR IC50 = 0.34 µM',
    mechanismNote: 'Rapidly exits synaptic NMDA channels during phasic 100 Hz AMPA depolarization, but transiently blocks α7-nAChR during initiation.',
    temporalNote: {
      acute_d1_5: 'CAUTION: Transient α7-nAChR antagonism causes temporary cognitive fog during Days 1–5 if dosed in the morning without titration.',
      subacute_d6_13: 'Compensatory nicotinic α7 receptor upregulation crosses baseline between Days 6–10.',
      chronic_d14_plus: 'Upregulated α7-nAChR density + preserved phasic synaptic LTP yields high cortical signal-to-noise.',
    },
    limitationNote: 'Supratherapeutic doses (>30 mg/d) begin encroaching on phasic synaptic NMDA channels and blunt LTP.',
    source: 'Aracava et al., J Pharmacol Exp Ther 2005 · Xia et al., J Neurosci 2010',
  },
  // Endoxifen cascade
  {
    id: 'e-endox-er',
    fromId: 'l1-endoxifen',
    toId: 'l2-era-erb',
    layerSpan: 'L1_L2',
    interactionType: 'partial_agonist',
    epistemicTier: 'quantitative_pkpd',
    confidencePct: 94,
    baseFlux: 92,
    quantitativeMetric: 'ERα IC50 = 3.0 nM · 100× potency vs parent Tamoxifen',
    mechanismNote: 'Direct active (Z)-isomer binds ERα/ERβ LBD and displaces Helix-12, recruiting NCoR/SMRT corepressors in hypothalamus and growth plate.',
    temporalNote: {
      acute_d1_5: 'Immediate ERα occupancy from Dose 1 without waiting for hepatic CYP2D6 prodrug conversion.',
      subacute_d6_13: 'Hypothalamic GnRH pulse frequency and pituitary LH/FSH amplitude rise steadily across Week 1–2.',
      chronic_d14_plus: 'Steady-state ERα proteasomal turnover and epiphyseal senescence restraint with preserved hepatic IGF-1.',
    },
    limitationNote: 'Tissue-selective SERM activity depends on cellular NCoR vs SRC-1 co-regulator expression ratios.',
    source: 'Goetz et al., J Clin Oncol 2017 · Wu et al., Cancer Res 2009 (PMID: 19244106)',
  },
  // Tamoxifen prodrug cascade
  {
    id: 'e-tamox-cyp2d6',
    fromId: 'l1-tamoxifen',
    toId: 'l2-cyp2d6',
    layerSpan: 'L1_L2',
    interactionType: 'metabolic_bottleneck',
    epistemicTier: 'quantitative_pkpd',
    confidencePct: 96,
    baseFlux: 78,
    quantitativeMetric: 'CYP2D6 4-Hydroxylation Rate-Limiting Step',
    mechanismNote: 'Requires two-step hepatic bioactivation (N-demethylation + CYP2D6 4-hydroxylation) to generate active Endoxifen while flooding first-pass liver ERα.',
    temporalNote: {
      acute_d1_5: 'Parent Tamoxifen accumulates first; active Endoxifen metabolite lags behind for 7–14 days.',
      subacute_d6_13: 'First-pass hepatic estrogenic agonism suppresses circulating IGF-1 by 25–38% and elevates SHBG.',
      chronic_d14_plus: 'Steady-state Endoxifen remains severely blunted in CYP2D6 *1/*4 or *4/*4 metabolizers or under SSRI/CYP2D6 inhibitor co-administration.',
    },
    limitationNote: 'Up to 30% of patients have sub-therapeutic Endoxifen conversion despite full Tamoxifen compliance.',
    source: 'Goetz et al., J Clin Oncol 2017 · Jin et al., J Natl Cancer Inst 2005',
  },
  {
    id: 'e-tamox-er',
    fromId: 'l1-tamoxifen',
    toId: 'l2-era-erb',
    layerSpan: 'L1_L2',
    interactionType: 'partial_agonist',
    epistemicTier: 'supported_mechanistic',
    confidencePct: 79,
    baseFlux: 54,
    quantitativeMetric: 'Parent Tamoxifen ERα Ki ~ 45 nM (Weak without CYP2D6)',
    mechanismNote: 'Variable downstream ERα occupancy wholly dependent on hepatic CYP2D6 conversion efficiency.',
    temporalNote: {
      acute_d1_5: 'Low initial receptor potency until secondary metabolites accumulate.',
      subacute_d6_13: 'Moderate ERα blockade if CYP2D6 is wild-type (*1/*1).',
      chronic_d14_plus: 'High inter-individual variance and hepatic IGF-1 trade-off.',
    },
    limitationNote: 'Inferior to direct (Z)-Endoxifen when IGF-1 preservation or CYP2D6 independence is required.',
    source: 'Wu et al., Cancer Res 2009',
  },
  // Vosoritide cascade
  {
    id: 'e-voso-nprb',
    fromId: 'l1-vosoritide',
    toId: 'l2-nprb',
    layerSpan: 'L1_L2',
    interactionType: 'agonist',
    epistemicTier: 'quantitative_pkpd',
    confidencePct: 95,
    baseFlux: 89,
    quantitativeMetric: 'NPR-B EC50 = 12 nM · Plasma t½ = 38 min · Tissue cascade = 22h',
    mechanismNote: 'Binds chondrocyte transmembrane NPR-B homodimer, triggering a 6–8× surge in intracellular cGMP.',
    temporalNote: {
      acute_d1_5: 'Peak plasma cGMP at T+25 min; administer post-meal with 250 mL water to prevent transient orthostatic vasodilation.',
      subacute_d6_13: 'Urinary cGMP/creatinine pulse stabilizes; proliferating chondrocyte columns reorganize.',
      chronic_d14_plus: 'Sustained +45–60% elevation in serum Collagen X Marker (CXM) and endochondral ossification velocity while physis remains open.',
    },
    limitationNote: 'Requires open epiphyseal growth plates (Greulich-Pyle bone age verification); zero longitudinal effect after epiphyseal fusion.',
    source: 'Savarirayan et al., NEJM 2019 (PMID: 31216405) · Lorget et al., Am J Hum Genet 2012',
  },
  // Testosterone Cypionate cascade
  {
    id: 'e-test-ar',
    fromId: 'l1-test-cyp',
    toId: 'l2-ar-hpta',
    layerSpan: 'L1_L2',
    interactionType: 'agonist',
    epistemicTier: 'quantitative_pkpd',
    confidencePct: 98,
    baseFlux: 90,
    quantitativeMetric: 'AR Kd = 0.4 nM · Depot t½ = 120 h',
    mechanismNote: 'Saturates skeletal muscle and osteoblast androgen receptors while exerting negative feedback on hypothalamic-pituitary LH/FSH.',
    temporalNote: {
      acute_d1_5: 'Initial depot cleavage; wideweekly boluses create supraphysiological 48h peaks that drive aromatase.',
      subacute_d6_13: 'Cumulating ester depot (steady state at ~5 half-lives / Day 25); E3.5D or EOD micro-cadence flattens peaks.',
      chronic_d14_plus: 'Full myonuclear AR transcriptional activation alongside erythropoietin and CYP19A1 aromatization load.',
    },
    limitationNote: 'Suppresses endogenous GnRH/LH/FSH unless paired with HPTA guardrails.',
    source: 'Nieschlag & Behre, Testosterone: Action, Deficiency, Substitution',
  },
  {
    id: 'e-test-at1r-spill',
    fromId: 'l1-test-cyp',
    toId: 'l2-at1r',
    layerSpan: 'L1_L2',
    interactionType: 'spillover_load',
    epistemicTier: 'supported_mechanistic',
    confidencePct: 85,
    baseFlux: 62,
    quantitativeMetric: 'Renal AngII / Aldosterone & Erythropoietin Upregulation',
    mechanismNote: 'Supraphysiological androgen exposure upregulates renal angiotensinogen, AT1R expression, and hematocrit viscosity.',
    temporalNote: {
      acute_d1_5: 'Early sodium/water retention if bolus peaks trigger aldosterone and estrogenic spillover.',
      subacute_d6_13: 'Rising sympathetic vascular tone if unshielded by an ARB.',
      chronic_d14_plus: 'Cumulative hematocrit drift and left-ventricular concentric remodeling risk unless shielded by Telmisartan AT1R blockade.',
    },
    limitationNote: 'Magnitude scales non-linearly with peak-to-trough ester fluctuation.',
    source: 'Benson et al., 2004 · Bachmann et al., Am J Physiol',
  },
  {
    id: 'e-test-er-spill',
    fromId: 'l1-test-cyp',
    toId: 'l2-era-erb',
    layerSpan: 'L1_L2',
    interactionType: 'spillover_load',
    epistemicTier: 'quantitative_pkpd',
    confidencePct: 93,
    baseFlux: 58,
    quantitativeMetric: 'CYP19A1 Aromatization (~0.3–0.5% T → Estradiol)',
    mechanismNote: 'Aromatization of peak free testosterone elevates tissue estradiol (E2), accelerating growth-plate senescence or mammary ERα activation if unguarded.',
    temporalNote: {
      acute_d1_5: 'E2 tracks free T peaks within 24–36h post-pin.',
      subacute_d6_13: 'Stabilizes when pinning cadence is split to E3.5D or EOD.',
      chronic_d14_plus: 'Requires Ultrasensitive LC-MS/MS E2 monitoring (20–38 pg/mL) and selective ERα modulation if epiphyseal preservation is targeted.',
    },
    limitationNote: 'Immunoassay E2 tests fail to resolve low-range male/epiphyseal estradiol accurately; LC-MS/MS is mandatory.',
    source: 'Goetz et al., 2017',
  },
  // Citicoline & Alpha-GPC & Magnesium cascades
  {
    id: 'e-citi-nachr',
    fromId: 'l1-citicoline',
    toId: 'l2-ampa-nachr',
    layerSpan: 'L1_L2',
    interactionType: 'agonist',
    epistemicTier: 'supported_mechanistic',
    confidencePct: 88,
    baseFlux: 80,
    quantitativeMetric: '92% Bioavailability · Dual Choline + Uridine Flux',
    mechanismNote: 'Supplies choline for phasic synaptic acetylcholine synthesis and cytidine→uridine for Kennedy-pathway phosphatidylcholine & striatal D2 density.',
    temporalNote: {
      acute_d1_5: 'Immediate prefrontal cholinergic support; counterbalances Memantine Day 1–5 α7-nAChR adaptation.',
      subacute_d6_13: 'Accelerates synaptic membrane phospholipid synthesis.',
      chronic_d14_plus: 'Synergizes with Memantine: Citicoline amplifies phasic synaptic signal while Memantine suppresses tonic extrasynaptic noise.',
    },
    limitationNote: 'High evening doses (>500 mg) may delay sleep onset via dopaminergic/cholinergic arousal.',
    source: 'Secades & Lorenzo, Methods Find Exp Clin Pharmacol 2006',
  },
  {
    id: 'e-agpc-nachr',
    fromId: 'l1-alphagpc',
    toId: 'l2-ampa-nachr',
    layerSpan: 'L1_L2',
    interactionType: 'agonist',
    epistemicTier: 'supported_mechanistic',
    confidencePct: 80,
    baseFlux: 68,
    quantitativeMetric: 'Rapid ACh Spike (t½ ~ 5h) · Lacks Cytidine/Uridine',
    mechanismNote: 'Delivers free choline across the blood-brain barrier but lacks the cytidine/uridine pyrimidine component required for full Kennedy-pathway membrane repair.',
    temporalNote: {
      acute_d1_5: 'Sharp 1–3h cholinergic peak followed by rapid afternoon drop-off.',
      subacute_d6_13: 'Repeated high bolus doses can cause cholinergic mood depression in sensitive individuals.',
      chronic_d14_plus: 'Inferior membrane phospholipid remodeling compared to Citicoline.',
    },
    limitationNote: 'High bolus doses undergo gut microbial TMA lyase cleavage.',
    source: 'Wang et al., JAMA Netw Open 2021',
  },
  {
    id: 'e-agpc-sink',
    fromId: 'l1-alphagpc',
    toId: 'l2-cyp2d6',
    layerSpan: 'L1_L2',
    interactionType: 'spillover_load',
    epistemicTier: 'supported_mechanistic',
    confidencePct: 84,
    baseFlux: 65,
    quantitativeMetric: 'Gut TMA → Hepatic FMO3 → Pro-Atherogenic TMAO Spike',
    mechanismNote: 'Unabsorbed intestinal choline bolus is cleaved by gut microbiota into trimethylamine (TMA) and oxidized by hepatic FMO3 to TMAO.',
    temporalNote: {
      acute_d1_5: 'Post-prandial plasma TMAO surge within 4–6 hours of >600 mg bolus.',
      subacute_d6_13: 'Sustained elevation in circulating TMAO if gut TMA-lyase flora are abundant.',
      chronic_d14_plus: 'Endothelial inflammatory load; eliminated by swapping to Citicoline (CDP-Choline).',
    },
    limitationNote: 'TMAO conversion varies with microbiome composition and dietary carnitine/choline intake.',
    source: 'Wang et al., JAMA Netw Open 2021',
  },
  {
    id: 'e-mgthr-glun2b',
    fromId: 'l1-mgthreonate',
    toId: 'l2-glun2b',
    layerSpan: 'L1_L2',
    interactionType: 'shielding_mitigation',
    epistemicTier: 'supported_mechanistic',
    confidencePct: 83,
    baseFlux: 72,
    quantitativeMetric: '+15% CSF [Mg²⁺] · Physiological -70 mV Pore Gate',
    mechanismNote: 'Elevates cerebrospinal fluid Mg²⁺, reinforcing the physiological resting voltage-dependent block of NMDA channels alongside Memantine.',
    temporalNote: {
      acute_d1_5: 'Supports evening parasympathetic wind-down.',
      subacute_d6_13: 'Gradual intracellular and CSF Mg²⁺ replenishment over 7–14 days.',
      chronic_d14_plus: 'Upregulates prefrontal and hippocampal synaptic density.',
    },
    limitationNote: 'Translational CSF magnitude in humans is more modest than rodent Slutsky 2010 models.',
    source: 'Slutsky et al., Neuron 2010',
  },
  {
    id: 'e-mgox-sink',
    fromId: 'l1-mgoxide',
    toId: 'l2-cyp2d6',
    layerSpan: 'L1_L2',
    interactionType: 'metabolic_bottleneck',
    epistemicTier: 'quantitative_pkpd',
    confidencePct: 96,
    baseFlux: 85,
    quantitativeMetric: '~4% Fractional Intestinal Absorption (96% GI Osmotic Waste)',
    mechanismNote: 'Inorganic Magnesium Oxide fails to cross intestinal epithelium at neutral pH, acting as an unabsorbed osmotic lumen sink.',
    temporalNote: {
      acute_d1_5: 'Osmotic GI water draw and accelerated transit can impair absorption of co-administered oral compounds.',
      subacute_d6_13: 'Negligible change in intracellular RBC or CSF Mg²⁺.',
      chronic_d14_plus: '96% wasted spend; swap to Magnesium L-Threonate or Bisglycinate.',
    },
    limitationNote: 'Confirmed across crossover bioavailability studies.',
    source: 'Firoz & Graber, Magnes Res 2001',
  },

  // L2 -> L3 Target-to-Subcellular Mechanism Edges
  {
    id: 'e-at1r-enos',
    fromId: 'l2-at1r',
    toId: 'l3-enos-raas',
    layerSpan: 'L2_L3',
    interactionType: 'shielding_mitigation',
    epistemicTier: 'quantitative_pkpd',
    confidencePct: 96,
    baseFlux: 90,
    quantitativeMetric: 'Efferent Resistance -24% · Aldosterone Clamp',
    mechanismNote: 'Blocks AT1R Gq/11 phospholipase C vasoconstriction and uncouples NADPH oxidase superoxide generation, preserving endothelial eNOS.',
    temporalNote: {
      acute_d1_5: 'Immediate reduction in total peripheral resistance.',
      subacute_d6_13: 'Stabilizes glomerular filtration pressure and blunts androgen water retention.',
      chronic_d14_plus: 'Protects Cystatin C / eGFR and attenuates angiotensin-II erythropoietin stimulation.',
    },
    limitationNote: 'Monitor serum potassium if combined with potassium-sparing agents.',
    source: 'Benson et al., Hypertension 2004',
  },
  {
    id: 'e-ppar-pgc1a',
    fromId: 'l2-ppar',
    toId: 'l3-pgc1a-glut4',
    layerSpan: 'L2_L3',
    interactionType: 'partial_agonist',
    epistemicTier: 'supported_mechanistic',
    confidencePct: 85,
    baseFlux: 68,
    quantitativeMetric: 'PGC-1α / Adiponectin Upregulation · 0% ENaC Edema',
    mechanismNote: 'Selective PPAR-γ modulation enhances skeletal muscle GLUT4 translocation and hepatic β-oxidation while avoiding renal collecting-duct ENaC fluid retention.',
    temporalNote: {
      acute_d1_5: 'Transcriptional priming.',
      subacute_d6_13: 'Improved post-prandial glucose disposal.',
      chronic_d14_plus: 'Lowered fasting insulin, HOMA-IR, and neurovascular inflammatory cytokines.',
    },
    limitationNote: 'Effect size is ~27% of full thiazolidinedione agonists by design to avoid edema/bone loss.',
    source: 'Schupp et al., Circulation 2004',
  },
  {
    id: 'e-glun2b-ca2',
    fromId: 'l2-glun2b',
    toId: 'l3-ca2-filter',
    layerSpan: 'L2_L3',
    interactionType: 'antagonist',
    epistemicTier: 'quantitative_pkpd',
    confidencePct: 93,
    baseFlux: 84,
    quantitativeMetric: '-74% Extrasynaptic Tonic Ca²⁺ Leak',
    mechanismNote: 'Prevents tonic extrasynaptic GluN2B Ca²⁺ influx from activating calcineurin/p38-MAPK apoptosis and halts ΔFosB dopaminergic tolerance drift.',
    temporalNote: {
      acute_d1_5: 'Progressive reduction in afternoon cognitive fatigue and glutamate spillover.',
      subacute_d6_13: 'Stabilization of prefrontal excitatory/inhibitory (E/I) balance.',
      chronic_d14_plus: 'Sustained protection against stimulant or catecholaminergic receptor downregulation.',
    },
    limitationNote: 'Does not replace sleep-dependent glymphatic clearance.',
    source: 'Lipton, Nat Rev Drug Discov 2006',
  },
  {
    id: 'e-ampa-ltp',
    fromId: 'l2-ampa-nachr',
    toId: 'l3-ltp-ach',
    layerSpan: 'L2_L3',
    interactionType: 'agonist',
    epistemicTier: 'supported_mechanistic',
    confidencePct: 87,
    baseFlux: 82,
    quantitativeMetric: '95% Synaptic Phasic LTP Preserved + CDP-Choline Flux',
    mechanismNote: 'High-frequency synaptic AMPA depolarization (-20 mV) expels open-channel blockers in <0.8s, allowing clean CaMKII/CREB long-term potentiation.',
    temporalNote: {
      acute_d1_5: 'During Days 1–5, Citicoline co-administration buffers transient Memantine α7-nAChR antagonism.',
      subacute_d6_13: 'Nicotinic α7 upregulation amplifies prefrontal attentional gating.',
      chronic_d14_plus: 'High-contrast synaptic encoding (low tonic background noise + high phasic LTP peak).',
    },
    limitationNote: 'Synergy between Memantine and Citicoline is a supported systems-neuroscience mechanism without a large Phase III dual-agent trial.',
    source: 'Xia et al., J Neurosci 2010 · Secades & Lorenzo 2006',
  },
  {
    id: 'e-er-ncor',
    fromId: 'l2-era-erb',
    toId: 'l3-ncor-epiphysis',
    layerSpan: 'L2_L3',
    interactionType: 'partial_agonist',
    epistemicTier: 'theoretical_frontier',
    confidencePct: 71,
    baseFlux: 86,
    quantitativeMetric: 'Epiphyseal ERα Senescence Restraint + LH Disinhibition',
    mechanismNote: 'AF-2 NCoR recruitment blocks estrogen-accelerated chondrocyte stem-cell exhaustion in the resting zone while preserving osteoblast AF-1 trabecular density.',
    temporalNote: {
      acute_d1_5: 'Immediate pituitary ERα negative-feedback release.',
      subacute_d6_13: 'LH/FSH pulsatility rises; monitor Ultrasensitive E2.',
      chronic_d14_plus: 'Extends the open epiphyseal proliferation window for concurrent NPR-B/cGMP signaling.',
    },
    limitationNote: 'FRONTIER HYPOTHESIS: While ERα senescence gating and Endoxifen PK are clinically established, combined Endoxifen + Vosoritide epiphyseal extension is a theoretical systems model.',
    source: 'Goetz et al., 2017 · Weise et al., PNAS 2001 (Estrogen senescence model)',
  },
  {
    id: 'e-nprb-pkgii',
    fromId: 'l2-nprb',
    toId: 'l3-cgmp-pkgii',
    layerSpan: 'L2_L3',
    interactionType: 'agonist',
    epistemicTier: 'quantitative_pkpd',
    confidencePct: 94,
    baseFlux: 88,
    quantitativeMetric: 'PKGII → RAF-1 Ser43 Phosphorylation (-78% p-ERK1/2)',
    mechanismNote: 'cGMP activates type II cGMP-dependent protein kinase (PKGII), which phosphorylates RAF-1 at Ser43 and blocks FGFR3 MAPK chondrocyte arrest.',
    temporalNote: {
      acute_d1_5: 'Rapid cGMP surge within 30 min of SubQ bolus.',
      subacute_d6_13: 'Hypertrophic chondrocyte cell volume and aggrecan matrix synthesis expand.',
      chronic_d14_plus: 'Sustained elevation of serum Collagen X Marker (CXM) and annualized linear growth velocity.',
    },
    limitationNote: 'Biological tissue effect (22h) far outlasts plasma half-life (38 min) due to intracellular PKGII/ERK1/2 dephosphorylation kinetics.',
    source: 'Lorget et al., Am J Hum Genet 2012 · Savarirayan et al., NEJM 2019',
  },
  {
    id: 'e-cyp2d6-sink',
    fromId: 'l2-cyp2d6',
    toId: 'l3-hepatic-sink',
    layerSpan: 'L2_L3',
    interactionType: 'metabolic_bottleneck',
    epistemicTier: 'quantitative_pkpd',
    confidencePct: 95,
    baseFlux: 76,
    quantitativeMetric: 'CYP2D6 Polymorphism Bottleneck & First-Pass IGF-1 Drop',
    mechanismNote: 'Prodrug conversion bottleneck or unabsorbed intestinal choline/oxide load creates hepatic first-pass IGF-1 suppression, TMAO elevation, or GI waste.',
    temporalNote: {
      acute_d1_5: 'Immediate first-pass hepatic exposure.',
      subacute_d6_13: 'Serum IGF-1 drops 25–38% on oral Tamoxifen prodrug.',
      chronic_d14_plus: 'Bypassed completely by swapping Tamoxifen → Direct Endoxifen and Alpha-GPC → Citicoline.',
    },
    limitationNote: 'Genotype-dependent (*1/*1 vs *1/*4 vs *4/*4).',
    source: 'Goetz et al., J Clin Oncol 2017',
  },
  {
    id: 'e-ar-anabolic',
    fromId: 'l2-ar-hpta',
    toId: 'l3-anabolic-epo',
    layerSpan: 'L2_L3',
    interactionType: 'agonist',
    epistemicTier: 'quantitative_pkpd',
    confidencePct: 96,
    baseFlux: 88,
    quantitativeMetric: 'Myofibrillar Protein Synthesis + Erythropoietin Drive',
    mechanismNote: 'Androgen receptor dimerization drives satellite-cell myogenesis and bone periosteal apposition while stimulating renal EPO and aromatase.',
    temporalNote: {
      acute_d1_5: 'Intracellular nitrogen and glycogen retention.',
      subacute_d6_13: 'Rising reticulocyte and red cell mass.',
      chronic_d14_plus: 'Requires hematocrit (<49.5%), Sensitive E2, and Cystatin C surveillance.',
    },
    limitationNote: 'Supraphysiological peaks increase E2 and hematocrit viscosity if cadence is wider than E3.5D.',
    source: 'Bhasin et al., NEJM 1996',
  },

  // L3 -> L4 Subcellular Mechanism-to-Phenotypic Goal Edges
  {
    id: 'e-enos-hemo',
    fromId: 'l3-enos-raas',
    toId: 'goal-hemodynamic',
    layerSpan: 'L3_L4',
    interactionType: 'shielding_mitigation',
    epistemicTier: 'quantitative_pkpd',
    confidencePct: 96,
    baseFlux: 91,
    quantitativeMetric: 'Systolic BP -8 to -12 mmHg · eGFR Preserved',
    mechanismNote: 'Sustained AT1R blockade + eNOS preservation maintains normotensive renal perfusion and shields against androgen/catecholamine hemodynamic strain.',
    temporalNote: {
      acute_d1_5: 'Seated systolic BP begins normalizing within 48–72 hours.',
      subacute_d6_13: 'Elimination of evening facial flushing and aldosterone water retention.',
      chronic_d14_plus: 'Long-term glomerular and left-ventricular protection.',
    },
    limitationNote: 'Verify seated and orthostatic BP baselines.',
    source: 'Benson et al., 2004',
  },
  {
    id: 'e-pgc1a-meta',
    fromId: 'l3-pgc1a-glut4',
    toId: 'goal-metabolic',
    layerSpan: 'L3_L4',
    interactionType: 'agonist',
    epistemicTier: 'supported_mechanistic',
    confidencePct: 86,
    baseFlux: 74,
    quantitativeMetric: 'Fasting Insulin & HOMA-IR Improvement',
    mechanismNote: 'Selective PPAR-γ co-activator recruitment increases peripheral insulin sensitivity and endothelial barrier integrity without fluid retention.',
    temporalNote: {
      acute_d1_5: 'Early transcriptional phase.',
      subacute_d6_13: 'Measurable shift in post-meal glycemic excursion.',
      chronic_d14_plus: 'Sustained fasting insulin < 4.5 uIU/mL and neurovascular metabolic support.',
    },
    limitationNote: 'Synergizes with aerobic zone-2 mitochondrial biogenesis.',
    source: 'Schupp et al., Circulation 2004',
  },
  {
    id: 'e-pgc1a-cog',
    fromId: 'l3-pgc1a-glut4',
    toId: 'goal-cognition',
    layerSpan: 'L3_L4',
    interactionType: 'shielding_mitigation',
    epistemicTier: 'contextual_association',
    confidencePct: 64,
    baseFlux: 56,
    quantitativeMetric: 'Cerebrovascular Blood-Brain Barrier & Microglial Calm',
    mechanismNote: 'Central AT1R blockade and PPAR-γ activation attenuate neurovascular inflammation and support prefrontal perfusion.',
    temporalNote: {
      acute_d1_5: 'Indirect baseline vascular support.',
      subacute_d6_13: 'Reduced afternoon autonomic arousal.',
      chronic_d14_plus: 'Contextual neuroprotective background for glutamatergic/cholinergic stack.',
    },
    limitationNote: 'CONTEXTUAL ASSOCIATION: Contributes permissive cerebrovascular support rather than direct acute neurotransmitter gating.',
    source: 'Anderson et al., Lancet Neurol',
  },
  {
    id: 'e-ca2-cog',
    fromId: 'l3-ca2-filter',
    toId: 'goal-cognition',
    layerSpan: 'L3_L4',
    interactionType: 'shielding_mitigation',
    epistemicTier: 'supported_mechanistic',
    confidencePct: 89,
    baseFlux: 86,
    quantitativeMetric: 'Signal-to-Noise Ratio +2.3 pts · 0% Tolerance Drift',
    mechanismNote: 'Suppressing tonic extrasynaptic GluN2B Ca²⁺ noise lowers the cortical noise floor so phasic synaptic signals stand out with high fidelity.',
    temporalNote: {
      acute_d1_5: 'Transitioning through α7-nAChR adaptation window (bedtime dosing recommended Days 1–5).',
      subacute_d6_13: 'Noise floor drops; afternoon glutamate fatigue resolves.',
      chronic_d14_plus: 'Peak working-memory endurance and protection against dopaminergic tolerance.',
    },
    limitationNote: 'Subjective SNR gains depend on clearing the initial 7-day titration window.',
    source: 'Lipton, Nat Rev Drug Discov 2006',
  },
  {
    id: 'e-ltp-cog',
    fromId: 'l3-ltp-ach',
    toId: 'goal-cognition',
    layerSpan: 'L3_L4',
    interactionType: 'agonist',
    epistemicTier: 'supported_mechanistic',
    confidencePct: 88,
    baseFlux: 85,
    quantitativeMetric: 'Hippocampal Phasic LTP & Prefrontal ACh Output',
    mechanismNote: 'Combines unobstructed phasic AMPA/NMDA depolarization with abundant acetylcholine and Kennedy-pathway phosphatidylcholine.',
    temporalNote: {
      acute_d1_5: 'Immediate attentional support within 90 min of morning Citicoline.',
      subacute_d6_13: 'Enhanced late-phase LTP consolidation during REM/slow-wave sleep.',
      chronic_d14_plus: 'Durable synaptic spine density and striatal dopamine receptor resilience.',
    },
    limitationNote: 'Requires adequate sleep architecture for late-phase protein synthesis.',
    source: 'Secades & Lorenzo 2006 · Xia et al., 2010',
  },
  {
    id: 'e-ncor-epiph',
    fromId: 'l3-ncor-epiphysis',
    toId: 'goal-epiphyseal',
    layerSpan: 'L3_L4',
    interactionType: 'shielding_mitigation',
    epistemicTier: 'theoretical_frontier',
    confidencePct: 68,
    baseFlux: 84,
    quantitativeMetric: 'Growth-Plate Senescence Shield + 94% IGF-1 Preservation',
    mechanismNote: 'Restraining ERα-driven proliferative exhaustion in the epiphyseal resting zone keeps the growth plate responsive to concurrent CNP/PKGII signaling without crashing hepatic IGF-1.',
    temporalNote: {
      acute_d1_5: 'Estrogen receptor co-repressor complex assembly.',
      subacute_d6_13: 'Preserved systemic IGF-1 Z-score compared to oral Tamoxifen prodrug.',
      chronic_d14_plus: 'Prolongs the active endochondral ossification timeline prior to epiphyseal fusion.',
    },
    limitationNote: 'THEORETICAL FRONTIER: Coupled Endoxifen + Vosoritide synergy is a mechanistic ODE projection requiring open physes and ultrasensitive E2 guardrails.',
    source: 'Savarirayan et al., 2019 · Goetz et al., 2017',
  },
  {
    id: 'e-ncor-endo',
    fromId: 'l3-ncor-epiphysis',
    toId: 'goal-endocrine',
    layerSpan: 'L3_L4',
    interactionType: 'agonist',
    epistemicTier: 'quantitative_pkpd',
    confidencePct: 92,
    baseFlux: 88,
    quantitativeMetric: 'LH Pulse Amplitude +68% · Trabecular Bone Sparing',
    mechanismNote: 'Hypothalamic ERα blockade disinhibits GnRH pulsatility while osteoblast AF-1 partial agonism protects trabecular bone mineral density.',
    temporalNote: {
      acute_d1_5: 'Pituitary gonadotrope disinhibition begins within 72 hours.',
      subacute_d6_13: 'Serum LH, FSH, and endogenous intratesticular steroidogenesis rise.',
      chronic_d14_plus: 'Sustained HPTA axis tone without zuclomiphene isomer accumulation.',
    },
    limitationNote: 'Over-titration (>8 mg/d Endoxifen) can drive supraphysiological serum E2 behind the receptor block.',
    source: 'Ahmad et al., Clin Pharmacol Ther 2010',
  },
  {
    id: 'e-pkgii-epiph',
    fromId: 'l3-cgmp-pkgii',
    toId: 'goal-epiphyseal',
    layerSpan: 'L3_L4',
    interactionType: 'agonist',
    epistemicTier: 'quantitative_pkpd',
    confidencePct: 94,
    baseFlux: 92,
    quantitativeMetric: 'Collagen X Velocity (CXM) +48–54% vs Baseline',
    mechanismNote: 'Unblocking FGFR3 MAPK inhibition via RAF-1 Ser43 phosphorylation directly accelerates hypertrophic chondrocyte differentiation and matrix mineralization.',
    temporalNote: {
      acute_d1_5: 'Urinary cGMP biomarker confirms daily NPR-B target engagement.',
      subacute_d6_13: 'Serum Collagen X Marker (CXM) rises measurably by Week 2.',
      chronic_d14_plus: 'Sustained longitudinal growth velocity gain across open growth plates.',
    },
    limitationNote: 'Daily circadian SubQ consistency is critical because NPR-B signaling resets every ~24 hours.',
    source: 'Savarirayan et al., NEJM 2019 & Lancet 2020',
  },
  {
    id: 'e-sink-epiph-penalty',
    fromId: 'l3-hepatic-sink',
    toId: 'goal-epiphyseal',
    layerSpan: 'L3_L4',
    interactionType: 'metabolic_bottleneck',
    epistemicTier: 'quantitative_pkpd',
    confidencePct: 91,
    baseFlux: 75,
    quantitativeMetric: '-33% First-Pass Hepatic IGF-1 & Variable ERα Block',
    mechanismNote: 'Prodrug Tamoxifen suppresses hepatic IGF-1 synthesis on first pass and suffers up to 75% loss of active Endoxifen formation in CYP2D6 poor/intermediate metabolizers.',
    temporalNote: {
      acute_d1_5: 'First-pass hepatic estrogen agonism begins immediately.',
      subacute_d6_13: 'Circulating IGF-1 drops while prodrug accumulates.',
      chronic_d14_plus: 'Blunts net epiphyseal velocity; resolved by swapping to direct (Z)-Endoxifen.',
    },
    limitationNote: 'Severity scales directly with CYP2D6 *4/*10 allele burden.',
    source: 'Goetz et al., J Clin Oncol 2017',
  },
  {
    id: 'e-sink-hemo-penalty',
    fromId: 'l3-hepatic-sink',
    toId: 'goal-hemodynamic',
    layerSpan: 'L3_L4',
    interactionType: 'spillover_load',
    epistemicTier: 'supported_mechanistic',
    confidencePct: 83,
    baseFlux: 64,
    quantitativeMetric: 'Elevated Plasma TMAO & Osmotic GI Malabsorption',
    mechanismNote: 'High-dose Alpha-GPC TMAO generation increases vascular endothelial activation, while Mg Oxide causes osmotic GI waste.',
    temporalNote: {
      acute_d1_5: 'Post-dose TMAO peak and osmotic GI transit shift.',
      subacute_d6_13: 'Persistent vascular TMAO exposure.',
      chronic_d14_plus: 'Eliminated by swapping Alpha-GPC → Citicoline and Mg Oxide → Mg L-Threonate.',
    },
    limitationNote: 'Direct swap eliminates both metabolic sinks.',
    source: 'Wang et al., JAMA Netw Open 2021',
  },
  {
    id: 'e-anabolic-endo',
    fromId: 'l3-anabolic-epo',
    toId: 'goal-endocrine',
    layerSpan: 'L3_L4',
    interactionType: 'agonist',
    epistemicTier: 'quantitative_pkpd',
    confidencePct: 95,
    baseFlux: 89,
    quantitativeMetric: 'Skeletal Muscle & Periosteal Bone Anabolism',
    mechanismNote: 'Sustained androgen receptor occupancy drives nitrogen retention, satellite-cell fusion, and cortical bone mineral density.',
    temporalNote: {
      acute_d1_5: 'Myocellular glycogen & amino acid uptake.',
      subacute_d6_13: 'Positive nitrogen balance and recovery acceleration.',
      chronic_d14_plus: 'Maximal lean tissue remodeling when paired with E3.5D/EOD micro-cadence.',
    },
    limitationNote: 'Requires PCT/SERM bridge upon discontinuation to restore endogenous HPTA.',
    source: 'Nieschlag & Behre',
  },
  {
    id: 'e-anabolic-hemo-spill',
    fromId: 'l3-anabolic-epo',
    toId: 'goal-hemodynamic',
    layerSpan: 'L3_L4',
    interactionType: 'spillover_load',
    epistemicTier: 'quantitative_pkpd',
    confidencePct: 90,
    baseFlux: 60,
    quantitativeMetric: 'Hematocrit Viscosity & RAAS Pressor Load',
    mechanismNote: 'Unshielded androgen load elevates hematocrit (>50%) and angiotensin-II vascular tone unless counterbalanced by Telmisartan AT1R blockade.',
    temporalNote: {
      acute_d1_5: 'Early aldosterone sodium retention on wide weekly boluses.',
      subacute_d6_13: 'Erythropoietin stimulation accelerates.',
      chronic_d14_plus: 'Mitigated by Telmisartan 40 mg + E3.5D/EOD micro-pinning cadence.',
    },
    limitationNote: 'Monitor CBC hematocrit and Cystatin C every 6–8 weeks.',
    source: 'Bachmann et al. · Benson et al., 2004',
  },
];

export function computeCausalCascadeGraph(rawEntries = [], options = {}) {
  const {
    direction = 'forward', // 'forward' | 'backward'
    selectedNodeId = null,
    targetGoalId = 'goal-cognition',
    cyp2d6Genotype = 'extensive', // 'extensive' (*1/*1) | 'intermediate' (*1/*4) | 'poor' (*4/*4)
    doseMultiplier = 1.0,
    temporalPhase = 'chronic_d14_plus', // 'acute_d1_5' | 'subacute_d6_13' | 'chronic_d14_plus'
    epistemicFilter = 'all', // 'all' | 'quantitative_only' | 'established_and_supported' | 'frontier_highlight'
    counterfactuals = {},
  } = options;

  const normalized = rawEntries
    .map((item) => String(item?.name || item?.title || item || '').toLowerCase())
    .filter(Boolean);

  let matchedL1 = CASCADE_COMPOUND_CATALOG.filter((c) =>
    normalized.some((text) => c.match.some((token) => text.includes(token)))
  );

  // Default showcase stack if empty
  const isDefaultSample = matchedL1.length === 0;
  if (isDefaultSample) {
    matchedL1 = CASCADE_COMPOUND_CATALOG.slice(0, 5);
  }

  // Apply Counterfactual Swaps & Toggles dynamically
  const activeMap = new Map(matchedL1.map((c) => [c.id, { ...c, isCounterfactualAdded: false }]));

  if (counterfactuals.swapTamoxifenToEndoxifen) {
    activeMap.delete('l1-tamoxifen');
    const endox = CASCADE_COMPOUND_CATALOG.find((c) => c.id === 'l1-endoxifen');
    if (endox) activeMap.set('l1-endoxifen', { ...endox, isCounterfactualAdded: true });
  }
  if (counterfactuals.swapAlphaGpcToCiticoline) {
    activeMap.delete('l1-alphagpc');
    const citi = CASCADE_COMPOUND_CATALOG.find((c) => c.id === 'l1-citicoline');
    if (citi) activeMap.set('l1-citicoline', { ...citi, isCounterfactualAdded: true });
  }
  if (counterfactuals.swapMgOxideToThreonate) {
    activeMap.delete('l1-mgoxide');
    const mgthr = CASCADE_COMPOUND_CATALOG.find((c) => c.id === 'l1-mgthreonate');
    if (mgthr) activeMap.set('l1-mgthreonate', { ...mgthr, isCounterfactualAdded: true });
  }
  if (counterfactuals.toggleTelmisartanShield === true && !activeMap.has('l1-telmisartan')) {
    const telmi = CASCADE_COMPOUND_CATALOG.find((c) => c.id === 'l1-telmisartan');
    if (telmi) activeMap.set('l1-telmisartan', { ...telmi, isCounterfactualAdded: true });
  } else if (counterfactuals.toggleTelmisartanShield === false) {
    activeMap.delete('l1-telmisartan');
  }
  if (counterfactuals.toggleVosoritide === true && !activeMap.has('l1-vosoritide')) {
    const voso = CASCADE_COMPOUND_CATALOG.find((c) => c.id === 'l1-vosoritide');
    if (voso) activeMap.set('l1-vosoritide', { ...voso, isCounterfactualAdded: true });
  } else if (counterfactuals.toggleVosoritide === false) {
    activeMap.delete('l1-vosoritide');
  }

  const activeCompounds = Array.from(activeMap.values()).map((c, idx, arr) => {
    const spacing = Math.min(115, Math.floor(560 / Math.max(1, arr.length)));
    const startY = Math.max(70, Math.round(340 - ((arr.length - 1) * spacing) / 2));
    return {
      ...c,
      layer: 1,
      x: 125,
      y: startY + idx * spacing,
    };
  });

  const activeL1Ids = new Set(activeCompounds.map((c) => c.id));
  const cypFactor = cyp2d6Genotype === 'poor' ? 0.18 : cyp2d6Genotype === 'intermediate' ? 0.58 : 1.0;
  const phaseFactor = temporalPhase === 'acute_d1_5' ? 0.68 : temporalPhase === 'subacute_d6_13' ? 0.88 : 1.0;
  const doseFactor = Math.max(0.4, Math.min(2.2, Number(doseMultiplier) || 1.0));

  // Filter L1->L2 edges to active compounds, then cascade to L2->L3 and L3->L4
  const l1ToL2 = CASCADE_BASE_EDGES.filter((e) => e.layerSpan === 'L1_L2' && activeL1Ids.has(e.fromId));
  const engagedL2Ids = new Set(l1ToL2.map((e) => e.toId));
  const l2ToL3 = CASCADE_BASE_EDGES.filter((e) => e.layerSpan === 'L2_L3' && engagedL2Ids.has(e.fromId));
  const engagedL3Ids = new Set(l2ToL3.map((e) => e.toId));
  const l3ToL4 = CASCADE_BASE_EDGES.filter((e) => e.layerSpan === 'L3_L4' && engagedL3Ids.has(e.fromId));

  const rawActiveEdges = [...l1ToL2, ...l2ToL3, ...l3ToL4].map((edge) => {
    let computedFlux = edge.baseFlux * Math.pow(doseFactor, 0.45) * phaseFactor;
    // Apply CYP2D6 pharmacogenomic effect on Tamoxifen vs Endoxifen
    if (edge.id === 'e-tamox-er') {
      computedFlux = Math.round(edge.baseFlux * cypFactor);
    } else if (edge.id === 'e-tamox-cyp2d6' || edge.id === 'e-sink-epiph-penalty') {
      computedFlux = Math.round(edge.baseFlux * (2.0 - cypFactor * 0.8));
    }
    // Apply Telmisartan shielding effect on androgen spillover
    if ((edge.id === 'e-test-at1r-spill' || edge.id === 'e-anabolic-hemo-spill') && activeL1Ids.has('l1-telmisartan')) {
      computedFlux = Math.round(computedFlux * 0.35);
    }
    // Apply Endoxifen shielding on E2 epiphyseal spillover
    if (edge.id === 'e-test-er-spill' && activeL1Ids.has('l1-endoxifen')) {
      computedFlux = Math.round(computedFlux * 0.4);
    }
    // Apply temporal acute phase adaptation penalty on Memantine nicotinic receptor
    if (edge.id === 'e-mem-ampa-nachr' && temporalPhase === 'acute_d1_5' && !activeL1Ids.has('l1-citicoline')) {
      computedFlux = Math.round(computedFlux * 0.55);
    }

    const clampedFlux = Math.max(12, Math.min(99, Math.round(computedFlux)));
    const epistemicSpec = EPISTEMIC_TIERS[edge.epistemicTier] || EPISTEMIC_TIERS.supported_mechanistic;
    const polaritySpec = INTERACTION_POLARITIES[edge.interactionType] || INTERACTION_POLARITIES.agonist;

    const passesEpistemicFilter =
      epistemicFilter === 'all' ||
      (epistemicFilter === 'quantitative_only' && edge.epistemicTier === 'quantitative_pkpd') ||
      (epistemicFilter === 'established_and_supported' &&
        (edge.epistemicTier === 'quantitative_pkpd' || edge.epistemicTier === 'supported_mechanistic')) ||
      (epistemicFilter === 'frontier_highlight' &&
        (edge.epistemicTier === 'theoretical_frontier' || edge.epistemicTier === 'contextual_association'));

    return {
      ...edge,
      fluxScore: clampedFlux,
      epistemicSpec,
      polaritySpec,
      passesEpistemicFilter,
      activeTemporalNote: edge.temporalNote?.[temporalPhase] || edge.mechanismNote,
    };
  });

  // Bidirectional Causal Pathfinding (Forward from Compound/Target or Backward from Phenotypic Goal)
  const focusId =
    direction === 'backward'
      ? selectedNodeId && selectedNodeId.startsWith('goal-')
        ? selectedNodeId
        : targetGoalId || 'goal-cognition'
      : selectedNodeId || activeCompounds[0]?.id || 'l1-telmisartan';

  const tracedNodeIds = new Set([focusId]);
  const tracedEdgeIds = new Set();

  if (direction === 'backward') {
    // Trace backward from Phenotypic Goal (L4) -> L3 -> L2 -> L1, and also identify missing upstream pathways from full catalog
    for (const e34 of rawActiveEdges.filter((e) => e.layerSpan === 'L3_L4' && e.toId === focusId)) {
      tracedEdgeIds.add(e34.id);
      tracedNodeIds.add(e34.fromId);
    }
    for (const e23 of rawActiveEdges.filter((e) => e.layerSpan === 'L2_L3' && tracedNodeIds.has(e.toId))) {
      tracedEdgeIds.add(e23.id);
      tracedNodeIds.add(e23.fromId);
    }
    for (const e12 of rawActiveEdges.filter((e) => e.layerSpan === 'L1_L2' && tracedNodeIds.has(e.toId))) {
      tracedEdgeIds.add(e12.id);
      tracedNodeIds.add(e12.fromId);
    }
  } else {
    // Trace both upstream and downstream from focusId so clicking any layer highlights its complete causal chain
    // Downstream propagation
    let changed = true;
    while (changed) {
      changed = false;
      for (const edge of rawActiveEdges) {
        if (tracedNodeIds.has(edge.fromId) && !tracedEdgeIds.has(edge.id)) {
          tracedEdgeIds.add(edge.id);
          if (!tracedNodeIds.has(edge.toId)) {
            tracedNodeIds.add(edge.toId);
            changed = true;
          }
        }
      }
    }
    // Upstream propagation (if user clicked an L2, L3, or L4 node in forward mode)
    changed = true;
    while (changed) {
      changed = false;
      for (const edge of rawActiveEdges) {
        if (tracedNodeIds.has(edge.toId) && !tracedEdgeIds.has(edge.id)) {
          tracedEdgeIds.add(edge.id);
          if (!tracedNodeIds.has(edge.fromId)) {
            tracedNodeIds.add(edge.fromId);
            changed = true;
          }
        }
      }
    }
  }

  // Enrich Layer 2 (Targets), Layer 3 (Mechanisms), and Layer 4 (Phenotypes) with occupancy & state
  const targets = CASCADE_TARGETS_L2.map((t) => {
    const incoming = rawActiveEdges.filter((e) => e.toId === t.id);
    const hasShield =
      (t.id === 'l2-at1r' && activeL1Ids.has('l1-telmisartan')) ||
      (t.id === 'l2-era-erb' && activeL1Ids.has('l1-endoxifen')) ||
      (t.id === 'l2-glun2b' && activeL1Ids.has('l1-memantine'));
    const hasBottleneck = incoming.some((e) => e.interactionType === 'metabolic_bottleneck' || e.interactionType === 'spillover_load');
    const occupancyPct = incoming.length
      ? Math.min(98, Math.round(incoming.reduce((acc, e) => acc + e.fluxScore * 0.85, 0) / Math.pow(incoming.length, 0.65)))
      : 0;
    return {
      ...t,
      layer: 2,
      x: 415,
      incomingCount: incoming.length,
      occupancyPct,
      state: hasShield && hasBottleneck ? 'shielded_convergence' : hasBottleneck ? 'bottleneck_warning' : incoming.length > 0 ? 'engaged' : 'unoccupied',
      inTrace: tracedNodeIds.has(t.id),
    };
  });

  const mechanisms = CASCADE_MECHANISMS_L3.map((m) => {
    const incoming = rawActiveEdges.filter((e) => e.toId === m.id);
    const outgoing = rawActiveEdges.filter((e) => e.fromId === m.id);
    const meanFlux = incoming.length ? Math.round(incoming.reduce((s, e) => s + e.fluxScore, 0) / incoming.length) : 0;
    const isBottleneck = incoming.some((e) => e.interactionType === 'metabolic_bottleneck' || e.interactionType === 'spillover_load');
    return {
      ...m,
      layer: 3,
      x: 715,
      engaged: incoming.length > 0,
      meanFlux,
      isBottleneck,
      epistemicTier: incoming[0]?.epistemicTier || outgoing[0]?.epistemicTier || 'supported_mechanistic',
      inTrace: tracedNodeIds.has(m.id),
    };
  });

  const phenotypes = CASCADE_PHENOTYPES_L4.map((p) => {
    const incoming = rawActiveEdges.filter((e) => e.toId === p.id);
    const positiveFlux = incoming
      .filter((e) => e.interactionType !== 'metabolic_bottleneck' && e.interactionType !== 'spillover_load')
      .reduce((s, e) => s + e.fluxScore, 0);
    const penaltyFlux = incoming
      .filter((e) => e.interactionType === 'metabolic_bottleneck' || e.interactionType === 'spillover_load')
      .reduce((s, e) => s + e.fluxScore * 0.55, 0);
    const netScore = incoming.length ? Math.max(10, Math.min(99, Math.round((positiveFlux - penaltyFlux) / Math.max(1, Math.sqrt(incoming.length))))) : 0;

    // Identify missing upstream candidate compounds that could support this phenotypic goal
    const allGoalL3Ids = CASCADE_BASE_EDGES.filter(
      (e) => e.layerSpan === 'L3_L4' && e.toId === p.id && e.interactionType !== 'metabolic_bottleneck' && e.interactionType !== 'spillover_load'
    ).map((e) => e.fromId);
    const allGoalL2Ids = CASCADE_BASE_EDGES.filter((e) => e.layerSpan === 'L2_L3' && allGoalL3Ids.includes(e.toId)).map((e) => e.fromId);
    const candidateL1Ids = CASCADE_BASE_EDGES.filter(
      (e) => e.layerSpan === 'L1_L2' && allGoalL2Ids.includes(e.toId) && e.interactionType !== 'metabolic_bottleneck' && e.interactionType !== 'spillover_load'
    ).map((e) => e.fromId);

    const missingCandidates = CASCADE_COMPOUND_CATALOG.filter((c) => candidateL1Ids.includes(c.id) && !activeL1Ids.has(c.id)).map((c) => c.name);

    return {
      ...p,
      layer: 4,
      x: 1015,
      incomingCount: incoming.length,
      netScore,
      missingCandidates,
      inTrace: tracedNodeIds.has(p.id),
    };
  });

  const edges = rawActiveEdges.map((e) => ({
    ...e,
    inTrace: tracedEdgeIds.has(e.id),
  }));

  // Compute Bottlenecks, Convergent Synergies & Temporal Overlap Matrix
  const bottlenecks = [];
  if (activeL1Ids.has('l1-tamoxifen')) {
    bottlenecks.push({
      id: 'bn-cyp2d6-tamox',
      severity: cyp2d6Genotype === 'extensive' ? 'moderate' : 'critical',
      title: `CYP2D6 (${cyp2d6Genotype.toUpperCase()}) Prodrug Bottleneck & First-Pass IGF-1 Suppression`,
      detail: `Oral Tamoxifen retains only ${Math.round(cypFactor * 100)}% conversion efficiency to active Endoxifen under ${cyp2d6Genotype} CYP2D6 metabolism while suppressing hepatic IGF-1 by ~33%.`,
      remedy: 'Counterfactual Swap: Replace Tamoxifen 20 mg → Direct (Z)-Endoxifen 4 mg.',
    });
  }
  if (activeL1Ids.has('l1-alphagpc')) {
    bottlenecks.push({
      id: 'bn-tmao-agpc',
      severity: 'moderate',
      title: 'Gut Microbial TMA → Hepatic FMO3 TMAO Spike (Alpha-GPC)',
      detail: 'High-dose Alpha-GPC bolus undergoes intestinal TMA cleavage and lacks cytidine/uridine for Kennedy-pathway phosphatidylcholine repair.',
      remedy: 'Counterfactual Swap: Replace Alpha-GPC → Citicoline (CDP-Choline) 250 mg.',
    });
  }
  if (activeL1Ids.has('l1-mgoxide')) {
    bottlenecks.push({
      id: 'bn-mgoxide',
      severity: 'high',
      title: 'Inorganic Magnesium Oxide GI Lumen Sink (~96% Unabsorbed)',
      detail: 'Only ~4% fractional absorption across intestinal epithelium; fails to elevate CSF [Mg²⁺] for NMDA pore gating.',
      remedy: 'Counterfactual Swap: Replace Magnesium Oxide → Magnesium L-Threonate.',
    });
  }
  if (activeL1Ids.has('l1-test-cyp') && !activeL1Ids.has('l1-telmisartan')) {
    bottlenecks.push({
      id: 'bn-unshielded-raas',
      severity: 'moderate',
      title: 'Unshielded Androgen RAAS & Erythropoietin Pressor Load',
      detail: 'Testosterone ester depot upregulates renal angiotensin II and hematocrit viscosity without AT1R efferent arteriolar protection.',
      remedy: 'Counterfactual Shield: Add Telmisartan 40 mg insurmountable AT1R blockade.',
    });
  }
  if (activeL1Ids.has('l1-memantine') && temporalPhase === 'acute_d1_5' && !activeL1Ids.has('l1-citicoline')) {
    bottlenecks.push({
      id: 'bn-memantine-acute-fog',
      severity: 'moderate',
      title: 'Transient Day 1–5 α7-nAChR Nicotinic Adaptation Window',
      detail: 'During acute initiation (Days 1–5), Memantine open-channel block at α7-nAChR (IC50 0.34 µM) causes temporary daytime fog prior to Day-10 receptor upregulation.',
      remedy: 'Temporal Mitigation: Administer Memantine before sleep during Days 1–5 or pair with morning Citicoline.',
    });
  }

  const synergies = [];
  if (activeL1Ids.has('l1-memantine') && (activeL1Ids.has('l1-citicoline') || activeL1Ids.has('l1-mgthreonate'))) {
    synergies.push({
      id: 'syn-glut-ach',
      title: 'Orthogonal Cortical Signal-to-Noise Amplification (GluN2B Noise Filter + Phasic LTP)',
      detail: 'Memantine suppresses tonic extrasynaptic Ca²⁺ leak (-70 mV) while Citicoline/Mg²⁺ potentiates phasic 100 Hz synaptic depolarization and Kennedy-pathway membrane synthesis.',
      epistemicTier: 'supported_mechanistic',
    });
  }
  if (activeL1Ids.has('l1-endoxifen') && activeL1Ids.has('l1-vosoritide')) {
    synergies.push({
      id: 'syn-epiph-dual',
      title: 'Dual-Axis Epiphyseal Kinetics (NPR-B cGMP Proliferation + ERα Senescence Restraint)',
      detail: 'Vosoritide unblocks FGFR3 MAPK via PKGII RAF-1 Ser43 phosphorylation while Endoxifen restrains ERα chondrocyte senescence without suppressing hepatic IGF-1.',
      epistemicTier: 'theoretical_frontier',
    });
  }
  if (activeL1Ids.has('l1-telmisartan') && activeL1Ids.has('l1-test-cyp')) {
    synergies.push({
      id: 'syn-at1r-androgen',
      title: 'Hemodynamic & Renal Shielding Under Androgen Depot Load',
      detail: 'Telmisartan insurmountable AT1R antagonism (t½ 213 min) + 27% PPAR-γ activation neutralizes androgen-induced angiotensin II vasoconstriction, aldosterone retention, and Cystatin C drift.',
      epistemicTier: 'quantitative_pkpd',
    });
  }

  // 24-Hour Circadian Pharmacokinetic Windows
  const circadianSlots = [
    {
      id: 'slot-morning',
      window: '07:00 – 10:00 · Waking Fasted / Hydrated Window',
      compounds: activeCompounds.filter((c) => c.circadianSlot === 'morning').map((c) => `${c.name} (${c.defaultDose})`),
      pkDynamics: 'Peak AT1R saturation (Telmisartan Tmax 1h) + prefrontal ACh/dopamine priming (Citicoline Tmax 2.5h).',
      mitigationRule: activeL1Ids.has('l1-memantine') && temporalPhase === 'acute_d1_5'
        ? 'Shift Memantine to 21:00 Evening Window during Days 1–5 to sleep through transient α7-nAChR adaptation.'
        : 'Steady-state morning administration aligned; zero luminal chelation conflicts.',
    },
    {
      id: 'slot-midday',
      window: '10:00 – 14:00 · Post-Meal Circadian Chondrocyte Window',
      compounds: activeCompounds.filter((c) => c.circadianSlot === 'midday').map((c) => `${c.name} (${c.defaultDose})`),
      pkDynamics: 'SubQ Vosoritide NPR-B → cGMP surge (Tmax 25 min, 22h PKGII tail) + Direct (Z)-Endoxifen ERα steady-state.',
      mitigationRule: activeL1Ids.has('l1-vosoritide')
        ? 'Separate Vosoritide SubQ by ≥90 min from peak Telmisartan Tmax and administer after 250 mL water + light meal to prevent additive cGMP/AT1R orthostatic dip.'
        : 'Consistent midday window maintains stable 52h Endoxifen trough.',
    },
    {
      id: 'slot-evening',
      window: '20:00 – 23:00 · Evening Parasympathetic & Sleep Consolidation',
      compounds: activeCompounds.filter((c) => c.circadianSlot === 'evening').map((c) => `${c.name} (${c.defaultDose})`),
      pkDynamics: 'CSF Mg²⁺ resting NMDA voltage gate replenishment and slow-wave synaptic protein synthesis.',
      mitigationRule: 'Avoid high-dose choline donors (>250 mg Citicoline) after 16:00 to preserve REM/deep sleep latency.',
    },
  ];

  const allNodes = [...activeCompounds, ...targets, ...mechanisms, ...phenotypes];
  const focusNode = allNodes.find((n) => n.id === focusId) || activeCompounds[0];

  const meanConfidence = edges.length
    ? Math.round(edges.reduce((s, e) => s + e.confidencePct, 0) / edges.length)
    : 88;
  const meanFlux = edges.length
    ? Math.round(edges.reduce((s, e) => s + e.fluxScore, 0) / edges.length)
    : 75;

  return {
    isDefaultSample,
    direction,
    focusId,
    focusNode,
    cyp2d6Genotype,
    doseMultiplier: doseFactor,
    temporalPhase,
    epistemicFilter,
    layers: {
      compounds: activeCompounds.map((c) => ({ ...c, inTrace: tracedNodeIds.has(c.id) })),
      targets,
      mechanisms,
      phenotypes,
    },
    edges,
    synergies,
    bottlenecks,
    circadianSlots,
    summaryMetrics: {
      meanConfidence,
      meanFlux,
      activeCompoundCount: activeCompounds.length,
      engagedTargetCount: targets.filter((t) => t.incomingCount > 0).length,
      activeBottleneckCount: bottlenecks.length,
      activeSynergyCount: synergies.length,
    },
  };
}

// 5. Blood-Marker Log (Photo Entry #5, Recheck Calendar Event, & Cheapest Way to Test Budget Line)
export const BLOOD_MARKER_CATALOG = {
  estradiol_sensitive: {
    id: 'estradiol_sensitive',
    name: 'Estradiol, Ultrasensitive (LC-MS/MS)',
    unit: 'pg/mL',
    min: 20,
    max: 38,
    retailUsd: 119,
    directUsd: 38,
    provider: 'Marek / LabCorp #500108',
  },
  igf1_lcms: {
    id: 'igf1_lcms',
    name: 'IGF-1 (LC-MS/MS) + Z-Score',
    unit: 'ng/mL',
    min: 140,
    max: 275,
    retailUsd: 135,
    directUsd: 44,
    provider: 'Ulta / Quest #16293',
  },
  cystatin_c: {
    id: 'cystatin_c',
    name: 'Cystatin C with eGFR',
    unit: 'mg/L',
    min: 0.55,
    max: 0.90,
    retailUsd: 95,
    directUsd: 29,
    provider: 'PrivateMD / LabCorp #121251',
  },
  lh_fsh: {
    id: 'lh_fsh',
    name: 'LH & FSH Gonadotropin Panel',
    unit: 'mIU/mL',
    min: 3.5,
    max: 9.5,
    retailUsd: 110,
    directUsd: 28,
    provider: 'Marek Basic / LabCorp #028480',
  },
  fasting_insulin: {
    id: 'fasting_insulin',
    name: 'Fasting Insulin & hs-CRP',
    unit: 'uIU/mL',
    min: 2.0,
    max: 6.0,
    retailUsd: 88,
    directUsd: 22,
    provider: 'Ulta Metabolic / Quest #561',
  },
  cmp_cbc_hematocrit: {
    id: 'cmp_cbc_hematocrit',
    name: 'CBC w/ Hematocrit & CMP-14',
    unit: '% Hct',
    min: 40,
    max: 49.5,
    retailUsd: 78,
    directUsd: 18,
    provider: 'Direct Access / LabCorp #322000',
  },
};

export function evaluateBloodMarkerPanel({
  entries = [],
  recordedAtIso = '2026-11-08T09:00:00.000Z',
  recheckWeeks = 6,
  sourcePhotoName = '',
} = {}) {
  let totalRetailUsd = 0;
  let totalDirectUsd = 0;

  const evaluated = entries.map((entry) => {
    const spec = BLOOD_MARKER_CATALOG[entry.markerKey] || {
      id: entry.markerKey || 'custom',
      name: entry.name || 'Custom Biomarker',
      unit: entry.unit || '',
      min: entry.min ?? 0,
      max: entry.max ?? 100,
      retailUsd: 85,
      directUsd: 28,
      provider: 'Direct-to-Consumer Lab Requisition',
    };
    const val = Number(entry.value);
    const status = val < spec.min ? 'low' : val > spec.max ? 'elevated' : 'optimal';
    totalRetailUsd += spec.retailUsd;
    totalDirectUsd += spec.directUsd;
    return {
      ...spec,
      value: val,
      status,
      referenceRange: `${spec.min}–${spec.max} ${spec.unit}`,
    };
  });

  // Bundle discount if >= 3 markers ordered together
  const bundledDirectUsd = evaluated.length >= 3 ? Math.round(totalDirectUsd * 0.85) : totalDirectUsd;
  const savedOnLabsUsd = Math.max(0, totalRetailUsd - bundledDirectUsd);

  const recheckMs = new Date(recordedAtIso).getTime() + Math.max(1, Number(recheckWeeks) || 6) * 7 * 24 * 3600 * 1000;
  const recheckDateIso = new Date(recheckMs).toISOString();

  const calendarEvent = {
    id: `lab-recheck-${new Date(recordedAtIso).getTime()}`,
    kind: 'lab_recheck',
    title: `Blood-Marker Recheck (${evaluated.map((e) => e.name.split(',')[0]).join(' + ') || 'Biomarker Panel'})`,
    occurred_at: recheckDateIso,
    scheduled_at: recheckDateIso,
    note: `Fasted AM draw (${recheckWeeks}w post-entry). Cheapest requisition bundle: $${bundledDirectUsd} (saves $${savedOnLabsUsd} vs clinic retail).`,
  };

  const cheapestTestLine = evaluated.length
    ? `Cheapest way to test these ${evaluated.length} markers: Order bundled direct LabCorp/Quest requisition (${evaluated.map((e) => e.provider.split('/')[0].trim()).filter((v, i, a) => a.indexOf(v) === i).join(' / ')}) for $${bundledDirectUsd} total instead of $${totalRetailUsd} clinic retail — saves $${savedOnLabsUsd} per recheck.`
    : 'Select markers to compute the lowest-cost direct lab requisition bundle.';

  return {
    recordedAtIso,
    recheckWeeks: Number(recheckWeeks) || 6,
    recheckDateIso,
    sourcePhotoName,
    evaluated,
    totalRetailUsd,
    bundledDirectUsd,
    savedOnLabsUsd,
    cheapestTestLine,
    calendarEvent,
  };
}

// 6. Dose-Adjustment Advisor (Sits inside the Reviewer, gated on REAL lab + symptom data)
export function evaluateDoseAdjustmentAdvisor({ labs = [], symptomAttributions = [], protocolItems = [] } = {}) {
  const hasRealLabs = Array.isArray(labs) && labs.length > 0 && labs.some((panel) => (panel.evaluated || panel.markers || []).length > 0);
  const hasRealSymptoms = Array.isArray(symptomAttributions) && symptomAttributions.length > 0;

  if (!hasRealLabs || !hasRealSymptoms) {
    return {
      unlocked: false,
      hasRealLabs,
      hasRealSymptoms,
      missingRequirements: [
        ...(!hasRealLabs ? ['At least 1 recorded Blood-Marker Lab panel (via Photo Entry #5 or marker log)'] : []),
        ...(!hasRealSymptoms ? ['At least 1 Causal Symptom Attribution ("Which change did this?" via Mini-Experiment #4 or Voice Check-In #6)'] : []),
      ],
      recommendations: [],
    };
  }

  const latestPanel = labs[0];
  const markers = latestPanel.evaluated || latestPanel.markers || [];
  const latestSymptom = symptomAttributions[0];
  const recommendations = [];

  for (const m of markers) {
    if (m.id === 'estradiol_sensitive' && m.status === 'elevated') {
      recommendations.push({
        id: 'adv-e2-high',
        targetCompound: 'Endoxifen / Ester Cadence',
        action: 'Split ester pinning interval to EOD (48h) or titrate Endoxifen 2 mg → 4 mg',
        evidenceBasis: `Lab E2 (LC-MS/MS) elevated at ${m.value} ${m.unit} (target ${m.referenceRange}) + causal symptom log: "${latestSymptom.observation || latestSymptom.symptom}"`,
        confidence: 'High — Dual lab + symptom concordance',
      });
    } else if (m.id === 'cmp_cbc_hematocrit' && m.status === 'elevated') {
      recommendations.push({
        id: 'adv-hct-high',
        targetCompound: 'Telmisartan',
        action: 'Titrate Telmisartan 20 mg → 40 mg daily & verify morning hydration',
        evidenceBasis: `Hematocrit at ${m.value}% (upper threshold ${m.max}%) alongside "${latestSymptom.attributedChange || 'protocol load'}"`,
        confidence: 'High — AT1R blockade attenuates angiotensin-II erythropoietin amplification',
      });
    } else if (m.id === 'cystatin_c' && m.status === 'elevated') {
      recommendations.push({
        id: 'adv-cys-high',
        targetCompound: 'Telmisartan',
        action: 'Maintain or initiate Telmisartan 40 mg for efferent arteriolar decompression',
        evidenceBasis: `Cystatin C elevated at ${m.value} mg/L (target < 0.90 mg/L)`,
        confidence: 'High — Glomerular filtration preservation',
      });
    }
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'adv-steady-state',
      targetCompound: protocolItems[0]?.name || 'Active Protocol Stack',
      action: 'Hold current dosages steady through next recheck window (0% titration delta)',
      evidenceBasis: `All ${markers.length} logged blood markers are within target range and causal check-in ("${latestSymptom.attributedChange || 'Current timing'}") shows stable response.`,
      confidence: 'Verified — Empirical biomarkers & symptom attribution aligned',
    });
  }

  return {
    unlocked: true,
    hasRealLabs: true,
    hasRealSymptoms: true,
    missingRequirements: [],
    recommendations,
  };
}

// 7. PCT / Ancillary Builder (Mode of the Reviewer)
export function buildPctAncillaryPlan({
  ester = 'enanthate',
  weeklyDoseMg = 200,
  cycleWeeks = 12,
  sermChoice = 'endoxifen', // 'endoxifen' | 'enclomiphene' | 'raloxifene'
} = {}) {
  const profile = ESTER_KINETICS[ester] || ESTER_KINETICS.enanthate;
  const ke = Math.LN2 / profile.halfLifeH;
  // Estimate days after last pin for depot to decay below ~15 mg/week equivalent HPTA suppression threshold
  const suppressionThresholdMg = 18;
  const ratio = Math.max(1, Number(weeklyDoseMg) / suppressionThresholdMg);
  const washoutHours = Math.log(ratio) / ke;
  const washoutDays = Math.max(3, Math.ceil(washoutHours / 24));

  const sermProtocols = {
    endoxifen: {
      name: 'Endoxifen (Direct Active Metabolite)',
      weeks1to2: '4 mg once daily (AM)',
      weeks3to4: '2 mg once daily (AM)',
      rationale: 'Zero CYP2D6 metabolic variance; direct hypothalamic ERα antagonism restores LH/FSH pulse amplitude without zuclomiphene accumulation or hepatic IGF-1 crash.',
    },
    enclomiphene: {
      name: 'Enclomiphene Citrate (Pure trans-isomer)',
      weeks1to2: '12.5 mg once daily (AM)',
      weeks3to4: '6.25 mg once daily (AM)',
      rationale: 'Rapid pituitary gonadotrope disinhibition (t½ ~ 10.5 h) free of estrogenic cis-zuclomiphene isomer.',
    },
    raloxifene: {
      name: 'Raloxifene HCl (Mammary-Selective SERM)',
      weeks1to2: '60 mg once daily with meal',
      weeks3to4: '30 mg once daily with meal',
      rationale: 'Highest mammary/epiphyseal selectivity for gynecomastia reversal with gentler HPTA LH surge.',
    },
  };

  const selectedSerm = sermProtocols[sermChoice] || sermProtocols.endoxifen;

  return {
    esterLabel: profile.label,
    halfLifeH: profile.halfLifeH,
    weeklyDoseMg: Number(weeklyDoseMg),
    cycleWeeks: Number(cycleWeeks),
    washoutDays,
    sermStartDay: `Day +${washoutDays} after final pin`,
    selectedSerm,
    ancillaryGuardrails: [
      {
        phase: `Bridge / Washout (Days 1 to +${washoutDays})`,
        protocol: 'hCG 250–500 IU EOD SubQ (stop 72h prior to SERM start) + Telmisartan 20–40 mg daily',
        purpose: 'Reverses Leydig cell desensitization (maintains intratesticular ITT & STAR protein) while ester clears.',
      },
      {
        phase: `HPTA Restart Phase 1 (Weeks 1–2 post-washout)`,
        protocol: `${selectedSerm.name}: ${selectedSerm.weeks1to2}`,
        purpose: selectedSerm.rationale,
      },
      {
        phase: `HPTA Consolidation Phase 2 (Weeks 3–4 post-washout)`,
        protocol: `${selectedSerm.name}: ${selectedSerm.weeks3to4} + Blood-Marker Recheck (LH, FSH, Total/Free T, Sensitive E2)`,
        purpose: 'Tapers ER blockade to prevent rebound estradiol flare and verifies endogenous HPTA axis autonomy.',
      },
    ],
  };
}

// 8. Goal -> Protocol Finder (Free Lead Magnet -> Ends in Pre-Filled Consult Intake)
export const GOAL_PROTOCOL_ARCHITECTURES = {
  height: {
    goalKey: 'height',
    goalLabel: 'Height & Epiphyseal Velocity',
    headline: 'NPR-B / cGMP Chondrocyte Signaling & Epiphyseal Estrogen Gatekeeping',
    mechanisticThesis:
      'Linear longitudinal growth velocity is governed by two rate-limiting axes before epiphyseal senescence: (1) C-type Natriuretic Peptide (NPR-B → cGMP → PKGII) counteracting FGFR3 MAPK chondrocyte arrest, and (2) preventing premature ERα-driven chondrocyte stem-cell exhaustion.',
    coreStack: [
      { name: 'Vosoritide (CNP-38)', dose: '15 mcg/kg SubQ', window: 'Morning / Circadian window', role: 'NPR-B → cGMP → PKGII phosphorylation of RAF-1 Ser43' },
      { name: 'Endoxifen', dose: '2 mg Oral', window: 'Morning', role: 'CYP2D6-independent ERα modulation; preserves hepatic IGF-1 vs prodrug SERMs' },
      { name: 'Vitamin K2 (MK-4 / MK-7) + D3 + Mg Glycinate', dose: '5 mg / 4000 IU / 400 mg', window: 'With fat-containing meal', role: 'Osteocalcin γ-carboxylation & trabecular mineralization matrix' },
    ],
    requiredBaselines: ['Left Hand/Wrist Bone Age X-Ray (Greulich-Pyle)', 'Collagen X Marker (CXM) & PINP', 'Estradiol, Ultrasensitive (LC-MS/MS)', 'IGF-1 (LC-MS/MS) + Z-Score'],
    estimatedMonthlySavedUsd: 94,
  },
  bone: {
    goalKey: 'bone',
    goalLabel: 'Bone Density & Remodeling Kinetics',
    headline: 'Osteoblast Anabolic Coupling & RANKL/OPG Equilibrium',
    mechanisticThesis:
      'Maximizes periosteal apposition and trabecular thickness by pairing selective AF-1 estrogen receptor bone-sparing signaling with micro-mineral cofactor saturation and angiogenic peptide support.',
    coreStack: [
      { name: 'Endoxifen or Raloxifene', dose: '2 mg / 30 mg Oral', window: 'With meal', role: 'Selective osteoblast AF-1 agonist; suppresses osteoclast RANKL resorption' },
      { name: 'BPC-157 (Lyophilized SubQ)', dose: '250 mcg twice daily', window: 'Morning & Evening', role: 'VEGFR2 angiogenesis & tendon-to-bone enthesis collagen I/III organization' },
      { name: 'Magnesium Glycinate + Boron + K2', dose: '400 mg / 6 mg / 200 mcg', window: 'Evening meal', role: 'Parathyroid hormone sensitivity & hydroxyapatite crystal lattice integration' },
    ],
    requiredBaselines: ['DEXA Z-Score + TBS', 'PINP & CTX-1 Bone Turnover Ratio', '25-OH Vitamin D & Ionized Calcium', 'Estradiol, Ultrasensitive (LC-MS/MS)'],
    estimatedMonthlySavedUsd: 78,
  },
  cognition: {
    goalKey: 'cognition',
    goalLabel: 'Cognition & Synaptic Signal-to-Noise',
    headline: 'Extrasynaptic NMDA Noise Suppression + Phasic Cholinergic LTP',
    mechanisticThesis:
      'Elevates cognitive signal-to-noise ratio by blocking tonic extrasynaptic GluN2B Ca²⁺ leak with Memantine while potentiating phasic synaptic AMPA/NMDA depolarization and phospholipid synthesis with Citicoline.',
    coreStack: [
      { name: 'Memantine HCl', dose: '5 → 10 mg Oral', window: 'Morning (7-day titration)', role: 'Uncompetitive voltage-dependent extrasynaptic NMDA block; preserves phasic LTP' },
      { name: 'Citicoline (CDP-Choline)', dose: '250 mg Oral', window: 'After waking', role: 'Dual choline + cytidine/uridine donor for phosphatidylcholine & dopamine D2 density' },
      { name: 'Telmisartan', dose: '20–40 mg Oral', window: 'Morning', role: 'Cerebrovascular AT1R protection + central PPAR-γ neurovascular coupling' },
    ],
    requiredBaselines: ['Fasting Insulin & HbA1c', 'hs-CRP & Homocysteine', 'Resting Blood Pressure & HR Variability'],
    estimatedMonthlySavedUsd: 68,
  },
  studying: {
    goalKey: 'studying',
    goalLabel: 'Studying, Working Memory & Tolerance Prevention',
    headline: 'Dopaminergic Sensitization Shielding & Hippocampal Consolidation',
    mechanisticThesis:
      'Prevents stimulant/catecholamine receptor downregulation and ΔFosB tolerance drift while accelerating late-phase LTP protein synthesis during deep-sleep consolidation.',
    coreStack: [
      { name: 'Memantine HCl', dose: '5–10 mg Oral', window: 'Before bed or AM', role: 'Prevents glutamatergic excitotoxic tolerance to catecholaminergic focus agents' },
      { name: 'Citicoline (CDP-Choline)', dose: '250 mg Oral', window: 'Morning study block', role: 'Sustains prefrontal acetylcholine output without Alpha-GPC TMAO spike' },
      { name: 'Magnesium L-Threonate', dose: '144 mg elemental Mg', window: 'Before bed', role: 'Elevates cerebrospinal Mg²⁺ to gate resting NMDA channels during slow-wave sleep' },
    ],
    requiredBaselines: ['Sleep Architecture / Deep Sleep %', 'Resting BP & Morning Cortisol', 'Serum Ferritin & B12'],
    estimatedMonthlySavedUsd: 62,
  },
  recovery: {
    goalKey: 'recovery',
    goalLabel: 'Endothelial, Renal & Soft-Tissue Recovery',
    headline: 'AT1R/PPAR-γ Hemodynamic Shielding & Angiogenic Tissue Repair',
    mechanisticThesis:
      'Addresses both systemic microvascular strain (intraglomerular hypertension, hematocrit viscosity, insulin resistance) and localized connective tissue remodeling.',
    coreStack: [
      { name: 'Telmisartan', dose: '40 mg Oral', window: 'Morning', role: 'AT1R blockade + partial PPAR-γ agonism; lowers Cystatin C & hematocrit viscosity' },
      { name: 'BPC-157 (Lyophilized)', dose: '250 mcg SubQ', window: 'Morning & Evening', role: 'FAK-paxillin fibroblast migration & eNOS nitric oxide modulation' },
      { name: 'Magnesium Glycinate', dose: '400 mg elemental', window: 'Before bed', role: 'Parasympathetic vagal recovery & vascular smooth muscle relaxation' },
    ],
    requiredBaselines: ['Cystatin C with eGFR', 'CBC w/ Hematocrit & CMP-14', 'Fasting Insulin & hs-CRP'],
    estimatedMonthlySavedUsd: 82,
  },
  anxiety: {
    goalKey: 'anxiety',
    goalLabel: 'Anxiety, Autonomic Tone & Sociability',
    headline: 'Glutamatergic Hyper-Excitability Damping Without Sedative GABA Blunting',
    mechanisticThesis:
      'Calms amygdala-prefrontal glutamate spillover and peripheral sympathetic AT1R vasoconstriction while preserving dopaminergic social agency and verbal fluency.',
    coreStack: [
      { name: 'Memantine HCl', dose: '5–10 mg Oral', window: 'Morning', role: 'Reduces tonic extrasynaptic glutamate excitability without benzodiazepine/GABA cognitive dulling' },
      { name: 'Telmisartan', dose: '20 mg Oral', window: 'Morning', role: 'Blunts central & peripheral angiotensin-II sympathetic catecholamine amplification' },
      { name: 'L-Theanine + Magnesium Glycinate', dose: '200 mg / 300 mg', window: 'Afternoon / Evening', role: 'Alpha-wave cortical synchronization & NMDA co-factor stabilization' },
    ],
    requiredBaselines: ['Resting HR & Orthostatic BP', 'Free & Total Testosterone + Sensitive E2', 'Thyroid TSH / Free T3'],
    estimatedMonthlySavedUsd: 54,
  },
};

export function findGoalProtocol(goalKey = 'cognition', currentStackText = '', audit = null) {
  const arch = GOAL_PROTOCOL_ARCHITECTURES[goalKey] || GOAL_PROTOCOL_ARCHITECTURES.cognition;
  const recognizedNames = (audit?.items || []).map((i) => `${i.name}${i.amount != null ? ` ${i.amount}${i.unit ? ` ${i.unit}` : ''}` : ''}`);
  const enteredStackSummary = recognizedNames.length
    ? recognizedNames.join(', ')
    : String(currentStackText || '').trim() || arch.coreStack.map((c) => `${c.name} (${c.dose})`).join(', ');

  const conflictsSummary = (audit?.conflicts || []).map((c) => c.title).join('; ') || 'None flagged on initial screen';
  const swapsSummary = (audit?.swaps || []).map((s) => `${s.title} -> ${s.replacement_name}`).join('; ') || 'Direct reference architecture selected';

  return {
    ...arch,
    prefilledIntake: {
      goalKey: arch.goalKey,
      goalLabel: arch.goalLabel,
      enteredStack: enteredStackSummary,
      flaggedConflicts: conflictsSummary,
      recommendedSwaps: swapsSummary,
      biomarkerTargets: arch.requiredBaselines.join(' · '),
      titrationNotes: `Reference architecture for ${arch.goalLabel}: ${arch.coreStack.map((c) => `${c.name} ${c.dose} (${c.window})`).join(' + ')}.`,
      baselineBp: '116/74 mmHg',
      baselineWeightKg: '76',
    },
  };
}

// 9. Calendar (.ics) Reminder Export (Protocol Tracker + Ester Pinning + Lab Rechecks)
export function createIcsCalendar(events = [], workspaceLabel = 'BioScience Protocol') {
  const formatIcsDate = (iso) => {
    const d = new Date(iso || Date.now());
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  };
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BioScience Protocol Studio//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${workspaceLabel}`,
  ];
  for (const ev of events) {
    const startIso = ev.scheduled_at || ev.occurred_at || ev.next_at || ev.first_at || new Date().toISOString();
    const endIso = new Date(new Date(startIso).getTime() + 30 * 60 * 1000).toISOString();
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.id || crypto.randomUUID()}@bioscience.studio`,
      `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
      `DTSTART:${formatIcsDate(startIso)}`,
      `DTEND:${formatIcsDate(endIso)}`,
      `SUMMARY:${String(ev.title || ev.name || 'Protocol Administration').replace(/\n/g, ' ')}`,
      `DESCRIPTION:${String(ev.note || ev.notes || '').replace(/\n/g, ' ')}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
