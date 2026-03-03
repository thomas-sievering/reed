---
name: torbjorn-add
description: "Add a single task to the torbjorn queue."
argument-hint: "[task description]"
allowed-tools: Bash(torb *), Bash(torbjorn *), Bash(go install *)
---

# Torbjorn Add

Run `torbjorn add "$ARGUMENTS"` and report the result to the user.

If torbjorn is not installed, install it:
```
go install github.com/thomas-sievering/torbjorn@latest
```
