export const units = ['mg', 'mcg', 'g', 'IU', 'mL'];
export const number = (value) => value == null || !Number.isFinite(Number(value)) ? '—' : new Intl.NumberFormat(undefined, { maximumSignificantDigits: 4 }).format(value);
export const numeric = (value) => value === '' || value == null ? null : Number(value);
export const dateTime = (value, timezone) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', ...(timezone ? { timeZone: timezone } : {}) }).format(new Date(value)) : 'Not scheduled';
export const shortDate = (value) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value));
export function localTime(value = new Date().toISOString()) {
  if (!value) return '';
  const date = new Date(value);
  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
export const instant = (value) => value ? new Date(value).toISOString() : null;
export const browserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
export const nameFor = (library, id) => library?.compounds?.find((compound) => compound.id === id)?.name || 'Unlisted compound';
export const scopeLabel = (scope) => scope === 'next_occurrence' ? 'Next occurrence only' : 'Recurring schedule from this time';
export function itemPayload(item) {
  const keys = ['id', 'source_item_id', 'compound_id', 'amount', 'unit', 'interval_h', 'first_at', 'end_at', 'notes', 'minimum_amount', 'maximum_amount', 'next_override'];
  return Object.fromEntries(keys.filter((key) => item[key] !== undefined).map((key) => [key, item[key]]));
}
export const sortRecent = (records = []) => [...records].sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));
