# Threat model

The tool reads an export of what users did, which is personal data even with ids in place of names, and prints numbers that may decide whether a product is built or stopped. The risks are a wrong number that looks right, and the data going where it should not.

| Threat | Response |
|---|---|
| A malformed row is dropped and a rate changes | Every row is checked; the run stops and names each bad row. |
| Recent sign-ups make a healthy product look worse | Only users whose whole window can be seen are measured, and the count is shown. |
| A misspelled event name reads as a 0% rate | An event that never appears gives "not checked". |
| A verdict is given on too few users | Below `min_users` the verdict is "not enough data". |
| Targets are adjusted after seeing the numbers | Targets live in a criteria file meant to be written and versioned before launch; the tool has none of its own. |
| An event name runs as a formula when the CSV is opened | Cells that start with a formula character are prefixed with an apostrophe. |
| The data leaves the machine | The tool opens no network connection and writes a file only when `--output` is given. |

## Outside this model

- Whether the events were tracked correctly; docs/limits.md says why.
- A modified copy of the tool. Install from a release and check the attestation and checksums.
