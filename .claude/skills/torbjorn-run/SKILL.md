---
name: torbjorn-run
description: "Start the torbjorn task loop. Use when user says 'run torbjorn', 'start the loop', or 'torbjorn run'."
argument-hint: "[--dashboard [--port N]]"
allowed-tools: Bash(torb run *), Bash(torb status *), Bash(torb dashboard *), Bash(torb pause *), Bash(torb stop *), Bash(torbjorn run *), Bash(torbjorn status *), Bash(torbjorn dashboard *), Bash(torbjorn pause *), Bash(torbjorn stop *), Bash(go install github.com/thomas-sievering/torbjorn@latest)
---

# Torbjorn Run

Run `torbjorn run $ARGUMENTS` and report the output to the user.

Options:
- `--dashboard` — also start the live web UI (default port 7070)
- `--dashboard --port 8080` — web UI on custom port

Model escalation is configured in `.torbjorn/config.toml`, not via CLI flags.

If torbjorn is not installed, install it:
```
go install github.com/thomas-sievering/torbjorn@latest
```

After starting, inform the user:
- "Use `/torbjorn-status` to check progress."
- "Dashboard: `torbjorn dashboard` or rerun with `--dashboard`"
- "To pause: `torbjorn pause`"
- "To stop: `torbjorn stop`"
