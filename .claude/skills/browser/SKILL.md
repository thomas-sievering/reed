---
name: browser
description: Browser automation via playwright-cli. Use when verifying UI, taking screenshots, checking console/network errors, or generating Playwright tests.
argument-hint: "[url]"
allowed-tools: Read, Bash(playwright-cli *), Bash(cat .dev-server.json)
---

Browser automation using playwright-cli. Token-efficient CLI — browser state stays on disk, not in context.

For the full command reference, see [commands.md](commands.md).
For test generation patterns, see [test-export.md](test-export.md).

## Environment

!`command -v playwright-cli 2>/dev/null && playwright-cli --version || echo "⚠ PLAYWRIGHT-CLI NOT INSTALLED — run: npm install -g @playwright/cli@latest"`

## Active browser sessions

!`playwright-cli list 2>/dev/null || echo "No active sessions"`

## Resolve the target URL

**Do not guess ports. Do not scan ports yourself.**

Resolution order:
1. **Argument** → `$ARGUMENTS` was passed, use it directly
2. **`.dev-server.json`** → read from project root: `cat .dev-server.json 2>/dev/null` — use the `url` field
3. **CLAUDE.md** → check for a dev URL in the project's CLAUDE.md
4. **None of the above** → invoke `/dev-server` to detect or start the server, then read the `.dev-server.json` it creates
5. **Still nothing** → fail with a clear message. Do NOT prompt when running autonomously.

## Quick verification (most common use)

Headless by default — no window, no disruption.

**Screenshot (visual check):**
```bash
playwright-cli open <url>
playwright-cli screenshot --filename=verify.png
playwright-cli close
```

**Snapshot (structural check — cheaper, no vision tokens):**
```bash
playwright-cli open <url>
playwright-cli snapshot
playwright-cli close
```

**Choose the right method:**
- Element existence, text content, structure → `snapshot` (text-based, cheap)
- Layout, styling, colors, visual appearance → `screenshot` (vision, costs more)
- Console errors, failed requests → `console` / `network`

Default to **snapshot** unless the task is specifically visual.

**Error check:**
```bash
playwright-cli open <url>
playwright-cli console
playwright-cli network
playwright-cli close
```

### Verify-and-retry pattern

For verifying the agent's own UI changes in a loop:

1. Snapshot or screenshot after the change
2. Compare against what was intended
3. If mismatch → adjust code, then `playwright-cli reload` and verify again
4. **Max 3 retries**, then fail with what was observed vs what was expected

Always close the browser when done, even on failure.

## Test export

When a flow works and should be locked down as a regression test, see [test-export.md](test-export.md) for patterns and conventions.

## Element references

After `snapshot` or most commands, playwright-cli returns refs like `e1`, `e4`, `e15`. Use these in subsequent interaction commands. Refs become stale after navigation or major DOM updates — take a new snapshot to refresh them.

## When to use --headed

Headless is the default and preferred. Only use `--headed` when:
- The user explicitly asks to watch the browser
- Debugging a flow that isn't working
- Manual intervention needed (CAPTCHA, OAuth)

## Rules

- Don't screenshot everything — prefer snapshot for non-visual checks
- Don't leave browsers open — always close when done, even on failure
- Don't guess ports — follow the resolution order above
- Don't run headed by default — it steals focus and wastes time
- Don't prompt for user input when running autonomously — fail cleanly instead
- Don't reuse stale element refs after navigation — take a fresh snapshot
