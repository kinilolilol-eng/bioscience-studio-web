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
