import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let server, PublicStack, PublicAuditResult, stackAfterSwap, resolveStackPhrase, phoneCardSections, GatesEditor;
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));
const audit = {
  goal: 'studying', items: [{ id: 'A', name: 'Reference A', amount: 10, unit: 'mg', raw: 'ref a 10mg' }, { id: 'B', name: 'Reference B', amount: 5, unit: 'mg', raw: 'ref b 5mg' }],
  unknown: ['unlisted bottle'], ambiguous: [{ text: 'shorthand', options: [{ id: 'C', name: 'Exact form' }] }],
  verdict: { title: 'Coverage needs attention', summary: 'One conflict applies.' },
  conflicts: [{ id: 'conflict', title: 'Reference conflict', explanation: 'Unresolved reference conflict', compound_ids: ['A', 'B'], source: 'Synthetic test note' }],
  waste: [], goal_tradeoffs: [], label_truth: [], swaps: [],
  timing_guide: [{ id: 'A', name: 'Reference A', amount: 10, unit: 'mg', timing: 'With lunch', reason: 'Source-backed lunch note' }, { id: 'B', name: 'Reference B', amount: 5, unit: 'mg', timing: null, reason: 'Timing rules conflict; confirm the timing.' }],
  daily_split: { wake: [{ id: 'A', name: 'Reference A', amount: 10, unit: 'mg', reason: 'Legacy bucket should not control the guide' }], meal: [], bedtime: [], unassigned: [] },
  coverage: { recognized: 2, total: 4, insights: 2 },
};

before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  ({ default: PublicStack, PublicAuditResult } = await server.ssrLoadModule('/src/views/PublicStack.jsx'));
  ({ stackAfterSwap, resolveStackPhrase } = await server.ssrLoadModule('/src/publicStack.js'));
  ({ phoneCardSections } = await server.ssrLoadModule('/src/phoneCard.js'));
  ({ GatesEditor } = await server.ssrLoadModule('/src/components/ProtocolEditor.jsx'));
});
after(async () => { await server?.close(); });

test('public front door has six explicit goals and one empty stack field', () => {
  const html = render(PublicStack, { onPrivate() {} });
  assert.match(html, /Check your stack/);
  assert.equal((html.match(/aria-pressed="false"/g) || []).length, 6);
  assert.equal((html.match(/<textarea/g) || []).length, 1);
  assert.equal((html.match(/<select/g) || []).length, 0);
  assert.match(html, /Client \/ Pro sign in/);
  assert.doesNotMatch(html, /Your check-in|Reference A|class="public-results"/);
});

test('public unknowns and unresolved conflicts are never rendered as a clear result', () => {
  const html = render(PublicAuditResult, { audit });
  assert.match(html, /unlisted bottle/);
  assert.match(html, /not been cleared/);
  assert.match(html, /Reference conflict/);
  assert.match(html, /Timing notes do not clear/);
  assert.match(html, /With lunch/);
  assert.match(html, /Timing rules conflict/);
  assert.match(html, /Timing to confirm/);
  assert.doesNotMatch(html, /Empty Stomach|Before Bed|No entries here|Legacy bucket/);
  assert.doesNotMatch(html, /Try this swap/);
  const noTiming = render(PublicAuditResult, { audit: { ...audit, timing_guide: [] } });
  assert.doesNotMatch(noTiming, /Timing guide|daily-bucket/);
  assert.match(noTiming, /Save phone card/);
});

test('a swap removes the old amount and preserves other entries and unresolved text', () => {
  const text = stackAfterSwap(audit, { compound_id: 'A', replacement_name: 'Replacement C' });
  assert.match(text, /^Replacement C\nReference B 5 mg/);
  assert.match(text, /unlisted bottle\nshorthand/);
  assert.doesNotMatch(text, /Reference A|Replacement C 10|Replacement C 5/);
  assert.throws(() => stackAfterSwap(audit, { compound_id: 'missing', replacement_name: 'Replacement C' }), /no longer matches/);
});

test('ambiguity resolution changes only the returned phrase', () => {
  assert.equal(resolveStackPhrase('Shorthand, other bottle', 'shorthand', 'Exact form'), 'Exact form, other bottle');
  assert.throws(() => resolveStackPhrase('different entry', 'shorthand', 'Exact form'), /changed/);
});

test('phone card follows actual timing labels and retains unknowns and conflicts', () => {
  const sections = phoneCardSections(audit);
  assert.equal(sections[0].title, 'Timing guide');
  const all = JSON.stringify(sections);
  assert.match(all, /With lunch/);
  assert.match(all, /Source-backed lunch note/);
  assert.match(all, /Timing rules conflict/);
  assert.match(all, /unlisted bottle/);
  assert.match(all, /Identity unresolved/);
  assert.match(all, /Unresolved conflicts/);
  assert.doesNotMatch(all, /Empty Stomach|Before Bed|Legacy bucket/);
  const arbitrary = JSON.stringify(phoneCardSections({ ...audit, timing_guide: [{ ...audit.timing_guide[0], timing: 'After training' }, { ...audit.timing_guide[1], timing: 'Separate from Reference A' }] }));
  assert.match(arbitrary, /After training/);
  assert.match(arbitrary, /Separate from Reference A/);
  assert.equal(phoneCardSections({ ...audit, timing_guide: [] }).some((section) => section.kind === 'timing'), false);
});

test('maximum amount condition includes an explicit limit-unit selector', () => {
  const html = render(GatesEditor, { gates: [{ id: 'gate', title: 'Reference limit', measure_id: 'measure', compound_id: 'A', operator: 'gte', threshold: 8, max_age_h: 24, action: 'maximum_amount', maximum_amount: 5, unit: 'mg', source: 'Synthetic rule fixture' }], measures: [{ id: 'measure', name: 'Reported measure' }], library: { compounds: [{ id: 'A', name: 'Reference A' }] }, onChange() {} });
  assert.match(html, /Limit unit/);
  assert.match(html, /value="mg" selected/);
});
