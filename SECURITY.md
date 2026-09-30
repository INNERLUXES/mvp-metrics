# Security

## Reporting a problem

Write to info@innerluxes.dev with the subject line "mvp-metrics security", or use private vulnerability reporting on this repository. Please do not open a public issue for a vulnerability.

Include made-up event and criteria files that show the problem, what you expected and what happened. Do not send real user events.

## Scope

In scope:

- input that passes validation but produces a wrong number or a wrong verdict
- input that makes the tool hang or use unbounded memory
- a CSV result that runs as a formula when opened in a spreadsheet
- anything that makes the tool open a network connection, or read or write a file it was not given

Out of scope: whether the events describe what users really did; docs/limits.md lists what the numbers cannot tell.

Read [docs/threat-model.md](docs/threat-model.md) for the rest.
