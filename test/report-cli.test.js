import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCriteria, measure, toText, toMarkdown, toJson, toCsv, parseArgs, main } from '../src/index.js';

const EX = join(fileURLToPath(import.meta.url), '..', '..', 'examples');
const DAY = 86400000;
const T0 = Date.parse('2026-03-02T10:00:00Z');
const sample = () => measure(
  [{ user: 'a', event: 'signup', time: T0 }, { user: 'a', event: 'act', time: T0 + DAY }, { user: 'b', event: 'signup', time: T0 }, { user: 'z', event: 'x', time: T0 + 30 * DAY }],
  parseCriteria({ signup: 'signup', activation: { event: 'act' }, paid: { event: '=pay' }, targets: { activation: 0.4, paid: 0.1 }, min_users: 5 })
);

function sink() {
  let data = '';
  return { write(s) { data += s; }, get text() { return data; } };
}

test('every format carries "not enough data" and "not checked"', () => {
  const r = sample();
  for (const out of [toText(r), toMarkdown(r)]) {
    assert.match(out, /not enough data/);
    assert.match(out, /never appears/);
  }
  const j = JSON.parse(toJson(r));
  assert.deepEqual(j.metrics.map((m) => m.verdict), ['no target', 'not enough data', 'not checked']);
  assert.match(toCsv(r), /^activation,act,0\.5000,1,2,0\.4,not enough data,$/m);
  assert.match(toCsv(r), /^paid,'=pay,/m);
});

test('text: a line per metric and the week table', () => {
  const t = toText(sample());
  assert.match(t, /^MVP metrics up to 2026-04-01: 3 users in the file, 2 signed up/);
  assert.match(t, /Activation within 7 days \[act\]: 50\.0% \(1 of 2 users\), target 40\.0%: not enough data/);
  assert.match(t, /2026-03-02 +2 sign-ups  activation 50\.0%/);
});

test('parseArgs', () => {
  const o = parseArgs(['--events', 'e.csv', '--criteria', 'c.json', '--as-of', '2026-05-01', '--fail-on-miss']);
  assert.equal(o.asOf, Date.parse('2026-05-01T23:59:59.999Z'));
  assert.equal(o.failOnMiss, true);
  assert.throws(() => parseArgs(['--events', 'e.csv']), /are required/);
  assert.throws(() => parseArgs(['--events', 'e', '--criteria', 'c', '--as-of', '1 May']), /YYYY-MM-DD/);
  assert.throws(() => parseArgs(['--events', 'e', '--criteria', 'c', '--format', 'xml']), /unknown format/);
  assert.throws(() => parseArgs(['--events']), /needs a value/);
  assert.throws(() => parseArgs(['--nope', 'x']), /unknown option/);
  assert.equal(parseArgs(['--help']).help, true);
});

test('the example, --fail-on-miss, --output and bad input', async (t) => {
  const args = ['--events', join(EX, 'events.csv'), '--criteria', join(EX, 'criteria.json')];
  const out = sink();
  assert.equal(await main(args, { stdout: out, stderr: sink() }), 0);
  assert.match(out.text, /Paid \[paid\]: 1\.9% \(3 of 160 users\), target 5\.0%: missed/);
  const err = sink();
  assert.equal(await main([...args, '--fail-on-miss'], { stdout: sink(), stderr: err }), 1);
  assert.match(err.text, /1 target\(s\) missed: paid/);
  const d = await mkdtemp(join(tmpdir(), 'mm-'));
  t.after(() => rm(d, { recursive: true, force: true }));
  assert.equal(await main([...args, '--format', 'json', '--output', join(d, 'r.json')], { stdout: sink(), stderr: sink() }), 0);
  assert.equal(JSON.parse(await readFile(join(d, 'r.json'), 'utf8')).signups, 160);
  await writeFile(join(d, 'bad.json'), '{ nope');
  const e2 = sink();
  assert.equal(await main(['--events', join(EX, 'events.csv'), '--criteria', join(d, 'bad.json')], { stdout: sink(), stderr: e2 }), 2);
  assert.match(e2.text, /is not valid JSON/);
  assert.equal(await main(['--events', join(d, 'missing.csv'), '--criteria', join(EX, 'criteria.json')], { stdout: sink(), stderr: sink() }), 2);
  const help = sink();
  assert.equal(await main(['--help'], { stdout: help, stderr: sink() }), 0);
  assert.match(help.text, /Exit codes/);
});
