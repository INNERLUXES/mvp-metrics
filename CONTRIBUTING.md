# Contributing

Every change goes through a pull request and is reviewed before it is merged. The pipeline runs the tests on Linux, Windows and macOS, the repository checks, CodeQL, and a secure development check of the repository itself.

## Adding or changing a metric

1. Describe how it is counted in docs/metrics.md first, including which users are measured and which are not yet.
2. Add a test with a few made-up users where the expected number can be worked out by hand.
3. A user whose window has not ended is left out, never counted as a failure.
4. Too few users gives "not enough data", an event that never appears gives "not checked", in every format.

## Rules for the code

- No runtime dependencies. Node 22 or newer and nothing else.
- The tool reads the files it is given and writes only when `--output` is given. It opens no network connection.
- No built-in targets. The targets come from the criteria file, written before launch.
- Never commit real user events, even as a test fixture. The example is generated from a fixed seed by examples/make-events.mjs.

## Before you open the pull request

```
npm test
npm run check
npm run example
```
