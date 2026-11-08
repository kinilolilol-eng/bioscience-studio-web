import { useEffect, useRef, useState } from 'react';
import { createBrowserVaultApp, resolveCompoundPassage } from '../atlas/browserVault.ts';
import { intelligibilityPaths } from '../atlas/discovery.ts';
import { AtlasReviewLedger } from '../atlas/ledger.ts';
import { selectionFor } from '../atlas/logic.ts';
import { buildAtlasModel } from '../atlas/model.ts';
import { AtlasRenderer } from '../atlas/renderer.ts';
import { applyProposalReviews } from '../atlas/review.ts';
import { Icon } from './ui.jsx';

export default function KnowledgeAtlas({
  items = [],
  suppliedText = '',
  libraryCompounds = [],
  initialSelectedCompoundName = '',
  onSelectCompound,
}) {
  const stageRef = useRef(null);
  const rendererRef = useRef(null);
  const appRef = useRef(null);
  const ledgerRef = useRef(null);

  const [model, setModel] = useState(null);
  const [mode, setMode] = useState('atlas');
  const [activeTopics, setActiveTopics] = useState(() => new Set());
  const [selectedId, setSelectedId] = useState(null);
  const [selectedProposalId, setSelectedProposalId] = useState(null);
  const [selectedGapId, setSelectedGapId] = useState(null);
  const [selectedPatternId, setSelectedPatternId] = useState(null);
  const [selectedPathId, setSelectedPathId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoverInfo, setHoverInfo] = useState(null);
  const [fullPassageState, setFullPassageState] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  // Build browser-adapted Atlas model from BrowserVaultApp
  useEffect(() => {
    let cancelled = false;
    async function initAtlas() {
      const app = createBrowserVaultApp({
        suppliedText,
        libraryCompounds,
      });
      const ledger = new AtlasReviewLedger(app);
      await ledger.load();
      const rawModel = await buildAtlasModel(app);
      const proposals = applyProposalReviews(rawModel.proposals, [...ledger.allEvents()]);
      const dismissed = new Set(proposals.filter((p) => p.reviewStatus === 'dismissed').map((p) => p.id));
      const hydrated = {
        ...rawModel,
        proposals,
        bridges: rawModel.bridges.filter((b) => !dismissed.has(b.id)),
        voids: rawModel.voids.filter((v) => !dismissed.has(v.id)),
      };
      if (cancelled) return;
      appRef.current = app;
      ledgerRef.current = ledger;
      setModel(hydrated);
      setActiveTopics(new Set(hydrated.topics.map((t) => t.id)));

      // Match initial compound if present
      const targetName = (initialSelectedCompoundName || items[0]?.name || '').toLowerCase();
      const initialNode =
        hydrated.nodes.find((n) => targetName && n.title.toLowerCase().includes(targetName)) ||
        hydrated.nodes[0] ||
        null;
      if (initialNode) {
        setSelectedId(initialNode.id);
      }
    }
    initAtlas();
    return () => {
      cancelled = true;
    };
  }, [suppliedText, libraryCompounds, initialSelectedCompoundName, items]);

  // Mount Three.js AtlasRenderer
  useEffect(() => {
    if (!stageRef.current || !model) return undefined;
    const container = stageRef.current;
    container.innerHTML = '';
    const renderer = new AtlasRenderer(container, {
      onSelect: (nodeId) => {
        setSelectedProposalId(null);
        setSelectedGapId(null);
        setSelectedPathId(null);
        setSelectedId(nodeId);
        if (nodeId && onSelectCompound) {
          const found = model.nodes.find((n) => n.id === nodeId);
          if (found) onSelectCompound(found.title);
        }
      },
      onInsight: (kind, id) => {
        setSelectedId(null);
        if (kind === 'bridge') {
          setSelectedProposalId(id);
          setSelectedGapId(null);
        } else {
          setSelectedGapId(id);
          setSelectedProposalId(null);
        }
      },
      onHover: (nodeId, point) => {
        if (!nodeId || !point) {
          setHoverInfo(null);
          return;
        }
        const node = model.nodes.find((n) => n.id === nodeId);
        if (node) setHoverInfo({ node, point });
      },
      onOpen: (nodeId) => {
        handleOpenFullPassage(nodeId);
      },
    });
    renderer.setModel(model);
    rendererRef.current = renderer;

    if (selectedId) {
      const sel = selectionFor(model, selectedId);
      renderer.setSelection(sel);
    }

    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  // Sync selection & lens state to renderer when not restoring from full passage
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !model || fullPassageState) return;
    if (selectedId) {
      const sel = selectionFor(model, selectedId);
      renderer.setSelection(sel, true);
    } else {
      renderer.setSelection(null, false);
    }
  }, [selectedId, model, fullPassageState]);

  function handleSelectNode(nodeId) {
    setSelectedProposalId(null);
    setSelectedGapId(null);
    setSelectedPathId(null);
    setSelectedId(nodeId);
    const renderer = rendererRef.current;
    if (renderer && model) {
      renderer.setFocusedProposal(null);
      renderer.setFocusedGap(null);
      renderer.setPath(null);
      if (nodeId) {
        const sel = selectionFor(model, nodeId);
        renderer.setSelection(sel, true);
        const found = model.nodes.find((n) => n.id === nodeId);
        if (found && onSelectCompound) onSelectCompound(found.title);
      } else {
        renderer.setSelection(null, false);
      }
    }
  }

  async function handleOpenFullPassage(nodeId) {
    if (!model || !appRef.current) return;
    const node = model.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const renderer = rendererRef.current;
    const cameraState = renderer ? renderer.getCameraState() : { position: { x: 0, y: 26, z: 74 }, target: { x: 0, y: 0, z: 0 } };
    const file = appRef.current.vault.getAbstractFileByPath(node.path);
    const rawContent = file ? await appRef.current.vault.cachedRead(file) : node.meaningRef || node.analysisText;
    const passageRecord = resolveCompoundPassage(
      { name: node.title },
      { suppliedText, libraryCompounds }
    );

    setFullPassageState({
      nodeId: node.id,
      title: node.title,
      topic: node.topic,
      category: node.category,
      path: node.path,
      description: node.excerpt,
      fullPassage: rawContent || passageRecord.fullPassage,
      source: passageRecord.source,
      cameraState,
      mode,
      activeTopics: new Set(activeTopics),
      selectedPathId,
    });
  }

  function handleReturnToGraph() {
    if (!fullPassageState) return;
    const saved = fullPassageState;
    setFullPassageState(null);
    setMode(saved.mode);
    setActiveTopics(saved.activeTopics);
    setSelectedId(saved.nodeId);
    setSelectedPathId(saved.selectedPathId);

    const renderer = rendererRef.current;
    if (renderer && model) {
      renderer.setMode(saved.mode);
      renderer.setActiveTopics(saved.activeTopics);
      const sel = selectionFor(model, saved.nodeId);
      renderer.setSelection(sel, false);
      renderer.setCameraState(saved.cameraState);
    }
  }

  async function handleBrowserFileUpload(event) {
    const fileList = Array.from(event.target.files || []);
    if (!fileList.length || !appRef.current) return;
    let importedCount = 0;
    for (const file of fileList) {
      const text = await file.text();
      const relativePath = file.webkitRelativePath || `Browser Vault/Concept Graph/Compounds/${file.name.endsWith('.md') ? file.name : `${file.name}.md`}`;
      appRef.current.vault.upsertFile(relativePath, text);
      importedCount += 1;
    }
    const rebuilt = await buildAtlasModel(appRef.current);
    setModel(rebuilt);
    setActiveTopics(new Set(rebuilt.topics.map((t) => t.id)));
    if (rebuilt.nodes[0]) setSelectedId(rebuilt.nodes[0].id);
    setUploadStatus(`Loaded ${importedCount} browser note(s) into the Concept Graph.`);
  }

  const selectedNode = model?.nodes.find((n) => n.id === selectedId) || null;
  const selection = model && selectedNode ? selectionFor(model, selectedNode.id) : null;
  const paths = model && selectedNode ? intelligibilityPaths(model, selectedNode.id).slice(0, 3) : [];

  const searchMatches =
    model && searchQuery.trim()
      ? model.nodes
          .filter((n) => `${n.title} ${n.topic} ${n.category} ${n.excerpt}`.toLowerCase().includes(searchQuery.trim().toLowerCase()))
          .slice(0, 6)
      : [];

  return (
    <div className="browser-atlas-shell" aria-label="Browser-adapted Personal Knowledge Atlas">
      <div className="browser-atlas-toolbar">
        <div>
          <span className="microcopy">BROWSER CONCEPT GRAPH · ADAPTED FROM OBSIDIAN PERSONAL KNOWLEDGE ATLAS</span>
          <h3>Spatial Compound &amp; Mechanism Atlas ({model?.nodes.length || 0} compound notes · {model?.edges.length || 0} declared links)</h3>
        </div>
        <div className="inline-actions">
          <label className="button secondary small-button" style={{ cursor: 'pointer' }}>
            Load .md / .txt notes from browser
            <input
              type="file"
              accept=".md,.txt,text/markdown,text/plain"
              multiple
              style={{ display: 'none' }}
              onChange={handleBrowserFileUpload}
            />
          </label>
          <button
            type="button"
            className="button quiet small-button"
            onClick={() => {
              setFullPassageState(null);
              handleSelectNode(null);
              rendererRef.current?.frameAll();
            }}
          >
            Frame full atlas
          </button>
        </div>
      </div>

      {uploadStatus && <p className="small" style={{ color: 'var(--teal-dark)', marginBottom: '8px' }}>{uploadStatus}</p>}

      {/* Quick Compound Selector Bar */}
      {model && (
        <div className="segmented-button-row" style={{ marginBottom: '12px' }} role="group" aria-label="Select compound in Knowledge Atlas">
          {model.nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              className={`button small-button ${selectedId === node.id ? 'primary' : 'secondary'}`}
              onClick={() => handleSelectNode(node.id)}
            >
              {node.title}
            </button>
          ))}
        </div>
      )}

      <div className="browser-atlas-workspace">
        {/* 3D Canvas Stage */}
        <div className="browser-atlas-stage-wrap">
          <div className="browser-atlas-stage-controls">
            <input
              type="search"
              placeholder="Find a compound or idea…"
              aria-label="Find a compound or idea"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="browser-atlas-search-input"
            />
            <div className="segmented-button-row">
              {[
                ['atlas', 'Atlas'],
                ['bridges', 'Bridges'],
                ['gaps', 'Gaps'],
                ['patterns', 'Patterns'],
              ].map(([mKey, mLabel]) => (
                <button
                  key={mKey}
                  type="button"
                  className={`button small-button ${mode === mKey ? 'primary' : 'quiet'}`}
                  onClick={() => {
                    setMode(mKey);
                    rendererRef.current?.setMode(mKey);
                    if (mKey === 'patterns' && model?.patterns.length) {
                      setSelectedPatternId(model.patterns[0].id);
                      rendererRef.current?.setPattern(model.patterns[0].id);
                    }
                  }}
                >
                  {mLabel}
                </button>
              ))}
            </div>
          </div>

          {searchMatches.length > 0 && (
            <div className="browser-atlas-search-dropdown" role="listbox">
              {searchMatches.map((match) => (
                <button
                  key={match.id}
                  type="button"
                  className="text-button"
                  onClick={() => {
                    handleSelectNode(match.id);
                    setSearchQuery('');
                  }}
                >
                  <strong>{match.title}</strong> <span className="muted small">({match.topic})</span>
                </button>
              ))}
            </div>
          )}

          <div ref={stageRef} className="browser-atlas-canvas-host" />

          {hoverInfo && !fullPassageState && (
            <div className="browser-atlas-hover-pill">
              <strong>{hoverInfo.node.title}</strong> · <span>{hoverInfo.node.topic} · L{hoverInfo.node.depth}</span>
            </div>
          )}

          {/* Full Passage Overlay inside the Atlas (preserves underlying 3D camera & selection state) */}
          {fullPassageState && (
            <div className="browser-atlas-passage-overlay" role="dialog" aria-label={`Full passage for ${fullPassageState.title}`}>
              <div className="passage-overlay-header">
                <div>
                  <span className="microcopy">
                    BROWSER VAULT NOTE · {fullPassageState.path} · SAVED CAMERA ({fullPassageState.cameraState.position.x.toFixed(1)}, {fullPassageState.cameraState.position.y.toFixed(1)}, {fullPassageState.cameraState.position.z.toFixed(1)})
                  </span>
                  <h3>{fullPassageState.title} — Full Supplied Passage</h3>
                </div>
                <button type="button" className="button primary small-button" onClick={handleReturnToGraph}>
                  Return to same graph position
                </button>
              </div>
              <div className="passage-overlay-body">
                <pre className="verbatim-passage-block">{fullPassageState.fullPassage}</pre>
              </div>
              <div className="passage-overlay-footer">
                <span className="microcopy">Wording preserved verbatim from your supplied text · Source: {fullPassageState.source}</span>
                <button type="button" className="button secondary small-button" onClick={handleReturnToGraph}>
                  Return to same graph position
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bounded Elucidation Card */}
        <aside className="browser-atlas-card" aria-live="polite">
          {selectedNode && selection ? (
            <div>
              <div className="inline-between">
                <span className="microcopy">{selectedNode.topic} · {selectedNode.category} · Layer {selectedNode.depth}</span>
                <span className="status status-due">{selection.ancestorIds.size} foundations traced</span>
              </div>
              <h3 style={{ fontSize: '18px', marginTop: '6px' }}>{selectedNode.title}</h3>
              <p className="small" style={{ marginTop: '8px', color: '#172d40' }}>
                {selectedNode.excerpt}
              </p>

              <div className="inline-actions" style={{ marginTop: '14px' }}>
                <button
                  type="button"
                  className="button primary small-button"
                  onClick={() => handleOpenFullPassage(selectedNode.id)}
                >
                  Open full passage
                  <Icon name="arrow" />
                </button>
                {fullPassageState && (
                  <button
                    type="button"
                    className="button secondary small-button"
                    onClick={handleReturnToGraph}
                  >
                    Return to same graph position
                  </button>
                )}
              </div>

              {selection.directFoundationIds.size > 0 && (
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
                  <span className="microcopy">BUILDS DIRECTLY ON ({selection.directFoundationIds.size})</span>
                  <div className="segmented-button-row" style={{ marginTop: '6px' }}>
                    {[...selection.directFoundationIds].map((id) => {
                      const n = model.nodes.find((cand) => cand.id === id);
                      if (!n) return null;
                      return (
                        <button key={id} type="button" className="button quiet small-button" onClick={() => handleSelectNode(id)}>
                          {n.title} (L{n.depth})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selection.directNextIds.size > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
                  <span className="microcopy">OPENS NEXT ({selection.directNextIds.size})</span>
                  <div className="segmented-button-row" style={{ marginTop: '6px' }}>
                    {[...selection.directNextIds].map((id) => {
                      const n = model.nodes.find((cand) => cand.id === id);
                      if (!n) return null;
                      return (
                        <button key={id} type="button" className="button quiet small-button" onClick={() => handleSelectNode(id)}>
                          {n.title} (L{n.depth})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {paths.length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
                  <span className="microcopy">WAYS THROUGH THIS IDEA</span>
                  <div className="record-list" style={{ marginTop: '6px' }}>
                    {paths.map((p) => (
                      <div className="record-row" key={p.id} style={{ padding: '8px 0' }}>
                        <div>
                          <h3>{p.label}</h3>
                          <p>
                            {p.nodeIds.map((nid) => model.nodes.find((n) => n.id === nid)?.title || nid).join(' → ')}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => {
                            const nextPathId = selectedPathId === p.id ? null : p.id;
                            setSelectedPathId(nextPathId);
                            rendererRef.current?.setPath(nextPathId ? p.nodeIds : null);
                          }}
                        >
                          {selectedPathId === p.id ? 'Clear path' : 'Trace path'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="muted small">Select any compound node in the 3D Atlas or top selector bar to read its supplied description and open the full passage.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
