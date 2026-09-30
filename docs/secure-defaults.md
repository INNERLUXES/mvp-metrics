# Secure defaults

| Setting | Default | Why |
|---|---|---|
| Bad rows | Stop and list them | A dropped row changes a rate without anyone knowing. |
| Users whose window has not ended | Left out of that metric | Counting them as failures makes rates fall as growth speeds up. |
| Fewer users than `min_users` | "not enough data" | A verdict on a handful of users is noise presented as a result. |
| An event that never appears | "not checked" | A typo in an event name must not read as a 0% rate. |
| Targets | None built in | What counts as success depends on the product and was written before launch. |
| Exit code | 0, unless `--fail-on-miss` is given | The tool reports by default; a pipeline decides whether a miss blocks it. |
| CSV cells | Formula characters prefixed with an apostrophe | Event names are free text and must not run in a spreadsheet. |
| Network | Never used | Event exports describe people's behaviour and stay on the machine. |
| Output | Terminal | Nothing is written to disk unless `--output` is given. |
