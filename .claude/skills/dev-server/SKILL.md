---
name: dev-server
description: Detect or start the project's dev server and cache the result. Use when a dev server URL is needed but unknown.
allowed-tools: Write, Edit, Bash(lsof *), Bash(npm run *), Bash(npx *), Bash(yarn *), Bash(pnpm *), Bash(cat .dev-server.json *), Bash(cat package.json *), Bash(ls *), Bash(sleep *), Bash(kill -0 *)
---

Detect the project's dev server, start it if needed, and cache the result in `.dev-server.json` so other skills (like `/browser`) can resolve the URL instantly on subsequent runs.

## Existing config

!`cat .dev-server.json 2>/dev/null && echo "^^^ cached config found — verify it is still accurate" || echo "No .dev-server.json found — need to detect or create one"`

## Active ports

!`lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null | grep -E ':(3000|3001|4173|4200|5173|5174|8080|8081|8888)\b' | head -10 || echo "No dev servers detected"`

## Project info

!`cat package.json 2>/dev/null | grep -A8 '"scripts"' | grep -E '"(dev|start|serve|preview)"' || echo "No dev scripts found"`

!`ls vite.config.* next.config.* angular.json nuxt.config.* svelte.config.* remix.config.* astro.config.* webpack.config.* 2>/dev/null || echo "No framework config detected"`

## Detection logic

Follow this order. Stop at the first success.

### 1. Cached config exists and server is live

If `.dev-server.json` exists, read the `port` and verify it's still listening:
```bash
lsof -iTCP:<port> -sTCP:LISTEN -P -n 2>/dev/null
```
If listening → done, config is valid.
If not listening → config is stale, continue to step 2.

### 2. Server is already running

If exactly one dev server port is detected above → record it.
If multiple → check which one matches this project's framework:
- `vite.config.*` → likely 5173
- `next.config.*` → likely 3000
- `angular.json` → likely 4200
- If still ambiguous and running interactively, ask the user. If autonomous, pick the one matching the framework config.

### 3. No server running — start one

Determine the start command from the detected scripts above:
- `dev` script exists → `npm run dev`
- `start` script exists → `npm run start`
- `serve` script exists → `npm run serve`

Determine the expected port from the framework config:
- Vite → 5173
- Next.js → 3000
- Angular → 4200
- CRA → 3000
- If unknown → 3000 as fallback

Start the server and wait:
```bash
npm run dev &
DEV_SERVER_PID=$!

# wait for port (max 30s)
for i in $(seq 1 60); do
  lsof -iTCP:<expected_port> -sTCP:LISTEN -P -n 2>/dev/null && break
  sleep 0.5
done

# verify it's actually up
lsof -iTCP:<expected_port> -sTCP:LISTEN -P -n 2>/dev/null || echo "FAILED: server did not start within 30s"
```

### 4. Write .dev-server.json

Once a server is confirmed running, write the config:

```json
{
  "url": "http://localhost:<port>",
  "port": <port>,
  "command": "<the command used or detected>",
  "framework": "<detected framework or unknown>",
  "pid": <pid if we started it, null if it was already running>
}
```

Write to the project root. Add `.dev-server.json` to `.gitignore` if not already present.

### 5. Confirm

Report the result:
- URL that was detected/started
- Whether it was already running or freshly started
- Path to `.dev-server.json`

## Failure

If no server could be detected or started:
- Do NOT prompt in autonomous mode — fail with a clear error listing what was tried
- Report: what ports were scanned, what scripts were found, what was attempted
- Suggest the user start the server manually and re-run
