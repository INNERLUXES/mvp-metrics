# Changes

## 1.0.0

First release.

- Sign-ups, activation within a number of days, retention in chosen weeks, and the share who paid, from a CSV of events.
- Verdicts against targets written before launch: met, missed, not enough data, or not checked.
- Only users whose whole window can be seen are measured, so recent sign-ups never pull a rate down.
- A table by sign-up week, and `--as-of` to measure up to a chosen date.
- Reports as text, Markdown, JSON and CSV; `--fail-on-miss` for use in a pipeline.
- Release packages come with a CycloneDX SBOM, SHA-256 checksums and a build provenance attestation.
