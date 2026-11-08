import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let server;
let Today, Compare, Progress, LibraryDrawer, Chart, itemPayload;
const library = { revision: 0, compounds: [], relations: [] };
const workspace = { id: 'test-workspace', label: 'Private workspace', goal: '', timezone: 'UTC', revision: 0, allow_plan_changes: false, protocol: { items: [], measures: [], gates: [] }, events: [], observations: [], protocol_changes: [] };
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));

before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  Today = (await server.ssrLoadModule('/src/views/Today.jsx')).default;
  Compare = (await server.ssrLoadModule('/src/views/Compare.jsx')).default;
  Progress = (await server.ssrLoadModule('/src/views/Progress.jsx')).default;
  LibraryDrawer = (await server.ssrLoadModule('/src/components/LibraryDrawer.jsx')).default;
  Chart = (await server.ssrLoadModule('/src/components/Chart.jsx')).default;
  ({ itemPayload } = await server.ssrLoadModule('/src/format.js'));
});
after(async () => { await server?.close(); });

test('an empty workspace renders truthful empty states without seeded protocol or chart', () => {
  const today = render(Today, { workspace, library, owner: true });
  assert.match(today, /No protocol assigned yet/);
  assert.match(today, /No actual intake has been recorded/);
  assert.doesNotMatch(today, /class="stack-row"|class="chart"/);
  assert.match(render(Compare, { workspace, library }), /Add a protocol before comparing/);
  const progress = render(Progress, { workspace });
  assert.match(progress, /No measures configured/);
  assert.doesNotMatch(progress, /class="chart"/);
});

test('client-visible protocol actions use server planned amount and natural names', () => {
  const props = { workspace: { ...workspace, protocol: { ...workspace.protocol, items: [{ id: 'item-id', compound_id: 'compound-id', amount: 5, next_amount: 2.5, unit: 'mg', first_at: '2026-11-04T10:00:00Z', interval_h: 24, next_at: '2026-11-05T10:00:00Z', due_status: 'upcoming' }] } }, library: { ...library, compounds: [{ id: 'compound-id', name: 'Reference compound' }] } };
  const html = render(Today, props);
  assert.match(html, /Reference compound/);
  assert.match(html, /2\.5 <span>mg/);
  assert.match(html, /Record 2\.5 mg actually taken now/);
  assert.doesNotMatch(html, /Edit protocol/);
});

test('unconfigured library starts with blank scientific inputs', () => {
  const html = render(LibraryDrawer, { library, onSaved() {}, onClose() {} });
  assert.match(html, /Not configured — tracking only/);
  assert.match(html, /value="unconfigured" selected/);
  assert.doesNotMatch(html, /Elimination half-life \(h\)/);
  assert.match(html, /Compound name<\/label><input[^>]*value=""/);
});

test('protocol writes strip every server-only schedule field and retain an override', () => {
  const next_override = { amount: 3 };
  const item = itemPayload({ id: 'item-id', source_item_id: 'original-item-id', compound_id: 'compound-id', amount: 5, unit: 'mg', next_at: 'future', due_status: 'due', next_amount: 3, next_scheduled_at: 'original', name: 'Reference compound', next_override });
  assert.deepEqual(item, { id: 'item-id', source_item_id: 'original-item-id', compound_id: 'compound-id', amount: 5, unit: 'mg', next_override });
});

test('completed schedules remain secondary and are not editable comparison choices', () => {
  const completed = { id: 'completed-item', compound_id: 'compound-id', amount: 5, unit: 'mg', first_at: '2026-11-04T10:00:00Z', interval_h: null, due_status: 'complete' };
  const props = { workspace: { ...workspace, protocol: { ...workspace.protocol, items: [completed] } }, library: { ...library, compounds: [{ id: 'compound-id', name: 'Reference compound' }] } };
  const today = render(Today, props);
  assert.match(today, /Completed schedules \(1\)/);
  assert.doesNotMatch(today, /class="stack-row"/);
  assert.match(render(Compare, props), /No upcoming schedule to compare/);
});

test('progress plots only configured observations and no filled-in dates', () => {
  const measure = { id: 'measure-id', name: 'Observed measure', unit: 'points' };
  const html = render(Progress, { workspace: { ...workspace, protocol: { ...workspace.protocol, measures: [measure] }, observations: [{ id: 'observation-id', measure_id: measure.id, value: 4, occurred_at: '2026-11-04T10:00:00Z', note: 'Recorded note' }] } });
  assert.match(html, /Actual observations only/);
  assert.equal((html.match(/<circle/g) || []).length, 1);
  assert.match(html, /Recorded note/);
});

test('chart handles a single zero-valued observation without NaN coordinates', () => {
  const html = render(Chart, { title: 'Observed measure', observations: true, unit: 'points', series: [{ label: 'Observed', times: ['2026-11-04T10:00:00Z'], values: [0] }] });
  assert.match(html, /<circle/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});
