// Command line: mvp-metrics --events events.csv --criteria criteria.json [--as-of YYYY-MM-DD]
//               [--format text|markdown|json|csv] [--output file] [--fail-on-miss]

import { readFile, writeFile } from 'node:fs/promises';
import { parseEvents, parseCriteria } from './input.js';
import { measure, missed } from './metrics.js';
import { toText, toMarkdown, toJson, toCsv } from './report.js';

export const USAGE = `mvp-metrics --events <events.csv> --criteria <criteria.json> [options]

Measures an MVP against the success criteria written before launch: sign-ups, activation within a number of days,
retention in chosen weeks, and the share who paid, with a table by sign-up week. A metric with too few users says
"not enough data"; an event that never appears says "not checked". It reads the files you give it and fetches nothing.

Options
  --events <file>         CSV with columns user, event, time (ISO 8601) (required)
  --criteria <file>       JSON with the sign-up event, the metrics and their targets (required)
  --as-of <date>          measure up to this date instead of the last event in the file
  --format <f>            text (default), markdown, json or csv
  --output <file>         write the result to a file
  --fail-on-miss          exit 1 when a metric with enough data missed its target
  --help                  this text

Exit codes: 0 done, 1 a target missed with --fail-on-miss, 2 wrong usage or invalid input.`;

export function parseArgs(argv) {
  const o = { format: 'text', failOnMiss: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { o.help = true; continue; }
    if (a === '--fail-on-miss') { o.failOnMiss = true; continue; }
    if (!['--events', '--criteria', '--as-of', '--format', '--output'].includes(a)) throw new Error(`unknown option: ${a}`);
    if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) throw new Error(`${a} needs a value`);
    o[a === '--as-of' ? 'asOf' : a.slice(2)] = argv[++i];
  }
  if (o.help) return o;
  if (!o.events || !o.criteria) throw new Error('--events and --criteria are required');
  if (!['text', 'markdown', 'json', 'csv'].includes(o.format)) throw new Error(`unknown format: ${o.format}`);
  if (o.asOf !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(o.asOf) || Number.isNaN(Date.parse(`${o.asOf}T23:59:59.999Z`))) throw new Error('--as-of takes a date as YYYY-MM-DD');
    o.asOf = Date.parse(`${o.asOf}T23:59:59.999Z`);
  }
  return o;
}

async function read(file) {
  try {
    return await readFile(file, 'utf8');
  } catch (err) {
    throw new Error(`cannot read ${file}: ${err.message}`);
  }
}

export async function main(argv, { stdout = process.stdout, stderr = process.stderr } = {}) {
  let o, result;
  try {
    o = parseArgs(argv);
    if (o.help) { stdout.write(`${USAGE}\n`); return 0; }
    const events = parseEvents(await read(o.events));
    let raw;
    try {
      raw = JSON.parse(await read(o.criteria));
    } catch (err) {
      throw new Error(err.message.startsWith('cannot read') ? err.message : `${o.criteria} is not valid JSON: ${err.message}`);
    }
    result = measure(events, parseCriteria(raw), { asOf: o.asOf });
  } catch (err) {
    stderr.write(`${err.message}\n\n${USAGE}\n`);
    return 2;
  }
  const out = o.format === 'json' ? toJson(result) : o.format === 'csv' ? toCsv(result)
    : o.format === 'markdown' ? toMarkdown(result) : toText(result);
  if (o.output) await writeFile(o.output, `${out}\n`);
  else stdout.write(`${out}\n`);
  if (o.failOnMiss && missed(result).length) {
    stderr.write(`${missed(result).length} target(s) missed: ${missed(result).map((m) => m.key).join(', ')}\n`);
    return 1;
  }
  return 0;
}
