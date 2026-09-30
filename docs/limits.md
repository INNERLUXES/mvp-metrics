# What the numbers cannot tell

- **Whether the events are right.** An event sent twice, or not sent on one platform, changes every rate. Check the tracking before trusting the result.
- **Why users did what they did.** The numbers say how many; interviews with users say why. An MVP needs both.
- **Small samples.** With a few dozen users, one person more or less moves a rate by several points. `min_users` stops a verdict below a floor, but a result just above it is still uncertain.
- **Paid share over time.** Users who signed up late have had less time to pay; compare by sign-up week or use `--as-of`.
- **Time zones.** Weeks start on Monday UTC. A product used mostly in one time zone may see a few events land in the neighbouring day.
