import type { Settings } from './types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Collapses configured opening hours into compact, human-readable ranges,
 * e.g. "Mon – Fri 12:00–22:00, Sat – Sun 10:00–23:00".
 * Returns null when no hours have been configured, so callers never
 * fabricate or guess at business hours.
 */
export function summarizeHours(hours: Settings['hours']): string | null {
  if (!hours.length) return null;
  const byDay = [...hours].sort((a, b) => a.day - b.day);
  const groups: { days: number[]; open: string; close: string }[] = [];
  for (const h of byDay) {
    const last = groups[groups.length - 1];
    if (last && last.open === h.open && last.close === h.close && last.days[last.days.length - 1] === h.day - 1) {
      last.days.push(h.day);
    } else {
      groups.push({ days: [h.day], open: h.open, close: h.close });
    }
  }
  return groups
    .map(g => {
      const label = g.days.length > 1 ? `${DAY_LABELS[g.days[0]]} – ${DAY_LABELS[g.days[g.days.length - 1]]}` : DAY_LABELS[g.days[0]];
      return `${label} ${g.open}–${g.close}`;
    })
    .join(', ');
}

/** Turns a plain-language dish description into short uppercase tags, e.g. "Roasted lamb, herb crust and seasonal greens." -> "ROASTED LAMB · HERB CRUST · SEASONAL GREENS". */
export function dishTags(description: string): string {
  return description
    .replace(/\.$/, '')
    .replace(/\s+and\s+/gi, ', ')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .join(' · ');
}
