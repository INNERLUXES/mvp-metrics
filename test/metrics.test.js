import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCriteria, measure, missed, weekOf, DAY } from '../src/index.js';

const T0 = Date.parse('2026-03-02T10:00:00Z'); // a Monday
const ev = (user, event, day) => ({ user, event, time: T0 + day * DAY });
const crit = (extra = {}) => parseCriteria({ signup: 'signup', activation: { event: 'act', within_days: 7 }, retention: { event: 'open', weeks: [1] }, paid: { event: 'pay' }, min_users: 1, ...extra });
const get = (r, key) => r.metrics.find((m) => m.key === key);

test('weekOf: the Monday of the week, in UTC', () => {
  assert.equal(weekOf(Date.parse('2026-03-02T00:00:00Z')), '2026-03-02');
  assert.equal(weekOf(Date.parse('2026-03-08T23:59:00Z')), '2026-03-02');
  assert.equal(weekOf(Date.parse('2026-03-09T00:00:00Z')), '2026-03-09');
});

test('activation: only users whose whole window is visible are counted', () => {
  const events = [ev('a', 'signup', 0), ev('a', 'act', 3), ev('b', 'signup', 0), ev('b', 'act', 9), ev('c', 'signup', 20), ev('c', 'act', 21), ev('z', 'x', 22)];
  const m = get(measure(events, crit()), 'activation');
  // c signed up two days before the end of the data: not measured yet; b acted too late
  assert.deepEqual([m.count, m.eligible, m.rate], [1, 2, 0.5]);
});

test('retention: the event must fall in that week after sign-up', () => {
  const events = [ev('a', 'signup', 0), ev('a', 'open', 8), ev('b', 'signup', 0), ev('b', 'open', 3), ev('c', 'signup', 0), ev('c', 'open', 15), ev('z', 'x', 30)];
  const m = get(measure(events, crit()), 'retention_week_1');
  assert.deepEqual([m.count, m.eligible], [1, 3]);
});

test('paid: any time after sign-up, before the end', () => {
  const events = [ev('a', 'signup', 0), ev('a', 'pay', 40), ev('b', 'signup', 0), ev('b', 'pay', -1), ev('c', 'signup', 1)];
  const m = get(measure(events, crit()), 'paid');
  assert.deepEqual([m.count, m.eligible], [1, 3]);
});

test('verdicts: met, missed, not enough data, not checked, no target', () => {
  // 'open' appears (in week 0), but nobody opens in week 1, so week 1 retention is measured and missed
  const events = [ev('a', 'signup', 0), ev('a', 'act', 1), ev('a', 'open', 2), ev('b', 'signup', 0), ev('z', 'x', 30)];
  const r = measure(events, crit({ targets: { activation: 0.4, paid: 0.1, retention_week_1: 0.1 } }));
  assert.equal(get(r, 'activation').verdict, 'met');
  assert.equal(get(r, 'paid').verdict, 'not checked');
  assert.match(get(r, 'paid').note, /never appears/);
  assert.equal(get(r, 'retention_week_1').verdict, 'missed');
  assert.equal(get(r, 'signup').verdict, 'no target');
  assert.deepEqual(missed(r).map((m) => m.key), ['retention_week_1']);
  const few = measure(events, crit({ min_users: 5, targets: { activation: 0.4 } }));
  assert.equal(get(few, 'activation').verdict, 'not enough data');
  assert.deepEqual(missed(few), []);
});

test('as of a date: later events are left out and counted', () => {
  const events = [ev('a', 'signup', 0), ev('a', 'act', 2), ev('b', 'signup', 10), ev('z', 'x', 30)];
  const r = measure(events, crit(), { asOf: T0 + 8 * DAY });
  assert.equal(r.signups, 1);
  assert.equal(r.ignoredAfterEnd, 2);
  assert.equal(r.end.slice(0, 10), '2026-03-10');
});

test('cohorts: one row per sign-up week with its own rates', () => {
  const events = [ev('a', 'signup', 0), ev('a', 'act', 1), ev('b', 'signup', 7), ev('z', 'x', 40)];
  const r = measure(events, crit());
  assert.deepEqual(r.cohorts.map((c) => [c.week, c.signups, c.activation.rate]), [['2026-03-02', 1, 1], ['2026-03-09', 1, 0]]);
  assert.ok(r.cohorts[0].retention[1]);
});
