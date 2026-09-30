# How each metric is counted

All times are UTC. The end of the data is the last event in the file, or the end of the day given with `--as-of`; events after it are left out and counted in the notes.

| Metric | Who is measured | Who counts |
|---|---|---|
| Sign-ups | Every user with the sign-up event | The same; the first sign-up event is the user's start |
| Activation within N days | Users whose start is at least N days before the end of the data | Those with the activation event between their start and N days later |
| Retention in week k | Users whose start is at least k + 1 weeks before the end | Those with the retention event from day 7k to day 7(k + 1) after their start |
| Paid | Every user who signed up | Those with the paid event after their start and before the end |

## Why users are left out, not counted as failures

A user who signed up two days ago has not had seven days to activate. Counting them as "not activated" would make every rate fall as the product grows faster, which is the opposite of the truth. So each metric only measures users whose whole window can be seen, and the report shows how many that is.

The paid share is the one exception: it has no window, so recent users have had less time to pay. Compare it by sign-up week, or use `--as-of` to measure only older users.

## Verdicts

| Verdict | When |
|---|---|
| met | enough users were measured and the rate is at or above the target |
| missed | enough users were measured and the rate is below the target |
| not enough data | fewer users were measured than `min_users` (30 by default) |
| not checked | the event of that metric never appears in the file |
| no target | the criteria file sets no target for it |

Only "missed" makes `--fail-on-miss` exit with 1.

## By sign-up week

Users are grouped by the Monday (UTC) of the week they signed up, and each week gets its own activation and retention rates, measured the same way. A week at the end of the data shows "n/a" until its users can be measured.
