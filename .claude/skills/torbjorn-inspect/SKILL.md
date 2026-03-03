---
name: torbjorn-inspect
description: "Analyze torbjorn loop logs for recurring failure patterns. Use when user says 'inspect logs', 'check failures', or 'torbjorn inspect'."
allowed-tools: Bash(torb inspect *), Bash(torbjorn inspect *), Bash(go install github.com/thomas-sievering/torbjorn@latest)
---

# Torbjorn Inspect

Run `torbjorn inspect` to analyze loop logs for recurring failure patterns.

If torbjorn is not installed, install it:
```
go install github.com/thomas-sievering/torbjorn@latest
```

Report the findings to the user, highlighting critical and high severity issues first.
