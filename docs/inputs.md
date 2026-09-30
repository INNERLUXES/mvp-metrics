# The two files

## events.csv

One event per line, with a header. The columns can be in any order; other columns are ignored.

| Column | What goes in it |
|---|---|
| `user` | Any stable id of the user or account. Never a name or an email address. |
| `event` | The event name, exactly as in the criteria file. |
| `time` | ISO 8601: `2026-05-04T10:15:00Z`, `2026-05-04 10:15`, or a date alone, which counts as midnight UTC. |

Most analytics tools and databases can export this shape. Keep only the events the criteria name; everything else is ignored anyway.

## criteria.json

Written before launch, and kept with the product's plan, so the MVP is judged by the questions asked before anyone saw the numbers.

```json
{
  "signup": "signed_up",
  "activation": { "event": "created_booking_page", "within_days": 7 },
  "retention": { "event": "opened_dashboard", "weeks": [1, 4] },
  "paid": { "event": "paid" },
  "targets": { "activation": 0.4, "retention_week_1": 0.35, "retention_week_4": 0.2, "paid": 0.05 },
  "min_users": 30
}
```

| Field | Required | Meaning |
|---|---|---|
| `signup` | yes | The event that starts a user's clock. |
| `activation` | no | The event that shows a user got the product's value, and the days they have to reach it (default 7). |
| `retention` | no | The event that shows a user came back, and the weeks to measure (default 1 and 4). |
| `paid` | no | The event of a first payment. |
| `targets` | no | A share from 0 to 1 for `activation`, `paid` and each `retention_week_<k>`. |
| `min_users` | no | Fewer measured users than this gives "not enough data" (default 30). |

## Choosing the targets

The tool has none built in. The right activation or retention for a booking tool is not the right one for a game. Write down what would make you build the full product, what would make you change course, and put the first of those numbers here.
