import { FUNCTIONAL_EFFECT_PROFILES } from '../studioLogic.js';

export interface BrowserVaultFile {
  path: string;
  basename: string;
  extension: string;
  content: string;
}

export interface BrowserVaultAdapter {
  exists(path: string): Promise<boolean>;
  read(path: string): Promise<string>;
  write(path: string, content: string): Promise<void>;
  append(path: string, content: string): Promise<void>;
}

export interface BrowserMetadataCache {
  resolvedLinks: Record<string, Record<string, number>>;
}

export interface BrowserVaultApp {
  vault: {
    configDir: string;
    adapter: BrowserVaultAdapter;
    getMarkdownFiles(): BrowserVaultFile[];
    cachedRead(file: BrowserVaultFile): Promise<string>;
    read(file: BrowserVaultFile): Promise<string>;
    getAbstractFileByPath(path: string): BrowserVaultFile | null;
    upsertFile(path: string, content: string): BrowserVaultFile;
  };
  metadataCache: BrowserMetadataCache;
}

const VAULT_STORAGE_KEY = 'bioscience_browser_vault_files_v1';
const ADAPTER_STORAGE_PREFIX = 'bioscience_obsidian_adapter_v1:';
const memoryAdapterStore = new Map<string, string>();

function readStorage(key: string): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryAdapterStore.get(key) ?? null;
    }
  }
  return memoryAdapterStore.get(key) ?? null;
}

function writeStorage(key: string, value: string): void {
  memoryAdapterStore.set(key, value);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore storage quota errors in restricted browsing contexts
    }
  }
}

export function normalizePath(path: string): string {
  return String(path || '')
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\/+/, '')
    .trim();
}

export interface CompoundPassageRecord {
  id: string;
  compoundId: string;
  name: string;
  aliases: string[];
  topic: string;
  category: string;
  path: string;
  route: string;
  form: string;
  description: string;
  fullPassage: string;
  source: string;
  linkedCompoundNames: string[];
}

export const DEFAULT_COMPOUND_PASSAGES: CompoundPassageRecord[] = [
  {
    id: 'l1-telmisartan',
    compoundId: 'cmp-telmisartan',
    name: 'Telmisartan',
    aliases: ['telmisartan', 'micardis', 'telmi'],
    topic: 'Hemodynamic & Metabolic Shielding',
    category: 'Core',
    path: 'Hemodynamic & Metabolic Shielding/Concept Graph/Core/Telmisartan.md',
    route: 'Oral · Benzimidazole Free Acid Tablet',
    form: 'Benzimidazole Free Acid Tablet',
    description:
      'Insurmountable AT1R antagonist (t½ ~ 24h) + selective partial PPAR-γ modulator (27% activation). Uniquely lipophilic benzimidazole ARB that exhibits insurmountable AT1 receptor blockade (slow dissociation t½ ~ 213 min) alongside selective partial PPAR-γ agonism (~25–30% maximal rosiglitazone activation) without adipogenic fluid retention.',
    fullPassage: `# Telmisartan

Insurmountable AT1R antagonist (t½ ~ 24h) + selective partial PPAR-γ modulator (27% activation).

Uniquely lipophilic benzimidazole ARB that exhibits insurmountable AT1 receptor blockade (slow dissociation t½ ~ 213 min) alongside selective partial PPAR-γ agonism (~25–30% maximal rosiglitazone activation) without adipogenic fluid retention.

## Mechanistic Signaling Axes
- **AT1R Insurmountable Blockade (Vascular & Adrenal AT1 Receptor · Ki = 3.7 nM · Dissociation t½ = 213 min):** Attenuates angiotensin II-mediated vasoconstriction, aldosterone secretion, sympathetic tone, and left-ventricular remodeling under supraphysiological androgen or catecholamine load.
- **Selective PPAR-γ Co-Regulator Recruitment (Nuclear PPAR-γ1 / PPAR-γ2 Ligand-Binding Domain · EC50 = 4.5 µM · 27% Partial Agonism):** Recruits PGC-1α and TIF2 while sparing DRIP205/TRAP220, upregulating adiponectin, GLUT4 translocation, and hepatic fatty-acid oxidation without renal ENaC sodium/water retention.
- **Endothelial & Renal Hemodynamics (eNOS / Glomerular Efferent Arteriole · Steady-state trough coverage > 24 h):** Reduces intraglomerular hypertension, lowers hs-CRP and Cystatin C drift, and preserves endothelial nitric oxide bioavailability.

## Complementary & Protocol Links
Telmisartan counteracts androgen-induced angiotensin II vasoconstriction, aldosterone retention, left-ventricular hypertrophy, and erythropoietin-driven hematocrit viscosity when paired with [[Testosterone Cypionate]] or neurovascular protocols alongside [[Memantine HCl]] and [[Citicoline (CDP-Choline)]].

## Timing & Administration
Peak plasma concentration occurs 0.5–1 h post-dose with a 24 h terminal half-life and insurmountable AT1R receptor binding. Window: After waking (or split AM/PM for 24h non-dipper BP profile).

Source: DailyMed Telmisartan Monograph · Benson et al., Hypertension 2004 (PMID: 14757770); Schupp et al., Circulation 2004.`,
    source: 'DailyMed Telmisartan Monograph · Benson et al., Hypertension 2004 (AT1R/PPAR-γ)',
    linkedCompoundNames: ['Testosterone Cypionate', 'Memantine HCl', 'Citicoline (CDP-Choline)'],
  },
  {
    id: 'l1-memantine',
    compoundId: 'cmp-memantine',
    name: 'Memantine HCl',
    aliases: ['memantine', 'memantine hcl', 'namenda', 'ebixa'],
    topic: 'Cortical Synaptic Coupling',
    category: 'Core',
    path: 'Cortical Synaptic Coupling/Concept Graph/Core/Memantine HCl.md',
    route: 'Oral · Hydrochloride Salt Oral Tablet',
    form: 'Hydrochloride Salt Oral Tablet',
    description:
      'Uncompetitive voltage-dependent extrasynaptic NMDA open-channel blocker; preserves phasic synaptic LTP. Fast on/off open-channel kinetics and strong voltage dependence allow Memantine to selectively block pathological tonic (extrasynaptic) Ca²⁺ influx while vacating the NMDA pore during high-frequency synaptic depolarization (preserving physiological phasic LTP).',
    fullPassage: `# Memantine HCl

Uncompetitive voltage-dependent extrasynaptic NMDA open-channel blocker; preserves phasic synaptic LTP.

Fast on/off open-channel kinetics and strong voltage dependence allow Memantine to selectively block pathological tonic (extrasynaptic) Ca²⁺ influx while vacating the NMDA pore during high-frequency synaptic depolarization (preserving physiological phasic LTP).

## Mechanistic Signaling Axes
- **Extrasynaptic NR2B Tonic Noise Suppression (Extrasynaptic GluN1/GluN2B Channel Pore · IC50 = 1.1 µM at -70 mV · Open-channel trapping):** Blocks chronic low-level glutamate spillover and excitotoxic Ca²⁺ overload that drives CREB shut-off, mitochondrial stress, and stimulant/dopaminergic tolerance.
- **Synaptic Phasic LTP Preservation (Synaptic GluN2A/2B under AMPA Depolarization · τ_off = 0.8 s at -20 mV Rapid Voltage Unblock):** During transient ~100 Hz synaptic cleft glutamate pulses (>1 mM), rapid postsynaptic depolarization expels Memantine alongside Mg²⁺, leaving physiological hippocampal LTP intact.
- **α7-nAChR Biphasic Adaptation (Neuronal α7 Nicotinic Acetylcholine Receptor · Transient antagonism Days 1–5 → Upregulation):** Initial α7-nAChR blockade causes transient "brain fog" during Days 1–4, followed by compensatory receptor upregulation and sharpened signal-to-noise ratio by Day 10.

## Complementary & Protocol Links
Memantine suppresses tonic extrasynaptic GluN2B Ca²⁺ noise while [[Citicoline (CDP-Choline)]] amplifies phasic synaptic nicotinic/AMPA depolarization and membrane phospholipid repair, and [[Magnesium L-Threonate]] supports resting physiological NMDA pore gating.

## Timing & Administration
With a 60–80 h elimination half-life, steady-state tonic NMDA blockade spans 24 hours; bedtime dosing during Week 1 masks transient α7-nAChR adaptation fog.

Source: Lipton, Nat Rev Drug Discov 2006 (PMID: 16424917) · Xia et al., J Neurosci 2010 · DailyMed Memantine HCl Monograph.`,
    source: 'Lipton, Nat Rev Drug Discov 2006 · DailyMed Memantine HCl Monograph',
    linkedCompoundNames: ['Citicoline (CDP-Choline)', 'Magnesium L-Threonate', 'Telmisartan'],
  },
  {
    id: 'l1-endoxifen',
    compoundId: 'cmp-endoxifen',
    name: 'Endoxifen',
    aliases: ['endoxifen', 'z-endoxifen', 'endoxifen ((z)-isomer)', '4-oh-n-desmethyltamoxifen'],
    topic: 'Epiphyseal & Endocrine Kinetics',
    category: 'Core',
    path: 'Epiphyseal & Endocrine Kinetics/Concept Graph/Core/Endoxifen.md',
    route: 'Oral · (Z)-Isomer Enteric Capsule',
    form: '(Z)-Isomer Enteric Capsule',
    description:
      'Direct active SERM metabolite bypassing CYP2D6 genetic polymorphism bottleneck; targeted AF-1/AF-2 ER co-regulator recruitment. Direct administration of (Z)-Endoxifen bypasses hepatic CYP2D6 bioactivation polymorphisms completely, achieving 30–100× higher ERα/ERβ binding affinity than parent tamoxifen with tissue-selective AF-1/AF-2 co-repressor recruitment.',
    fullPassage: `# Endoxifen

Direct active SERM metabolite bypassing CYP2D6 genetic polymorphism bottleneck; targeted AF-1/AF-2 ER co-regulator recruitment.

Direct administration of (Z)-Endoxifen bypasses hepatic CYP2D6 bioactivation polymorphisms completely, achieving 30–100× higher ERα/ERβ binding affinity than parent tamoxifen with tissue-selective AF-1/AF-2 co-repressor recruitment.

## Mechanistic Signaling Axes
- **AF-2 Helix-12 Conformational Antagonism (Mammary & Hypothalamic ERα LBD, IC50 = 3.0 nM · Direct active species · Zero CYP2D6 bottleneck):** Displaces Helix-12 over the co-activator groove, recruiting NCoR/SMRT corepressors in breast/pituitary tissue to prevent gynecomastia and disinhibit GnRH/LH/FSH pulsatility.
- **Epiphyseal & Trabecular AF-1 Partial Agonism (Osteoblast & Growth Plate Chondrocyte ERα/ERβ · Selective SRC-1 recruitment):** Preserves trabecular bone mineral density while avoiding supraphysiological E2-driven premature chondrocyte senescence when titrated against ultrasensitive LC-MS/MS estradiol.
- **PKC-β1 & Non-Genomic Signaling (Protein Kinase C-β1 Allosteric Site · IC50 = 0.8 µM):** Inhibits PKC-β signaling independent of estrogen receptor occupancy, stabilizing mood and endothelial barrier tone.

## Complementary & Swap Context
Endoxifen blocks ERα-driven growth-plate chondrocyte senescence without suppressing hepatic IGF-1, extending the temporal window for [[Vosoritide (CNP-38)]] NPR-B → cGMP → PKGII linear growth velocity. Direct (Z)-Endoxifen replaces prodrug [[Tamoxifen Citrate]] at 1/5th the milligram load.

## Timing & Administration
Terminal half-life ~52 hours maintains stable hypothalamic and epiphyseal ERα occupancy with once-daily morning administration.

Source: Goetz et al., J Clin Oncol 2017 · Wu et al., Cancer Res 2009 (PMID: 19244106); Ahmad et al., Clin Pharmacol Ther 2010.`,
    source: 'Goetz et al., J Clin Oncol 2017 · Wu et al., Cancer Res 2009',
    linkedCompoundNames: ['Vosoritide (CNP-38)', 'Tamoxifen Citrate', 'Testosterone Cypionate'],
  },
  {
    id: 'l1-vosoritide',
    compoundId: 'cmp-vosoritide',
    name: 'Vosoritide (CNP-38)',
    aliases: ['vosoritide', 'vosoritide (cnp-38)', 'cnp', 'cnp-38', 'voxzogo', 'fgfr3-cnp'],
    topic: 'Epiphyseal & Endocrine Kinetics',
    category: 'Models',
    path: 'Epiphyseal & Endocrine Kinetics/Concept Graph/Models/Vosoritide (CNP-38).md',
    route: 'Subcutaneous · Modified Recombinant Human C-Type Natriuretic Peptide (Lyophilized)',
    form: 'Modified Recombinant Human C-Type Natriuretic Peptide (Lyophilized)',
    description:
      'NPR-B guanylyl cyclase agonist → cGMP → PKGII phosphorylation of RAF-1 Ser43, unblocking FGFR3 MAPK chondrocyte inhibition. Binds transmembrane guanylyl cyclase NPR-B on proliferating and pre-hypertrophic growth-plate chondrocytes, elevating intracellular cGMP and activating PKGII to phosphorylate RAF-1 at Ser43—directly unblocking FGFR3-driven MEK1/2–ERK1/2 MAPK inhibition of endochondral ossification.',
    fullPassage: `# Vosoritide (CNP-38)

NPR-B guanylyl cyclase agonist → cGMP → PKGII phosphorylation of RAF-1 Ser43, unblocking FGFR3 MAPK chondrocyte inhibition.

Binds transmembrane guanylyl cyclase NPR-B on proliferating and pre-hypertrophic growth-plate chondrocytes, elevating intracellular cGMP and activating PKGII to phosphorylate RAF-1 at Ser43—directly unblocking FGFR3-driven MEK1/2–ERK1/2 MAPK inhibition of endochondral ossification.

## Mechanistic Signaling Axes
- **NPR-B → cGMP → PKGII Cascade (Chondrocyte Transmembrane Guanylyl Cyclase B / NPR2 · EC50 = 12 nM · Peak plasma cGMP at T+25 min):** Drives a 6–8× surge in intracellular and urinary cGMP/creatinine ratio, sustaining chondrocyte column architecture for 18–24 hours despite rapid plasma peptide clearance (t½ ~ 28–45 min).
- **RAF-1 (Ser43) Cross-Inhibition of FGFR3 MAPK (FGFR3 → RAS → RAF-1 → MEK1/2 → ERK1/2 Axis · 78% suppression of p-ERK1/2 nuclear translocation):** PKGII phosphorylation of RAF-1 halts constitutive FGFR3 signaling, restoring chondrocyte proliferation, extracellular matrix (aggrecan / Collagen X) synthesis, and hypertrophic cell volume.
- **SOX9 & STAT1 Gatekeeping (Pre-hypertrophic to Hypertrophic Transition Zone):** Prevents premature SOX9 stabilization and STAT1-mediated cell-cycle arrest while avoiding NPR-C clearance sink saturation via modified N-terminal Pro-Gly resistance to neutral endopeptidase (NEP).

## Complementary & Protocol Links
Pairs with [[Endoxifen]] so ERα-mediated chondrocyte senescence is restrained without first-pass hepatic IGF-1 suppression.

## Timing & Administration
SubQ administration after 250 mL water and a light meal prevents transient vascular cGMP hypotension while driving a 24-hour chondrocyte PKGII cascade.

Source: Savarirayan et al., NEJM 2019 · Lorget et al., Am J Hum Genet 2012 (PMID: 23200862); Yasoda et al., Nat Med 2004.`,
    source: 'Savarirayan et al., NEJM 2019 · Lorget et al., Am J Hum Genet 2012',
    linkedCompoundNames: ['Endoxifen', 'BPC-157 (Lyophilized)'],
  },
  {
    id: 'l1-test-cyp',
    compoundId: 'cmp-test-cyp',
    name: 'Testosterone Cypionate',
    aliases: ['testosterone cypionate', 'test cyp', 'testosterone', 'cypionate', 'test e', 'testosterone enanthate'],
    topic: 'Hemodynamic & Metabolic Shielding',
    category: 'Models',
    path: 'Hemodynamic & Metabolic Shielding/Concept Graph/Models/Testosterone Cypionate.md',
    route: 'Intramuscular / SubQ · 17β-Cyclopentylpropionate Ester in USP Cottonseed/MCT Carrier',
    form: '17β-Cyclopentylpropionate Ester in USP Cottonseed/MCT Carrier',
    description:
      'Depot androgen ester (t½ ~ 5 days). Pair with micro-cadence pinning (E3.5D / EOD) to minimize aromatase E2 & hematocrit peaks.',
    fullPassage: `# Testosterone Cypionate

Depot androgen ester (t½ ~ 5 days). Pair with micro-cadence pinning (E3.5D / EOD) to minimize aromatase E2 & hematocrit peaks.

## Pharmacokinetic & Receptor Coupling
- **17β-Cyclopentylpropionate Ester Depot:** Elimination half-life ~120 hours (5 days) with ~70% active unesterified base weight fraction after esterase cleavage.
- **Micro-Cadence Pinning (E3.5D / 84h):** Splitting 140 mg/week into 70 mg (0.35 mL / 35 U-100 units at 200 mg/mL) every 84 hours maintains a steady-state peak-to-trough ratio of 1.62×, curbing supraphysiological CYP19A1 aromatization spikes and erythropoietin (EPO) viscosity drift.
- **Hemodynamic & Endocrine Guardrails:** Pair with [[Telmisartan]] to counteract androgen-induced angiotensin II vasoconstriction, aldosterone retention, and hematocrit viscosity, and monitor ultrasensitive LC-MS/MS estradiol alongside [[Endoxifen]].

Source: Nieschlag & Behre, Testosterone: Action, Deficiency, Substitution · Benson et al., Hypertension 2004.`,
    source: 'Nieschlag & Behre, Testosterone: Action, Deficiency, Substitution',
    linkedCompoundNames: ['Telmisartan', 'Endoxifen'],
  },
  {
    id: 'l1-bpc157',
    compoundId: 'cmp-bpc157',
    name: 'BPC-157 (Lyophilized)',
    aliases: ['bpc-157 (lyophilized)', 'bpc-157', 'bpc 157', 'pentadecapeptide'],
    topic: 'Hemodynamic & Metabolic Shielding',
    category: 'Use and Audit',
    path: 'Hemodynamic & Metabolic Shielding/Concept Graph/Use and Audit/BPC-157 (Lyophilized).md',
    route: 'Subcutaneous · Lyophilized Acetate / Arginate Vial',
    form: 'Lyophilized Acetate / Arginate Vial',
    description:
      'Upregulates growth hormone receptor expression on fibroblasts and FAK-paxillin angiogenic remodeling.',
    fullPassage: `# BPC-157 (Lyophilized)

Upregulates growth hormone receptor expression on fibroblasts and FAK-paxillin angiogenic remodeling.

## Tissue Remodeling & Angiogenic Pathways
- **VEGFR2 & FAK-Paxillin Remodeling:** Accelerates tendon-to-bone enthesis collagen I/III organization and fibroblast migration via focal adhesion kinase (FAK)-paxillin phosphorylation.
- **Endothelial eNOS Modulation:** Stabilizes microvascular perfusion and endothelial nitric oxide homeostasis alongside [[Telmisartan]] and osteogenic/epiphyseal protocols with [[Vosoritide (CNP-38)]] and [[Endoxifen]].

Source: Hsieh et al., J Appl Physiol 2017 · Sikiric et al., Curr Pharm Des 2018.`,
    source: 'Hsieh et al., J Appl Physiol 2017 · Sikiric et al., Curr Pharm Des 2018',
    linkedCompoundNames: ['Telmisartan', 'Vosoritide (CNP-38)', 'Endoxifen'],
  },
  {
    id: 'l1-citicoline',
    compoundId: 'cmp-citicoline',
    name: 'Citicoline (CDP-Choline)',
    aliases: ['citicoline (cdp-choline)', 'citicoline', 'cdp-choline', 'cognizin'],
    topic: 'Cortical Synaptic Coupling',
    category: 'Models',
    path: 'Cortical Synaptic Coupling/Concept Graph/Models/Citicoline (CDP-Choline).md',
    route: 'Oral · Cytidine 5-Diphosphocholine Free Base',
    form: 'Cytidine 5-Diphosphocholine Free Base',
    description:
      'Dual choline + cytidine/uridine donor supporting phosphatidylcholine synthesis and striatal dopamine receptor density.',
    fullPassage: `# Citicoline (CDP-Choline)

Dual choline + cytidine/uridine donor supporting phosphatidylcholine synthesis and striatal dopamine receptor density.

## Synaptic & Membrane Phospholipid Pathways
- **Kennedy Pathway & Cytidine/Uridine Flux:** Delivers both choline and cytidine (converted to uridine in humans) to upregulate neuronal phosphatidylcholine synthesis and striatal dopamine D2 receptor density.
- **Extrasynaptic Noise Filtering Synergy:** While [[Memantine HCl]] suppresses tonic extrasynaptic GluN2B Ca²⁺ noise, Citicoline amplifies phasic synaptic nicotinic/AMPA depolarization and membrane phospholipid repair.
- **Smarter Swap over Alpha-GPC:** Replaces high-bolus [[Alpha-GPC]] to avoid gut microbial TMA → hepatic FMO3 pro-atherogenic TMAO conversion.

Source: Secades & Lorenzo, Methods Find Exp Clin Pharmacol 2006; Wang et al., JAMA Netw Open 2021.`,
    source: 'Secades & Lorenzo, Methods Find Exp Clin Pharmacol 2006',
    linkedCompoundNames: ['Memantine HCl', 'Alpha-GPC', 'Magnesium L-Threonate'],
  },
  {
    id: 'l1-tamoxifen',
    compoundId: 'cmp-tamoxifen',
    name: 'Tamoxifen Citrate',
    aliases: ['tamoxifen citrate', 'tamoxifen', 'nolvadex'],
    topic: 'Epiphyseal & Endocrine Kinetics',
    category: 'Use and Audit',
    path: 'Epiphyseal & Endocrine Kinetics/Concept Graph/Use and Audit/Tamoxifen Citrate.md',
    route: 'Oral · Oral Prodrug Tablet',
    form: 'Oral Prodrug Tablet',
    description:
      'Prodrug requiring hepatic CYP2D6 bioactivation to Endoxifen; suppresses hepatic IGF-1 on first pass. Up to 30% of individuals carry reduced-function CYP2D6 alleles that blunt conversion of Tamoxifen to active Endoxifen while still subjecting the liver to first-pass estrogenic IGF-1 suppression.',
    fullPassage: `# Tamoxifen Citrate

Prodrug requiring hepatic CYP2D6 bioactivation to Endoxifen; suppresses hepatic IGF-1 on first pass.

## Bioactivation Bottleneck & First-Pass Trade-Off
- **CYP2D6 Polymorphism Bottleneck:** Up to 30% of individuals carry reduced-function CYP2D6 alleles (*4, *10) that blunt conversion of prodrug Tamoxifen to active [[Endoxifen]] while still subjecting the liver to first-pass estrogenic IGF-1 suppression.
- **Counterfactual Optimization:** Direct (Z)-[[Endoxifen]] achieves predictable ERα co-repressor recruitment at 1/5th the milligram load without hepatic CYP2D6 metabolic dependency, preserving systemic IGF-1 alongside [[Vosoritide (CNP-38)]].

Source: Goetz et al., J Clin Oncol 2017 · Wu et al., Cancer Res 2009.`,
    source: 'Goetz et al., J Clin Oncol 2017',
    linkedCompoundNames: ['Endoxifen', 'Vosoritide (CNP-38)'],
  },
  {
    id: 'l1-alphagpc',
    compoundId: 'cmp-alphagpc',
    name: 'Alpha-GPC',
    aliases: ['alpha-gpc', 'alpha gpc', 'choline alfoscerate'],
    topic: 'Cortical Synaptic Coupling',
    category: 'Use and Audit',
    path: 'Cortical Synaptic Coupling/Concept Graph/Use and Audit/Alpha-GPC.md',
    route: 'Oral · Hygroscopic Capsule',
    form: 'Hygroscopic Capsule',
    description:
      'Rapid acetylcholine spike but undergoes gut microbial TMA → hepatic TMAO conversion at high bolus doses. High-dose Alpha-GPC converts to pro-atherogenic TMAO and lacks uridine.',
    fullPassage: `# Alpha-GPC

Rapid acetylcholine spike but undergoes gut microbial TMA → hepatic TMAO conversion at high bolus doses.

## Metabolic Sink & Smarter Swap
- **Gut TMA → Hepatic FMO3 TMAO Conversion:** High-dose Alpha-GPC converts to pro-atherogenic trimethylamine N-oxide (TMAO) in the gut-liver axis and lacks the cytidine/uridine pyrimidine component.
- **Counterfactual Swap:** [[Citicoline (CDP-Choline)]] delivers both choline and cytidine (converted to uridine) to upregulate dopamine D2 receptor density and phosphatidylcholine synthesis with significantly lower gut TMA → TMAO conversion alongside [[Memantine HCl]].

Source: Wang et al., JAMA Netw Open 2021 (TMAO conversion) · Secades & Lorenzo 2006.`,
    source: 'Wang et al., JAMA Netw Open 2021 (TMAO conversion)',
    linkedCompoundNames: ['Citicoline (CDP-Choline)', 'Memantine HCl'],
  },
  {
    id: 'l1-mgoxide',
    compoundId: 'cmp-mgoxide',
    name: 'Magnesium Oxide',
    aliases: ['magnesium oxide', 'mg oxide'],
    topic: 'Cortical Synaptic Coupling',
    category: 'Use and Audit',
    path: 'Cortical Synaptic Coupling/Concept Graph/Use and Audit/Magnesium Oxide.md',
    route: 'Oral · Inorganic Oxide Tablet',
    form: 'Inorganic Oxide Tablet',
    description:
      'Poorly soluble inorganic oxide (~4% fractional absorption); largely acts as osmotic laxative. Inorganic Magnesium Oxide barely crosses the intestinal epithelium.',
    fullPassage: `# Magnesium Oxide

Poorly soluble inorganic oxide (~4% fractional absorption); largely acts as osmotic laxative.

## Bioavailability Bottleneck & Smarter Swap
- **4% Fractional Absorption (96% Unabsorbed GI Waste):** Inorganic Magnesium Oxide barely crosses the intestinal epithelium and fails to elevate cerebrospinal fluid Mg²⁺.
- **Counterfactual Swap:** Switching to [[Magnesium L-Threonate]] or Bisglycinate restores intracellular and CSF Mg²⁺ needed to gate resting NMDA channels alongside [[Memantine HCl]].

Source: Firoz & Graber, Magnes Res 2001 (4% fractional bioavailability); Slutsky et al., Neuron 2010.`,
    source: 'Firoz & Graber, Magnes Res 2001 (4% fractional bioavailability)',
    linkedCompoundNames: ['Magnesium L-Threonate', 'Memantine HCl'],
  },
  {
    id: 'l1-mgthreonate',
    compoundId: 'cmp-mgthreonate',
    name: 'Magnesium L-Threonate',
    aliases: ['magnesium l-threonate', 'magtein', 'mg l-threonate', 'magnesium glycinate'],
    topic: 'Cortical Synaptic Coupling',
    category: 'Models',
    path: 'Cortical Synaptic Coupling/Concept Graph/Models/Magnesium L-Threonate.md',
    route: 'Oral · Chelated L-Threonate / Bisglycinate',
    form: 'Chelated L-Threonate / Bisglycinate',
    description:
      'Elevates brain cerebrospinal fluid Mg²⁺ and supports resting NMDA voltage block.',
    fullPassage: `# Magnesium L-Threonate

Elevates brain cerebrospinal fluid Mg²⁺ and supports resting NMDA voltage block.

## Synaptic Density & Resting NMDA Pore Gatekeeping
- **CSF Mg²⁺ Elevation:** Chelated L-Threonate crosses the blood-brain barrier to elevate cerebrospinal fluid Mg²⁺, reinforcing physiological resting (-70 mV) voltage-dependent NMDA channel block.
- **Complementary Coupling:** Works alongside [[Memantine HCl]] and [[Citicoline (CDP-Choline)]] while replacing low-bioavailability [[Magnesium Oxide]].

Source: Slutsky et al., Neuron 2010 · Firoz & Graber, Magnes Res 2001.`,
    source: 'Slutsky et al., Neuron 2010',
    linkedCompoundNames: ['Memantine HCl', 'Citicoline (CDP-Choline)', 'Magnesium Oxide'],
  },
];

/**
 * Resolves the exact compound description and full passage from user-supplied text,
 * library compound records, and default compound passages without altering user wording.
 */
export function resolveCompoundPassage(
  compoundInput: { id?: string; name?: string; notes?: string; source?: string; route?: string; form?: string } | string,
  options: {
    suppliedText?: string;
    libraryCompounds?: Array<{ id?: string; name?: string; aliases?: string[]; notes?: string; source?: string; route?: string; form?: string }>;
  } = {}
): CompoundPassageRecord {
  const rawName = typeof compoundInput === 'string' ? compoundInput : compoundInput?.name || compoundInput?.id || '';
  const rawId = typeof compoundInput === 'object' ? compoundInput?.id || '' : '';
  const lowerName = rawName.toLowerCase().trim();
  const lowerId = rawId.toLowerCase().trim();

  const baseRecord =
    DEFAULT_COMPOUND_PASSAGES.find(
      (p) =>
        p.id === lowerId ||
        p.compoundId === lowerId ||
        p.name.toLowerCase() === lowerName ||
        p.aliases.some((a) => lowerName.includes(a) || a.includes(lowerName))
    ) || null;

  const libMatch = (options.libraryCompounds || []).find((c) => {
    if (!c) return false;
    if (c.id && (c.id === rawId || c.id === baseRecord?.compoundId)) return true;
    const names = [c.name?.toLowerCase(), ...(c.aliases || []).map((a) => a.toLowerCase())].filter(Boolean);
    return names.some((n) => n && (lowerName.includes(n) || n.includes(lowerName)));
  });

  const profileMatch = FUNCTIONAL_EFFECT_PROFILES.find(
    (fp) =>
      fp.compoundId === (libMatch?.id || baseRecord?.compoundId || rawId) ||
      lowerName.includes(fp.name.toLowerCase()) ||
      fp.name.toLowerCase().includes(lowerName)
  );

  // Check if the user supplied text (e.g. in the stack check textarea or custom note) mentioning this compound
  const suppliedLines: string[] = [];
  if (options.suppliedText && options.suppliedText.trim()) {
    const tokens = [
      rawName.toLowerCase(),
      ...(baseRecord?.aliases || []),
      ...(libMatch?.aliases || []).map((a) => a.toLowerCase()),
    ].filter((t) => t && t.length >= 3);

    const paragraphs = String(options.suppliedText)
      .split(/\r?\n\s*\r?\n|\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    for (const para of paragraphs) {
      const lowerPara = para.toLowerCase();
      if (tokens.some((tok) => lowerPara.includes(tok))) {
        suppliedLines.push(para);
      }
    }
  }

  const customItemNotes = typeof compoundInput === 'object' && compoundInput?.notes ? String(compoundInput.notes).trim() : '';
  const customLibNotes = libMatch?.notes ? String(libMatch.notes).trim() : '';

  const displayName = baseRecord?.name || libMatch?.name || rawName || 'Selected Compound';
  const route =
    (typeof compoundInput === 'object' && compoundInput?.route) ||
    libMatch?.route ||
    baseRecord?.route ||
    'Oral / Protocol Route';
  const form =
    (typeof compoundInput === 'object' && compoundInput?.form) ||
    libMatch?.form ||
    baseRecord?.form ||
    'Configured Form';
  const source =
    (typeof compoundInput === 'object' && compoundInput?.source) ||
    libMatch?.source ||
    profileMatch?.source ||
    baseRecord?.source ||
    'Supplied Protocol Text';

  // Preserve exact user wording in description and full passage
  const userSuppliedExcerpt =
    suppliedLines.find((line) => line.length > displayName.length + 10) ||
    suppliedLines[0] ||
    '';

  const baseDescription =
    customLibNotes && customLibNotes !== baseRecord?.description
      ? customLibNotes
      : customItemNotes
      ? customItemNotes
      : baseRecord?.description ||
        profileMatch?.mechanisticSummary ||
        `${displayName}: ${userSuppliedExcerpt || 'Protocol compound entry from supplied text.'}`;

  const description = userSuppliedExcerpt
    ? `${userSuppliedExcerpt}${baseDescription && !baseDescription.includes(userSuppliedExcerpt) ? ` — ${baseDescription}` : ''}`
    : baseDescription;

  const fullSections: string[] = [];
  if (suppliedLines.length > 0) {
    fullSections.push(`Supplied Input Text:\n${suppliedLines.join('\n')}`);
  }
  if (customItemNotes && !suppliedLines.includes(customItemNotes)) {
    fullSections.push(`Protocol Item Note:\n${customItemNotes}`);
  }
  if (customLibNotes && (!baseRecord || !baseRecord.fullPassage.includes(customLibNotes))) {
    fullSections.push(`Library Description:\n${customLibNotes}`);
  }
  if (baseRecord?.fullPassage) {
    fullSections.push(baseRecord.fullPassage);
  } else if (profileMatch) {
    fullSections.push(
      `# ${displayName}\n\n${profileMatch.mechanisticSummary}\n\n` +
        profileMatch.pathways.map((pw) => `- **${pw.axis} (${pw.target} · ${pw.kinetics}):** ${pw.effect}`).join('\n') +
        `\n\nSource: ${profileMatch.source}`
    );
  } else if (fullSections.length === 0) {
    fullSections.push(`# ${displayName}\n\n${description}\n\nSource: ${source}`);
  }

  return {
    id: baseRecord?.id || rawId || `cmp-${displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    compoundId: baseRecord?.compoundId || libMatch?.id || rawId,
    name: displayName,
    aliases: baseRecord?.aliases || libMatch?.aliases || [displayName.toLowerCase()],
    topic: baseRecord?.topic || 'Protocol Pharmacology',
    category: baseRecord?.category || 'Core',
    path: baseRecord?.path || `Protocol Pharmacology/Concept Graph/Core/${displayName}.md`,
    route,
    form,
    description,
    fullPassage: fullSections.join('\n\n'),
    source,
    linkedCompoundNames: baseRecord?.linkedCompoundNames || [],
  };
}

function buildResolvedLinks(files: BrowserVaultFile[]): Record<string, Record<string, number>> {
  const byTitle = new Map<string, string>();
  for (const file of files) {
    byTitle.set(file.basename.toLowerCase(), file.path);
    byTitle.set(file.path.toLowerCase(), file.path);
    const heading = file.content.match(/^#\s+(.+)$/m)?.[1]?.trim();
    if (heading) byTitle.set(heading.toLowerCase(), file.path);
  }

  const resolvedLinks: Record<string, Record<string, number>> = {};
  const wikiRegex = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g;

  for (const file of files) {
    const links: Record<string, number> = {};
    let match: RegExpExecArray | null;
    wikiRegex.lastIndex = 0;
    while ((match = wikiRegex.exec(file.content)) !== null) {
      const rawTarget = match[1].trim().toLowerCase();
      const targetPath =
        byTitle.get(rawTarget) ||
        files.find((f) => f.basename.toLowerCase().includes(rawTarget) || rawTarget.includes(f.basename.toLowerCase()))?.path;
      if (targetPath && targetPath !== file.path) {
        links[targetPath] = (links[targetPath] ?? 0) + 1;
      }
    }
    resolvedLinks[file.path] = links;
  }

  return resolvedLinks;
}

export function createBrowserVaultApp(options: {
  suppliedText?: string;
  libraryCompounds?: Array<{ id?: string; name?: string; aliases?: string[]; notes?: string; source?: string; route?: string; form?: string }>;
  extraFiles?: Array<{ path: string; content: string }>;
} = {}): BrowserVaultApp {
  const filesMap = new Map<string, BrowserVaultFile>();

  const putFile = (rawPath: string, content: string): BrowserVaultFile => {
    const clean = normalizePath(rawPath);
    const filename = clean.split('/').pop() || clean;
    const basename = filename.replace(/\.md$/i, '');
    const file: BrowserVaultFile = {
      path: clean,
      basename,
      extension: 'md',
      content: String(content || ''),
    };
    filesMap.set(clean, file);
    return file;
  };

  // 1. Seed default compound passages (with any user-supplied text merged verbatim)
  for (const record of DEFAULT_COMPOUND_PASSAGES) {
    const resolved = resolveCompoundPassage(record, {
      suppliedText: options.suppliedText,
      libraryCompounds: options.libraryCompounds,
    });
    putFile(resolved.path, resolved.fullPassage);
  }

  // 2. Include any additional library compounds not in DEFAULT_COMPOUND_PASSAGES
  for (const comp of options.libraryCompounds || []) {
    if (!comp?.name) continue;
    const exists = DEFAULT_COMPOUND_PASSAGES.some(
      (p) => p.compoundId === comp.id || p.name.toLowerCase() === comp.name!.toLowerCase()
    );
    if (!exists) {
      const resolved = resolveCompoundPassage(comp, {
        suppliedText: options.suppliedText,
        libraryCompounds: options.libraryCompounds,
      });
      putFile(resolved.path, resolved.fullPassage);
    }
  }

  // 3. Load any persisted browser vault files from localStorage
  const storedRaw = readStorage(VAULT_STORAGE_KEY);
  if (storedRaw) {
    try {
      const parsed = JSON.parse(storedRaw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item?.path && typeof item?.content === 'string') {
            putFile(item.path, item.content);
          }
        }
      }
    } catch {
      // Ignore malformed stored vault data
    }
  }

  // 4. Include any explicit extra files passed by caller
  for (const extra of options.extraFiles || []) {
    if (extra?.path && typeof extra?.content === 'string') {
      putFile(extra.path, extra.content);
    }
  }

  const metadataCache: BrowserMetadataCache = {
    resolvedLinks: buildResolvedLinks([...filesMap.values()]),
  };

  const adapter: BrowserVaultAdapter = {
    async exists(path: string): Promise<boolean> {
      const key = `${ADAPTER_STORAGE_PREFIX}${normalizePath(path)}`;
      return readStorage(key) !== null;
    },
    async read(path: string): Promise<string> {
      const key = `${ADAPTER_STORAGE_PREFIX}${normalizePath(path)}`;
      return readStorage(key) ?? '';
    },
    async write(path: string, content: string): Promise<void> {
      const key = `${ADAPTER_STORAGE_PREFIX}${normalizePath(path)}`;
      writeStorage(key, content);
    },
    async append(path: string, content: string): Promise<void> {
      const key = `${ADAPTER_STORAGE_PREFIX}${normalizePath(path)}`;
      const current = readStorage(key) ?? '';
      writeStorage(key, `${current}${content}`);
    },
  };

  return {
    vault: {
      configDir: '.obsidian',
      adapter,
      getMarkdownFiles(): BrowserVaultFile[] {
        return [...filesMap.values()];
      },
      async cachedRead(file: BrowserVaultFile): Promise<string> {
        return filesMap.get(file.path)?.content ?? file.content ?? '';
      },
      async read(file: BrowserVaultFile): Promise<string> {
        return filesMap.get(file.path)?.content ?? file.content ?? '';
      },
      getAbstractFileByPath(path: string): BrowserVaultFile | null {
        const clean = normalizePath(path);
        return filesMap.get(clean) ?? null;
      },
      upsertFile(path: string, content: string): BrowserVaultFile {
        const file = putFile(path, content);
        metadataCache.resolvedLinks = buildResolvedLinks([...filesMap.values()]);
        const customList = [...filesMap.values()].map((f) => ({ path: f.path, content: f.content }));
        writeStorage(VAULT_STORAGE_KEY, JSON.stringify(customList));
        return file;
      },
    },
    metadataCache,
  };
}
