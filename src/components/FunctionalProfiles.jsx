import { useState } from 'react';
import { FUNCTIONAL_EFFECT_PROFILES } from '../studioLogic.js';
import { SectionHead } from './ui.jsx';

export default function FunctionalProfiles() {
  const [activeId, setActiveId] = useState(FUNCTIONAL_EFFECT_PROFILES[0].id);
  const [selectedDoseIdx, setSelectedDoseIdx] = useState(2);

  const profile = FUNCTIONAL_EFFECT_PROFILES.find((p) => p.id === activeId) || FUNCTIONAL_EFFECT_PROFILES[0];
  const dosePoint = profile.doseResponsePoints[selectedDoseIdx] || profile.doseResponsePoints[0];

  return (
    <section className="studio-section functional-profiles-section" aria-label="Functional Effect Profiles">
      <SectionHead title="Functional Effect Profiles">
        Receptor occupancy, co-regulator recruitment, and biomarker targets for Telmisartan, Memantine, Endoxifen, and FGFR3/CNP.
      </SectionHead>

      <div className="profile-selector" role="tablist" aria-label="Select compound profile">
        {FUNCTIONAL_EFFECT_PROFILES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={activeId === item.id}
            className={`profile-tab-button ${activeId === item.id ? 'active' : ''}`}
            onClick={() => {
              setActiveId(item.id);
              setSelectedDoseIdx(2);
            }}
          >
            <strong>{item.name}</strong>
            <span>{item.subtitle}</span>
          </button>
        ))}
      </div>

      <article className="profile-detail-panel">
        <header className="profile-detail-header">
          <div>
            <p className="microcopy">{profile.classification}</p>
            <h3>{profile.name} · {profile.subtitle}</h3>
            <p className="profile-summary">{profile.mechanisticSummary}</p>
          </div>
          <div className="profile-meta-readout">
            <div>
              <span>Timing</span>
              <strong>{profile.standardWindow}</strong>
            </div>
            <div>
              <span>Half-life</span>
              <strong className="tabular-nums">{profile.halfLifeH} h</strong>
            </div>
          </div>
        </header>

        <div className="profile-dose-scrubber">
          <div className="inline-between">
            <span className="small">
              <strong>Dose tier</strong>
            </span>
            <div className="dose-step-buttons" role="group" aria-label="Titration dose tiers">
              {profile.doseResponsePoints.map((pt, idx) => {
                const label = pt.doseMg != null ? `${pt.doseMg} mg` : `${pt.doseMcgKg} mcg/kg`;
                return (
                  <button
                    key={label}
                    type="button"
                    className={`button small-button ${selectedDoseIdx === idx ? 'primary' : 'secondary'}`}
                    onClick={() => setSelectedDoseIdx(idx)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="dose-telemetry-grid">
            {profile.id === 'profile-telmisartan' && (
              <>
                <div className="telemetry-cell">
                  <span>AT1R blockade (t½ 213 min)</span>
                  <strong className="tabular-nums">{dosePoint.at1BlockadePct}%</strong>
                </div>
                <div className="telemetry-cell">
                  <span>PPAR-γ activation (PGC-1α)</span>
                  <strong className="tabular-nums">{dosePoint.pparGammaPct}%</strong>
                </div>
              </>
            )}
            {profile.id === 'profile-memantine' && (
              <>
                <div className="telemetry-cell">
                  <span>Extrasynaptic GluN2B block (-70 mV)</span>
                  <strong className="tabular-nums">{dosePoint.extrasynapticBlockPct}%</strong>
                </div>
                <div className="telemetry-cell">
                  <span>Synaptic LTP preserved (-20 mV)</span>
                  <strong className="tabular-nums">{dosePoint.synapticLtpPreservedPct}%</strong>
                </div>
              </>
            )}
            {profile.id === 'profile-endoxifen' && (
              <>
                <div className="telemetry-cell">
                  <span>ERα occupancy (AF-2 H12)</span>
                  <strong className="tabular-nums">{dosePoint.erAlphaOccupancyPct}%</strong>
                </div>
                <div className="telemetry-cell">
                  <span>CYP2D6 variance</span>
                  <strong className="tabular-nums">±{dosePoint.cyp2d6VariancePct}%</strong>
                </div>
              </>
            )}
            {profile.id === 'profile-fgfr3-cnp' && (
              <>
                <div className="telemetry-cell">
                  <span>FGFR3 MAPK inhibition (Ser43)</span>
                  <strong className="tabular-nums">{dosePoint.mapkInhibitionPct}%</strong>
                </div>
                <div className="telemetry-cell">
                  <span>CXM velocity change</span>
                  <strong className="tabular-nums">+{dosePoint.cxmVelocityPct}%</strong>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="profile-columns">
          <div>
            <h4>Signaling pathways</h4>
            <div className="record-list">
              {profile.pathways.map((pw) => (
                <div className="record-row profile-pathway-row" key={pw.axis}>
                  <div>
                    <h3>{pw.axis} · <span className="muted">{pw.target}</span></h3>
                    <p>{pw.effect}</p>
                    <p className="small muted tabular-nums" style={{ marginTop: '4px' }}>{pw.kinetics}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4>Biomarker targets</h4>
            <div className="record-list">
              {profile.biomarkerTargets.map((bm) => (
                <div className="record-row" key={bm.marker}>
                  <div>
                    <h3>{bm.marker}</h3>
                    <p>{bm.rationale}</p>
                  </div>
                  <strong className="tabular-nums">{bm.target}</strong>
                </div>
              ))}
            </div>
            <p className="microcopy" style={{ marginTop: '16px' }}>
              Source: {profile.source}
            </p>
          </div>
        </div>
      </article>
    </section>
  );
}
