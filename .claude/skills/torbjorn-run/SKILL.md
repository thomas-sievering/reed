---
name: torbjorn-run
description: "Start the torbjorn task loop."
argument-hint: "[--model sonnet|opus] [--dry-run]"
allowed-tools: Bash(torb *), Bash(torbjorn *), Bash(go install *)
---

# Torbjorn Run

Run `torbjorn run $ARGUMENTS` and report the output to the user.

If torbjorn is not installed, install it:
```
go install github.com/thomas-sievering/torbjorn@latest
```

After starting, inform the user:
- "Use `/torbjorn-status` to check progress."
- "To pause: `torbjorn pause`"
- "To stop: `torbjorn stop`"
