import { goalName, publicItemLabel } from './publicStack.js';

export function phoneCardSections(audit) {
  const sections = [];
  const guide = audit.timing_guide || [];
  if (guide.length) sections.push({ title: 'Timing guide', kind: 'timing', entries: guide.map((item) => ({ title: publicItemLabel(item), text: [item.timing, item.reason || (!item.timing ? 'Timing is not specified for this entry.' : '')].filter(Boolean).join(' — '), source: item.source || '' })) });
  const remaining = (audit.items || []).filter((item) => !guide.some((entry) => entry.id === item.id));
  if (remaining.length) sections.push({ title: 'Your stack', kind: 'stack', entries: remaining.map((item) => ({ title: publicItemLabel(item), text: 'Timing is not specified for this entry.' })) });
  const unresolved = [
    ...(audit.unknown || []).map((text) => ({ title: text, text: 'Not recognized. This entry has not been cleared.' })),
    ...(audit.ambiguous || []).map((entry) => ({ title: entry.text, text: `Identity unresolved: ${entry.options.map((option) => option.name).join(' / ')}.` })),
  ];
  if (unresolved.length) sections.push({ title: 'Needs an identity check', kind: 'unknown', entries: unresolved });
  if (audit.conflicts?.length) sections.push({ title: 'Unresolved conflicts', kind: 'conflict', entries: audit.conflicts.map((insight) => ({ title: insight.title, text: insight.explanation, source: insight.source })) });
  return sections;
}

function wrapText(context, text, maxWidth) {
  const lines = [];
  for (const paragraph of String(text || '').split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (context.measureText(`${line}${line ? ' ' : ''}${word}`).width <= maxWidth) { line += `${line ? ' ' : ''}${word}`; continue; }
      if (line) lines.push(line);
      line = '';
      // Also wrap long names and source URLs instead of clipping them.
      for (const character of word) {
        if (context.measureText(line + character).width > maxWidth && line) { lines.push(line); line = ''; }
        line += character;
      }
    }
    lines.push(line);
  }
  return lines;
}

async function loadLogo() {
  const loaded = document.querySelector('img[src="/bioscience-logo.png"]');
  if (loaded?.complete && loaded.naturalWidth) return loaded;
  const image = new Image();
  image.src = '/bioscience-logo.png';
  await image.decode();
  return image;
}

export async function createPhoneCard(audit) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot create a phone card.');
  const logo = await loadLogo();
  const width = 1080, padding = 70, contentWidth = width - padding * 2;
  const blocks = [];
  const font = (size, weight = 400) => `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  function textBlock(text, size, weight, color, gapAfter = 14, indent = 0) {
    context.font = font(size, weight);
    const lines = wrapText(context, text, contentWidth - indent);
    blocks.push({ type: 'text', lines, size, weight, color, lineHeight: size * 1.42, gapAfter, indent });
  }
  textBlock('Stack check', 52, 650, '#172D40', 8);
  textBlock(goalName(audit.goal), 31, 500, '#087D7A', 30);
  textBlock(audit.verdict.title, 34, 650, '#172D40', 10);
  textBlock(audit.verdict.summary, 27, 400, '#617481', 32);
  for (const section of phoneCardSections(audit)) {
    blocks.push({ type: 'divider', gapAfter: 24 });
    textBlock(section.title, 34, 650, section.kind === 'conflict' ? '#9B6333' : '#172D40', 22);
    for (const entry of section.entries) {
      textBlock(entry.title, 30, 600, '#172D40', 7);
      textBlock(entry.text, 25, 400, '#617481', entry.source ? 6 : 22);
      if (entry.source) textBlock(`Source: ${entry.source}`, 21, 400, '#71818B', 22);
    }
  }
  blocks.push({ type: 'divider', gapAfter: 24 });
  if (audit.conflicts?.length) textBlock('Unresolved findings are listed above.', 25, 550, '#172D40', 10);
  textBlock(`${audit.coverage.recognized} of ${audit.coverage.total} entries recognized. Items still needing clarification are listed above.`, 23, 400, '#617481', 10);
  textBlock(`Saved ${new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} · BioScience`, 21, 400, '#71818B', 0);
  const bodyHeight = blocks.reduce((sum, block) => sum + (block.type === 'text' ? block.lines.length * block.lineHeight : 2) + block.gapAfter, 0);
  const height = Math.max(1920, Math.ceil(210 + bodyHeight + padding));
  if (height > 16000) throw new Error('This card is too long to export safely. Shorten the stack before saving.');
  canvas.width = width; canvas.height = height;
  context.fillStyle = '#FFFFFF'; context.fillRect(0, 0, width, height);
  context.drawImage(logo, padding, 56, 92, 92);
  context.font = font(37, 700); context.fillStyle = '#172D40'; context.textBaseline = 'top';
  context.fillText('BioScience', padding + 112, 75);
  context.font = font(19, 450); context.fillStyle = '#617481'; context.fillText('STACK CHECK', padding + 114, 120);
  context.fillStyle = '#11B6B1'; context.fillRect(padding, 174, contentWidth, 4);
  let y = 210;
  for (const block of blocks) {
    if (block.type === 'divider') { context.fillStyle = '#DFE8ED'; context.fillRect(padding, y, contentWidth, 2); y += 2 + block.gapAfter; continue; }
    context.font = font(block.size, block.weight); context.fillStyle = block.color;
    for (const line of block.lines) { context.fillText(line, padding + block.indent, y); y += block.lineHeight; }
    y += block.gapAfter;
  }
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('The phone card could not be exported. Please retry.');
  return blob;
}

export async function savePhoneCard(audit) {
  const blob = await createPhoneCard(audit);
  const filename = `bioscience-${audit.goal}-stack-check.png`;
  const file = new File([blob], filename, { type: 'image/png' });
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (mobile && navigator.share && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ title: 'BioScience stack check', files: [file] }); return 'shared'; }
    catch (error) { if (error.name === 'AbortError') return 'cancelled'; }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = filename;
  document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}

export async function createReceptorMapCard(receptorMap, title = "Your Stack's Receptor-Overlap Map") {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot render a receptor map card.');
  const width = 1200;
  const height = 1350;
  canvas.width = width;
  canvas.height = height;

  const font = (size, weight = 400) => `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, width, height);

  // Subtle calibration grid
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 1;
  for (let x = 60; x < width; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 60; y < height; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  // Header
  ctx.fillStyle = '#11B6B1';
  ctx.fillRect(72, 68, width - 144, 3);
  ctx.font = font(20, 600);
  ctx.fillStyle = '#11B6B1';
  ctx.fillText('BIOSCIENCE PROTOCOL STUDIO · RECEPTOR-OVERLAP TOPOLOGY', 72, 110);

  ctx.font = font(42, 700);
  ctx.fillStyle = '#F8FAFC';
  ctx.fillText(title, 72, 162);

  ctx.font = font(22, 400);
  ctx.fillStyle = '#94A3B8';
  ctx.fillText(`Active Stack: ${(receptorMap.compounds || []).join('  ·  ')}`, 72, 204);

  // Draw Receptor Nodes & Edges in central stage
  const stageTop = 250;
  const scaleX = 1.25;
  const scaleY = 1.15;
  const offsetX = 65;

  const nodePos = (node) => ({
    x: offsetX + node.x * scaleX,
    y: stageTop + node.y * scaleY,
  });

  // Compound source anchors on left & right rails
  const compounds = receptorMap.compounds || [];
  const compoundPositions = compounds.map((name, i) => ({
    name,
    x: i % 2 === 0 ? 220 : 980,
    y: stageTop + 140 + Math.floor(i / 2) * 180,
  }));

  // Draw Edges
  for (const edge of receptorMap.edges || []) {
    const cPos = compoundPositions[edge.compoundIndex] || { x: 600, y: stageTop + 260 };
    const targetNode = (receptorMap.nodes || []).find((n) => n.id === edge.nodeId);
    if (!targetNode) continue;
    const tPos = nodePos(targetNode);
    ctx.beginPath();
    ctx.moveTo(cPos.x, cPos.y);
    ctx.lineTo(tPos.x, tPos.y);
    ctx.strokeStyle =
      edge.mode === 'overlap_stress' || edge.mode === 'bottleneck'
        ? '#F59E0B'
        : edge.mode === 'synergy' || edge.mode === 'preserved'
        ? '#11B6B1'
        : '#64748B';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // Draw Receptor Nodes
  for (const node of receptorMap.nodes || []) {
    const pos = nodePos(node);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 30, 0, Math.PI * 2);
    ctx.fillStyle =
      node.state === 'protected_synergy'
        ? '#0D9488'
        : node.state === 'conflict_hotspot'
        ? '#B45309'
        : node.state === 'engaged'
        ? '#1E293B'
        : '#0F172A';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle =
      node.state === 'protected_synergy'
        ? '#2DD4BF'
        : node.state === 'conflict_hotspot'
        ? '#F59E0B'
        : node.state === 'engaged'
        ? '#94A3B8'
        : '#334155';
    ctx.stroke();

    ctx.font = font(18, 650);
    ctx.fillStyle = '#F8FAFC';
    ctx.textAlign = 'center';
    ctx.fillText(node.label, pos.x, pos.y + 52);
    ctx.font = font(14, 400);
    ctx.fillStyle = '#94A3B8';
    ctx.fillText(node.system, pos.x, pos.y + 74);
  }

  // Draw Compound Anchors
  for (const c of compoundPositions) {
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.fillRect(c.x - 125, c.y - 26, 250, 52);
    ctx.strokeRect(c.x - 125, c.y - 26, 250, 52);
    ctx.font = font(19, 650);
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(c.name, c.x, c.y + 7);
  }

  ctx.textAlign = 'left';
  let footY = 890;
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(72, footY, width - 144, 2);
  footY += 42;

  ctx.font = font(24, 650);
  ctx.fillStyle = '#F8FAFC';
  ctx.fillText('Receptor Convergence & Mechanistic Hotspots', 72, footY);
  footY += 36;

  const hotspots = receptorMap.hotspots?.length
    ? receptorMap.hotspots
    : [{ receptor: 'Orthogonal Receptor Coverage', summary: 'Compounds act across distinct non-competing signaling axes.' }];

  for (const h of hotspots.slice(0, 4)) {
    ctx.font = font(20, 600);
    ctx.fillStyle = '#11B6B1';
    ctx.fillText(`${h.receptor}:`, 72, footY);
    ctx.font = font(19, 400);
    ctx.fillStyle = '#CBD5E1';
    ctx.fillText(h.summary.slice(0, 92), 72, footY + 26);
    footY += 64;
  }

  ctx.font = font(18, 500);
  ctx.fillStyle = '#64748B';
  ctx.fillText(`Exported ${new Date().toLocaleDateString()} · BioScience Protocol Studio · Shareable Stack Map`, 72, height - 48);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not export receptor map image card.');
  return blob;
}

export async function saveReceptorMapCard(receptorMap, title) {
  const blob = await createReceptorMapCard(receptorMap, title);
  const filename = 'bioscience-stack-receptor-map.png';
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
