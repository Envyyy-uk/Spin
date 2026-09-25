// Date helpers working on ISO calendar dates ("YYYY-MM-DD") in local time,
// so trips never shift by a day because of time zones.

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseISO(value) {
  if (typeof value !== 'string') return null;
  const m = ISO_RE.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

export function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO(now = new Date()) {
  return toISO(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
}

export function addDays(iso, days) {
  const d = parseISO(iso);
  if (!d) return null;
  d.setDate(d.getDate() + days);
  return toISO(d);
}

/** Whole calendar days from a to b (b - a). */
export function diffDays(aIso, bIso) {
  const a = parseISO(aIso);
  const b = parseISO(bIso);
  if (!a || !b) return NaN;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86400000);
}

/** Number of trip days when both first and last day are included. */
export function inclusiveDays(startIso, endIso) {
  const n = diffDays(startIso, endIso);
  return Number.isNaN(n) ? NaN : n + 1;
}

/** Last day of a trip that starts on `startIso` and lasts `days` days. */
export function tripEnd(startIso, days) {
  return addDays(startIso, Math.max(1, days) - 1);
}
