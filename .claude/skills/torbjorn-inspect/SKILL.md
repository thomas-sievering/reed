---
name: torbjorn-inspect
description: "Analyze torbjorn loop logs for recurring failure patterns."
allowed-tools: Bash(torb inspect *), Bash(torbjorn inspect *), Bash(go install *)
---

# Torbjorn Inspect

Run `torbjorn inspect` to analyze loop logs for recurring failure patterns.

If torbjorn is not installed, install it:
```
go install github.com/thomas-sievering/torbjorn@latest
```

Report the findings to the user, highlighting critical and high severity issues first.
