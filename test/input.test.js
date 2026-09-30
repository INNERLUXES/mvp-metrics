import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEvents, parseCriteria } from '../src/index.js';

test('parseEvents: columns in any order, dates and date-times, BOM and quotes', () => {
  const ev = parseEvents('﻿time,user,event\n2026-01-05,a,signed_up\n"2026-01-06T10:00:00Z",a,"paid"\n2026-01-07 08:30,b,signed_up\n');
  assert.equal(ev.length, 3);
  assert.equal(ev[0].time, Date.parse('2026-01-05T00:00:00Z'));
  assert.deepEqual(ev[1], { user: 'a', event: 'paid', time: Date.parse('2026-01-06T10:00:00Z') });
  assert.equal(ev[2].user, 'b');
});

test('parseEvents: every bad row is named, none is skipped', () => {
  let msg = '';
  try { parseEvents('user,event,time\n,signed_up,2026-01-01\na,,2026-01-01\nb,x,yesterday\nc,x\n'); } catch (err) { msg = err.message; }
  assert.match(msg, /line 2: user is empty/);
  assert.match(msg, /line 3: event is empty/);
  assert.match(msg, /line 4: time "yesterday" is not an ISO 8601 date/);
  assert.match(msg, /line 5: expected 3 values, found 2/);
  assert.throws(() => parseEvents(''), /the file is empty/);
  assert.throws(() => parseEvents('user,event\n'), /missing column\(s\) time/);
  assert.throws(() => parseEvents('user,event,time\n'), /no events/);
});

test('parseCriteria: defaults and a full set', () => {
  const c = parseCriteria({ signup: 's', activation: { event: 'a' }, retention: { event: 'r', weeks: [4, 1, 4] }, paid: { event: 'p' }, targets: { activation: 0.4, retention_week_4: 0.2 }, min_users: 10 });
  assert.deepEqual(c, { signup: 's', minUsers: 10, targets: { activation: 0.4, retention_week_4: 0.2 }, activation: { event: 'a', withinDays: 7 }, retention: { event: 'r', weeks: [1, 4] }, paid: { event: 'p' } });
  assert.equal(parseCriteria({ signup: 's' }).minUsers, 30);
});

test('parseCriteria: every mistake is listed', () => {
  let msg = '';
  try { parseCriteria({ activation: { within_days: 0 }, retention: { event: 'r', weeks: [0] }, paid: {}, targets: { activation: 2, retention_week_9: 0.1, nps: 0.5 }, min_users: 0 }); } catch (err) { msg = err.message; }
  for (const part of ['signup: the name', 'activation.event', 'activation.within_days', 'retention.weeks', 'paid.event', 'min_users', 'targets.activation: a share', 'targets.retention_week_9: not a measured metric', 'targets.nps']) assert.ok(msg.includes(part), part);
  assert.throws(() => parseCriteria([]), /must be an object/);
});
