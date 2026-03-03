---
name: torbjorn-add
description: "Add a single task to the torbjorn queue. Use when user says 'add task' or 'torbjorn add'."
argument-hint: "[task description]"
allowed-tools: Bash(torb add *), Bash(torbjorn add *), Bash(go install github.com/thomas-sievering/torbjorn@latest), Bash(torbjorn tasks *)
---

# Torbjorn Add

Run `torbjorn add "$ARGUMENTS"` and report the result to the user.

If torbjorn is not installed, install it:
```
go install github.com/thomas-sievering/torbjorn@latest
```
