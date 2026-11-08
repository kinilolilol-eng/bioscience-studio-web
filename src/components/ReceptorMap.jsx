import { useState } from 'react';
import { resolveCompoundPassage } from '../atlas/browserVault.ts';
import {
  EPISTEMIC_TIERS,
  INTERACTION_POLARITIES,
  computeCausalCascadeGraph,
  computeReceptorOverlapMap,
} from '../studioLogic.js';
import { saveReceptorMapCard } from '../phoneCard.js';
import KnowledgeAtlas from './KnowledgeAtlas.jsx';
import { Icon, Notice } from './ui.jsx';

const TEMPORAL_PHASES = [
  ['acute_d1_5', 'Acute Initiation (Days 1–5)'],
  ['subacute_d6_13', 'Subacute Titration (Days 6–13)'],
  ['chronic_d14_plus', 'Chronic Steady-State (Day 14+)'],
];

const CYP2D6_GENOTYPES = [
  ['extensive', '*1/*1 Extensive (100%)'],
  ['intermediate', '*1/*4 Intermediate (58%)'],
  ['poor', '*4/*4 Poor Metabolizer (18%)'],
];

const DOSE_MULTIPLIERS = [
  [0.5, '0.5× Low Titration'],
  [1.0, '1.0× Standard Regimen'],
  [1.5, '1.5× High Exposure'],
  [2.0, '2.0× Supraphysiological'],
];

const EPISTEMIC_FILTERS = [
  ['all', 'All Epistemic Tiers'],
  ['quantitative_only', 'Quantitative PK/PD Only'],
  ['established_and_supported', 'Quantitative + Supported'],
  ['frontier_highlight', 'Frontier ODE & Contextual'],
];

export default function ReceptorMap({
  items = [],
  suppliedText = '',
  library = null,
  title = 'Causal Cascade Tree & Epistemic Systems-Pharmacology Instrument',
  subtitle = 'Four-layer mechanistic trace (Compound & Route → Primary Target → Subcellular Mechanism → Phenotypic Goal) with epistemic edge encoding, counterfactual stack modeling, and temporal adaptation.',
}) {
  const [direction, setDirection] = useState('forward');
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedCompoundId, setSelectedCompoundId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [targetGoalId, setTargetGoalId] = useState('goal-cognition');
  const [temporalPhase, setTemporalPhase] = useState('chronic_d14_plus');
  const [cyp2d6Genotype, setCyp2d6Genotype] = useState('extensive');
  const [doseMultiplier, setDoseMultiplier] = useState(1.0);
  const [epistemicFilter, setEpistemicFilter] = useState('all');
  const [counterfactuals, setCounterfactuals] = useState({
    swapTamoxifenToEndoxifen: false,
    swapAlphaGpcToCiticoline: false,
    swapMgOxideToThreonate: false,
    toggleTelmisartanShield: null,
    toggleVosoritide: null,
  });

  const [graphView, setGraphView] = useState({ panX: 0, panY: 0, zoom: 1 });
  const [openPassageState, setOpenPassageState] = useState(null);
  const [atlasViewMode, setAtlasViewMode] = useState('cascade');

  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [exportError, setExportError] = useState('');

  const cascade = computeCausalCascadeGraph(items, {
    direction,
    selectedNodeId,
    targetGoalId,
    cyp2d6Genotype,
    doseMultiplier,
    temporalPhase,
    epistemicFilter,
    counterfactuals,
  });

  const legacyMap = computeReceptorOverlapMap(
    cascade.layers.compounds.map((c) => ({ name: c.name }))
  );

  const allNodes = [
    ...cascade.layers.compounds,
    ...cascade.layers.targets,
    ...cascade.layers.mechanisms,
    ...cascade.layers.phenotypes,
  ];
  const nodeById = new Map(allNodes.map((n) => [n.id, n]));

  const activeEdge =
    cascade.edges.find((e) => e.id === selectedEdgeId) ||
    cascade.edges.find((e) => e.inTrace && e.passesEpistemicFilter) ||
    cascade.edges[0];

  const activeNode = cascade.focusNode;

  const activeCompound =
    cascade.layers.compounds.find((c) => c.id === selectedCompoundId) ||
    (activeNode?.layer === 1 ? activeNode : cascade.layers.compounds[0]) ||
    null;

  const matchingInputItem = items.find(
    (it) =>
      (it.id && activeCompound && (it.id === activeCompound.compoundId || it.id === activeCompound.id)) ||
      (it.name && activeCompound?.name && activeCompound.name.toLowerCase().includes(String(it.name).toLowerCase()))
  );

  const compoundPassage = activeCompound
    ? resolveCompoundPassage(
        {
          ...activeCompound,
          raw: matchingInputItem?.raw || '',
          notes: matchingInputItem?.notes || activeCompound.notes || '',
        },
        {
          suppliedText,
          libraryCompounds: library?.compounds || [],
        }
      )
    : null;

  function handleSelectNode(node) {
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
    if (node.layer === 1) {
      setSelectedCompoundId(node.id);
    }
    if (node.layer === 4) {
      setTargetGoalId(node.id);
    }
  }

  function handleOpenFullPassage(targetCompound = activeCompound) {
    if (!targetCompound) return;
    const itemMatch = items.find(
      (it) =>
        (it.id && (it.id === targetCompound.compoundId || it.id === targetCompound.id)) ||
        (it.name && targetCompound.name && targetCompound.name.toLowerCase().includes(String(it.name).toLowerCase()))
    );
    const resolved = resolveCompoundPassage(
      {
        ...targetCompound,
        raw: itemMatch?.raw || '',
        notes: itemMatch?.notes || targetCompound.notes || '',
      },
      {
        suppliedText,
        libraryCompounds: library?.compounds || [],
      }
    );
    setOpenPassageState({
      compound: targetCompound,
      passage: resolved,
      savedGraphPosition: {
        selectedNodeId: selectedNodeId || targetCompound.id,
        selectedCompoundId: targetCompound.id,
        selectedEdgeId,
        direction,
        targetGoalId,
        temporalPhase,
        cyp2d6Genotype,
        doseMultiplier,
        epistemicFilter,
        panX: graphView.panX,
        panY: graphView.panY,
        zoom: graphView.zoom,
        nodeX: targetCompound.x,
        nodeY: targetCompound.y,
        scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
      },
    });
  }

  function handleReturnToGraphPosition() {
    if (!openPassageState) return;
    const { savedGraphPosition } = openPassageState;
    setDirection(savedGraphPosition.direction);
    setSelectedNodeId(savedGraphPosition.selectedNodeId);
    setSelectedCompoundId(savedGraphPosition.selectedCompoundId);
    setSelectedEdgeId(savedGraphPosition.selectedEdgeId);
    setTargetGoalId(savedGraphPosition.targetGoalId);
    setTemporalPhase(savedGraphPosition.temporalPhase);
    setCyp2d6Genotype(savedGraphPosition.cyp2d6Genotype);
    setDoseMultiplier(savedGraphPosition.doseMultiplier);
    setEpistemicFilter(savedGraphPosition.epistemicFilter);
    setGraphView({
      panX: savedGraphPosition.panX,
      panY: savedGraphPosition.panY,
      zoom: savedGraphPosition.zoom,
    });
    setOpenPassageState(null);
    if (typeof window !== 'undefined' && typeof savedGraphPosition.scrollY === 'number') {
      window.scrollTo({ top: savedGraphPosition.scrollY, behavior: 'auto' });
    }
  }

  function toggleCounterfactual(key) {
    setCounterfactuals((prev) => {
      if (key === 'toggleTelmisartanShield' || key === 'toggleVosoritide') {
        const nextVal = prev[key] === null ? true : prev[key] === true ? false : null;
        return { ...prev, [key]: nextVal };
      }
      return { ...prev, [key]: !prev[key] };
    });
  }

  function resetCounterfactuals() {
    setCounterfactuals({
      swapTamoxifenToEndoxifen: false,
      swapAlphaGpcToCiticoline: false,
      swapMgOxideToThreonate: false,
      toggleTelmisartanShield: null,
      toggleVosoritide: null,
    });
    setCyp2d6Genotype('extensive');
    setDoseMultiplier(1.0);
    setTemporalPhase('chronic_d14_plus');
    setEpistemicFilter('all');
  }

  async function handleExportCard() {
    if (exporting) return;
    setExporting(true);
    setExportStatus('');
    setExportError('');
    try {
      await saveReceptorMapCard(legacyMap, title);
      setExportStatus("Shareable image card ('bioscience-stack-receptor-map.png') downloaded.");
    } catch (cause) {
      setExportError(cause.message);
    } finally {
      setExporting(false);
    }
  }

  const hasActiveCounterfactual =
    counterfactuals.swapTamoxifenToEndoxifen ||
    counterfactuals.swapAlphaGpcToCiticoline ||
    counterfactuals.swapMgOxideToThreonate ||
    counterfactuals.toggleTelmisartanShield !== null ||
    counterfactuals.toggleVosoritide !== null ||
    cyp2d6Genotype !== 'extensive' ||
    doseMultiplier !== 1.0 ||
    temporalPhase !== 'chronic_d14_plus';

  const viewWidth = Math.round(1150 / graphView.zoom);
  const viewHeight = Math.round(675 / graphView.zoom);
  const svgViewBox = `${graphView.panX} ${graphView.panY} ${viewWidth} ${viewHeight}`;

  return (
    <section className="studio-section receptor-map-section causal-cascade-instrument" aria-label={title}>
      <div className="section-head">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="inline-actions">
          <button
            type="button"
            className={`button small-button ${atlasViewMode === 'atlas_3d' ? 'primary' : 'secondary'}`}
            onClick={() => setAtlasViewMode((m) => (m === 'cascade' ? 'atlas_3d' : 'cascade'))}
          >
            {atlasViewMode === 'atlas_3d' ? 'Return to Causal Cascade Graph' : 'Open 3D Knowledge Atlas (Browser Vault)'}
          </button>
          {hasActiveCounterfactual && (
            <button type="button" className="button quiet small-button" onClick={resetCounterfactuals}>
              Reset parameters
            </button>
          )}
          <button type="button" className="button secondary small-button" onClick={handleExportCard} disabled={exporting}>
            <Icon name="download" />
            {exporting ? 'Rendering map card…' : "Share your stack's map (PNG)"}
          </button>
        </div>
      </div>

      <Notice kind="success">{exportStatus}</Notice>
      <Notice>{exportError}</Notice>

      {/* Top Telemetry Summary Strip */}
      <div className="cascade-telemetry-strip" aria-label="Systems pharmacology summary metrics">
        <div className="telemetry-cell">
          <span>Active Causal Trace Mode</span>
          <strong>{direction === 'forward' ? 'Forward: Compound → Phenotype' : 'Backward: Goal → Upstream'}</strong>
          <small>Focus: {activeNode?.name || activeNode?.label}</small>
        </div>
        <div className="telemetry-cell">
          <span>Mean Pathway Flux Score</span>
          <strong className="tabular-nums">{cascade.summaryMetrics.meanFlux}%</strong>
          <small className="tabular-nums">
            {cascade.summaryMetrics.activeCompoundCount} compounds · {cascade.summaryMetrics.engagedTargetCount}/8 targets engaged
          </small>
        </div>
        <div className="telemetry-cell">
          <span>Epistemic Evidence Confidence</span>
          <strong className="tabular-nums">{cascade.summaryMetrics.meanConfidence}%</strong>
          <small>Weighted across {cascade.edges.length} active mechanistic edges</small>
        </div>
        <div className="telemetry-cell">
          <span>Convergence &amp; Bottleneck Status</span>
          <strong className="tabular-nums">
            {cascade.summaryMetrics.activeSynergyCount} Synergies · {cascade.summaryMetrics.activeBottleneckCount} Bottlenecks
          </strong>
          <small>
            CYP2D6 {cyp2d6Genotype.toUpperCase()} · {doseMultiplier.toFixed(1)}× Exposure ·{' '}
            {TEMPORAL_PHASES.find(([k]) => k === temporalPhase)?.[1]}
          </small>
        </div>
      </div>

      {/* Control Console: Bidirectional Mode + Counterfactuals + Temporal + Epistemic Filter */}
      <div className="cascade-control-console">
        <div className="cascade-control-row">
          <div className="cascade-control-group" role="group" aria-label="Bidirectional causal exploration mode">
            <span className="cascade-control-label">1. Causal Trace Direction</span>
            <div className="segmented-button-row">
              <button
                type="button"
                className={`button small-button ${direction === 'forward' ? 'primary' : 'secondary'}`}
                onClick={() => {
                  setDirection('forward');
                  setSelectedNodeId(cascade.layers.compounds[0]?.id || null);
                }}
              >
                Forward Trace (Compound → Phenotype)
              </button>
              <button
                type="button"
                className={`button small-button ${direction === 'backward' ? 'primary' : 'secondary'}`}
                onClick={() => {
                  setDirection('backward');
                  setSelectedNodeId(targetGoalId);
                }}
              >
                Backward Trace (Phenotypic Goal → Pathways)
              </button>
            </div>
          </div>

          <div className="cascade-control-group" role="group" aria-label="Temporal interaction and adaptation phase">
            <span className="cascade-control-label">2. Temporal PK/PD &amp; Adaptation Window</span>
            <div className="segmented-button-row">
              {TEMPORAL_PHASES.map(([phaseKey, phaseLabel]) => (
                <button
                  key={phaseKey}
                  type="button"
                  className={`button small-button ${temporalPhase === phaseKey ? 'primary' : 'quiet'}`}
                  onClick={() => setTemporalPhase(phaseKey)}
                >
                  {phaseLabel}
                </button>
              ))}
            </div>
          </div>
        </div>

        {direction === 'backward' && (
          <div className="cascade-backward-picker" role="group" aria-label="Select target phenotypic outcome for backward trace">
            <span className="cascade-control-label">Target Phenotypic Outcome (Click to trace required upstream mechanisms &amp; missing compounds):</span>
            <div className="segmented-button-row">
              {cascade.layers.phenotypes.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  className={`button small-button ${targetGoalId === goal.id ? 'primary' : 'secondary'}`}
                  onClick={() => {
                    setTargetGoalId(goal.id);
                    setSelectedNodeId(goal.id);
                  }}
                >
                  {goal.label} ({goal.netScore}% flux)
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="cascade-control-row">
          <div className="cascade-control-group" role="group" aria-label="Counterfactual stack perturbations">
            <span className="cascade-control-label">3. Dynamic Counterfactual Stack Interventions</span>
            <div className="segmented-button-row">
              <button
                type="button"
                aria-pressed={counterfactuals.swapTamoxifenToEndoxifen}
                className={`button small-button ${counterfactuals.swapTamoxifenToEndoxifen ? 'primary' : 'secondary'}`}
                onClick={() => toggleCounterfactual('swapTamoxifenToEndoxifen')}
              >
                {counterfactuals.swapTamoxifenToEndoxifen ? '✓ Swapped: Tamoxifen → Direct Endoxifen' : 'Counterfactual: Tamoxifen → Endoxifen'}
              </button>
              <button
                type="button"
                aria-pressed={counterfactuals.swapAlphaGpcToCiticoline}
                className={`button small-button ${counterfactuals.swapAlphaGpcToCiticoline ? 'primary' : 'secondary'}`}
                onClick={() => toggleCounterfactual('swapAlphaGpcToCiticoline')}
              >
                {counterfactuals.swapAlphaGpcToCiticoline ? '✓ Swapped: Alpha-GPC → Citicoline' : 'Counterfactual: Alpha-GPC → Citicoline'}
              </button>
              <button
                type="button"
                aria-pressed={counterfactuals.swapMgOxideToThreonate}
                className={`button small-button ${counterfactuals.swapMgOxideToThreonate ? 'primary' : 'secondary'}`}
                onClick={() => toggleCounterfactual('swapMgOxideToThreonate')}
              >
                {counterfactuals.swapMgOxideToThreonate ? '✓ Swapped: Mg Oxide → Mg L-Threonate' : 'Counterfactual: Mg Oxide → L-Threonate'}
              </button>
              <button
                type="button"
                className={`button small-button ${counterfactuals.toggleTelmisartanShield === true ? 'primary' : 'secondary'}`}
                onClick={() => toggleCounterfactual('toggleTelmisartanShield')}
              >
                {counterfactuals.toggleTelmisartanShield === true
                  ? '✓ Telmisartan AT1R Shield Forced ON'
                  : counterfactuals.toggleTelmisartanShield === false
                  ? '✗ Telmisartan Shield Forced OFF'
                  : 'Toggle Telmisartan AT1R Shield'}
              </button>
              <button
                type="button"
                className={`button small-button ${counterfactuals.toggleVosoritide === true ? 'primary' : 'secondary'}`}
                onClick={() => toggleCounterfactual('toggleVosoritide')}
              >
                {counterfactuals.toggleVosoritide === true
                  ? '✓ Vosoritide CNP-38 Forced ON'
                  : counterfactuals.toggleVosoritide === false
                  ? '✗ Vosoritide Forced OFF'
                  : 'Toggle Vosoritide (CNP-38)'}
              </button>
            </div>
          </div>
        </div>

        <div className="cascade-control-row three-col">
          <div className="cascade-control-group" role="group" aria-label="CYP2D6 metabolizer phenotype">
            <span className="cascade-control-label">4. CYP2D6 Pharmacogenomic Phenotype</span>
            <div className="segmented-button-row">
              {CYP2D6_GENOTYPES.map(([gKey, gLabel]) => (
                <button
                  key={gKey}
                  type="button"
                  className={`button small-button ${cyp2d6Genotype === gKey ? 'primary' : 'quiet'}`}
                  onClick={() => setCyp2d6Genotype(gKey)}
                >
                  {gLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="cascade-control-group" role="group" aria-label="Dose exposure multiplier">
            <span className="cascade-control-label">5. Dose &amp; Exposure Scaling</span>
            <div className="segmented-button-row">
              {DOSE_MULTIPLIERS.map(([mult, mLabel]) => (
                <button
                  key={mult}
                  type="button"
                  className={`button small-button ${doseMultiplier === mult ? 'primary' : 'quiet'}`}
                  onClick={() => setDoseMultiplier(mult)}
                >
                  {mLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="cascade-control-group" role="group" aria-label="Epistemic evidence filter">
            <span className="cascade-control-label">6. Epistemic Edge Filter</span>
            <div className="segmented-button-row">
              {EPISTEMIC_FILTERS.map(([fKey, fLabel]) => (
                <button
                  key={fKey}
                  type="button"
                  className={`button small-button ${epistemicFilter === fKey ? 'primary' : 'quiet'}`}
                  onClick={() => setEpistemicFilter(fKey)}
                >
                  {fLabel}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Epistemic & Polarity Visual Encoding Legend */}
      <div className="epistemic-encoding-legend" aria-label="Epistemic edge encoding and mechanistic polarity legend">
        <div className="legend-cluster">
          <span className="legend-heading">Epistemic Evidence Strength (Stroke Pattern):</span>
          {Object.values(EPISTEMIC_TIERS).map((tier) => (
            <span key={tier.id} className="legend-item" title={tier.description}>
              <svg width="28" height="10" aria-hidden="true">
                {(tier.id === 'theoretical_frontier' || tier.id === 'contextual_association') && (
                  <line x1="0" y1="5" x2="28" y2="5" stroke="#94a3b8" strokeWidth="6" strokeOpacity="0.22" />
                )}
                <line
                  x1="0"
                  y1="5"
                  x2="28"
                  y2="5"
                  stroke="#172d40"
                  strokeWidth="2.2"
                  strokeDasharray={tier.strokeDasharray === 'none' ? undefined : tier.strokeDasharray}
                />
              </svg>
              <strong>{tier.shortLabel}</strong>
              <small className="muted">({tier.confidenceRange[0]}–{tier.confidenceRange[1]}%)</small>
            </span>
          ))}
        </div>
        <div className="legend-cluster">
          <span className="legend-heading">Mechanistic Polarity (Terminal Glyph):</span>
          {Object.values(INTERACTION_POLARITIES).map((pol) => (
            <span key={pol.id} className="legend-item">
              <strong style={{ color: pol.color }}>{pol.glyph}</strong>
              <span>{pol.label}</span>
            </span>
          ))}
        </div>
      </div>

      {atlasViewMode === 'atlas_3d' && (
        <KnowledgeAtlas
          items={items}
          suppliedText={suppliedText}
          libraryCompounds={library?.compounds || []}
          initialSelectedCompoundName={activeCompound?.name || ''}
          onSelectCompound={(compoundName) => {
            const matched = cascade.layers.compounds.find(
              (c) =>
                c.name.toLowerCase().includes(String(compoundName).toLowerCase()) ||
                String(compoundName).toLowerCase().includes(c.name.toLowerCase())
            );
            if (matched) {
              handleSelectNode(matched);
            }
          }}
        />
      )}

      {/* 4-Layer Causal Cascade Tree SVG Canvas */}
      <div className="receptor-map-stage causal-cascade-stage">
        {/* Selected Compound Description & Full Passage Controls (Browser Vault Adaptation) */}
        {compoundPassage && (
          <div className="compound-passage-card" aria-live="polite">
            <div className="compound-passage-header">
              <div>
                <span className="microcopy">
                  SELECTED COMPOUND · SUPPLIED DESCRIPTION ({compoundPassage.path})
                </span>
                <h3>
                  {compoundPassage.name}{' '}
                  {activeCompound?.route ? <span className="muted small">· {activeCompound.route}</span> : null}
                </h3>
              </div>
              <div className="inline-actions">
                {!openPassageState ? (
                  <button
                    type="button"
                    className="button primary small-button"
                    onClick={() => handleOpenFullPassage(activeCompound)}
                  >
                    Open full passage
                    <Icon name="arrow" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button primary small-button"
                    onClick={handleReturnToGraphPosition}
                  >
                    Return to same graph position
                  </button>
                )}
              </div>
            </div>

            {/* Compound selector bar synchronized with Level 1 SVG nodes */}
            {cascade.layers.compounds.length > 0 && (
              <div
                className="segmented-button-row"
                style={{ marginTop: '8px', marginBottom: '10px' }}
                role="group"
                aria-label="Select compound to inspect supplied description"
              >
                {cascade.layers.compounds.map((cmp) => {
                  const isCurrent = activeCompound?.id === cmp.id;
                  return (
                    <button
                      key={cmp.id}
                      type="button"
                      className={`button small-button ${isCurrent ? 'primary' : 'secondary'}`}
                      onClick={() => handleSelectNode(cmp)}
                    >
                      {cmp.name}
                    </button>
                  );
                })}
              </div>
            )}

            <p className="compound-supplied-description">{compoundPassage.description}</p>

            {openPassageState && (
              <div
                className="compound-full-passage-panel"
                role="region"
                aria-label={`Full passage for ${openPassageState.passage.name}`}
              >
                <div className="passage-overlay-header">
                  <div>
                    <span className="microcopy">
                      FULL SUPPLIED PASSAGE · LOCKED GRAPH POSITION: NODE ({openPassageState.savedGraphPosition.nodeX},{' '}
                      {openPassageState.savedGraphPosition.nodeY}) · VIEWBOX ({openPassageState.savedGraphPosition.panX},{' '}
                      {openPassageState.savedGraphPosition.panY}, {openPassageState.savedGraphPosition.zoom.toFixed(2)}×)
                    </span>
                    <h4>{openPassageState.passage.name} — Verbatim Note</h4>
                  </div>
                  <button
                    type="button"
                    className="button secondary small-button"
                    onClick={handleReturnToGraphPosition}
                  >
                    Return to same graph position
                  </button>
                </div>
                <div className="passage-overlay-body">
                  <pre className="verbatim-passage-block">{openPassageState.passage.fullPassage}</pre>
                </div>
                <div className="passage-overlay-footer">
                  <span className="microcopy">Source: {openPassageState.passage.source}</span>
                  <button
                    type="button"
                    className="button primary small-button"
                    onClick={handleReturnToGraphPosition}
                  >
                    Return to same graph position
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <svg
          viewBox={svgViewBox}
          role="img"
          aria-label="Four-layer Causal Cascade Tree mapping Compound and Route to Primary Target, Subcellular Mechanism, and Phenotypic Goal"
        >
          <defs>
            <pattern id="cascade-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e8eff3" strokeWidth="0.8" />
            </pattern>
            {/* Arrowhead for Direct Agonism */}
            <marker id="marker-agonist" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#087d7a" />
            </marker>
            {/* Perpendicular T-bar for Insurmountable Antagonism / Channel Blockade */}
            <marker id="marker-antagonist" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <line x1="7" y1="1" x2="7" y2="9" stroke="#1d4ed8" strokeWidth="2.5" />
            </marker>
            {/* Diamond for Selective Partial Agonism / Co-Regulator Recruitment */}
            <marker id="marker-partial_agonist" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto">
              <polygon points="1,5 5,1.5 9,5 5,8.5" fill="#0e7490" />
            </marker>
            {/* Shield Circle for Receptor Shielding */}
            <marker id="marker-shielding_mitigation" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto">
              <circle cx="5" cy="5" r="3.6" fill="#ecfdf5" stroke="#047857" strokeWidth="1.8" />
            </marker>
            {/* Bottleneck Cross for Competitive Metabolic Sink */}
            <marker id="marker-metabolic_bottleneck" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto">
              <circle cx="5" cy="5" r="3.8" fill="#fffbeb" stroke="#b45309" strokeWidth="1.8" />
            </marker>
            {/* Spillover Load Marker */}
            <marker id="marker-spillover_load" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#be123c" />
            </marker>
          </defs>

          <rect width="1150" height="675" fill="url(#cascade-grid)" rx="5" />

          {/* Column Layer Headers */}
          {[
            { x: 125, step: 'LEVEL 1 · INPUT', title: 'Compound & Route' },
            { x: 415, step: 'LEVEL 2 · RECEPTOR / ENZYME', title: 'Primary Molecular Target' },
            { x: 715, step: 'LEVEL 3 · TRANSDUCTION', title: 'Subcellular Mechanism' },
            { x: 1015, step: 'LEVEL 4 · OUTCOME', title: 'Phenotypic Goal & Readout' },
          ].map((col) => (
            <g key={col.step}>
              <rect x={col.x - 110} y="10" width="220" height="36" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
              <text x={col.x} y="25" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#087d7a" letterSpacing="0.6">
                {col.step}
              </text>
              <text x={col.x} y="39" textAnchor="middle" fontSize="10.5" fontWeight="650" fill="#172d40">
                {col.title}
              </text>
            </g>
          ))}

          {/* Causal Cascade Bezier Edges (L1->L2, L2->L3, L3->L4) */}
          {cascade.edges.map((edge, edgeIdx) => {
            const source = nodeById.get(edge.fromId);
            const target = nodeById.get(edge.toId);
            if (!source || !target) return null;

            const x1 = source.x + 110;
            const y1 = source.y;
            const x2 = target.x - 112;
            const y2 = target.y;
            const cx1 = x1 + (x2 - x1) * 0.44;
            const cx2 = x1 + (x2 - x1) * 0.56;
            const pathD = `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;

            const isSelectedEdge = activeEdge?.id === edge.id;
            const isHighlighted = edge.inTrace && edge.passesEpistemicFilter;
            const strokeColor = edge.polaritySpec.color;
            const baseWidth = 1.3 + (edge.fluxScore / 100) * 2.1;
            const strokeWidth = isSelectedEdge ? baseWidth + 1.2 : isHighlighted ? baseWidth : 1.1;
            const opacity = !edge.passesEpistemicFilter ? 0.12 : isSelectedEdge ? 1.0 : edge.inTrace ? 0.88 : 0.24;

            const showUncertaintyHalo =
              edge.passesEpistemicFilter &&
              edge.inTrace &&
              (edge.epistemicTier === 'theoretical_frontier' || edge.epistemicTier === 'contextual_association');

            // Stagger badge position t along the cubic Bezier curve to prevent overlap on crossing edges
            const t = edgeIdx % 3 === 0 ? 0.42 : edgeIdx % 3 === 1 ? 0.58 : 0.50;
            const mt = 1 - t;
            const badgeX = mt * mt * mt * x1 + 3 * mt * mt * t * cx1 + 3 * mt * t * t * cx2 + t * t * t * x2;
            const badgeY = mt * mt * mt * y1 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y2;

            return (
              <g
                key={edge.id}
                onClick={() => setSelectedEdgeId(edge.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Epistemic Uncertainty Envelope for Frontier/Contextual Hypotheses */}
                {showUncertaintyHalo && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth + 6}
                    strokeOpacity="0.14"
                    strokeLinecap="round"
                  />
                )}
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={edge.epistemicSpec.strokeDasharray === 'none' ? undefined : edge.epistemicSpec.strokeDasharray}
                  opacity={opacity}
                  markerEnd={`url(#marker-${edge.interactionType})`}
                />
                {/* Polarity & Flux Micro-Badge on Active Trace Edges */}
                {isHighlighted && (
                  <g transform={`translate(${badgeX}, ${badgeY})`}>
                    <rect
                      x="-21"
                      y="-8"
                      width="42"
                      height="16"
                      rx="3"
                      fill={isSelectedEdge ? '#172d40' : '#ffffff'}
                      stroke={strokeColor}
                      strokeWidth="1"
                      opacity="0.96"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fontSize="8.5"
                      fontWeight="700"
                      fill={isSelectedEdge ? '#ffffff' : strokeColor}
                    >
                      {edge.polaritySpec.glyph} {edge.fluxScore}%
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* LEVEL 1 NODES: Compound & Route */}
          {cascade.layers.compounds.map((cmp) => {
            const isSelected = activeNode?.id === cmp.id;
            const inTrace = cmp.inTrace;
            return (
              <g
                key={cmp.id}
                className="cascade-node-group"
                onClick={() => handleSelectNode(cmp)}
                style={{ cursor: 'pointer' }}
                opacity={inTrace ? 1 : 0.45}
              >
                <rect
                  x={cmp.x - 110}
                  y={cmp.y - 26}
                  width="220"
                  height="52"
                  rx="5"
                  fill={isSelected ? '#0f172a' : '#172d40'}
                  stroke={isSelected ? '#11b6b1' : cmp.isCounterfactualAdded ? '#087d7a' : '#0f172a'}
                  strokeWidth={isSelected ? '2.5' : '1.4'}
                />
                <text x={cmp.x} y={cmp.y - 7} textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="650">
                  {cmp.name}
                </text>
                <text x={cmp.x} y={cmp.y + 7} textAnchor="middle" fill="#cbd5e1" fontSize="8.5">
                  {cmp.route}
                </text>
                <text x={cmp.x} y={cmp.y + 19} textAnchor="middle" fill="#5eead4" fontSize="8.5" fontWeight="600">
                  F {Math.round(cmp.bioavailability * 100)}% · t½ {cmp.halfLifeH}h · {cmp.defaultDose}
                </text>
              </g>
            );
          })}

          {/* LEVEL 2 NODES: Primary Molecular Target */}
          {cascade.layers.targets.map((tgt) => {
            const isSelected = activeNode?.id === tgt.id;
            const fill =
              tgt.state === 'shielded_convergence'
                ? '#ecfdf5'
                : tgt.state === 'bottleneck_warning'
                ? '#fffbeb'
                : tgt.state === 'engaged'
                ? '#f8fafc'
                : '#ffffff';
            const stroke =
              tgt.state === 'shielded_convergence'
                ? '#047857'
                : tgt.state === 'bottleneck_warning'
                ? '#b45309'
                : tgt.state === 'engaged'
                ? '#172d40'
                : '#cbd5e1';

            return (
              <g
                key={tgt.id}
                className="cascade-node-group"
                onClick={() => handleSelectNode(tgt)}
                style={{ cursor: 'pointer' }}
                opacity={tgt.inTrace || tgt.incomingCount > 0 ? 1 : 0.4}
              >
                <rect
                  x={tgt.x - 110}
                  y={tgt.y - 24}
                  width="220"
                  height="48"
                  rx="5"
                  fill={fill}
                  stroke={isSelected ? '#11b6b1' : stroke}
                  strokeWidth={isSelected ? '2.6' : tgt.inTrace ? '1.8' : '1.1'}
                />
                <text x={tgt.x} y={tgt.y - 6} textAnchor="middle" fill="#172d40" fontSize="10.5" fontWeight="650">
                  {tgt.label}
                </text>
                <text x={tgt.x} y={tgt.y + 7} textAnchor="middle" fill="#64748b" fontSize="8.5">
                  {tgt.sublabel}
                </text>
                <text
                  x={tgt.x}
                  y={tgt.y + 19}
                  textAnchor="middle"
                  fill={tgt.state === 'bottleneck_warning' ? '#b45309' : '#087d7a'}
                  fontSize="8.5"
                  fontWeight="650"
                >
                  {tgt.incomingCount > 0 ? `Occupancy ~${tgt.occupancyPct}% (${tgt.incomingCount} input)` : 'Unoccupied (0%)'}
                </text>
              </g>
            );
          })}

          {/* LEVEL 3 NODES: Subcellular Mechanism */}
          {cascade.layers.mechanisms.map((mech) => {
            const isSelected = activeNode?.id === mech.id;
            const tierSpec = EPISTEMIC_TIERS[mech.epistemicTier] || EPISTEMIC_TIERS.supported_mechanistic;
            const fill = mech.isBottleneck ? '#fffbeb' : mech.engaged ? '#f4f9fa' : '#ffffff';
            const stroke = mech.isBottleneck ? '#b45309' : mech.engaged ? '#087d7a' : '#cbd5e1';

            return (
              <g
                key={mech.id}
                className="cascade-node-group"
                onClick={() => handleSelectNode(mech)}
                style={{ cursor: 'pointer' }}
                opacity={mech.inTrace || mech.engaged ? 1 : 0.4}
              >
                <rect
                  x={mech.x - 110}
                  y={mech.y - 24}
                  width="220"
                  height="48"
                  rx="5"
                  fill={fill}
                  stroke={isSelected ? '#172d40' : stroke}
                  strokeWidth={isSelected ? '2.6' : mech.inTrace ? '1.8' : '1.1'}
                  strokeDasharray={tierSpec.strokeDasharray === 'none' ? undefined : tierSpec.strokeDasharray}
                />
                <text x={mech.x} y={mech.y - 6} textAnchor="middle" fill="#172d40" fontSize="9.8" fontWeight="650">
                  {mech.label}
                </text>
                <text x={mech.x} y={mech.y + 7} textAnchor="middle" fill="#475569" fontSize="8">
                  {mech.sublabel.slice(0, 42)}
                </text>
                <text
                  x={mech.x}
                  y={mech.y + 19}
                  textAnchor="middle"
                  fill={mech.isBottleneck ? '#b45309' : '#0f766e'}
                  fontSize="8.5"
                  fontWeight="650"
                >
                  {mech.engaged ? `Cascade Flux ${mech.meanFlux}% · ${tierSpec.shortLabel}` : 'Inactive Pathway'}
                </text>
              </g>
            );
          })}

          {/* LEVEL 4 NODES: Phenotypic Goal & Biomarker Readout */}
          {cascade.layers.phenotypes.map((pheno) => {
            const isSelected = activeNode?.id === pheno.id || (direction === 'backward' && targetGoalId === pheno.id);
            const active = pheno.incomingCount > 0;
            return (
              <g
                key={pheno.id}
                className="cascade-node-group"
                onClick={() => handleSelectNode(pheno)}
                style={{ cursor: 'pointer' }}
                opacity={pheno.inTrace || active ? 1 : 0.48}
              >
                <rect
                  x={pheno.x - 110}
                  y={pheno.y - 28}
                  width="220"
                  height="56"
                  rx="5"
                  fill={isSelected ? '#e6f7f5' : active ? '#f8fafc' : '#ffffff'}
                  stroke={isSelected ? '#087d7a' : active ? '#172d40' : '#cbd5e1'}
                  strokeWidth={isSelected ? '2.8' : pheno.inTrace ? '2.0' : '1.2'}
                />
                <text x={pheno.x} y={pheno.y - 9} textAnchor="middle" fill="#172d40" fontSize="10.2" fontWeight="700">
                  {pheno.label}
                </text>
                <text x={pheno.x} y={pheno.y + 5} textAnchor="middle" fill="#475569" fontSize="8.2">
                  {pheno.biomarker}
                </text>
                <text x={pheno.x} y={pheno.y + 19} textAnchor="middle" fill="#087d7a" fontSize="9" fontWeight="700">
                  {active ? `Net Phenotypic Flux: ${pheno.netScore}%` : '0% Active Drive (Click to trace)'}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Deep Mechanistic Node & Edge Inspector */}
        <div className="receptor-map-inspector cascade-inspector-grid">
          <div className="cascade-inspector-card">
            <div className="receptor-inspector-head">
              <div>
                <span className="microcopy">
                  Selected Causal Edge · Click any curve badge or node in the 4-layer tree to inspect
                </span>
                <h3>
                  {nodeById.get(activeEdge?.fromId)?.name || nodeById.get(activeEdge?.fromId)?.label}{' '}
                  <span style={{ color: activeEdge?.polaritySpec?.color }}>{activeEdge?.polaritySpec?.glyph}</span>{' '}
                  {nodeById.get(activeEdge?.toId)?.label}
                </h3>
              </div>
              {activeEdge && (
                <span className="receptor-state-tag">
                  {activeEdge.epistemicSpec.label} ({activeEdge.confidencePct}% confidence)
                </span>
              )}
            </div>

            {activeEdge ? (
              <div className="cascade-edge-details">
                <p>
                  <strong>Quantitative / Biophysical Basis ({activeEdge.quantitativeMetric}):</strong>{' '}
                  {activeEdge.mechanismNote}
                </p>
                <p className="small" style={{ marginTop: '6px' }}>
                  <strong>Temporal Behavior ({TEMPORAL_PHASES.find(([k]) => k === temporalPhase)?.[1]}):</strong>{' '}
                  {activeEdge.activeTemporalNote}
                </p>
                <p className="microcopy" style={{ marginTop: '6px' }}>
                  <strong>Epistemic Uncertainty &amp; Limitation ({activeEdge.epistemicSpec.uncertaintyLabel}):</strong>{' '}
                  {activeEdge.limitationNote} · <em>Source: {activeEdge.source}</em>
                </p>
              </div>
            ) : (
              <p className="muted small">Select any node or edge to inspect its quantitative parameters and epistemic bounds.</p>
            )}
          </div>

          <div className="cascade-inspector-card">
            <div className="receptor-inspector-head">
              <div>
                <span className="microcopy">
                  {direction === 'backward'
                    ? 'Backward Phenotypic Trace · Upstream Requirements & Missing Candidates'
                    : 'Convergent Synergies & Rate-Limiting Bottlenecks'}
                </span>
                <h3>
                  {direction === 'backward'
                    ? `Goal Trace: ${cascade.layers.phenotypes.find((p) => p.id === targetGoalId)?.label || 'Phenotypic Outcome'}`
                    : `${cascade.synergies.length} Active Synergies · ${cascade.bottlenecks.length} Bottlenecks`}
                </h3>
              </div>
            </div>

            {direction === 'backward' && (
              <div className="backward-trace-summary">
                {(() => {
                  const goalObj = cascade.layers.phenotypes.find((p) => p.id === targetGoalId) || cascade.layers.phenotypes[0];
                  return (
                    <>
                      <p className="small">
                        <strong>Biomarker Target:</strong> {goalObj.biomarker} ·{' '}
                        <strong className="tabular-nums">Current Modeled Drive: {goalObj.netScore}%</strong>
                      </p>
                      {goalObj.missingCandidates?.length > 0 ? (
                        <p className="small" style={{ marginTop: '6px' }}>
                          <strong>Unoccupied Upstream Pathways (Candidate Additions):</strong> Adding{' '}
                          <strong>{goalObj.missingCandidates.join(' or ')}</strong> engages orthogonal L2→L3 pathways feeding this phenotype.
                        </p>
                      ) : (
                        <p className="small" style={{ marginTop: '6px' }}>
                          <strong>Pathway Coverage Complete:</strong> All primary upstream receptor axes for {goalObj.label} are represented in the active stack.
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            <div className="record-list" style={{ marginTop: '8px' }}>
              {cascade.bottlenecks.map((bn) => (
                <div className="record-row" key={bn.id}>
                  <div>
                    <h3 style={{ color: '#b45309' }}>▲ Bottleneck: {bn.title}</h3>
                    <p>{bn.detail}</p>
                    <small className="muted">{bn.remedy}</small>
                  </div>
                </div>
              ))}
              {cascade.synergies.map((syn) => (
                <div className="record-row" key={syn.id}>
                  <div>
                    <h3 style={{ color: '#087d7a' }}>● Convergent Synergy: {syn.title}</h3>
                    <p>{syn.detail}</p>
                    <small className="muted">
                      Epistemic Class: {EPISTEMIC_TIERS[syn.epistemicTier]?.label}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Temporal Pharmacokinetic Overlap & Circadian Mitigation Strip */}
        <div className="cascade-circadian-strip" aria-label="24-hour circadian pharmacokinetic overlap and adaptation schedule">
          <h4>Temporal Pharmacokinetic Overlap &amp; Adaptation Mitigation ({TEMPORAL_PHASES.find(([k]) => k === temporalPhase)?.[1]})</h4>
          <div className="circadian-slot-grid">
            {cascade.circadianSlots.map((slot) => (
              <article className="circadian-slot-card" key={slot.id}>
                <span className="microcopy">{slot.window}</span>
                <strong>{slot.compounds.length ? slot.compounds.join(' + ') : 'No compounds scheduled in this window'}</strong>
                <p className="small muted">{slot.pkDynamics}</p>
                <small className="circadian-mitigation-note">{slot.mitigationRule}</small>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
