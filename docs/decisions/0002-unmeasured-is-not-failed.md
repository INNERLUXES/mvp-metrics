# 2. A user who cannot be measured yet is not a failure

## Context

The simplest way to count activation is "activated users divided by all users". It is wrong for a growing product: the newest users have not had their seven days, and they drag the rate down more the faster the product grows.

## Decision

- Each metric measures only users whose whole window ends before the end of the data.
- The report shows how many users were measured for each metric, next to the rate.
- Below `min_users` measured users, the verdict is "not enough data".

## Consequences

- Rates arrive later than a naive count would give them, and they are the rates that hold up.
