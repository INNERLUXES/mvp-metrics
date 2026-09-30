// The result in four formats. Every format carries the same facts: a metric with too few users says "not enough data",
// an event that never appears says "not checked", and neither is ever shown as met or missed.

const pct = (r) => (r === null ? 'n/a' : `${(Math.round(r * 1000) / 10).toFixed(1)}%`);

function line(m) {
  const base = m.key === 'signup' ? `${m.count} users` : `${pct(m.rate)} (${m.count} of ${m.eligible} users)`;
  const tgt = m.target === null ? '' : `, target ${pct(m.target)}: ${m.verdict}`;
  return `${m.label} [${m.event}]: ${base}${tgt}${m.note ? ` (${m.note})` : ''}`;
}

function notes(r) {
  const out = [];
  if (r.metrics.some((m) => m.verdict === 'not enough data')) out.push(`"Not enough data" means fewer than ${r.minUsers} users could be measured for that metric (min_users).`);
  out.push('A user is counted in a metric only when its whole window ends before the end of the data.');
  if (r.ignoredAfterEnd) out.push(`${r.ignoredAfterEnd} event(s) after the end date were left out.`);
  return out;
}

export function toText(r) {
  const lines = [`MVP metrics up to ${r.end.slice(0, 10)}: ${r.users} users in the file, ${r.signups} signed up`, ''];
  for (const m of r.metrics) lines.push(line(m));
  if (r.cohorts.length) {
    lines.push('', 'By sign-up week:');
    for (const c of r.cohorts) {
      const parts = [`${c.week}  ${String(c.signups).padStart(4)} sign-ups`];
      if (c.activation) parts.push(`activation ${pct(c.activation.rate)}`);
      if (c.retention) for (const [k, s] of Object.entries(c.retention)) parts.push(`week ${k} ${pct(s.rate)}`);
      lines.push(`  ${parts.join('  ')}`);
    }
  }
  lines.push('', ...notes(r));
  return lines.join('\n');
}

const md = (s) => String(s).replace(/[|\\`*_[\]<>]/g, (c) => `\\${c}`);

export function toMarkdown(r) {
  const lines = ['# MVP metrics', '', `Up to ${r.end.slice(0, 10)}: ${r.users} users in the file, ${r.signups} signed up.`, '',
    '| Metric | Event | Result | Users measured | Target | Verdict |', '|---|---|---|---|---|---|'];
  for (const m of r.metrics) {
    lines.push(`| ${md(m.label)} | ${md(m.event)} | ${m.key === 'signup' ? m.count : pct(m.rate)} | ${m.eligible} | ${m.target === null ? '' : pct(m.target)} | ${md(m.note ? `${m.verdict}: ${m.note}` : m.verdict)} |`);
  }
  if (r.cohorts.length) {
    const weeks = r.cohorts[0].retention ? Object.keys(r.cohorts[0].retention) : [];
    lines.push('', '## By sign-up week', '', `| Week | Sign-ups |${r.cohorts[0].activation ? ' Activation |' : ''}${weeks.map((k) => ` Week ${k} |`).join('')}`,
      `|---|---|${r.cohorts[0].activation ? '---|' : ''}${weeks.map(() => '---|').join('')}`);
    for (const c of r.cohorts) lines.push(`| ${c.week} | ${c.signups} |${c.activation ? ` ${pct(c.activation.rate)} |` : ''}${weeks.map((k) => ` ${pct(c.retention[k].rate)} |`).join('')}`);
  }
  lines.push('', '## Notes', '', ...notes(r).map((x) => `- ${md(x)}`));
  return lines.join('\n');
}

export function toJson(r) {
  return JSON.stringify({ ...r, notes: notes(r) }, null, 2);
}

const cell = (v) => {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// One line per metric, ready for a spreadsheet next to the investor update.
export function toCsv(r) {
  const out = ['metric,event,rate,count,users_measured,target,verdict,note'];
  for (const m of r.metrics) {
    out.push([m.key, m.event, m.rate === null ? '' : m.rate.toFixed(4), m.count, m.eligible, m.target ?? '', m.verdict, m.note || ''].map(cell).join(','));
  }
  return out.join('\n');
}
