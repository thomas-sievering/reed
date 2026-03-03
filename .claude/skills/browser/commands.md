# playwright-cli Command Reference

Full command reference. Only load this when you need to look up a specific command.

## Navigation

```bash
playwright-cli open <url>              # open page (headless)
playwright-cli open <url> --headed     # open with visible browser
playwright-cli goto <url>              # navigate existing page
playwright-cli reload                  # reload current page
playwright-cli go-back                 # browser back
playwright-cli go-forward              # browser forward
playwright-cli close                   # close browser
```

## Inspection

```bash
playwright-cli snapshot                # accessibility tree (text-based, cheap)
playwright-cli snapshot --filename=x   # save snapshot to specific file
playwright-cli screenshot              # full page screenshot
playwright-cli screenshot --filename=x # named screenshot
playwright-cli console                 # JS console output
playwright-cli network                 # network requests/responses
```

## Interaction

```bash
playwright-cli click <ref>             # click element by ref from snapshot
playwright-cli dblclick <ref>          # double click
playwright-cli fill <ref> "text"       # fill input field (clears first)
playwright-cli type "text"             # type into focused element
playwright-cli press <key>             # press key (Enter, Tab, Escape, etc.)
playwright-cli check <ref>             # check checkbox/radio
playwright-cli uncheck <ref>           # uncheck checkbox
playwright-cli select <ref> "value"    # select dropdown option
playwright-cli hover <ref>             # hover over element
playwright-cli drag <start> <end>      # drag and drop between refs
```

## Mouse and keyboard

```bash
playwright-cli keydown <key>           # key down event
playwright-cli keyup <key>             # key up event
playwright-cli mousemove <x> <y>       # move mouse to coordinates
playwright-cli mousedown [button]      # mouse button down
playwright-cli mouseup [button]        # mouse button up
playwright-cli mousewheel <dx> <dy>    # scroll
```

## Tabs

```bash
playwright-cli tab-list                # list all tabs
playwright-cli tab-new [url]           # open new tab
playwright-cli tab-select <index>      # switch to tab by index
playwright-cli tab-close [index]       # close tab
```

## Sessions

Named sessions for parallel browser instances:

```bash
playwright-cli -s=<name> open <url>    # open in named session
playwright-cli -s=<name> screenshot    # screenshot in session
playwright-cli -s=<name> click e5      # interact in session
playwright-cli -s=<name> close         # close session
playwright-cli -s=<name> delete-data   # delete session data
playwright-cli list                    # list all active sessions
playwright-cli close-all               # close all sessions
playwright-cli kill-all                # force kill all browsers
```

## Persistence

Browser profile is in-memory by default (cookies survive during session, lost on close):

```bash
playwright-cli open <url> --persistent              # persist to disk
playwright-cli open <url> --profile=/path/to/dir    # custom profile dir
```

## DevTools

```bash
playwright-cli console                 # stream console messages
playwright-cli network                 # stream network activity
playwright-cli tracing-start           # start recording trace
playwright-cli tracing-stop            # stop and save trace
```

## Browser selection

```bash
playwright-cli open --browser=chromium   # default
playwright-cli open --browser=chrome     # Google Chrome
playwright-cli open --browser=firefox
playwright-cli open --browser=webkit
playwright-cli open --browser=msedge
```

## Visual dashboard

```bash
playwright-cli show                    # live dashboard of all sessions
```

## Configuration

Create `.playwright/cli.config.json` for persistent settings:

```json
{
  "browser": {
    "browserName": "chromium",
    "headless": true
  },
  "outputDir": "./playwright-output"
}
```

Environment variables:
- `PLAYWRIGHT_MCP_BROWSER` — browser to use
- `PLAYWRIGHT_MCP_HEADLESS` — true/false
- `PLAYWRIGHT_MCP_VIEWPORT_SIZE` — e.g. "1280x720"
- `PLAYWRIGHT_MCP_CONSOLE_LEVEL` — error, warning, info, debug
