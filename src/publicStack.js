export const publicGoals = [
  ['height', 'Height'], ['bone', 'Bone growth'], ['cognition', 'Cognition'],
  ['studying', 'Studying'], ['recovery', 'Recovery'], ['anxiety', 'Anxiety / sociability'],
];

export function timingLabel(value) {
  switch (value) {
    case 'wake': return 'After waking';
    case 'meal': return 'With a meal';
    case 'bedtime': return 'Before bed';
    default: return value;
  }
}

export const goalName = (key) => publicGoals.find(([value]) => value === key)?.[1] || key;
export function publicItemLabel(item) {
  return `${item.name}${item.amount != null ? ` · ${item.amount}${item.unit ? ` ${item.unit}` : ''}` : ''}`;
}

// Identity substitution only. No conversion or dose-equivalence assumption is made.
export function stackAfterSwap(audit, swap) {
  let replaced = false;
  const entries = (audit.items || []).flatMap((item) => {
    if (item.id === swap.compound_id) {
      if (replaced) return [];
      replaced = true;
      return [swap.replacement_name];
    }
    return [`${item.name}${item.amount != null ? ` ${item.amount}${item.unit ? ` ${item.unit}` : ''}` : ''}`];
  });
  if (!replaced) throw new Error('This swap no longer matches the checked stack. Check the stack again.');
  entries.push(...(audit.unknown || []), ...(audit.ambiguous || []).map((entry) => entry.text));
  return entries.join('\n');
}

export function resolveStackPhrase(text, phrase, choice) {
  const index = text.toLocaleLowerCase().indexOf(phrase.toLocaleLowerCase());
  if (index < 0) throw new Error('The entered phrase changed. Check your current stack again.');
  return text.slice(0, index) + choice + text.slice(index + phrase.length);
}
