// Writes examples/events.csv: a made-up booking tool with 160 sign-ups over eight weeks. The numbers are generated from a
// fixed seed so the example output never changes; they show the shape of the data, not how any real product performs.
import { writeFileSync } from 'node:fs';

let seed = 42;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const DAY = 86400000;
const start = Date.parse('2026-06-01T09:00:00Z');
const rows = ['user,event,time'];
for (let i = 1; i <= 160; i++) {
  const user = `u${String(i).padStart(3, '0')}`;
  const at = start + Math.floor(rnd() * 56) * DAY + Math.floor(rnd() * 8) * 3600000;
  rows.push(`${user},signed_up,${new Date(at).toISOString()}`);
  if (rnd() < 0.48) rows.push(`${user},created_booking_page,${new Date(at + Math.floor(rnd() * 6) * DAY + 3600000).toISOString()}`);
  for (let w = 0; w < 8; w++) {
    if (rnd() < 0.42 - w * 0.03) rows.push(`${user},opened_dashboard,${new Date(at + (w * 7 + 1 + Math.floor(rnd() * 5)) * DAY).toISOString()}`);
  }
  if (rnd() < 0.04) rows.push(`${user},paid,${new Date(at + 10 * DAY).toISOString()}`);
}
writeFileSync(new URL('./events.csv', import.meta.url), `${rows.join('\n')}\n`);
console.log(`${rows.length - 1} events written`);
