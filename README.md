# mvp-metrics

Measures an MVP against the success criteria written before launch.

An MVP exists to answer a question, and the answer is in its numbers. This tool reads the product's events and the criteria you wrote before launch, and answers:

- How many users signed up, and how many reached the product's value within the days you allowed?
- How many came back in week 1, week 4, or the weeks you chose?
- What share paid?
- Did each number meet its target, miss it, or is there not enough data yet to say?
- How does each sign-up week compare with the others?

Plain JavaScript, no dependencies. It reads the files you give it and fetches nothing; the events stay on your machine.

```
npm test
```

```
# tests 15
# pass 15
# fail 0
```

## Quick start

Requires Node 22 or newer. There is nothing to install.

```
git clone https://github.com/INNERLUXES/mvp-metrics.git
cd mvp-metrics
npm run example
```

```
MVP metrics up to 2026-09-16: 160 users in the file, 160 signed up

Sign-ups [signed_up]: 160 users
Activation within 7 days [created_booking_page]: 50.6% (81 of 160 users), target 40.0%: met
Retention in week 1 [opened_dashboard]: 43.1% (69 of 160 users), target 35.0%: met
Retention in week 4 [opened_dashboard]: 31.3% (50 of 160 users), target 20.0%: met
Paid [paid]: 1.9% (3 of 160 users), target 5.0%: missed

By sign-up week:
  2026-06-01    29 sign-ups  activation 34.5%  week 1 48.3%  week 4 24.1%
  2026-06-08    21 sign-ups  activation 57.1%  week 1 57.1%  week 4 19.0%
  2026-06-15    18 sign-ups  activation 44.4%  week 1 38.9%  week 4 27.8%
  2026-06-22    23 sign-ups  activation 60.9%  week 1 47.8%  week 4 43.5%
  2026-06-29    18 sign-ups  activation 50.0%  week 1 38.9%  week 4 27.8%
  2026-07-06    12 sign-ups  activation 50.0%  week 1 25.0%  week 4 25.0%
  2026-07-13    25 sign-ups  activation 64.0%  week 1 32.0%  week 4 40.0%
  2026-07-20    14 sign-ups  activation 42.9%  week 1 50.0%  week 4 42.9%

A user is counted in a metric only when its whole window ends before the end of the data.
```

The booking tool in `examples/` is made up; its events are generated from a fixed seed by `examples/make-events.mjs`. The targets in `examples/criteria.json` are an example too: the tool has none built in.

## Your own data

| File | Shape |
|---|---|
| `--events events.csv` | columns `user`, `event`, `time` (ISO 8601) |
| `--criteria criteria.json` | the sign-up event, the activation, retention and paid events, their targets, and `min_users` |

[docs/inputs.md](docs/inputs.md) describes both files and how to choose targets, and [docs/metrics.md](docs/metrics.md) gives the exact rule behind every number.

## Options

| Option | What it does |
|---|---|
| `--as-of <YYYY-MM-DD>` | Measure up to that date instead of the last event |
| `--format text\|markdown\|json\|csv` | CSV has one line per metric, ready for a spreadsheet |
| `--output <file>` | Write the result to a file |
| `--fail-on-miss` | Exit 1 when a metric with enough data missed its target |

Exit codes: 0 done, 1 a target missed with `--fail-on-miss`, 2 wrong usage or invalid input.

## Rules that keep the numbers honest

- A user is measured only when their whole window can be seen, so recent sign-ups never pull a rate down.
- Fewer measured users than `min_users` gives "not enough data"; an event that never appears gives "not checked". Neither is ever shown as met or missed.
- Every bad row stops the run with its line number.
- The numbers say how many, not why; [docs/limits.md](docs/limits.md) lists what they cannot tell.

## As a library

```js
import { parseEvents, parseCriteria, measure, toMarkdown } from './src/index.js';

const result = measure(parseEvents(csvText), parseCriteria(JSON.parse(criteriaText)));
console.log(toMarkdown(result));
```

## How this repository is kept

- No runtime dependencies, a committed lock file, `npm ci` in the pipeline.
- Tests on Linux, Windows and macOS with Node 22 and 24, CodeQL, and repository checks for syntax, exports, credentials and leftovers.
- Every workflow sets its token permissions and pins every action to a full commit hash; Dependabot keeps them current.
- The pipeline checks the repository against NIST SP 800-218 with [ssdf-repo-check](https://github.com/INNERLUXES/ssdf-repo-check).
- Releases come with a CycloneDX SBOM, SHA-256 checksums and a build provenance attestation.
- [SECURITY.md](SECURITY.md), [threat model](docs/threat-model.md), [secure defaults](docs/secure-defaults.md), [design decisions](docs/decisions).

## Related

Built by the team behind [MVP development services at INNERLUXES](https://innerluxes.dev/software-development/mvp).

## License

MIT
