---
name: torbjorn-status
description: "Show torbjorn task loop progress and current state. Use when checking progress, viewing task state, or monitoring the loop."
allowed-tools: Bash(torb status *), Bash(torb tasks *), Bash(torb dashboard *), Bash(torbjorn status *), Bash(torbjorn tasks *), Bash(torbjorn dashboard *), Bash(go install github.com/thomas-sievering/torbjorn@latest)
---

# Torbjorn Status

Run `torbjorn status` and `torbjorn tasks` to show current state.

For a live web UI, suggest: `torbjorn dashboard` (default port 7070).

If torbjorn is not installed, install it:
```
go install github.com/thomas-sievering/torbjorn@latest
```

Present the results in a clear, concise format with task counts and any stuck tasks highlighted.
