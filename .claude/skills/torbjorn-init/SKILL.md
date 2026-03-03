---
name: torbjorn-init
description: "Initialize torbjorn in the current project. Use when user says 'torbjorn init', 'init torbjorn', or 'set up torbjorn'."
allowed-tools: Bash(torb *), Bash(torbjorn *), Bash(go install *)
---

# Torbjorn Init

Run `torbjorn init` in the current directory. Do not explore the codebase first.

If torbjorn is not installed, install it:
```
go install github.com/thomas-sievering/torbjorn@latest
```

Report the result to the user.
