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
  ['acute_d1_5', 'Days 1 to 5 (Acute)'],
  ['subacute_d6_13', 'Days 6 to 13 (Subacute)'],
  ['chronic_d14_plus', 'Day 14+ (Steady state)'],
];

const CYP2D6_GENOTYPES = [
  ['extensive', '*1/*1 Extensive (100%)'],
  ['intermediate', '*1/*4 Intermediate (58%)'],
  ['poor', '*4/*4 Poor (18%)'],
];

const DOSE_MULTIPLIERS = [
  [0.5, '0.5x Low'],
  [1.0, '1.0x Standard'],
  [1.5, '1.5x High'],
  [2.0, '2.0x Supraphysiological'],
];

const EPISTEMIC_FILTERS = [
  ['all', 'All tiers'],
  ['quantitative_only', 'Quantitative PK/PD'],
  ['established_and_supported', 'Quantitative + Supported'],
  ['frontier_highlight', 'Frontier & Contextual'],
];

export default function ReceptorMap({
  items = [],
  suppliedText = '',
  library = null,
  title = 'Causal Cascade Graph',
  subtitle = 'Four-layer trace from compound and route to molecular target, subcellular pathway, and phenotypic outcome.',
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
      setExportStatus("Image card ('bioscience-stack-receptor-map.png') downloaded.");
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
            {atlasViewMode === 'atlas_3d' ? 'Cascade graph' : '3D Knowledge Atlas'}
          </button>
          {hasActiveCounterfactual && (
            <button type="button" className="button quiet small-button" onClick={resetCounterfactuals}>
              Reset parameters
            </button>
          )}
          <button type="button" className="button secondary small-button" onClick={handleExportCard} disabled={exporting}>
            <Icon name="download" />
            {exporting ? 'Exporting…' : 'Export PNG'}
          </button>
        </div>
      </div>

      <Notice kind="success">{exportStatus}</Notice>
      <Notice>{exportError}</Notice>

      <div className="cascade-telemetry-strip" aria-label="Systems pharmacology summary metrics">
        <div className="telemetry-cell">
          <span>Trace mode</span>
          <strong>{direction === 'forward' ? 'Forward (Compound to Outcome)' : 'Backward (Outcome to Compound)'}</strong>
        </div>
        <div className="telemetry-cell">
          <span>Mean pathway flux</span>
          <strong className="tabular-nums">{cascade.summaryMetrics.meanFlux}% ({cascade.summaryMetrics.engagedTargetCount}/8 targets)</strong>
        </div>
        <div className="telemetry-cell">
          <span>Evidence confidence</span>
          <strong className="tabular-nums">{cascade.summaryMetrics.meanConfidence}% ({cascade.edges.length} edges)</strong>
        </div>
        <div className="telemetry-cell">
          <span>Synergies &amp; bottlenecks</span>
          <strong className="tabular-nums">
            {cascade.summaryMetrics.activeSynergyCount} synergies · {cascade.summaryMetrics.activeBottleneckCount} bottlenecks
          </strong>
        </div>
      </div>

      <div className="cascade-control-console">
        <div className="cascade-control-row">
          <div className="cascade-control-group" role="group" aria-label="Bidirectional causal exploration mode">
            <span className="cascade-control-label">Trace direction</span>
            <div className="segmented-button-row">
              <button
                type="button"
                className={`button small-button ${direction === 'forward' ? 'primary' : 'secondary'}`}
                onClick={() => {
                  setDirection('forward');
                  setSelectedNodeId(cascade.layers.compounds[0]?.id || null);
                }}
              >
                Forward
              </button>
              <button
                type="button"
                className={`button small-button ${direction === 'backward' ? 'primary' : 'secondary'}`}
                onClick={() => {
                  setDirection('backward');
                  setSelectedNodeId(targetGoalId);
                }}
              >
                Backward
              </button>
            </div>
          </div>

          <div className="cascade-control-group" role="group" aria-label="Temporal interaction and adaptation phase">
            <span className="cascade-control-label">Adaptation window</span>
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
            <span className="cascade-control-label">Target outcome</span>
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
                  {goal.label} ({goal.netScore}%)
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="cascade-control-row">
          <div className="cascade-control-group" role="group" aria-label="Counterfactual stack perturbations">
            <span className="cascade-control-label">Counterfactual swaps</span>
            <div className="segmented-button-row">
              <button
                type="button"
                aria-pressed={counterfactuals.swapTamoxifenToEndoxifen}
                className={`button small-button ${counterfactuals.swapTamoxifenToEndoxifen ? 'primary' : 'secondary'}`}
                onClick={() => toggleCounterfactual('swapTamoxifenToEndoxifen')}
              >
                {counterfactuals.swapTamoxifenToEndoxifen ? 'Tamoxifen to Endoxifen (Active)' : 'Tamoxifen to Endoxifen'}
              </button>
              <button
                type="button"
                aria-pressed={counterfactuals.swapAlphaGpcToCiticoline}
                className={`button small-button ${counterfactuals.swapAlphaGpcToCiticoline ? 'primary' : 'secondary'}`}
                onClick={() => toggleCounterfactual('swapAlphaGpcToCiticoline')}
              >
                {counterfactuals.swapAlphaGpcToCiticoline ? 'Alpha-GPC to Citicoline (Active)' : 'Alpha-GPC to Citicoline'}
              </button>
              <button
                type="button"
                aria-pressed={counterfactuals.swapMgOxideToThreonate}
                className={`button small-button ${counterfactuals.swapMgOxideToThreonate ? 'primary' : 'secondary'}`}
                onClick={() => toggleCounterfactual('swapMgOxideToThreonate')}
              >
                {counterfactuals.swapMgOxideToThreonate ? 'Mg Oxide to L-Threonate (Active)' : 'Mg Oxide to L-Threonate'}
              </button>
              <button
                type="button"
                className={`button small-button ${counterfactuals.toggleTelmisartanShield === true ? 'primary' : 'secondary'}`}
                onClick={() => toggleCounterfactual('toggleTelmisartanShield')}
              >
                {counterfactuals.toggleTelmisartanShield === true
                  ? 'Telmisartan AT1R: On'
                  : counterfactuals.toggleTelmisartanShield === false
                  ? 'Telmisartan AT1R: Off'
                  : 'Telmisartan AT1R: Auto'}
              </button>
              <button
                type="button"
                className={`button small-button ${counterfactuals.toggleVosoritide === true ? 'primary' : 'secondary'}`}
                onClick={() => toggleCounterfactual('toggleVosoritide')}
              >
                {counterfactuals.toggleVosoritide === true
                  ? 'Vosoritide: On'
                  : counterfactuals.toggleVosoritide === false
                  ? 'Vosoritide: Off'
                  : 'Vosoritide: Auto'}
              </button>
            </div>
          </div>
        </div>

        <div className="cascade-control-row three-col">
          <div className="cascade-control-group" role="group" aria-label="CYP2D6 metabolizer phenotype">
            <span className="cascade-control-label">CYP2D6 phenotype</span>
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
            <span className="cascade-control-label">Dose scaling</span>
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
            <span className="cascade-control-label">Evidence filter</span>
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

      <div className="epistemic-encoding-legend" aria-label="Epistemic edge encoding and mechanistic polarity legend">
        <div className="legend-cluster">
          <span className="legend-heading">Evidence tier:</span>
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
              <span className="muted small">({tier.confidenceRange[0]} to {tier.confidenceRange[1]}%)</span>
            </span>
          ))}
        </div>
        <div className="legend-cluster">
          <span className="legend-heading">Polarity:</span>
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

      <div className="receptor-map-stage causal-cascade-stage">
        {compoundPassage && (
          <div className="compound-passage-card" aria-live="polite">
            <div className="compound-passage-header">
              <div>
                <span className="microcopy">
                  Compound note ({compoundPassage.path})
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
                    Return to graph
                  </button>
                )}
              </div>
            </div>

            {cascade.layers.compounds.length > 0 && (
              <div
                className="segmented-button-row"
                style={{ marginTop: '8px', marginBottom: '8px' }}
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
                      Source: {openPassageState.passage.source}
                    </span>
                    <h4>{openPassageState.passage.name}</h4>
                  </div>
                  <button
                    type="button"
                    className="button secondary small-button"
                    onClick={handleReturnToGraphPosition}
                  >
                    Return to graph
                  </button>
                </div>
                <div className="passage-overlay-body">
                  <pre className="verbatim-passage-block">{openPassageState.passage.fullPassage}</pre>
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
            <marker id="marker-agonist" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#087d7a" />
            </marker>
            <marker id="marker-antagonist" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <line x1="7" y1="1" x2="7" y2="9" stroke="#1d4ed8" strokeWidth="2.5" />
            </marker>
            <marker id="marker-partial_agonist" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto">
              <polygon points="1,5 5,1.5 9,5 5,8.5" fill="#0e7490" />
            </marker>
            <marker id="marker-shielding_mitigation" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto">
              <circle cx="5" cy="5" r="3.6" fill="#ecfdf5" stroke="#047857" strokeWidth="1.8" />
            </marker>
            <marker id="marker-metabolic_bottleneck" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto">
              <circle cx="5" cy="5" r="3.8" fill="#fffbeb" stroke="#b45309" strokeWidth="1.8" />
            </marker>
            <marker id="marker-spillover_load" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#be123c" />
            </marker>
          </defs>

          <rect width="1150" height="675" fill="url(#cascade-grid)" rx="5" />

          {[
            { x: 125, step: 'LEVEL 1 · INPUT', title: 'Compound & Route' },
            { x: 415, step: 'LEVEL 2 · TARGET', title: 'Primary Molecular Target' },
            { x: 715, step: 'LEVEL 3 · PATHWAY', title: 'Subcellular Mechanism' },
            { x: 1015, step: 'LEVEL 4 · OUTCOME', title: 'Phenotypic Goal' },
          ].map((col) => (
            <g key={col.step}>
              <rect x={col.x - 110} y="10" width="220" height="36" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
              <text x={col.x} y="25" textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#087d7a" letterSpacing="0.6">
                {col.step}
              </text>
              <text x={col.x} y="39" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#172d40">
                {col.title}
              </text>
            </g>
          ))}

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
                      fontWeight="600"
                      fill={isSelectedEdge ? '#ffffff' : strokeColor}
                    >
                      {edge.polaritySpec.glyph} {edge.fluxScore}%
                    </text>
                  </g>
                )}
              </g>
            );
          })}

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
                <text x={cmp.x} y={cmp.y - 7} textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600">
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
                <text x={tgt.x} y={tgt.y - 6} textAnchor="middle" fill="#172d40" fontSize="10.5" fontWeight="600">
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
                  fontWeight="600"
                >
                  {tgt.incomingCount > 0 ? `Occupancy ~${tgt.occupancyPct}% (${tgt.incomingCount} input)` : 'Unoccupied (0%)'}
                </text>
              </g>
            );
          })}

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
                <text x={mech.x} y={mech.y - 6} textAnchor="middle" fill="#172d40" fontSize="9.8" fontWeight="600">
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
                  fontWeight="600"
                >
                  {mech.engaged ? `Flux ${mech.meanFlux}% · ${tierSpec.shortLabel}` : 'Inactive'}
                </text>
              </g>
            );
          })}

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
                <text x={pheno.x} y={pheno.y - 9} textAnchor="middle" fill="#172d40" fontSize="10.2" fontWeight="600">
                  {pheno.label}
                </text>
                <text x={pheno.x} y={pheno.y + 5} textAnchor="middle" fill="#475569" fontSize="8.2">
                  {pheno.biomarker}
                </text>
                <text x={pheno.x} y={pheno.y + 19} textAnchor="middle" fill="#087d7a" fontSize="9" fontWeight="600">
                  {active ? `Net flux: ${pheno.netScore}%` : '0% drive'}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="receptor-map-inspector cascade-inspector-grid">
          <div className="cascade-inspector-card">
            <div className="receptor-inspector-head">
              <div>
                <span className="microcopy">Selected edge</span>
                <h3>
                  {nodeById.get(activeEdge?.fromId)?.name || nodeById.get(activeEdge?.fromId)?.label}{' '}
                  <span style={{ color: activeEdge?.polaritySpec?.color }}>{activeEdge?.polaritySpec?.glyph}</span>{' '}
                  {nodeById.get(activeEdge?.toId)?.label}
                </h3>
              </div>
              {activeEdge && (
                <span className="receptor-state-tag">
                  {activeEdge.epistemicSpec.label} ({activeEdge.confidencePct}%)
                </span>
              )}
            </div>

            {activeEdge ? (
              <ul className="compact-list cascade-edge-details" style={{ margin: '8px 0 0', paddingLeft: '16px' }}>
                <li>
                  <strong>Metric ({activeEdge.quantitativeMetric}):</strong> {activeEdge.mechanismNote}
                </li>
                <li style={{ marginTop: '4px' }}>
                  <strong>Window ({TEMPORAL_PHASES.find(([k]) => k === temporalPhase)?.[1]}):</strong> {activeEdge.activeTemporalNote}
                </li>
                <li style={{ marginTop: '4px' }}>
                  <strong>Bounds ({activeEdge.epistemicSpec.uncertaintyLabel}):</strong> {activeEdge.limitationNote} · Source: {activeEdge.source}
                </li>
              </ul>
            ) : (
              <p className="muted small">Select a node or edge to view parameters.</p>
            )}
          </div>

          <div className="cascade-inspector-card">
            <div className="receptor-inspector-head">
              <div>
                <span className="microcopy">
                  {direction === 'backward' ? 'Backward trace' : 'Pathway interactions'}
                </span>
                <h3>
                  {direction === 'backward'
                    ? cascade.layers.phenotypes.find((p) => p.id === targetGoalId)?.label || 'Outcome'
                    : `${cascade.synergies.length} synergies · ${cascade.bottlenecks.length} bottlenecks`}
                </h3>
              </div>
            </div>

            {direction === 'backward' && (
              <div className="backward-trace-summary">
                {(() => {
                  const goalObj = cascade.layers.phenotypes.find((p) => p.id === targetGoalId) || cascade.layers.phenotypes[0];
                  return (
                    <ul className="compact-list" style={{ margin: '8px 0 0', paddingLeft: '16px' }}>
                      <li className="small">
                        <strong>Biomarker:</strong> {goalObj.biomarker} · <strong className="tabular-nums">Drive: {goalObj.netScore}%</strong>
                      </li>
                      <li className="small" style={{ marginTop: '4px' }}>
                        {goalObj.missingCandidates?.length > 0 ? (
                          <>
                            <strong>Unoccupied pathways:</strong> {goalObj.missingCandidates.join(', ')}
                          </>
                        ) : (
                          <>
                            <strong>Coverage:</strong> Primary upstream receptor axes active.
                          </>
                        )}
                      </li>
                    </ul>
                  );
                })()}
              </div>
            )}

            <div className="record-list" style={{ marginTop: '8px' }}>
              {cascade.bottlenecks.map((bn) => (
                <div className="record-row" key={bn.id}>
                  <div>
                    <h3 style={{ color: '#b45309' }}>Bottleneck: {bn.title}</h3>
                    <p>{bn.detail}</p>
                    <p className="small muted" style={{ marginTop: '4px' }}>{bn.remedy}</p>
                  </div>
                </div>
              ))}
              {cascade.synergies.map((syn) => (
                <div className="record-row" key={syn.id}>
                  <div>
                    <h3 style={{ color: '#087d7a' }}>Synergy: {syn.title}</h3>
                    <p>{syn.detail}</p>
                    <p className="small muted" style={{ marginTop: '4px' }}>
                      {EPISTEMIC_TIERS[syn.epistemicTier]?.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cascade-circadian-strip" aria-label="24-hour circadian pharmacokinetic overlap and adaptation schedule">
          <h4>Circadian window ({TEMPORAL_PHASES.find(([k]) => k === temporalPhase)?.[1]})</h4>
          <div className="circadian-slot-grid">
            {cascade.circadianSlots.map((slot) => (
              <article className="circadian-slot-card" key={slot.id}>
                <span className="microcopy">{slot.window}</span>
                <strong>{slot.compounds.length ? slot.compounds.join(' + ') : 'No compounds scheduled'}</strong>
                <p className="small muted">{slot.pkDynamics}</p>
                <p className="small circadian-mitigation-note" style={{ marginTop: '4px' }}>{slot.mitigationRule}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
