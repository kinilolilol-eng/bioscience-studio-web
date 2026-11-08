import { useEffect, useState } from 'react';
import { request } from '../api.js';
import { Empty, Input, Loading, Notice, SectionHead, Select, Status, Tabs } from '../components/ui.jsx';

export default function Models({ owner }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [domain, setDomain] = useState('all');

  // Reconstitution & Unit-Mapping Calculator state (closed-form C = m/V, V_draw = D/C, U-100 units)
  const [vialMassMg, setVialMassMg] = useState('10');
  const [diluentMl, setDiluentMl] = useState('2');
  const [targetDoseMcg, setTargetDoseMcg] = useState('250');
  const [activeFraction, setActiveFraction] = useState('1.0');

  useEffect(() => {
    if (!owner) return undefined;
    const controller = new AbortController();
    setError('');
    request('/models/theoretical', { signal: controller.signal })
      .then((res) => { if (!controller.signal.aborted) setData(res); })
      .catch((cause) => { if (cause.name !== 'AbortError') setError(cause.message); });
    return () => controller.abort();
  }, [owner]);

  const mass = parseFloat(vialMassMg) || 0;
  const vol = parseFloat(diluentMl) || 0;
  const doseMcg = parseFloat(targetDoseMcg) || 0;
  const fraction = parseFloat(activeFraction) || 1;
  const concMgMl = vol > 0 ? (mass * fraction) / vol : 0;
  const concMcgMl = concMgMl * 1000;
  const drawMl = concMcgMl > 0 ? doseMcg / concMcgMl : 0;
  const u100Units = drawMl * 100;

  if (!owner) {
    return <Empty title="Owner-only channel">Stipulated theoretical models and parameter tables are visible only to the workspace owner.</Empty>;
  }

  const models = data?.models || [];
  const filtered = domain === 'all' ? models : models.filter((m) => m.domain === domain);

  return (
    <div className="models-view">
      <SectionHead title="Reconstitution & Unit-Mapping Calculator">
        Closed-form dimensional conversion for lyophilized vials, salt-to-base active fractions, and U-100 syringe graduations.
      </SectionHead>
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <Input label="Vial labeled mass (mg)" type="number" step="any" min="0" value={vialMassMg} onChange={(e) => setVialMassMg(e.target.value)} />
          <Input label="Bacteriostatic water / diluent (mL)" type="number" step="any" min="0.01" value={diluentMl} onChange={(e) => setDiluentMl(e.target.value)} />
          <Input label="Target active dose (mcg)" type="number" step="any" min="0" value={targetDoseMcg} onChange={(e) => setTargetDoseMcg(e.target.value)} />
          <Input label="Active free-base fraction (0–1)" type="number" step="0.01" min="0.01" max="1" value={activeFraction} onChange={(e) => setActiveFraction(e.target.value)} hint="1.00 for pure peptide; e.g. 0.75 for salt/hydration correction" />
        </div>
        <div className="record-list" style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <article className="record-row"><div><h3>Active concentration</h3><p>C = (m × f) / V</p></div><strong>{concMgMl.toFixed(3)} mg/mL ({concMcgMl.toFixed(0)} mcg/mL)</strong></article>
          <article className="record-row"><div><h3>Draw volume</h3><p>V_draw = D / C</p></div><strong>{drawMl.toFixed(4)} mL</strong></article>
          <article className="record-row"><div><h3>U-100 syringe mark</h3><p>100 units = 1.00 mL</p></div><strong>{u100Units.toFixed(1)} IU (units)</strong></article>
        </div>
      </div>

      <SectionHead title="Stipulated Theoretical Systems Models">
        Explicitly isolated from empirical DailyMed/PubMed pharmacokinetic curves. All outputs below represent stipulated mechanistic ODE, Monte Carlo, and PDE/conversion-sink simulations.
      </SectionHead>
      <Notice>{error}</Notice>
      {!data && !error && <Loading>Loading theoretical models channel…</Loading>}
      {data && (
        <>
          <Tabs
            label="Theoretical model domain"
            value={domain}
            onChange={setDomain}
            entries={[
              ['all', `All (${models.length})`],
              ['height_bone', 'Height & Epiphyseal'],
              ['cognition_recovery', 'Cognition & Recovery'],
              ['anxiety_sociability', 'Anxiety & Sociability'],
            ]}
          />
          <div className="record-list" style={{ marginTop: '1rem' }}>
            {filtered.map((model) => (
              <article className="record-row" key={model.model_id || model.id} style={{ display: 'block', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
                  <h3>{model.title || model.module}</h3>
                  <Status value="configured">{model.evidence_class || 'stipulated_theoretical'}</Status>
                </div>
                <p style={{ marginTop: '0.35rem' }}>{model.summary || model.caveat}</p>
                {model.outputs && (
                  <pre style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--surface-2, #f5f5f4)', borderRadius: '6px', overflowX: 'auto', fontSize: '0.8rem' }}>
                    {JSON.stringify(model.outputs, null, 2)}
                  </pre>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
