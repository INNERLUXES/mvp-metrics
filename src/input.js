// The two inputs: the product's events, and the success criteria written before launch. Every bad row stops the run
// with its line number: a metric computed over rows that were silently dropped is a metric nobody should decide on.

function csvRows(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  const s = String(text).replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

const ISO = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

// events.csv: user,event,time  (time in ISO 8601; a date alone counts as midnight UTC)
export function parseEvents(text) {
  const rows = csvRows(text);
  if (!rows.length) throw new Error('events: the file is empty');
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const missing = ['user', 'event', 'time'].filter((c) => !head.includes(c));
  if (missing.length) throw new Error(`events: missing column(s) ${missing.join(', ')}`);
  const at = Object.fromEntries(head.map((h, i) => [h, i]));
  const errors = [];
  const events = [];
  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    if (r.length !== head.length) { errors.push(`events line ${line}: expected ${head.length} values, found ${r.length}`); return; }
    const user = r[at.user].trim();
    const event = r[at.event].trim();
    const raw = r[at.time].trim();
    if (!user) errors.push(`events line ${line}: user is empty`);
    if (!event) errors.push(`events line ${line}: event is empty`);
    const t = ISO.test(raw) ? Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00Z` : raw.replace(' ', 'T')) : NaN;
    if (Number.isNaN(t)) errors.push(`events line ${line}: time "${raw}" is not an ISO 8601 date`);
    if (user && event && !Number.isNaN(t)) events.push({ user, event, time: t });
  });
  if (errors.length) throw new Error(`invalid events:\n  ${errors.slice(0, 50).join('\n  ')}${errors.length > 50 ? `\n  ... and ${errors.length - 50} more` : ''}`);
  if (!events.length) throw new Error('events: the file has a header but no events');
  return events;
}

// criteria.json, written before launch:
// { "signup": "signed_up",
//   "activation": { "event": "created_project", "within_days": 7 },
//   "retention": { "event": "opened_app", "weeks": [1, 4] },
//   "paid": { "event": "paid" },
//   "targets": { "activation": 0.4, "retention_week_4": 0.2, "paid": 0.05 },
//   "min_users": 30 }
export function parseCriteria(obj) {
  const errors = [];
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('criteria must be an object');
  const name = (v) => typeof v === 'string' && v.trim() !== '';
  if (!name(obj.signup)) errors.push('signup: the name of the sign-up event is required');
  const c = { signup: obj.signup, minUsers: 30, targets: {} };
  if (obj.activation !== undefined) {
    const a = obj.activation;
    if (!a || !name(a.event)) errors.push('activation.event: an event name is required');
    const d = a?.within_days ?? 7;
    if (!Number.isInteger(d) || d < 1 || d > 365) errors.push('activation.within_days: a whole number of days from 1 to 365');
    c.activation = { event: a?.event, withinDays: d };
  }
  if (obj.retention !== undefined) {
    const r = obj.retention;
    if (!r || !name(r.event)) errors.push('retention.event: an event name is required');
    const w = r?.weeks ?? [1, 4];
    if (!Array.isArray(w) || !w.length || w.some((x) => !Number.isInteger(x) || x < 1 || x > 52)) errors.push('retention.weeks: a list of week numbers from 1 to 52');
    c.retention = { event: r?.event, weeks: Array.isArray(w) ? [...new Set(w)].sort((x, y) => x - y) : [] };
  }
  if (obj.paid !== undefined) {
    if (!obj.paid || !name(obj.paid.event)) errors.push('paid.event: an event name is required');
    c.paid = { event: obj.paid?.event };
  }
  if (obj.min_users !== undefined) {
    if (!Number.isInteger(obj.min_users) || obj.min_users < 1) errors.push('min_users: a whole number above 0');
    c.minUsers = obj.min_users;
  }
  const allowed = new Set(['activation', 'paid', ...(c.retention?.weeks || []).map((w) => `retention_week_${w}`)]);
  for (const [k, v] of Object.entries(obj.targets || {})) {
    if (!allowed.has(k)) errors.push(`targets.${k}: not a measured metric (use ${[...allowed].join(', ')})`);
    else if (typeof v !== 'number' || v < 0 || v > 1) errors.push(`targets.${k}: a share from 0 to 1, such as 0.25`);
    else c.targets[k] = v;
  }
  if (errors.length) throw new Error(`invalid criteria:\n  ${errors.join('\n  ')}`);
  return c;
}
