// How each metric is measured. docs/metrics.md says the same in words; a change here changes that page too.

export const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

// Monday 00:00 UTC of the week a time falls in, as YYYY-MM-DD.
export function weekOf(t) {
  const d = new Date(t);
  const monday = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - ((d.getUTCDay() + 6) % 7) * DAY;
  return new Date(monday).toISOString().slice(0, 10);
}

function byUser(events) {
  const m = new Map();
  for (const e of events) {
    if (!m.has(e.user)) m.set(e.user, []);
    m.get(e.user).push(e);
  }
  for (const list of m.values()) list.sort((a, b) => a.time - b.time);
  return m;
}

// A user counts only when the whole window can be seen before the end of the data: a user who signed up yesterday
// has not had seven days to activate, and must not pull the rate down.
function share(users, inWindow, did) {
  const eligible = users.filter(inWindow);
  const count = eligible.filter(did).length;
  return { eligible: eligible.length, count, rate: eligible.length ? count / eligible.length : null };
}

export function measure(events, criteria, { asOf } = {}) {
  const end = asOf ?? Math.max(...events.map((e) => e.time));
  const seen = new Set(events.map((e) => e.event));
  const users = byUser(events.filter((e) => e.time <= end));
  const signups = [];
  for (const [user, list] of users) {
    const s = list.find((e) => e.event === criteria.signup);
    if (s) signups.push({ user, at: s.time, list });
  }
  const has = (u, event, from, to) => u.list.some((e) => e.event === event && e.time >= from && e.time < to);
  const metrics = [];
  const notSeen = (event) => (seen.has(event) ? null : `the event "${event}" never appears in the file`);

  metrics.push({ key: 'signup', label: 'Sign-ups', event: criteria.signup, eligible: signups.length, count: signups.length, rate: null,
    note: notSeen(criteria.signup) });
  if (criteria.activation) {
    const { event, withinDays } = criteria.activation;
    const w = withinDays * DAY;
    metrics.push({ key: 'activation', label: `Activation within ${withinDays} day${withinDays === 1 ? '' : 's'}`, event,
      ...share(signups, (u) => u.at + w <= end, (u) => has(u, event, u.at, u.at + w + 1)), note: notSeen(event) });
  }
  if (criteria.retention) {
    const { event, weeks } = criteria.retention;
    for (const k of weeks) {
      metrics.push({ key: `retention_week_${k}`, label: `Retention in week ${k}`, event,
        ...share(signups, (u) => u.at + (k + 1) * WEEK <= end, (u) => has(u, event, u.at + k * WEEK, u.at + (k + 1) * WEEK)), note: notSeen(event) });
    }
  }
  if (criteria.paid) {
    const { event } = criteria.paid;
    metrics.push({ key: 'paid', label: 'Paid', event, ...share(signups, () => true, (u) => has(u, event, u.at, end + 1)), note: notSeen(event) });
  }

  for (const m of metrics) {
    const target = criteria.targets[m.key];
    m.target = target ?? null;
    if (target === undefined) m.verdict = 'no target';
    else if (m.note) m.verdict = 'not checked';
    else if (m.eligible < criteria.minUsers) m.verdict = 'not enough data';
    else m.verdict = m.rate >= target ? 'met' : 'missed';
  }

  const cohorts = new Map();
  for (const u of signups) {
    const wk = weekOf(u.at);
    if (!cohorts.has(wk)) cohorts.set(wk, []);
    cohorts.get(wk).push(u);
  }
  const cohortRows = [...cohorts.keys()].sort().map((wk) => {
    const list = cohorts.get(wk);
    const row = { week: wk, signups: list.length };
    if (criteria.activation) {
      const w = criteria.activation.withinDays * DAY;
      row.activation = share(list, (u) => u.at + w <= end, (u) => has(u, criteria.activation.event, u.at, u.at + w + 1));
    }
    if (criteria.retention) {
      row.retention = Object.fromEntries(criteria.retention.weeks.map((k) => [k,
        share(list, (u) => u.at + (k + 1) * WEEK <= end, (u) => has(u, criteria.retention.event, u.at + k * WEEK, u.at + (k + 1) * WEEK))]));
    }
    return row;
  });

  return {
    end: new Date(end).toISOString(),
    users: users.size,
    signups: signups.length,
    minUsers: criteria.minUsers,
    metrics,
    cohorts: cohortRows,
    ignoredAfterEnd: events.filter((e) => e.time > end).length
  };
}

export function missed(result) {
  return result.metrics.filter((m) => m.verdict === 'missed');
}
