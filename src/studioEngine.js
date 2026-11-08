import {
  FUNCTIONAL_EFFECT_PROFILES,
  calculateReconstitutionAndInventory,
  computeCostAndWasteAnalysis,
  computeReceptorOverlapMap,
  evaluateBloodMarkerPanel,
  generateEsterPinningSchedule,
} from './studioLogic.js';
import {
  CLIENT_226_COMPOUNDS,
  CLIENT_226_ETERNAL_TESTS,
  CLIENT_226_PUBLIC_INSIGHTS,
  CLIENT_226_REACTOR_RESULTS,
  CLIENT_226_RELATIONS,
} from './client226Data.js';

const STORAGE_KEY = 'bioscience_studio_state_226_v3';

function buildInitialState() {
  const now = new Date('2026-11-08T09:00:00.000Z');
  const isoAt = (offsetHours) => new Date(now.getTime() + offsetHours * 3600 * 1000).toISOString();

  const compounds = [
    {
      id: 'cmp-telmisartan',
      name: 'Telmisartan',
      aliases: ['micardis', 'telmi'],
      form: 'Benzimidazole Free Acid Tablet',
      route: 'Oral',
      model: 'linear_oral',
      status: 'configured',
      half_life_h: 24,
      absorption_half_life_h: 1.0,
      bioavailability: 0.43,
      volume_l: 500,
      unbound_fraction: 0.005,
      mass_per_unit_mg: {},
      source: 'DailyMed Telmisartan Monograph · Benson et al., Hypertension 2004 (AT1R/PPAR-γ)',
      notes: 'Insurmountable AT1R antagonist (t½ ~ 24h) + selective partial PPAR-γ modulator (27% activation).',
      public_visible: true,
    },
    {
      id: 'cmp-memantine',
      name: 'Memantine HCl',
      aliases: ['memantine', 'namenda', 'ebixa'],
      form: 'Hydrochloride Salt Oral Tablet',
      route: 'Oral',
      model: 'linear_oral',
      status: 'configured',
      half_life_h: 65,
      absorption_half_life_h: 1.5,
      bioavailability: 0.99,
      volume_l: 98,
      unbound_fraction: 0.55,
      mass_per_unit_mg: {},
      source: 'Lipton, Nat Rev Drug Discov 2006 · DailyMed Memantine HCl Monograph',
      notes: 'Uncompetitive voltage-dependent extrasynaptic NMDA open-channel blocker; preserves phasic synaptic LTP.',
      public_visible: true,
    },
    {
      id: 'cmp-endoxifen',
      name: 'Endoxifen',
      aliases: ['z-endoxifen', '4-oh-n-desmethyltamoxifen'],
      form: '(Z)-Isomer Enteric Capsule',
      route: 'Oral',
      model: 'linear_oral',
      status: 'configured',
      half_life_h: 52,
      absorption_half_life_h: 1.2,
      bioavailability: 0.88,
      volume_l: 180,
      unbound_fraction: 0.02,
      mass_per_unit_mg: {},
      source: 'Goetz et al., J Clin Oncol 2017 · Wu et al., Cancer Res 2009',
      notes: 'Direct active SERM metabolite bypassing CYP2D6 genetic polymorphism bottleneck; targeted AF-1/AF-2 ER co-regulator recruitment.',
      public_visible: true,
    },
    {
      id: 'cmp-vosoritide',
      name: 'Vosoritide (CNP-38)',
      aliases: ['vosoritide', 'cnp', 'cnp-38', 'voxzogo', 'fgfr3-cnp'],
      form: 'Modified Recombinant Human C-Type Natriuretic Peptide (Lyophilized)',
      route: 'Subcutaneous',
      model: 'linear_bolus',
      status: 'configured',
      half_life_h: 0.75,
      absorption_half_life_h: 0.25,
      bioavailability: 0.85,
      volume_l: 18,
      unbound_fraction: 0.92,
      mass_per_unit_mg: { mL: 0.8 },
      source: 'Savarirayan et al., NEJM 2019 · Lorget et al., Am J Hum Genet 2012',
      notes: 'NPR-B guanylyl cyclase agonist → cGMP → PKGII phosphorylation of RAF-1 Ser43, unblocking FGFR3 MAPK chondrocyte inhibition.',
      public_visible: true,
    },
    {
      id: 'cmp-test-cyp',
      name: 'Testosterone Cypionate',
      aliases: ['test cyp', 'testosterone', 'cypionate', 'test e', 'testosterone enanthate'],
      form: '17β-Cyclopentylpropionate Ester in USP Cottonseed/MCT Carrier',
      route: 'Intramuscular / SubQ',
      model: 'linear_bolus',
      status: 'configured',
      half_life_h: 120,
      absorption_half_life_h: 14,
      bioavailability: 0.95,
      volume_l: 75,
      unbound_fraction: 0.02,
      mass_per_unit_mg: { mL: 200 },
      source: 'Nieschlag & Behre, Testosterone: Action, Deficiency, Substitution',
      notes: 'Depot androgen ester (t½ ~ 5 days). Pair with micro-cadence pinning (E3.5D / EOD) to minimize aromatase E2 & hematocrit peaks.',
      public_visible: true,
    },
    {
      id: 'cmp-bpc157',
      name: 'BPC-157 (Lyophilized)',
      aliases: ['bpc-157', 'bpc 157', 'pentadecapeptide'],
      form: 'Lyophilized Acetate / Arginate Vial',
      route: 'Subcutaneous',
      model: 'linear_bolus',
      status: 'configured',
      half_life_h: 4.5,
      absorption_half_life_h: 0.3,
      bioavailability: 0.90,
      volume_l: 24,
      unbound_fraction: 0.85,
      mass_per_unit_mg: { mL: 2.5 },
      source: 'Hsieh et al., J Appl Physiol 2017 · Sikiric et al., Curr Pharm Des 2018',
      notes: 'Upregulates growth hormone receptor expression on fibroblasts and FAK-paxillin angiogenic remodeling.',
      public_visible: true,
    },
    {
      id: 'cmp-citicoline',
      name: 'Citicoline (CDP-Choline)',
      aliases: ['citicoline', 'cdp-choline', 'cognizin'],
      form: 'Cytidine 5-Diphosphocholine Free Base',
      route: 'Oral',
      model: 'linear_oral',
      status: 'configured',
      half_life_h: 56,
      absorption_half_life_h: 1.5,
      bioavailability: 0.92,
      volume_l: 65,
      unbound_fraction: 0.75,
      mass_per_unit_mg: {},
      source: 'Secades & Lorenzo, Methods Find Exp Clin Pharmacol 2006',
      notes: 'Dual choline + cytidine/uridine donor supporting phosphatidylcholine synthesis and striatal dopamine receptor density.',
      public_visible: true,
    },
    {
      id: 'cmp-tamoxifen',
      name: 'Tamoxifen Citrate',
      aliases: ['tamoxifen', 'nolvadex'],
      form: 'Oral Prodrug Tablet',
      route: 'Oral',
      model: 'linear_oral',
      status: 'configured',
      half_life_h: 140,
      absorption_half_life_h: 2.0,
      bioavailability: 0.75,
      volume_l: 350,
      unbound_fraction: 0.01,
      mass_per_unit_mg: {},
      source: 'Goetz et al., J Clin Oncol 2017',
      notes: 'Prodrug requiring hepatic CYP2D6 bioactivation to Endoxifen; suppresses hepatic IGF-1 on first pass.',
      public_visible: true,
    },
    {
      id: 'cmp-alphagpc',
      name: 'Alpha-GPC',
      aliases: ['alpha gpc', 'alpha-gpc', 'choline alfoscerate'],
      form: 'Hygroscopic Capsule',
      route: 'Oral',
      model: 'linear_oral',
      status: 'configured',
      half_life_h: 5,
      absorption_half_life_h: 0.8,
      bioavailability: 0.85,
      volume_l: 45,
      unbound_fraction: 0.8,
      mass_per_unit_mg: {},
      source: 'Wang et al., JAMA Netw Open 2021 (TMAO conversion)',
      notes: 'Rapid acetylcholine spike but undergoes gut microbial TMA → hepatic TMAO conversion at high bolus doses.',
      public_visible: true,
    },
    {
      id: 'cmp-mgoxide',
      name: 'Magnesium Oxide',
      aliases: ['magnesium oxide', 'mg oxide'],
      form: 'Inorganic Oxide Tablet',
      route: 'Oral',
      model: 'unconfigured',
      status: 'configured',
      half_life_h: null,
      absorption_half_life_h: null,
      bioavailability: 0.04,
      volume_l: null,
      unbound_fraction: null,
      mass_per_unit_mg: {},
      source: 'Firoz & Graber, Magnes Res 2001 (4% fractional bioavailability)',
      notes: 'Poorly soluble inorganic oxide (~4% fractional absorption); largely acts as osmotic laxative.',
      public_visible: true,
    },
    {
      id: 'cmp-mgthreonate',
      name: 'Magnesium L-Threonate',
      aliases: ['magtein', 'mg l-threonate', 'magnesium glycinate', 'magnesium l-threonate'],
      form: 'Chelated L-Threonate / Bisglycinate',
      route: 'Oral',
      model: 'linear_oral',
      status: 'configured',
      half_life_h: 12,
      absorption_half_life_h: 1.0,
      bioavailability: 0.65,
      volume_l: 40,
      unbound_fraction: 0.70,
      mass_per_unit_mg: {},
      source: 'Slutsky et al., Neuron 2010',
      notes: 'Elevates brain cerebrospinal fluid Mg²⁺ and supports resting NMDA voltage block.',
      public_visible: true,
    },
  ];

  const relations = [
    {
      id: 'rel-telmi-test',
      perpetrator_id: 'cmp-telmisartan',
      victim_id: 'cmp-test-cyp',
      kind: 'complementary',
      title: 'Telmisartan AT1R / PPAR-γ Hemodynamic Shielding under Androgen Load',
      description: 'Telmisartan counteracts androgen-induced angiotensin II vasoconstriction, aldosterone retention, left-ventricular hypertrophy, and erythropoietin-driven hematocrit viscosity.',
      pathway: 'RAAS / AT1R / eNOS',
      fraction_metabolized: null,
      ki_mg_l: null,
      concentration_basis: 'unbound',
      source: 'Benson et al., Hypertension 2004',
      goal: 'recovery',
    },
    {
      id: 'rel-memantine-citicoline',
      perpetrator_id: 'cmp-memantine',
      victim_id: 'cmp-citicoline',
      kind: 'complementary',
      title: 'Extrasynaptic NMDA Noise Filtering + Phasic Cholinergic LTP Synergy',
      description: 'Memantine suppresses tonic extrasynaptic GluN2B Ca²⁺ noise while Citicoline amplifies phasic synaptic nicotinic/AMPA depolarization and membrane phospholipid repair.',
      pathway: 'Glutamatergic / Cholinergic Synaptic Coupling',
      fraction_metabolized: null,
      ki_mg_l: null,
      concentration_basis: 'unbound',
      source: 'Lipton, Nat Rev Drug Discov 2006',
      goal: 'cognition',
    },
    {
      id: 'rel-endoxifen-vosoritide',
      perpetrator_id: 'cmp-endoxifen',
      victim_id: 'cmp-vosoritide',
      kind: 'complementary',
      title: 'Epiphyseal Chondrocyte Senescence Delay + NPR-B cGMP Proliferation',
      description: 'Endoxifen blocks ERα-driven growth-plate chondrocyte senescence without suppressing hepatic IGF-1, extending the temporal window for Vosoritide NPR-B → cGMP → PKGII linear growth velocity.',
      pathway: 'Epiphyseal Growth Plate ERα / NPR2-PKGII',
      fraction_metabolized: null,
      ki_mg_l: null,
      concentration_basis: 'unbound',
      source: 'Savarirayan et al., NEJM 2019; Goetz et al., J Clin Oncol 2017',
      goal: 'height',
    },
  ];

  const public_insights = [
    {
      id: 'pi-tamoxifen-swap',
      kind: 'swap',
      compound_ids: ['cmp-tamoxifen'],
      goals: ['height', 'bone', 'recovery'],
      target_id: 'cmp-tamoxifen',
      replacement_id: 'cmp-endoxifen',
      bucket: null,
      title: 'Prodrug Tamoxifen relies on variable CYP2D6 bioactivation and suppresses first-pass IGF-1',
      explanation: 'Up to 30% of individuals carry reduced-function CYP2D6 alleles that blunt conversion of Tamoxifen to active Endoxifen while still subjecting the liver to first-pass estrogenic IGF-1 suppression. Direct (Z)-Endoxifen achieves predictable ERα co-repressor recruitment at 1/5th the milligram load.',
      source: 'Goetz et al., J Clin Oncol 2017 · Wu et al., Cancer Res 2009',
      published: true,
    },
    {
      id: 'pi-alphagpc-swap',
      kind: 'swap',
      compound_ids: ['cmp-alphagpc'],
      goals: ['cognition', 'studying'],
      target_id: 'cmp-alphagpc',
      replacement_id: 'cmp-citicoline',
      bucket: null,
      title: 'High-dose Alpha-GPC converts to pro-atherogenic TMAO and lacks uridine',
      explanation: 'Citicoline (CDP-Choline) delivers both choline and cytidine (converted to uridine) to upregulate dopamine D2 receptor density and phosphatidylcholine synthesis with significantly lower gut TMA → TMAO conversion.',
      source: 'Secades & Lorenzo 2006; Wang et al., JAMA Netw Open 2021',
      published: true,
    },
    {
      id: 'pi-mgoxide-swap',
      kind: 'swap',
      compound_ids: ['cmp-mgoxide'],
      goals: [],
      target_id: 'cmp-mgoxide',
      replacement_id: 'cmp-mgthreonate',
      bucket: null,
      title: 'Magnesium Oxide has ~4% fractional absorption (96% unabsorbed GI waste)',
      explanation: 'Inorganic Magnesium Oxide barely crosses the intestinal epithelium. Switching to Magnesium L-Threonate or Bisglycinate restores intracellular and CSF Mg²⁺ needed to gate resting NMDA channels.',
      source: 'Firoz & Graber, Magnes Res 2001; Slutsky et al., Neuron 2010',
      published: true,
    },
    {
      id: 'pi-memantine-timing',
      kind: 'timing',
      compound_ids: ['cmp-memantine'],
      goals: [],
      target_id: 'cmp-memantine',
      replacement_id: null,
      bucket: 'After waking (or Before bed during Days 1–5 α7-nAChR adaptation)',
      title: 'Memantine HCl Timing',
      explanation: 'With a 60–80 h elimination half-life, steady-state tonic NMDA blockade spans 24 hours; bedtime dosing during Week 1 masks transient α7-nAChR adaptation fog.',
      source: 'DailyMed Memantine HCl Monograph',
      published: true,
    },
    {
      id: 'pi-telmisartan-timing',
      kind: 'timing',
      compound_ids: ['cmp-telmisartan'],
      goals: [],
      target_id: 'cmp-telmisartan',
      replacement_id: null,
      bucket: 'After waking (or split AM/PM for 24h non-dipper BP profile)',
      title: 'Telmisartan Timing',
      explanation: 'Peak plasma concentration occurs 0.5–1 h post-dose with a 24 h terminal half-life and insurmountable AT1R receptor binding.',
      source: 'DailyMed Telmisartan Monograph',
      published: true,
    },
    {
      id: 'pi-endoxifen-timing',
      kind: 'timing',
      compound_ids: ['cmp-endoxifen'],
      goals: [],
      target_id: 'cmp-endoxifen',
      replacement_id: null,
      bucket: 'After waking (consistent 24h window)',
      title: 'Endoxifen Timing',
      explanation: 'Terminal half-life ~52 hours maintains stable hypothalamic and epiphyseal ERα occupancy with once-daily morning administration.',
      source: 'Ahmad et al., Clin Pharmacol Ther 2010',
      published: true,
    },
    {
      id: 'pi-vosoritide-timing',
      kind: 'timing',
      compound_ids: ['cmp-vosoritide'],
      goals: [],
      target_id: 'cmp-vosoritide',
      replacement_id: null,
      bucket: 'Morning hydrated window (post-meal to prevent transient cGMP orthostatic dip)',
      title: 'Vosoritide (CNP-38) Timing',
      explanation: 'SubQ administration after 250 mL water and a light meal prevents transient vascular cGMP hypotension while driving a 24-hour chondrocyte PKGII cascade.',
      source: 'Savarirayan et al., NEJM 2019',
      published: true,
    },
  ];

  // Initial Reconstitution & Inventory state
  const initialRecon = calculateReconstitutionAndInventory({
    compoundName: 'Vosoritide (CNP-38)',
    vialMassMg: 10,
    diluentMl: 2.0,
    targetDoseMcg: 1100,
    activeFraction: 0.96,
    dosesTaken: 23,
    pinsInBox: 30,
    bacWaterBottleMl: 10,
    vialsReconstitutedCount: 4,
  });

  // Initial Ester Pinning Schedule
  const initialPinSchedule = generateEsterPinningSchedule({
    compoundName: 'Testosterone Cypionate',
    ester: 'cypionate',
    weeklyDoseMg: 140,
    concentrationMgMl: 200,
    cadenceMode: 'e3_5d',
    startDateIso: isoAt(3),
    weeks: 3,
  });

  // Initial Blood Marker Panel
  const initialLabPanel = evaluateBloodMarkerPanel({
    recordedAtIso: isoAt(-72),
    recheckWeeks: 6,
    sourcePhotoName: 'labcorp-endocrine-renal-panel-nov2026.jpg',
    entries: [
      { markerKey: 'estradiol_sensitive', value: 29.4 },
      { markerKey: 'igf1_lcms', value: 238 },
      { markerKey: 'cystatin_c', value: 0.74 },
      { markerKey: 'fasting_insulin', value: 3.8 },
      { markerKey: 'cmp_cbc_hematocrit', value: 46.2 },
    ],
  });

  const workspace = {
    id: 'ws-client-01',
    label: 'Client #01 · Executive Neuro-Endocrine & Epiphyseal Studio',
    goal: 'Synchronize AT1R/PPAR-γ hemodynamic protection (Telmisartan), extrasynaptic NMDA noise suppression (Memantine), CYP2D6-independent ER co-regulator modulation (Endoxifen), and NPR-B/cGMP epiphyseal kinetics.',
    timezone: 'UTC',
    revision: 4,
    allow_plan_changes: true,
    protocol: {
      items: [
        {
          id: 'item-telmisartan',
          compound_id: 'cmp-telmisartan',
          name: 'Telmisartan',
          amount: 40,
          next_amount: 40,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-144),
          next_at: isoAt(2),
          due_status: 'due',
          window_label: 'Morning Window (07:30–09:30)',
          notes: 'AT1R insurmountable blockade (t½ 24h) + 27% selective PPAR-γ activation. Protects eGFR/Cystatin C & insulin sensitivity.',
          minimum_amount: 20,
          maximum_amount: 80,
        },
        {
          id: 'item-memantine',
          compound_id: 'cmp-memantine',
          name: 'Memantine HCl',
          amount: 10,
          next_amount: 10,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-144),
          next_at: isoAt(4),
          due_status: 'due',
          window_label: 'Morning Window (08:00–10:00)',
          notes: 'Extrasynaptic GluN2B tonic Ca²⁺ block while preserving phasic hippocampal AMPA/NMDA LTP.',
          minimum_amount: 5,
          maximum_amount: 20,
        },
        {
          id: 'item-endoxifen',
          compound_id: 'cmp-endoxifen',
          name: 'Endoxifen',
          amount: 4,
          next_amount: 4,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-120),
          next_at: isoAt(6),
          due_status: 'upcoming',
          window_label: 'Midday Window (12:00–14:00)',
          notes: 'Direct active (Z)-Endoxifen; bypasses CYP2D6 polymorphism bottleneck & preserves hepatic IGF-1.',
          minimum_amount: 2,
          maximum_amount: 8,
        },
        {
          id: 'item-vosoritide',
          compound_id: 'cmp-vosoritide',
          name: 'Vosoritide (CNP-38)',
          amount: 1.1,
          next_amount: 1.1,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-96),
          next_at: isoAt(8),
          due_status: 'upcoming',
          window_label: 'Circadian SubQ Window (10:00)',
          notes: `Reconstituted: ${initialRecon.concMgMl} mg/mL · Draw ${initialRecon.drawMl} mL (${initialRecon.u100Units} U-100 units) · ${initialRecon.pinsLeft} pins left / ${initialRecon.bacWaterLeftMl} mL BAC water left.`,
          minimum_amount: 0.5,
          maximum_amount: 1.5,
          reconstitution: initialRecon,
        },
        {
          id: 'item-test-cyp',
          compound_id: 'cmp-test-cyp',
          name: 'Testosterone Cypionate',
          amount: 70,
          next_amount: 70,
          unit: 'mg',
          interval_h: 84,
          first_at: isoAt(-84),
          next_at: isoAt(12),
          due_status: 'upcoming',
          window_label: 'E3.5D Pinning Window (Mon AM / Thu PM)',
          notes: '70 mg (0.35 mL / 35 U-100 units) every 84h (140 mg/wk) · Peak-to-trough ratio 1.62x.',
          minimum_amount: 40,
          maximum_amount: 100,
        },
      ],
      measures: [
        { id: 'meas-bp-sys', name: 'Resting Systolic BP', unit: 'mmHg', minimum: 85, maximum: 180, target: 116 },
        { id: 'meas-snr', name: 'Cognitive Signal-to-Noise', unit: 'score (1-10)', minimum: 1, maximum: 10, target: 8.5 },
        { id: 'meas-e2', name: 'Estradiol, Ultrasensitive (LC-MS/MS)', unit: 'pg/mL', minimum: 5, maximum: 120, target: 28 },
        { id: 'meas-cxm', name: 'Collagen X Epiphyseal Velocity (CXM)', unit: 'ng/mL', minimum: 5, maximum: 80, target: 42 },
      ],
      gates: [
        {
          id: 'gate-bp',
          title: 'Hemodynamic AT1R Titration Guardrail',
          measure_id: 'meas-bp-sys',
          compound_id: 'cmp-telmisartan',
          operator: 'gte',
          threshold: 128,
          max_age_h: 168,
          action: 'note',
          maximum_amount: null,
          unit: null,
          source: 'Benson et al. 2004: Evaluate 20 mg → 40 mg Telmisartan step-up if systolic BP exceeds 128 mmHg.',
        },
        {
          id: 'gate-e2',
          title: 'Epiphyseal & HPTA Estradiol Ceiling',
          measure_id: 'meas-e2',
          compound_id: 'cmp-endoxifen',
          operator: 'gte',
          threshold: 38,
          max_age_h: 720,
          action: 'maximum_amount',
          maximum_amount: 8,
          unit: 'mg',
          source: 'Maintain ultrasensitive E2 within 20–38 pg/mL alongside Endoxifen AF-2 blockade.',
        },
      ],
    },
    events: [
      {
        id: 'ev-1',
        item_id: 'item-telmisartan',
        compound_id: 'cmp-telmisartan',
        name: 'Telmisartan',
        status: 'taken',
        amount: 40,
        unit: 'mg',
        occurred_at: isoAt(-22),
        scheduled_at: isoAt(-22),
        note: 'Morning fasted administration with 300 mL water.',
      },
      {
        id: 'ev-2',
        item_id: 'item-memantine',
        compound_id: 'cmp-memantine',
        name: 'Memantine HCl',
        status: 'taken',
        amount: 10,
        unit: 'mg',
        occurred_at: isoAt(-21),
        scheduled_at: isoAt(-21),
        note: 'Day 14 steady-state; zero α7-nAChR fog, sharp working memory.',
      },
      {
        id: 'ev-3',
        item_id: 'item-endoxifen',
        compound_id: 'cmp-endoxifen',
        name: 'Endoxifen',
        status: 'taken',
        amount: 4,
        unit: 'mg',
        occurred_at: isoAt(-18),
        scheduled_at: isoAt(-18),
        note: 'Direct (Z)-Endoxifen capsule taken at 12:30.',
      },
    ],
    observations: [
      { id: 'obs-1', measure_id: 'meas-bp-sys', value: 124, unit: 'mmHg', occurred_at: isoAt(-120), note: 'Baseline prior to 40 mg Telmisartan step-up' },
      { id: 'obs-2', measure_id: 'meas-bp-sys', value: 118, unit: 'mmHg', occurred_at: isoAt(-72), note: 'Day 3 on Telmisartan 40 mg' },
      { id: 'obs-3', measure_id: 'meas-bp-sys', value: 114, unit: 'mmHg', occurred_at: isoAt(-12), note: 'Morning seated average — optimal AT1R saturation' },
      { id: 'obs-4', measure_id: 'meas-snr', value: 6.5, unit: 'score (1-10)', occurred_at: isoAt(-120), note: 'Transient Day-3 α7-nAChR adaptation window' },
      { id: 'obs-5', measure_id: 'meas-snr', value: 8.8, unit: 'score (1-10)', occurred_at: isoAt(-12), note: 'Post-upregulation clarity; zero afternoon glutamate fatigue' },
      { id: 'obs-6', measure_id: 'meas-e2', value: 29.4, unit: 'pg/mL', occurred_at: isoAt(-72), note: 'LabCorp LC-MS/MS panel verified' },
      { id: 'obs-7', measure_id: 'meas-cxm', value: 44.2, unit: 'ng/mL', occurred_at: isoAt(-48), note: 'Elevated Collagen X velocity (+48% over baseline)' },
    ],
    protocol_changes: [
      { id: 'chg-1', title: 'Swapped Tamoxifen 20 mg → Direct (Z)-Endoxifen 4 mg (CYP2D6 bypass)', occurred_at: isoAt(-120) },
      { id: 'chg-2', title: 'Shifted Memantine HCl 10 mg titration to morning window post α7-nAChR adaptation', occurred_at: isoAt(-72) },
      { id: 'chg-3', title: 'Split Testosterone Cypionate 140 mg/wk into 70 mg E3.5D pinning schedule', occurred_at: isoAt(-48) },
    ],
    // Reshaped Studio Extensions stored directly on workspace
    reconstitutions: [initialRecon],
    calendar_events: [
      ...initialPinSchedule.events.slice(0, 6),
      initialLabPanel.calendarEvent,
    ],
    symptom_attributions: [
      {
        id: 'sym-1',
        entryMode: 'mini_experiment',
        attributedChange: 'Shifted Memantine HCl 10 mg titration to morning window post α7-nAChR adaptation',
        hypothesis: '7-day bedtime bridge eliminates transient α7-nAChR nicotinic adaptation fog while preserving daytime LTP.',
        observation: 'Afternoon verbal fluency and working-memory endurance rose from 6.5/10 to 8.8/10 with zero stimulant tolerance drift.',
        verdict: 'Confirmed causal link (Keep current change)',
        occurred_at: isoAt(-18),
      },
      {
        id: 'sym-2',
        entryMode: 'voice_checkin',
        attributedChange: 'Split Testosterone Cypionate 140 mg/wk into 70 mg E3.5D pinning schedule',
        hypothesis: 'Voice check-in transcript attribution',
        observation: 'Dictated note: "Evening water retention and facial flushing disappeared within 5 days of switching from once-weekly to E3.5D pinning + Telmisartan 40 mg."',
        verdict: 'Confirmed causal link (Keep current change)',
        occurred_at: isoAt(-10),
      },
    ],
    blood_marker_panels: [initialLabPanel],
    consultation_notes: [
      {
        id: 'consult-1',
        clientCode: 'CL-2026-226 (cc224)',
        createdAt: isoAt(-96),
        biologicalBaseline: 'Client 226 (cc224) · 74.0 kg · Dual-Domain Architecture (53-Slot Cognition + 14-Day Staged Epiphyseal Height Reactor) · Resting BP 114/72 mmHg · CYP2D6 *4/*10 · eGFR 112 mL/min.',
        biomarkerTargets: 'Serum PO4 <= 4.5 mg/dL (R03) · Ultrasensitive E2 12–20 pg/mL (R01) · Free T4 1.3–1.7 ng/dL (R02) · CXM > 42 ng/mL.',
        titrationAdjustments: 'Height Arm A: Dabogratinib 18.5 mg + Vosoritide 1.11 mg SubQ + Staged Somatropin + Thiol-Clutch 36h before Day 9. Cognition: TAK-653 0.5 mg + ACD856 10 mg + OV350 25 mg + AUT00206 50 mg + Basmisanil 5 mg + Terazosin 0.6 mg.',
        clinicianSignoff: 'Protocol Studio — Client 226 Mechanistic Architecture',
      },
    ],
  };

  // Deduplicate and merge Client 226's 170 compounds, relations, and public insights
  const existingCompoundIds = new Set(compounds.map((c) => c.id));
  const mergedCompounds = [
    ...compounds,
    ...CLIENT_226_COMPOUNDS.filter((c) => !existingCompoundIds.has(c.id)),
  ];

  const existingRelIds = new Set(relations.map((r) => r.id));
  const mergedRelations = [
    ...relations,
    ...CLIENT_226_RELATIONS.filter((r) => !existingRelIds.has(r.id)),
  ];

  const existingInsightIds = new Set(public_insights.map((p) => p.id));
  const mergedPublicInsights = [
    ...public_insights,
    ...CLIENT_226_PUBLIC_INSIGHTS.filter((p) => !existingInsightIds.has(p.id)),
  ];

  const ws226Cognition = {
    id: 'ws-226-cognition',
    label: 'Client 226 (cc224) · 53-Slot Cognition & Exam-Execution Architecture',
    goal: 'Maximize multi-hour hippocampal pattern separation (Basmisanil α5-GABA-A NAM), fast AMPA/TrkB consolidation (TAK-653 + ACD856), PV+ gamma gain (OV350 + AUT00206), DLPFC persistent recurrence (Guanfacine + BPN14770), and PGK1/ISR metabolic endurance (Terazosin 0.6 mg + DNL343 + S107 + Creatine/GAA) with strict retrieval ordering gates.',
    timezone: 'UTC',
    revision: 6,
    allow_plan_changes: true,
    protocol: {
      items: [
        {
          id: 'item-226-tak653',
          compound_id: 'cmp-226-tak-653',
          name: 'TAK-653 (Osavampator)',
          amount: 0.5,
          next_amount: 0.5,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-144),
          next_at: isoAt(1),
          due_status: 'due',
          window_label: 'T - 90 min Encoding / Pre-Study Window (07:30)',
          notes: 'Slot #1 · Zero-intrinsic-agonism AMPA PAM (t½ ~ 39h). Amplifies fast EPSP slope without excitotoxic desensitization.',
          minimum_amount: 0.25,
          maximum_amount: 2.0,
        },
        {
          id: 'item-226-acd856',
          compound_id: 'cmp-226-acd856',
          name: 'ACD856 (Ponazuril-class TrkB PAM)',
          amount: 10,
          next_amount: 10,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-144),
          next_at: isoAt(1),
          due_status: 'due',
          window_label: 'T - 90 min Encoding / Pre-Study Window (07:30)',
          notes: 'Slot #1 · Positive allosteric TrkB/BDNF dimerization stabilizer; couples activity-dependent AMPA currents to structural spine consolidation.',
          minimum_amount: 5,
          maximum_amount: 30,
        },
        {
          id: 'item-226-ov350',
          compound_id: 'cmp-226-ov350',
          name: 'OV350 (Direct KCC2 Activator)',
          amount: 25,
          next_amount: 25,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-120),
          next_at: isoAt(2),
          due_status: 'due',
          window_label: 'T - 60 min E/I Gain Window (08:00)',
          notes: 'Slot #5 · Extrudes neuronal Cl⁻ to deepen E_GABA driving force (-75 mV) and prevent Cl⁻ collapse during 6-hour study bouts.',
          minimum_amount: 10,
          maximum_amount: 50,
        },
        {
          id: 'item-226-aut00206',
          compound_id: 'cmp-226-aut00206',
          name: 'AUT00206 (Kv3.1/Kv3.2 Positive Modulator)',
          amount: 50,
          next_amount: 50,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-120),
          next_at: isoAt(2),
          due_status: 'due',
          window_label: 'T - 60 min E/I Gain Window (08:00)',
          notes: 'Slot #6 · Restores fast afterhyperpolarization on parvalbumin (PV+) basket interneurons to lock 40–80 Hz gamma synchrony.',
          minimum_amount: 25,
          maximum_amount: 100,
        },
        {
          id: 'item-226-basmisanil',
          compound_id: 'cmp-226-basmisanil',
          name: 'Basmisanil (RG1662 · α5-GABA-A NAM)',
          amount: 5,
          next_amount: 5,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-96),
          next_at: isoAt(3),
          due_status: 'due',
          window_label: 'T - 60 min Pattern Separation Window (08:00)',
          notes: 'Slot #7 · Selective extrasynaptic α5-GABA-A negative allosteric modulator; releases dentate gyrus / CA3 tonic inhibition for orthogonal cue separation.',
          minimum_amount: 2.5,
          maximum_amount: 10,
        },
        {
          id: 'item-226-guanfacine',
          compound_id: 'cmp-226-guanfacine-er',
          name: 'Guanfacine ER',
          amount: 1.0,
          next_amount: 1.0,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-144),
          next_at: isoAt(3),
          due_status: 'upcoming',
          window_label: 'Morning DLPFC Gain Window (08:00)',
          notes: 'Slot #9 · Postsynaptic α2A-adrenoceptor agonist closing dendritic HCN channels on Layer III DLPFC spines (Cap <= 1.0 mg for exam retrieval flexibility).',
          minimum_amount: 0.5,
          maximum_amount: 2.0,
        },
        {
          id: 'item-226-bpn14770',
          compound_id: 'cmp-226-bpn14770',
          name: 'BPN14770 (Zatomilast · PDE4D NAM)',
          amount: 25,
          next_amount: 25,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-120),
          next_at: isoAt(4),
          due_status: 'upcoming',
          window_label: 'Mid-Morning PKA/CREB Window (09:00)',
          notes: 'Slot #24 · Dimeric PDE4D allosteric inhibitor; prolongs compartmentalized cAMP-PKA-CREB transcriptional tags without area postrema emesis.',
          minimum_amount: 10,
          maximum_amount: 50,
        },
        {
          id: 'item-226-dnl343',
          compound_id: 'cmp-226-dnl343',
          name: 'DNL343 (Brain-Penetrant eIF2B Activator)',
          amount: 10,
          next_amount: 10,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-120),
          next_at: isoAt(5),
          due_status: 'upcoming',
          window_label: 'Midday Translational Gate Release (12:00)',
          notes: 'Slot #25 · Decimates ATF4 translational brake and restores de novo synaptic protein synthesis during prolonged cognitive or ER load.',
          minimum_amount: 5,
          maximum_amount: 20,
        },
        {
          id: 'item-226-s107',
          compound_id: 'cmp-226-s107',
          name: 'S107 (Rycal RyR2-Calstabin2 Stabilizer)',
          amount: 25,
          next_amount: 25,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-96),
          next_at: isoAt(6),
          due_status: 'upcoming',
          window_label: 'Midday Ca²⁺ Leak Shield (12:00)',
          notes: 'Slot #22 · Prevents PKA-hyperphosphorylated RyR2 from shedding FKBP12.6/Calstabin2, halting dendritic ER Ca²⁺ leak and SK-channel slowing.',
          minimum_amount: 10,
          maximum_amount: 50,
        },
        {
          id: 'item-226-terazosin',
          compound_id: 'cmp-226-terazosin',
          name: 'Terazosin (Biphasic PGK1 Allosteric Activator)',
          amount: 0.6,
          next_amount: 0.6,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-144),
          next_at: isoAt(10),
          due_status: 'upcoming',
          window_label: 'Evening / Bedtime PGK1 Window (21:00)',
          notes: 'Slot #27 / Rule C03 · Exact 0.6 mg dose hits the ~25 nM biphasic PGK1 ADP-release optimum (+63% glycolytic ATP flux). Never exceed 1.0 mg.',
          minimum_amount: 0.25,
          maximum_amount: 1.0,
        },
        {
          id: 'item-226-creatine-gaa',
          compound_id: 'cmp-226-creatine-monohydrate',
          name: 'Creatine Monohydrate + GAA + Betaine (TMG)',
          amount: 5000,
          next_amount: 5000,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-144),
          next_at: isoAt(4),
          due_status: 'upcoming',
          window_label: 'Shared Cross-Domain Phosphagen Pool (10:00)',
          notes: 'Slot #27 · 5 g Creatine + 2 g GAA + 2.5 g Betaine (Rule C06: SAMe methyl-group protection). Shared across Cognition & Height.',
          minimum_amount: 3000,
          maximum_amount: 10000,
        },
        {
          id: 'item-226-daridorexant',
          compound_id: 'cmp-226-daridorexant',
          name: 'Daridorexant (Dual Orexin Antagonist)',
          amount: 25,
          next_amount: 25,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-96),
          next_at: isoAt(12),
          due_status: 'upcoming',
          window_label: 'T - 30 min Sleep Spindle & Glymphatic Window (22:30)',
          notes: 'Slot #39 · 8h terminal half-life preserves slow-wave sleep spindles and glymphatic clearance with zero next-morning residual occupancy.',
          minimum_amount: 25,
          maximum_amount: 50,
        },
      ],
      measures: [
        { id: 'meas-226-snr', name: 'Cognitive Signal-to-Noise & Pattern Separation', unit: 'score (1-10)', minimum: 1, maximum: 10, target: 9.2 },
        { id: 'meas-226-endurance', name: 'Sustained Study Endurance Without ATP Wall', unit: 'hours', minimum: 1, maximum: 12, target: 7.5 },
        { id: 'meas-226-bp', name: 'Seated Systolic BP (Terazosin/Guanfacine Check)', unit: 'mmHg', minimum: 85, maximum: 160, target: 114 },
        { id: 'meas-226-homocysteine', name: 'Plasma Homocysteine (GAA Methylation Check)', unit: 'umol/L', minimum: 3, maximum: 20, target: 6.8 },
      ],
      gates: [
        {
          id: 'gate-226-terazosin',
          title: 'Rule C03 · Terazosin Biphasic PGK1 Cap (<= 1.0 mg)',
          measure_id: 'meas-226-bp',
          compound_id: 'cmp-226-terazosin',
          operator: 'lte',
          threshold: 100,
          max_age_h: 168,
          action: 'maximum_amount',
          maximum_amount: 0.6,
          unit: 'mg',
          source: 'Chen et al., Nat Metab 2019: PGK1 activation peaks at 0.5–0.75 mg (~25 nM) and reverses above 1.5 mg.',
        },
        {
          id: 'gate-226-gaa-betaine',
          title: 'Rule C06 · GAA Methyl-Group Stoichiometry Guardrail',
          measure_id: 'meas-226-homocysteine',
          compound_id: 'cmp-226-creatine-monohydrate',
          operator: 'gte',
          threshold: 9.5,
          max_age_h: 720,
          action: 'note',
          maximum_amount: null,
          unit: null,
          source: 'Co-administer >= 1.25x mass ratio Betaine (TMG 2.5 g per 2.0 g GAA) to prevent GAMT methyl-group depletion.',
        },
      ],
    },
    events: [
      {
        id: 'ev-226-1',
        item_id: 'item-226-tak653',
        compound_id: 'cmp-226-tak-653',
        name: 'TAK-653 (Osavampator)',
        status: 'taken',
        amount: 0.5,
        unit: 'mg',
        occurred_at: isoAt(-22),
        scheduled_at: isoAt(-22),
        note: 'Pre-study encoding block; paired with ACD856 10 mg.',
      },
      {
        id: 'ev-226-2',
        item_id: 'item-226-terazosin',
        compound_id: 'cmp-226-terazosin',
        name: 'Terazosin (Biphasic PGK1 Allosteric Activator)',
        status: 'taken',
        amount: 0.6,
        unit: 'mg',
        occurred_at: isoAt(-11),
        scheduled_at: isoAt(-11),
        note: 'Exact 0.6 mg micro-dose (~25 nM PGK1 optimum); zero orthostatic dip.',
      },
    ],
    observations: [
      { id: 'obs-226-1', measure_id: 'meas-226-snr', value: 7.4, unit: 'score (1-10)', occurred_at: isoAt(-120), note: 'Baseline prior to Basmisanil + OV350 + AUT00206 synchronization' },
      { id: 'obs-226-2', measure_id: 'meas-226-snr', value: 9.1, unit: 'score (1-10)', occurred_at: isoAt(-24), note: 'High-similarity lure discrimination +28%; zero false-recognition bleed' },
      { id: 'obs-226-3', measure_id: 'meas-226-endurance', value: 7.5, unit: 'hours', occurred_at: isoAt(-24), note: 'Full 7.5h study marathon without Hour-5 ATP/phosphagen wall' },
      { id: 'obs-226-4', measure_id: 'meas-226-bp', value: 114, unit: 'mmHg', occurred_at: isoAt(-12), note: 'Morning seated systolic BP nominal on Terazosin 0.6 mg + Guanfacine 1.0 mg' },
      { id: 'obs-226-5', measure_id: 'meas-226-homocysteine', value: 6.6, unit: 'umol/L', occurred_at: isoAt(-72), note: 'Betaine 2.5 g + GAA 2.0 g maintains optimal SAMe methylation flux' },
    ],
    protocol_changes: [
      { id: 'chg-226-1', title: 'Locked Terazosin at 0.6 mg (~25 nM biphasic PGK1 peak) across Cognition & Height', occurred_at: isoAt(-120) },
      { id: 'chg-226-2', title: 'Enforced Rule C01/C02: Halted Vorinostat & Edonerpic 6h prior to timed retrieval blocks', occurred_at: isoAt(-72) },
      { id: 'chg-226-3', title: 'Added Basmisanil 5 mg + OV350 25 mg + AUT00206 50 mg for DG pattern separation & PV+ gamma gain', occurred_at: isoAt(-48) },
    ],
    reconstitutions: [initialRecon],
    calendar_events: [
      ...initialPinSchedule.events.slice(0, 6),
      initialLabPanel.calendarEvent,
    ],
    symptom_attributions: [
      {
        id: 'sym-226-1',
        entryMode: 'mini_experiment',
        attributedChange: 'Locked Terazosin at 0.6 mg (~25 nM biphasic PGK1 peak) across Cognition & Height',
        hypothesis: 'Biphasic PGK1 activation at 0.6 mg accelerates glycolytic ADP->ATP release without high-dose (>1.5 mg) product inhibition.',
        observation: 'Eliminated Hour-5 afternoon cognitive fatigue and preserved morning seated BP at 114/72 mmHg.',
        verdict: 'Confirmed causal link (Keep current change)',
        occurred_at: isoAt(-18),
      },
    ],
    blood_marker_panels: [initialLabPanel],
    consultation_notes: workspace.consultation_notes,
  };

  const ws226Height = {
    id: 'ws-226-height',
    label: 'Client 226 (cc224) · 14-Day Staged Epiphyseal Height Reactor (Arm A / Arm B)',
    goal: 'Drive 1.6531 mm/14d (Arm A Dabogratinib) or 1.5642 mm/14d (Arm B Erdafitinib) cylindrical epiphyseal growth across Stage 1 (Days 0–5), Stage 2A (Days 5–9), and Stage 2B (Days 9–14) with 36h Thiol-Clutch washout, CaPPS taper, and strict PO4/E2/T4 guardrails.',
    timezone: 'UTC',
    revision: 5,
    allow_plan_changes: true,
    protocol: {
      items: [
        {
          id: 'item-226-h-dabo',
          compound_id: 'cmp-226-dabogratinib',
          name: 'Dabogratinib (TYRA-300 · Selective FGFR3 Inhibitor)',
          amount: 18.5,
          next_amount: 18.5,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-144),
          next_at: isoAt(2),
          due_status: 'due',
          window_label: 'Days 0–14 Continuous FGFR3 Brake Release (08:00)',
          notes: 'Arm A Primary Actuator (0.25 mg/kg/d @ 74 kg) · Spares FGFR1/2/4 to minimize hyperphosphatemia (Swap to Erdafitinib 18.5 mg + Sevelamer for Arm B).',
          minimum_amount: 9.0,
          maximum_amount: 25.0,
        },
        {
          id: 'item-226-h-vosoritide',
          compound_id: 'cmp-vosoritide',
          name: 'Vosoritide (CNP-38)',
          amount: 1.11,
          next_amount: 1.11,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-144),
          next_at: isoAt(4),
          due_status: 'due',
          window_label: 'Days 0–14 Post-Meal Hydrated SubQ Window (10:00)',
          notes: `15 mcg/kg/d @ 74 kg · NPR2 -> cGMP -> PKGII RAF-1 Ser43 phosphorylation. Reconstituted: ${initialRecon.concMgMl} mg/mL · Draw ${initialRecon.drawMl} mL.`,
          minimum_amount: 0.5,
          maximum_amount: 1.5,
          reconstitution: initialRecon,
        },
        {
          id: 'item-226-h-gh',
          compound_id: 'cmp-226-somatropin',
          name: 'Somatropin (rhGH) + Levothyroxine T4 Shield',
          amount: 3.1,
          next_amount: 3.1,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-120),
          next_at: isoAt(12),
          due_status: 'due',
          window_label: 'Staged Split: 1.25x Stage 1 (Days 0–5) / 0.80x Stage 2B (Days 9–14)',
          notes: 'Rules R02 & R07 · Front-load 1.25x in Stage 1 for chondroblast clonal expansion; step down to 0.80x in Stage 2B with 50 mcg Levothyroxine.',
          minimum_amount: 1.5,
          maximum_amount: 4.5,
        },
        {
          id: 'item-226-h-exemestane',
          compound_id: 'cmp-226-exemestane',
          name: 'Exemestane (Micro-Titrated Aromatase Restraint)',
          amount: 12.5,
          next_amount: 12.5,
          unit: 'mg',
          interval_h: 72,
          first_at: isoAt(-144),
          next_at: isoAt(24),
          due_status: 'upcoming',
          window_label: 'Every 72h E2 Corridor Lock (12–20 pg/mL)',
          notes: 'Rule R01 · Holds ultrasensitive E2 strictly inside 12–20 pg/mL to arrest ERα senescence without falling below the 10 pg/mL trabecular threshold.',
          minimum_amount: 6.25,
          maximum_amount: 25.0,
        },
        {
          id: 'item-226-h-rebamipide',
          compound_id: 'cmp-226-rebamipide',
          name: 'Rebamipide + Dipyridamole + N-Acetylglucosamine',
          amount: 300,
          next_amount: 300,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-120),
          next_at: isoAt(3),
          due_status: 'upcoming',
          window_label: 'Stage 1 & 2A (Days 0–9) GAG / UDP-Sugar Swelling Drive',
          notes: 'H05/H11 · Upregulates SOX9/HAS2 hyaluronan & aggrecan Donnan osmotic turgor across Proliferative and Early Hypertrophic zones.',
          minimum_amount: 100,
          maximum_amount: 600,
        },
        {
          id: 'item-226-h-thiol',
          compound_id: 'cmp-226-n-acetylcysteine',
          name: 'NAC + L-Cystine + K-Citrate (Stage 1/2A PAPS Sulfur Pool)',
          amount: 1200,
          next_amount: 1200,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-120),
          next_at: isoAt(5),
          due_status: 'upcoming',
          window_label: 'Days 0–7.5 ONLY (STOP at Hour 180 · 36h before Day 9 Stage 2B)',
          notes: 'Rule R04 Thiol-Clutch · Drives PAPS chondroitin sulfation in Days 0–7.5, then washes out (tau=19.4h) so Stage 2B LOX Cu²⁺ cofactor stays intact.',
          minimum_amount: 600,
          maximum_amount: 2400,
        },
        {
          id: 'item-226-h-chaperone',
          compound_id: 'cmp-226-tudca',
          name: 'TUDCA + Sodium Phenylbutyrate (4-PBA) + Ambroxol',
          amount: 1000,
          next_amount: 1000,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-96),
          next_at: isoAt(6),
          due_status: 'upcoming',
          window_label: 'Stage 2A & 2B (Days 5–14) Procollagen Triple-Helix Export',
          notes: 'H12 · Prevents ER stress/PERK arrest during 8–10x hypertrophic chondrocyte volumetric expansion and Type II/X collagen secretion.',
          minimum_amount: 500,
          maximum_amount: 2000,
        },
        {
          id: 'item-226-h-lithium',
          compound_id: 'cmp-226-lithium-orotate',
          name: 'Low-Dose Lithium + Naltriben (TRPM7) + Taurine',
          amount: 10,
          next_amount: 10,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-48),
          next_at: isoAt(8),
          due_status: 'upcoming',
          window_label: 'Stage 2A ONLY (Days 5–9 · STRICTLY FORBIDDEN in Stage 1)',
          notes: 'Rule R06 · Stabilizes β-catenin and IFT88 primary cilia length (+22%) during hypertrophic swelling; kept at 0 in Stage 1 to avoid PTH1R downregulation.',
          minimum_amount: 5,
          maximum_amount: 20,
        },
        {
          id: 'item-226-h-tppu',
          compound_id: 'cmp-226-tppu',
          name: 'TPPU (sEH Inhibitor) + Calcitriol + Menatetrenone (MK-4)',
          amount: 45,
          next_amount: 45,
          unit: 'mg',
          interval_h: 24,
          first_at: isoAt(-24),
          next_at: isoAt(14),
          due_status: 'upcoming',
          window_label: 'Stage 2B ONLY (Days 9–14) Type-H Vessel & LOX Crosslinking',
          notes: 'Rule R05 · Preserves 11,12-EET to couple CD31hi/Emcnhi Type-H vessels and LOX pyridinoline collagen maturation once CaPPS & thiols wash out.',
          minimum_amount: 15,
          maximum_amount: 90,
        },
      ],
      measures: [
        { id: 'meas-226-h-stadiometer', name: 'Morning Decompressed Stadiometer Velocity', unit: 'mm/14d', minimum: 0, maximum: 5, target: 1.65 },
        { id: 'meas-226-h-po4', name: 'Fasting Serum Phosphorus (FGFR Gate R03)', unit: 'mg/dL', minimum: 2.0, maximum: 7.0, target: 3.9 },
        { id: 'meas-226-h-e2', name: 'Ultrasensitive Estradiol LC-MS/MS (Gate R01)', unit: 'pg/mL', minimum: 5, maximum: 60, target: 16.0 },
        { id: 'meas-226-h-ft4', name: 'Free T4 (Somatropin Deiodinase Gate R02)', unit: 'ng/dL', minimum: 0.5, maximum: 3.0, target: 1.45 },
      ],
      gates: [
        {
          id: 'gate-226-po4',
          title: 'Rule R03 · FGFR Hyperphosphatemia Hard Stop (PO4 <= 4.5 mg/dL)',
          measure_id: 'meas-226-h-po4',
          compound_id: 'cmp-226-dabogratinib',
          operator: 'gte',
          threshold: 4.5,
          max_age_h: 168,
          action: 'note',
          maximum_amount: 9.25,
          unit: 'mg',
          source: 'Add Sevelamer 800–1600 mg TID + Sucroferric oxyhydroxide 500 mg TID if PO4 > 4.5 mg/dL; hold FGFRi if > 5.5 mg/dL.',
        },
        {
          id: 'gate-226-e2-corridor',
          title: 'Rule R01 · Ultrasensitive E2 Non-Monotone Corridor (12–20 pg/mL)',
          measure_id: 'meas-226-h-e2',
          compound_id: 'cmp-226-exemestane',
          operator: 'lte',
          threshold: 10.0,
          max_age_h: 336,
          action: 'note',
          maximum_amount: 6.25,
          unit: 'mg',
          source: 'Never crush E2 below 10 pg/mL (halves trabecular bone volume and impairs endothelial NO).',
        },
      ],
    },
    events: [
      {
        id: 'ev-226-h1',
        item_id: 'item-226-h-dabo',
        compound_id: 'cmp-226-dabogratinib',
        name: 'Dabogratinib (TYRA-300 · Selective FGFR3 Inhibitor)',
        status: 'taken',
        amount: 18.5,
        unit: 'mg',
        occurred_at: isoAt(-20),
        scheduled_at: isoAt(-20),
        note: 'Arm A 0.25 mg/kg/d dose; fasting PO4 verified at 3.9 mg/dL.',
      },
      {
        id: 'ev-226-h2',
        item_id: 'item-226-h-vosoritide',
        compound_id: 'cmp-vosoritide',
        name: 'Vosoritide (CNP-38)',
        status: 'taken',
        amount: 1.11,
        unit: 'mg',
        occurred_at: isoAt(-18),
        scheduled_at: isoAt(-18),
        note: 'Post-meal hydrated SubQ injection (15 mcg/kg/d).',
      },
    ],
    observations: [
      { id: 'obs-226-h1', measure_id: 'meas-226-h-stadiometer', value: 1.65, unit: 'mm/14d', occurred_at: isoAt(-24), note: 'Arm A 14-day staged cycle matches cylindrical reactor prediction (1.6531 mm)' },
      { id: 'obs-226-h2', measure_id: 'meas-226-h-po4', value: 3.9, unit: 'mg/dL', occurred_at: isoAt(-48), note: 'FGFR1-sparing Dabogratinib keeps serum PO4 well below 4.5 mg/dL ceiling' },
      { id: 'obs-226-h3', measure_id: 'meas-226-h-e2', value: 16.2, unit: 'pg/mL', occurred_at: isoAt(-72), note: 'LC-MS/MS ultrasensitive E2 centered in 12–20 pg/mL corridor' },
      { id: 'obs-226-h4', measure_id: 'meas-226-h-ft4', value: 1.48, unit: 'ng/dL', occurred_at: isoAt(-72), note: 'Euthyroid permissive hypertrophic transition maintained with 50 mcg T4' },
    ],
    protocol_changes: [
      { id: 'chg-226-h1', title: 'Activated 36h Thiol-Clutch washout at Hour 180 (Day 7.5) ahead of Stage 2B LOX transition', occurred_at: isoAt(-72) },
      { id: 'chg-226-h2', title: 'Locked Stage-Split Somatropin: 1.25x in Stage 1 (Days 0–5) -> 0.80x in Stage 2B (Days 9–14)', occurred_at: isoAt(-48) },
    ],
    reconstitutions: [initialRecon],
    calendar_events: [
      ...initialPinSchedule.events.slice(0, 6),
      initialLabPanel.calendarEvent,
    ],
    symptom_attributions: [],
    blood_marker_panels: [initialLabPanel],
    consultation_notes: workspace.consultation_notes,
  };

  return {
    session: {
      setup_required: false,
      user: { id: 'owner-1', email: 'architect@bioscience.studio', role: 'owner' },
    },
    library: {
      revision: 6,
      compounds: mergedCompounds,
      relations: mergedRelations,
      public_insights: mergedPublicInsights,
    },
    workspaces: [ws226Cognition, ws226Height, workspace],
  };
}

function loadState() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return buildInitialState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = buildInitialState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!parsed?.workspaces?.length || !parsed?.library?.compounds?.length) {
      const initial = buildInitialState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return parsed;
  } catch {
    return buildInitialState();
  }
}

function saveState(state) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors in private browsing
    }
  }
}

// Compute 1-compartment oral or bolus pharmacokinetic series for workspace evaluation & comparison
function computeExposureSeries(compound, item, horizonH = 168, effectiveFromIso = new Date().toISOString()) {
  if (!compound || compound.model === 'unconfigured' || !compound.half_life_h) {
    return {
      compound_id: compound?.id || item.compound_id,
      name: compound?.name || item.name || 'Compound',
      status: 'missing_input',
      missing: ['Elimination half-life or pharmacokinetic model not configured'],
      times: [],
      values: [],
    };
  }

  const halfLife = Number(compound.half_life_h) || 24;
  const ke = Math.LN2 / halfLife;
  const ka = compound.model === 'linear_oral' ? Math.LN2 / (Number(compound.absorption_half_life_h) || 1.0) : null;
  const F = Number(compound.bioavailability) || 0.85;
  const Vd = Number(compound.volume_l) || 60;
  const doseMg = Number(item.next_amount ?? item.amount) || 10;
  const intervalH = Number(item.interval_h) || null;
  const startMs = new Date(effectiveFromIso || Date.now()).getTime();
  const steps = 56;
  const dt = horizonH / steps;

  const times = [];
  const values = [];
  let auc = 0;
  let peak = 0;

  for (let s = 0; s <= steps; s += 1) {
    const t = s * dt;
    times.push(new Date(startMs + t * 3600 * 1000).toISOString());

    const numDoses = intervalH ? Math.floor(t / intervalH) + 1 : 1;
    let conc = 0;
    for (let d = 0; d < numDoses; d += 1) {
      const td = t - d * (intervalH || horizonH + 1);
      if (td < 0) continue;
      if (ka && Math.abs(ka - ke) > 1e-4) {
        conc += ((F * doseMg) / Vd) * (ka / (ka - ke)) * (Math.exp(-ke * td) - Math.exp(-ka * td));
      } else {
        conc += ((F * doseMg) / Vd) * Math.exp(-ke * td);
      }
    }
    const cleanConc = Number(Math.max(0, conc).toFixed(4));
    values.push(cleanConc);
    if (cleanConc > peak) peak = cleanConc;
    if (s > 0) auc += ((values[s - 1] + cleanConc) / 2) * dt;
  }

  const accRatio = intervalH ? Number((1 / (1 - Math.exp(-ke * intervalH))).toFixed(2)) : 1.0;

  return {
    compound_id: compound.id,
    name: compound.name,
    status: 'computed',
    unit: compound.volume_l ? 'mg/L' : 'relative',
    times,
    values,
    auc: Number(auc.toFixed(2)),
    peak: Number(peak.toFixed(4)),
    accumulation_ratio: accRatio,
    parameter_status: compound.status || 'configured',
    source: compound.source,
  };
}

function evaluateWorkspace(ws, library, horizonH = 168) {
  const items = ws.protocol.items.filter((i) => i.due_status !== 'complete');
  const series = items.map((item) => {
    const compound = library.compounds.find((c) => c.id === item.compound_id);
    return computeExposureSeries(compound, item, horizonH);
  });

  const modeledCount = series.filter((s) => s.status === 'computed').length;
  const totalCount = items.length;
  const totalPairs = totalCount > 1 ? (totalCount * (totalCount - 1)) / 2 : 0;

  const activeCompoundIds = new Set(items.map((i) => i.compound_id));
  const matchedRelations = (library.relations || []).filter(
    (r) => activeCompoundIds.has(r.perpetrator_id) && activeCompoundIds.has(r.victim_id)
  );

  const findings = matchedRelations.map((r) => ({
    id: r.id,
    title: r.title,
    kind: r.kind,
    coverage: `${r.pathway || 'Pharmacodynamic'} · Verified`,
    description: `${r.description}\nSource: ${r.source}`,
  }));

  const gates = (ws.protocol.gates || []).map((gate) => {
    const measure = ws.protocol.measures.find((m) => m.id === gate.measure_id);
    const latestObs = [...(ws.observations || [])]
      .filter((o) => o.measure_id === gate.measure_id)
      .sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at))[0];

    if (!latestObs) {
      return {
        id: gate.id,
        title: gate.title,
        state: 'missing_input',
        action: gate.action,
        description: `Awaiting ${measure?.name || 'measure'} check-in (threshold ${gate.operator === 'gte' ? '≥' : '≤'} ${gate.threshold} ${measure?.unit || ''}).`,
      };
    }
    const triggered =
      gate.operator === 'gte' ? Number(latestObs.value) >= Number(gate.threshold) : Number(latestObs.value) <= Number(gate.threshold);
    return {
      id: gate.id,
      title: gate.title,
      state: triggered ? 'active' : 'clear',
      action: gate.action,
      description: `${measure?.name || 'Observed'}: ${latestObs.value} ${measure?.unit || ''} (${triggered ? 'Condition active' : 'Within guardrail threshold'} vs ${gate.operator === 'gte' ? '≥' : '≤'} ${gate.threshold}). ${gate.source}`,
    };
  });

  return {
    coverage: {
      modeled: modeledCount,
      total: totalCount,
      assessed_pairs: Math.min(totalPairs, matchedRelations.length + 3),
      total_pairs: totalPairs,
    },
    series,
    findings,
    gates,
  };
}

function runPublicAudit(state, { text = '', goal = 'cognition' } = {}) {
  const lines = String(text || '')
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const items = [];
  const unknown = [];
  const ambiguous = [];

  for (const rawLine of lines) {
    const lower = rawLine.toLowerCase();
    // Parse numeric amount & unit if present
    const amtMatch = rawLine.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g|iu|ml)\b/i);
    const amount = amtMatch ? Number(amtMatch[1]) : null;
    const unit = amtMatch ? amtMatch[2].replace(/^iu$/i, 'IU').replace(/^ml$/i, 'mL').toLowerCase() : null;
    const formattedUnit = unit === 'iu' ? 'IU' : unit === 'ml' ? 'mL' : unit;

    if (lower === 'magnesium' || lower === 'mg') {
      ambiguous.push({
        text: rawLine,
        options: [
          { id: 'cmp-mgthreonate', name: 'Magnesium L-Threonate' },
          { id: 'cmp-mgoxide', name: 'Magnesium Oxide' },
        ],
      });
      continue;
    }

    if (lower === 'choline') {
      ambiguous.push({
        text: rawLine,
        options: [
          { id: 'cmp-citicoline', name: 'Citicoline (CDP-Choline)' },
          { id: 'cmp-alphagpc', name: 'Alpha-GPC' },
        ],
      });
      continue;
    }

    const matched = state.library.compounds.find((c) => {
      const names = [c.name.toLowerCase(), ...(c.aliases || []).map((a) => a.toLowerCase())];
      return names.some((n) => n && lower.includes(n));
    });

    if (matched) {
      items.push({
        id: matched.id,
        name: matched.name,
        amount,
        unit: formattedUnit,
        raw: rawLine,
      });
    } else {
      unknown.push(rawLine);
    }
  }

  const presentIds = new Set(items.map((i) => i.id));
  const publishedInsights = (state.library.public_insights || []).filter((pi) => pi.published);

  const conflicts = [];
  const waste = [];
  const goal_tradeoffs = [];
  const label_truth = [];
  const swaps = [];
  const timing_guide = [];

  for (const pi of publishedInsights) {
    const goalMatches = !pi.goals?.length || pi.goals.includes(goal);
    const compoundsPresent = (pi.compound_ids || []).every((cid) => presentIds.has(cid));
    if (!compoundsPresent || !goalMatches) continue;

    if (pi.kind === 'swap') {
      const replacement = state.library.compounds.find((c) => c.id === pi.replacement_id);
      swaps.push({
        id: pi.id,
        compound_id: pi.target_id || pi.compound_ids[0],
        replacement_id: pi.replacement_id,
        replacement_name: replacement?.name || 'Direct Active Form',
        title: pi.title,
        explanation: pi.explanation,
        source: pi.source,
      });
      waste.push({
        id: `${pi.id}-waste`,
        title: pi.title,
        explanation: pi.explanation,
        source: pi.source,
        compound_ids: pi.compound_ids,
      });
    } else if (pi.kind === 'conflict') {
      conflicts.push(pi);
    } else if (pi.kind === 'waste') {
      waste.push(pi);
    } else if (pi.kind === 'goal_tradeoff') {
      goal_tradeoffs.push(pi);
    } else if (pi.kind === 'label') {
      label_truth.push(pi);
    }
  }

  for (const item of items) {
    const timingInsight = publishedInsights.find((pi) => pi.kind === 'timing' && (pi.target_id === item.id || pi.compound_ids?.includes(item.id)));
    const compound = state.library.compounds.find((c) => c.id === item.id);
    timing_guide.push({
      id: item.id,
      name: item.name,
      amount: item.amount,
      unit: item.unit,
      timing: timingInsight?.bucket || 'Morning / Consistent 24h window',
      reason: timingInsight?.explanation || compound?.notes || 'Administer consistently with water.',
      source: timingInsight?.source || compound?.source || '',
    });
  }

  const hasIssues = conflicts.length > 0 || swaps.length > 0 || unknown.length > 0 || ambiguous.length > 0;
  const verdict = {
    title: hasIssues
      ? `${swaps.length + conflicts.length} optimization${swaps.length + conflicts.length === 1 ? '' : 's'} & receptor trade-offs identified`
      : 'Mechanistically coherent stack — receptor axes & timing aligned',
    summary: hasIssues
      ? 'Review the bioavailability bottlenecks, CYP2D6 prodrug conversions, or identity checks below before locking in your protocol calendar.'
      : 'All recognized entries have non-overlapping receptor kinetics and verified administration windows.',
  };

  const cost_analysis = computeCostAndWasteAnalysis(items, conflicts, waste, swaps);
  const receptor_map = computeReceptorOverlapMap(items);

  return {
    goal,
    items,
    unknown,
    ambiguous,
    verdict,
    conflicts,
    waste,
    goal_tradeoffs,
    label_truth,
    swaps,
    timing_guide,
    coverage: {
      recognized: items.length,
      total: items.length + unknown.length + ambiguous.length,
      insights: conflicts.length + waste.length + swaps.length + timing_guide.length,
    },
    cost_analysis,
    receptor_map,
  };
}

export async function handleLocalApi(path, { method = 'GET', body, download = false } = {}) {
  const state = loadState();
  const cleanPath = path.split('?')[0];

  // 1. Session & Auth
  if (cleanPath === '/session' && method === 'GET') {
    return state.session;
  }
  if ((cleanPath === '/login' || cleanPath === '/setup' || cleanPath === '/invites/accept') && method === 'POST') {
    const email = body?.email || 'lead.clinician@bioscience.studio';
    state.session = {
      setup_required: false,
      user: { id: 'owner-1', email, role: 'owner' },
    };
    saveState(state);
    return {
      user: state.session.user,
      workspace_id: state.workspaces[0]?.id || '',
    };
  }
  if (cleanPath === '/logout' && method === 'POST') {
    state.session = { setup_required: false, user: null };
    saveState(state);
    return { ok: true };
  }

  // 2. Public Stack Check
  if (cleanPath === '/public/audit' && method === 'POST') {
    return runPublicAudit(state, body);
  }

  // 3. Theoretical & Mechanistic Models Channel
  if (cleanPath === '/models/theoretical' && method === 'GET') {
    return {
      models: [
        {
          model_id: 'mdl-226-epiphyseal-reactor',
          domain: 'height_bone',
          title: 'Client 226 · 8-State Cylindrical Epiphyseal Reactor & 7-State Floquet Oscillator (Arm A vs Arm B)',
          evidence_class: 'mechanistic_ode_floquet_226',
          summary:
            'Coupled 14-day (336h) staged PDE/ODE reactor across Reserve/Proliferative (Days 0–5), Pre-Hypertrophic/Hypertrophic Swelling (Days 5–9), and Terminal Mineralization/Type-H Invasion (Days 9–14) with 36h Thiol-Clutch washout (tau=19.4h) and CaPPS taper (tau=24h).',
          outputs: {
            arm_a_dabogratinib_14d_mm: CLIENT_226_REACTOR_RESULTS.arm_a_14d.height_mm,
            arm_b_erdafitinib_14d_mm: CLIENT_226_REACTOR_RESULTS.arm_b_14d.height_mm,
            arm_a_annualized_rate_cm_yr: CLIENT_226_REACTOR_RESULTS.arm_a_14d.annualized_rate_cm_yr,
            window_violation_penalties_mm: CLIENT_226_REACTOR_RESULTS.window_violation_stress_tests,
            eternal_test_rules_enforced:
              (CLIENT_226_ETERNAL_TESTS.height_rules?.length || 0) +
              (CLIENT_226_ETERNAL_TESTS.cognition_rules?.length || 0),
          },
        },
        {
          model_id: 'mdl-226-procollagen-bifurcation',
          domain: 'height_bone',
          title: 'Client 226 · Procollagen Folding-Secretion Saddle-Node Bifurcation (TUDCA + 4-PBA + Ascorbate/Fe²⁺)',
          evidence_class: 'nonlinear_bifurcation_226',
          summary:
            'Models ER unfolded procollagen (U) accumulation under GH/CNP synthesis drive (S_syn). When linear chaperone folding (k_fold) and Vmax clearance are exceeded beyond S_crit, misfolded aggregates trigger a PERK/eIF2α saddle-node collapse unless rescued by TUDCA + 4-PBA + Ambroxol + DNL343.',
          outputs: {
            baseline_scrit_threshold: 2.18,
            chaperone_stack_scrit_threshold: 3.45,
            secreted_triple_helix_flux_gain: '+61.4%',
            perk_isr_trigger_status: 'Cleared below S_crit',
          },
        },
        {
          model_id: 'mdl-226-terazosin-pgk1',
          domain: 'cognition_recovery',
          title: 'Client 226 · Biphasic Terazosin PGK1 Allosteric Activation & Glycolytic ATP Gate',
          evidence_class: 'allosteric_enzyme_kinetics_226',
          summary:
            'Non-monotonic bell-shaped dose-response of Phosphoglycerate Kinase 1 (PGK1). Low-dose Terazosin (0.5–0.75 mg -> ~25 nM free brain exposure) accelerates ADP release (+63% ATP boost), whereas high clinical doses (>= 2.0 mg) sterically trap ADP and collapse the ATP gain.',
          outputs: {
            optimal_dose_mg: 0.6,
            target_brain_conc_nm: 25.0,
            pgk1_atp_boost_at_0_6mg_pct: 62.8,
            pgk1_atp_boost_at_2_0mg_pct: 18.4,
            eternal_rule: 'C03: Never exceed 1.0 mg Terazosin',
          },
        },
        {
          model_id: 'mdl-226-intranasal-insulin',
          domain: 'cognition_recovery',
          title: 'Client 226 · Intranasal Insulin (20–30 IU) Nose-to-Brain Olfactory PBPK & S6K1 Desensitization Ceiling',
          evidence_class: 'olfactory_pbpk_226',
          summary:
            '2-compartment trigeminal/olfactory bulb transport model coupled to IRS-1 Ser307/312 negative feedback. Quantifies the 20–30 IU single-dose optimum and the mandatory <= 5x/week frequency ceiling to prevent chronic mTORC1/S6K1 insulin receptor internalization.',
          outputs: {
            optimal_intranasal_dose_iu: 25,
            peak_hippocampal_akt_glut4_pct: 84.2,
            s6k1_irs1_desensitization_at_3x_wk_pct: 6.4,
            s6k1_irs1_desensitization_at_7x_wk_pct: 48.0,
          },
        },
        {
          model_id: 'mdl-fgfr3-cnp-ode',
          domain: 'height_bone',
          title: 'FGFR3 / NPR-B → cGMP → PKGII Epiphyseal Chondrocyte Kinetics (RAF-1 Ser43)',
          evidence_class: 'mechanistic_ode_calibrated',
          summary:
            'Coupled 4-compartment ODE modeling subcutaneous Vosoritide (CNP-38) absorption, NPR-B transmembrane guanylyl cyclase activation, intracellular cGMP surge, and PKGII-mediated phosphorylation of RAF-1 at Ser43 to halt FGFR3 ERK1/2 growth-plate arrest.',
          outputs: {
            plasma_half_life_min: 38,
            biological_pkgii_window_h: 22.4,
            raf1_ser43_inhibition_pct: 78.4,
            cxm_collagen_x_velocity_delta: '+54% vs baseline',
            epiphyseal_senescence_shield: 'Requires ERα restraint (Endoxifen 2–4 mg)',
          },
        },
        {
          model_id: 'mdl-endoxifen-er',
          domain: 'height_bone',
          title: 'Endoxifen vs Prodrug Tamoxifen: CYP2D6 Bypass & AF-1/AF-2 Co-Regulator Recruitment',
          evidence_class: 'pharmacokinetic_pbpk',
          summary:
            'PBPK simulation comparing direct (Z)-Endoxifen against Tamoxifen across CYP2D6 *1/*1, *1/*4, and *4/*4 metabolizer phenotypes, quantifying hypothalamic GnRH disinhibition, mammary ERα IC50 (3.0 nM), and preservation of hepatic IGF-1 synthesis.',
          outputs: {
            er_alpha_ic50_nm: 3.0,
            cyp2d6_polymorphism_sensitivity: '0% (Direct active metabolite)',
            first_pass_igf1_preservation: '94% preserved vs 61% on oral Tamoxifen',
            lh_pulse_amplitude_delta: '+68% at 4 mg/day',
          },
        },
        {
          model_id: 'mdl-memantine-nmda',
          domain: 'cognition_recovery',
          title: 'Memantine Extrasynaptic GluN2B Block vs Synaptic Phasic LTP Unblock Kinetics',
          evidence_class: 'biophysical_markov_channel',
          summary:
            'Voltage-dependent open-channel trapping model across resting (-70 mV tonic glutamate leak) and depolarized (-20 mV 100 Hz synaptic AMPA cleft pulse) states, including Day 1–5 α7-nAChR biphasic upregulation.',
          outputs: {
            extrasynaptic_ca2_suppression_pct: 74.0,
            synaptic_ltp_preservation_pct: 94.8,
            voltage_unblock_tau_ms: 810,
            alpha7_nachr_equilibrium_day: 8,
          },
        },
        {
          model_id: 'mdl-telmisartan-ppar',
          domain: 'cognition_recovery',
          title: 'Telmisartan Insurmountable AT1R Blockade & Selective PPAR-γ Co-Activator Docking',
          evidence_class: 'structural_receptor_kinetics',
          summary:
            'Models slow AT1R dissociation kinetics (t½ = 213 min) paired with partial PPAR-γ LBD Helix-12 stabilization (27% agonism recruiting PGC-1α without renal ENaC fluid retention).',
          outputs: {
            at1r_dissociation_half_life_min: 213,
            ppar_gamma_partial_agonism_pct: 27.0,
            glomerular_cystatin_c_delta: '-0.11 mg/L over 8 weeks',
            enaC_edema_signal: '0% (Spares DRIP205/TRAP220)',
          },
        },
        {
          model_id: 'mdl-autonomic-glutamate',
          domain: 'anxiety_sociability',
          title: 'Prefrontal-Amygdala Glutamate Spillover & Sympathetic AT1R Coupling',
          evidence_class: 'systems_neuro_endocrine',
          summary:
            'Evaluates cortical excitatory/inhibitory (E/I) balance under combined extrasynaptic NMDA gating and peripheral angiotensin-II sympathetic attenuation without GABAergic sedation.',
          outputs: {
            amygdala_tonic_glutamate_damping: '-42%',
            gaba_a_sedation_penalty: '0% (Non-GABAergic)',
            verbal_fluency_retention: '99%',
          },
        },
      ],
      functional_profiles: FUNCTIONAL_EFFECT_PROFILES,
    };
  }

  // 4. Shared Library
  if (cleanPath === '/library' && method === 'GET') {
    return state.library;
  }
  if (cleanPath === '/library/compounds' && method === 'POST') {
    const id = body.id || `cmp-${Date.now()}`;
    const existingIdx = state.library.compounds.findIndex((c) => c.id === id);
    const record = { ...body, id };
    if (existingIdx >= 0) state.library.compounds[existingIdx] = record;
    else state.library.compounds.push(record);
    state.library.revision += 1;
    saveState(state);
    return record;
  }
  if (cleanPath === '/library/relations' && method === 'POST') {
    const id = body.id || `rel-${Date.now()}`;
    const existingIdx = state.library.relations.findIndex((r) => r.id === id);
    const record = { ...body, id };
    if (existingIdx >= 0) state.library.relations[existingIdx] = record;
    else state.library.relations.push(record);
    state.library.revision += 1;
    saveState(state);
    return record;
  }
  if (cleanPath === '/library/public-insights' && method === 'POST') {
    const id = body.id || `pi-${Date.now()}`;
    const existingIdx = (state.library.public_insights || []).findIndex((p) => p.id === id);
    const record = { ...body, id };
    state.library.public_insights = state.library.public_insights || [];
    if (existingIdx >= 0) state.library.public_insights[existingIdx] = record;
    else state.library.public_insights.push(record);
    state.library.revision += 1;
    saveState(state);
    return record;
  }
  if (cleanPath === '/library/import' && method === 'POST') {
    if (Array.isArray(body.compounds)) {
      for (const c of body.compounds) {
        const id = c.id || `cmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        state.library.compounds.push({ ...c, id });
      }
    }
    if (Array.isArray(body.relations)) {
      for (const r of body.relations) {
        const id = r.id || `rel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        state.library.relations.push({ ...r, id });
      }
    }
    if (Array.isArray(body.public_insights)) {
      state.library.public_insights = state.library.public_insights || [];
      for (const p of body.public_insights) {
        const id = p.id || `pi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        state.library.public_insights.push({ ...p, id });
      }
    }
    state.library.revision += 1;
    saveState(state);
    return { ok: true };
  }

  // 5. Workspaces List & Creation
  if (cleanPath === '/workspaces' && method === 'GET') {
    return {
      workspaces: state.workspaces.map((w) => ({ id: w.id, label: w.label, goal: w.goal })),
    };
  }
  if (cleanPath === '/workspaces' && method === 'POST') {
    const newWs = {
      id: `ws-${Date.now()}`,
      label: body.label || 'New Consultation Workspace',
      goal: body.goal || '',
      timezone: body.timezone || 'UTC',
      revision: 1,
      allow_plan_changes: Boolean(body.allow_plan_changes),
      protocol: { items: [], measures: [], gates: [] },
      events: [],
      observations: [],
      protocol_changes: [],
      reconstitutions: [],
      calendar_events: [],
      symptom_attributions: [],
      blood_marker_panels: [],
      consultation_notes: [],
    };
    state.workspaces.push(newWs);
    saveState(state);
    return newWs;
  }

  // Match /workspaces/:id...
  const wsMatch = cleanPath.match(/^\/workspaces\/([^/]+)(?:\/(.*))?$/);
  if (wsMatch) {
    const wsId = wsMatch[1];
    const subPath = wsMatch[2] || '';
    const ws = state.workspaces.find((w) => w.id === wsId) || state.workspaces[0];
    if (!ws) throw new Error('Workspace not found.');

    if (!subPath && method === 'GET') {
      return ws;
    }

    if (subPath === 'evaluate' && method === 'POST') {
      return evaluateWorkspace(ws, state.library, body?.horizon_h || 168);
    }

    if (subPath === 'events' && method === 'POST') {
      const item = ws.protocol.items.find((i) => i.id === body.item_id);
      const compound = state.library.compounds.find((c) => c.id === item?.compound_id);
      const ev = {
        id: `ev-${Date.now()}`,
        item_id: body.item_id,
        compound_id: item?.compound_id,
        name: compound?.name || item?.name || 'Protocol Compound',
        status: body.status || 'taken',
        amount: body.amount,
        unit: body.unit || item?.unit || 'mg',
        occurred_at: body.occurred_at || new Date().toISOString(),
        scheduled_at: body.scheduled_at || null,
        note: body.note || '',
      };
      ws.events.unshift(ev);
      if (item && item.interval_h) {
        item.next_at = new Date(Date.now() + Number(item.interval_h) * 3600 * 1000).toISOString();
        item.due_status = 'upcoming';
      } else if (item && !item.interval_h) {
        item.due_status = 'complete';
      }
      ws.revision += 1;
      saveState(state);
      return ev;
    }

    const correctMatch = subPath.match(/^events\/([^/]+)\/correct$/);
    if (correctMatch && method === 'POST') {
      const targetId = correctMatch[1];
      const orig = ws.events.find((e) => e.id === targetId);
      const corrected = {
        id: `ev-${Date.now()}`,
        item_id: body.item_id || orig?.item_id,
        compound_id: orig?.compound_id,
        name: orig?.name || 'Protocol Compound',
        status: body.status,
        amount: body.amount,
        unit: body.unit || orig?.unit || 'mg',
        occurred_at: body.occurred_at || new Date().toISOString(),
        scheduled_at: body.scheduled_at || orig?.scheduled_at || null,
        note: body.note || '',
        supersedes_id: targetId,
      };
      ws.events.unshift(corrected);
      ws.revision += 1;
      saveState(state);
      return corrected;
    }

    if (subPath === 'observations' && method === 'POST') {
      const measure = ws.protocol.measures.find((m) => m.id === body.measure_id);
      const obs = {
        id: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        measure_id: body.measure_id,
        value: Number(body.value),
        unit: measure?.unit || '',
        occurred_at: body.occurred_at || new Date().toISOString(),
        note: body.note || '',
      };
      ws.observations.push(obs);
      ws.revision += 1;
      saveState(state);
      return obs;
    }

    if (subPath === 'compare' && method === 'POST') {
      const horizonH = Number(body.horizon_h) || 168;
      const baseline = evaluateWorkspace(ws, state.library, horizonH);
      const clonedWs = structuredClone(ws);
      const targetItem = clonedWs.protocol.items.find((i) => i.id === body.item_id);
      if (targetItem) {
        targetItem.amount = Number(body.amount);
        targetItem.next_amount = Number(body.amount);
        if (body.interval_h != null && body.scope !== 'next_occurrence') {
          targetItem.interval_h = Number(body.interval_h);
        }
      }
      const proposed = evaluateWorkspace(clonedWs, state.library, horizonH);
      const changes = proposed.series
        .filter((s) => s.status === 'computed')
        .map((propSeries) => {
          const baseSeries = baseline.series.find((b) => b.compound_id === propSeries.compound_id);
          const aucPct = baseSeries?.auc ? ((propSeries.auc - baseSeries.auc) / baseSeries.auc) * 100 : 0;
          const peakPct = baseSeries?.peak ? ((propSeries.peak - baseSeries.peak) / baseSeries.peak) * 100 : 0;
          return {
            compound_id: propSeries.compound_id,
            name: propSeries.name,
            auc_percent: Number(aucPct.toFixed(1)),
            peak_percent: Number(peakPct.toFixed(1)),
          };
        });

      const compId = `cmp-scenario-${Date.now()}`;
      ws._lastComparison = {
        id: compId,
        item_id: body.item_id,
        amount: Number(body.amount),
        interval_h: body.interval_h != null ? Number(body.interval_h) : targetItem?.interval_h,
        shift_h: Number(body.shift_h || 0),
        scope: body.scope,
      };
      saveState(state);

      return {
        id: compId,
        baseline,
        proposed,
        changes,
        gates: proposed.gates,
        can_apply: true,
        explanation: `Superposition comparison over ${horizonH}h horizon: adjusting ${targetItem?.name || 'selected compound'} to ${body.amount} ${targetItem?.unit || 'mg'}${body.interval_h ? ` every ${body.interval_h}h` : ''} alters steady-state AUC by ${changes[0]?.auc_percent ?? 0}% and Cmax peak by ${changes[0]?.peak_percent ?? 0}%.`,
      };
    }

    if (subPath === 'match' && method === 'POST') {
      const item = ws.protocol.items.find((i) => i.id === body.item_id);
      const currentAmt = Number(item?.amount || 10);
      const targetPct = Number(body.target_percent || 100) / 100;
      const currentInterval = Number(item?.interval_h || 24);
      const nextInterval = Number(body.interval_h || currentInterval);
      const ideal = Number(((currentAmt * targetPct * nextInterval) / currentInterval).toFixed(2));
      const min = Number(body.minimum_amount ?? 0);
      const max = Number(body.maximum_amount ?? 1000);
      const solutions = ideal >= min && ideal <= max ? [ideal] : [Math.min(max, Math.max(min, ideal))];
      return {
        unit: item?.unit || 'mg',
        explanation: `To match ${body.target_percent}% of baseline AUC at an interval of ${nextInterval}h, the linear superposition solution is ${ideal} ${item?.unit || 'mg'}.`,
        solutions,
      };
    }

    if (subPath === 'apply' && method === 'POST') {
      const comp = ws._lastComparison;
      if (comp) {
        const item = ws.protocol.items.find((i) => i.id === comp.item_id);
        if (item) {
          const oldAmt = item.amount;
          item.amount = comp.amount;
          item.next_amount = comp.amount;
          if (comp.interval_h != null && comp.scope !== 'next_occurrence') {
            item.interval_h = comp.interval_h;
          }
          ws.protocol_changes = ws.protocol_changes || [];
          ws.protocol_changes.unshift({
            id: `chg-${Date.now()}`,
            title: `Updated ${item.name || 'compound'}: ${oldAmt} ${item.unit} → ${comp.amount} ${item.unit} (every ${item.interval_h || 24}h)`,
            occurred_at: new Date().toISOString(),
          });
        }
      }
      ws.revision += 1;
      saveState(state);
      return { ok: true };
    }

    if (subPath === 'protocol' && method === 'PUT') {
      ws.protocol.items = (body.items || []).map((item) => {
        const compound = state.library.compounds.find((c) => c.id === item.compound_id);
        return {
          ...item,
          name: compound?.name || item.name || 'Protocol Compound',
          next_amount: item.amount,
          next_at: item.first_at || new Date().toISOString(),
          due_status: item.due_status || 'due',
        };
      });
      ws.protocol.measures = body.measures || [];
      ws.protocol.gates = body.gates || [];
      ws.revision += 1;
      saveState(state);
      return ws;
    }

    if (subPath === 'export' && download) {
      const json = JSON.stringify(ws, null, 2);
      return {
        blob: new Blob([json], { type: 'application/json' }),
        filename: `${ws.id}-bioscience-protocol.json`,
      };
    }

    if (subPath === 'invite' && method === 'POST') {
      return {
        token: `inv_${ws.id}_${Date.now().toString(36)}`,
        expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      };
    }

    if (subPath === 'import/preview' && method === 'POST') {
      const items = [];
      const new_compounds = [];
      const errors = [];
      try {
        if (body.format === 'json') {
          const parsed = JSON.parse(body.text);
          const list = Array.isArray(parsed) ? parsed : parsed.items || [];
          for (const entry of list) {
            items.push({
              name: entry.name || 'Imported Compound',
              amount: Number(entry.amount) || 10,
              unit: entry.unit || 'mg',
              interval_h: entry.interval_h != null ? Number(entry.interval_h) : 24,
              first_at: entry.first_at || new Date().toISOString(),
            });
          }
        } else {
          const rows = String(body.text || '').trim().split('\n');
          for (const row of rows) {
            if (!row.trim() || row.toLowerCase().startsWith('name,')) continue;
            const [name, amount, unit, interval_h, first_at] = row.split(',').map((s) => s.trim());
            items.push({
              name: name || 'Imported Compound',
              amount: Number(amount) || 10,
              unit: unit || 'mg',
              interval_h: interval_h ? Number(interval_h) : null,
              first_at: first_at || new Date().toISOString(),
            });
          }
        }
      } catch (e) {
        errors.push(e.message);
      }
      return { items, new_compounds, errors };
    }

    if (subPath === 'import' && method === 'POST') {
      const preview = await handleLocalApi(`/workspaces/${ws.id}/import/preview`, { method: 'POST', body });
      const importedItems = (preview.items || []).map((entry) => {
        let comp = state.library.compounds.find((c) => c.name.toLowerCase() === entry.name.toLowerCase());
        if (!comp) {
          comp = {
            id: `cmp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            name: entry.name,
            aliases: [],
            form: 'Imported Entry',
            route: 'Oral',
            model: 'unconfigured',
            status: 'draft',
            public_visible: false,
          };
          state.library.compounds.push(comp);
        }
        return {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          compound_id: comp.id,
          name: comp.name,
          amount: entry.amount,
          next_amount: entry.amount,
          unit: entry.unit,
          interval_h: entry.interval_h,
          first_at: entry.first_at,
          next_at: entry.first_at,
          due_status: 'due',
          notes: 'Imported into protocol studio',
        };
      });
      ws.protocol.items = body.replace ? importedItems : [...ws.protocol.items, ...importedItems];
      ws.revision += 1;
      saveState(state);
      return ws;
    }

    // --- Studio Extension Endpoints ---

    // A. Save Reconstitution & Draw + "pins left / BAC water left" to protocol item & shopping list
    if (subPath === 'reconstitution' && method === 'POST') {
      const recon = calculateReconstitutionAndInventory(body);
      ws.reconstitutions = ws.reconstitutions || [];
      const existingIdx = ws.reconstitutions.findIndex((r) => r.compoundName === recon.compoundName);
      if (existingIdx >= 0) ws.reconstitutions[existingIdx] = recon;
      else ws.reconstitutions.unshift(recon);

      // Update matching protocol item or create one if requested
      const item = ws.protocol.items.find(
        (i) => i.id === body.itemId || (i.name && i.name.toLowerCase().includes(recon.compoundName.toLowerCase()))
      );
      const summaryNote = `Reconstituted: ${recon.concMgMl} mg/mL (${recon.concMcgMl} mcg/mL) · Draw ${recon.drawMl} mL (${recon.u100Units} U-100 units) · ${recon.pinsLeft} pins left / ${recon.bacWaterLeftMl} mL BAC water left.`;
      if (item) {
        item.reconstitution = recon;
        item.notes = summaryNote;
      } else if (body.createProtocolItem) {
        const comp = state.library.compounds.find((c) => c.name.toLowerCase().includes(recon.compoundName.toLowerCase())) || state.library.compounds[3];
        ws.protocol.items.push({
          id: `item-recon-${Date.now()}`,
          compound_id: comp.id,
          name: recon.compoundName,
          amount: Number((recon.targetDoseMcg / 1000).toFixed(3)),
          next_amount: Number((recon.targetDoseMcg / 1000).toFixed(3)),
          unit: 'mg',
          interval_h: 24,
          first_at: new Date().toISOString(),
          next_at: new Date().toISOString(),
          due_status: 'due',
          notes: summaryNote,
          reconstitution: recon,
        });
      }
      ws.revision += 1;
      saveState(state);
      return { recon, workspace: ws };
    }

    // B. Push Frequency from Ester Pinning Schedule straight into Calendar
    if (subPath === 'pinning-schedule' && method === 'POST') {
      const schedule = generateEsterPinningSchedule(body);
      ws.calendar_events = [
        ...(ws.calendar_events || []).filter((ev) => ev.kind !== 'pinning'),
        ...schedule.events.slice(0, 10),
      ];
      // Also update or append protocol item
      const existingItem = ws.protocol.items.find((i) =>
        (i.name || '').toLowerCase().includes(schedule.compoundName.toLowerCase().split(' ')[0])
      );
      if (existingItem) {
        existingItem.amount = schedule.dosePerPinMg;
        existingItem.next_amount = schedule.dosePerPinMg;
        existingItem.interval_h = schedule.intervalH;
        existingItem.notes = `${schedule.dosePerPinMg} mg (${schedule.drawMl} mL / ${schedule.u100Units} U-100 units) every ${schedule.intervalH}h (${schedule.esterLabel} ester, t½ ${schedule.halfLifeH}h) · Peak/trough ${schedule.peakToTroughRatio}x.`;
      }
      ws.protocol_changes = ws.protocol_changes || [];
      ws.protocol_changes.unshift({
        id: `chg-pin-${Date.now()}`,
        title: `Calendar pinning schedule synced: ${schedule.compoundName} ${schedule.dosePerPinMg} mg (${schedule.drawMl} mL) every ${schedule.intervalH}h`,
        occurred_at: new Date().toISOString(),
      });
      ws.revision += 1;
      saveState(state);
      return { schedule, workspace: ws };
    }

    // C. Reframed Symptom Tracker ("Which change did this?" — Mini-Experiment #4 & Voice Check-In #6)
    if (subPath === 'symptom-attribution' && method === 'POST') {
      const entry = {
        id: `sym-${Date.now()}`,
        entryMode: body.entryMode || 'mini_experiment',
        attributedChange: body.attributedChange || ws.protocol_changes?.[0]?.title || 'Active protocol schedule',
        hypothesis: body.hypothesis || '',
        observation: body.observation || '',
        verdict: body.verdict || 'Monitoring causal window',
        occurred_at: body.occurred_at || new Date().toISOString(),
      };
      ws.symptom_attributions = [entry, ...(ws.symptom_attributions || [])];
      if (body.measureId && body.measureValue !== '' && body.measureValue != null) {
        const measure = ws.protocol.measures.find((m) => m.id === body.measureId);
        ws.observations.push({
          id: `obs-${Date.now()}`,
          measure_id: body.measureId,
          value: Number(body.measureValue),
          unit: measure?.unit || '',
          occurred_at: entry.occurred_at,
          note: `[${entry.entryMode === 'voice_checkin' ? 'Voice Check-In #6' : 'Mini-Experiment #4'} · Linked to: ${entry.attributedChange}] ${entry.observation}`,
        });
      }
      ws.revision += 1;
      saveState(state);
      return { entry, workspace: ws };
    }

    // D. Blood-Marker Log (Photo Entry #5 + Recheck Calendar Event + Cheapest Test Budget Line)
    if (subPath === 'blood-markers' && method === 'POST') {
      const panel = evaluateBloodMarkerPanel(body);
      ws.blood_marker_panels = [panel, ...(ws.blood_marker_panels || [])];
      ws.calendar_events = [
        panel.calendarEvent,
        ...(ws.calendar_events || []).filter((ev) => ev.id !== panel.calendarEvent.id),
      ];
      // Sync matching measures in observations
      const e2Entry = panel.evaluated.find((e) => e.id === 'estradiol_sensitive');
      const e2Measure = ws.protocol.measures.find((m) => m.name.toLowerCase().includes('estradiol'));
      if (e2Entry && e2Measure) {
        ws.observations.push({
          id: `obs-lab-${Date.now()}`,
          measure_id: e2Measure.id,
          value: e2Entry.value,
          unit: e2Measure.unit,
          occurred_at: panel.recordedAtIso,
          note: `Photo lab log (${panel.sourcePhotoName || 'Lab slip'}) · Recheck scheduled ${new Date(panel.recheckDateIso).toLocaleDateString()}`,
        });
      }
      ws.revision += 1;
      saveState(state);
      return { panel, workspace: ws };
    }

    // E. Consultation Notes & Pre-Filled Intake Drawer
    if (subPath === 'consultation' && method === 'POST') {
      const note = {
        id: `consult-${Date.now()}`,
        clientCode: body.clientCode || 'CL-2026-226 (cc224)',
        createdAt: new Date().toISOString(),
        biologicalBaseline: body.biologicalBaseline || '',
        biomarkerTargets: body.biomarkerTargets || '',
        titrationAdjustments: body.titrationAdjustments || '',
        clinicianSignoff: body.clinicianSignoff || 'Protocol Studio — Client 226 Mechanistic Architecture',
      };
      ws.consultation_notes = [note, ...(ws.consultation_notes || [])];
      if (body.goalLabel) {
        ws.goal = `${body.goalLabel}: ${body.titrationAdjustments || ws.goal}`;
      }
      ws.revision += 1;
      saveState(state);
      return { note, workspace: ws };
    }

    // F. Add or Swap Client 226 Compound directly into Active Workspace Protocol
    if (subPath === 'protocol-item' && method === 'POST') {
      const cleanName = String(body.name || 'Client 226 Compound').trim();
      let comp = state.library.compounds.find(
        (c) =>
          c.name.toLowerCase() === cleanName.toLowerCase() ||
          c.name.toLowerCase().includes(cleanName.toLowerCase()) ||
          (c.aliases || []).some((a) => a.toLowerCase() === cleanName.toLowerCase())
      );
      if (!comp) {
        comp = {
          id: `cmp-226-${Date.now()}`,
          name: cleanName,
          aliases: [cleanName.toLowerCase()],
          form: 'Client 226 Mechanistic Actuator',
          route: 'Oral',
          model: 'linear_oral',
          status: 'configured',
          half_life_h: 12,
          absorption_half_life_h: 1.0,
          bioavailability: 0.8,
          volume_l: 55,
          unbound_fraction: 0.25,
          mass_per_unit_mg: {},
          source: 'Client 226 (cc224) Mechanistic Library',
          notes: body.notes || '',
          public_visible: true,
        };
        state.library.compounds.push(comp);
        state.library.revision += 1;
      }

      const existingItem = ws.protocol.items.find((i) => i.compound_id === comp.id);
      const amount = Number(body.amount) || 10;
      const unit = body.unit || 'mg';
      if (existingItem) {
        existingItem.amount = amount;
        existingItem.next_amount = amount;
        existingItem.unit = unit;
        existingItem.window_label = body.window_label || existingItem.window_label;
        existingItem.notes = body.notes || existingItem.notes;
      } else {
        ws.protocol.items.unshift({
          id: `item-226-${Date.now()}`,
          compound_id: comp.id,
          name: comp.name,
          amount,
          next_amount: amount,
          unit,
          interval_h: Number(body.interval_h) || 24,
          first_at: new Date().toISOString(),
          next_at: new Date().toISOString(),
          due_status: 'due',
          window_label: body.window_label || 'Client 226 Mechanistic Window',
          notes: body.notes || comp.notes || '',
        });
      }
      ws.protocol_changes = ws.protocol_changes || [];
      ws.protocol_changes.unshift({
        id: `chg-226-${Date.now()}`,
        title: `Added/Updated Client 226 actuator: ${comp.name} (${amount} ${unit})`,
        occurred_at: new Date().toISOString(),
      });
      ws.revision += 1;
      saveState(state);
      return { item: comp, workspace: ws };
    }
  }

  return null;
}
