# reed — Minimal Markdown Reader

## Overview

reed is a minimal, fast markdown reader built with Tauri v2. It renders `.md` files with clean typography and nothing else. No editor, no tabs, no bloat. Opens from file explorer or CLI.

## Goals

- **Fast**: Sub-second startup. Feels like opening a text file, not launching an app.
- **Minimal**: The window is the document. No chrome, no distractions.
- **Cross-platform**: Windows (.exe) and macOS (.dmg/.app). Linux is a bonus.
- **Agentic-friendly**: Auto-reloads on file changes. Useful when AI agents are editing files you're reading.

## Architecture

```
reed/
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs         # App entry, CLI arg handling
│   │   ├── markdown.rs     # File reading + markdown→HTML conversion
│   │   └── watcher.rs      # File change detection
│   ├── Cargo.toml
│   └── tauri.conf.json
├── ui/                     # Frontend (no framework)
│   ├── index.html
│   ├── style.css
│   └── main.js
├── package.json
└── spec.md
```

### Backend (Rust)

- **Markdown parsing**: `pulldown-cmark` with GFM extensions (tables, strikethrough, task lists, footnotes).
- **Syntax highlighting**: `syntect` for fenced code blocks. Generates inline CSS — no JS highlighter needed.
- **File watching**: `notify` crate. Watches the open file, emits event to frontend on change.
- **CLI**: `reed <file.md>` opens the file. No args shows a minimal "drop a file here" prompt or file picker.

### Frontend (Plain HTML/CSS/JS)

- Single `index.html` with a content container.
- Receives rendered HTML from backend via Tauri commands.
- Handles theme toggle and scroll position preservation on reload.

## UI Specification

### Window

- Default size: 900×700.
- Min size: 400×300.
- Title bar: system default, window title = filename (e.g. `CLAUDE.md — reed`).
- No custom menu bar. No toolbar. No sidebar.

### Content Area

- Rendered markdown fills the window.
- Max content width: 720px, centered horizontally.
- Vertical padding: 48px top, 80px bottom.
- Horizontal padding: 32px (scales down on narrow windows).
- Smooth scroll behavior.

### Typography

- **Body**: System font stack — `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- **Code (inline)**: `"SF Mono", "Cascadia Code", "JetBrains Mono", "Fira Code", Consolas, monospace`.
- **Code (blocks)**: Same monospace stack. Background-tinted container with 16px padding, rounded corners (6px), horizontal scroll on overflow.
- **Base font size**: 16px. Line height: 1.7.
- **Headings**: h1 2.0em, h2 1.5em, h3 1.25em, h4–h6 1.0em. Bold. h1 and h2 get a subtle bottom border.
- **Links**: Accent color, underline on hover.
- **Blockquotes**: Left border (3px), muted text color, italic.
- **Tables**: Full width, subtle borders, alternating row tint.
- **Task lists**: Styled checkboxes (read-only).
- **Images**: Max-width 100%, centered, subtle border-radius.
- **Horizontal rules**: Subtle, full-width, generous vertical margin.

### Theme

Two themes: **dark** (default) and **light**.

| Token              | Dark           | Light          |
|--------------------|----------------|----------------|
| `--bg`             | `#1a1a2e`      | `#ffffff`      |
| `--bg-secondary`   | `#232340`      | `#f5f5f7`      |
| `--text`           | `#e0e0e0`      | `#1d1d1f`      |
| `--text-muted`     | `#888899`      | `#6e6e73`      |
| `--accent`         | `#7c9fff`      | `#0066cc`      |
| `--border`         | `#2a2a45`      | `#d2d2d7`      |
| `--code-bg`        | `#16162a`      | `#f0f0f2`      |

- Toggle: Small icon button, fixed top-right corner (sun/moon icon, pure CSS or inline SVG). Fades in on hover near the top of the window, always visible on narrow screens.
- Shortcut: `Ctrl+D` (Windows/Linux) / `Cmd+D` (macOS).
- Preference persisted to `~/.config/reed/config.json` (or platform equivalent).
- Transition: Smooth 200ms on background and color properties.

## Behavior

### File Opening

1. **CLI**: `reed path/to/file.md` — opens and renders the file.
2. **File association**: Registers as handler for `.md` and `.markdown` on install.
3. **Drag and drop**: Drop a `.md` file onto the window to open it.
4. **No file**: If launched with no args, show a centered message: "Drop a markdown file here or open one from the command line" with an "Open File" button that triggers a native file dialog.

### File Watching / Auto-Reload

- Backend watches the open file using the `notify` crate.
- On detected change (write/modify event), re-read and re-parse the file.
- Frontend receives updated HTML, replaces content, and preserves scroll position (by percentage).
- Debounce: 200ms to handle rapid successive writes.

### Keyboard Shortcuts

| Shortcut              | Action              |
|-----------------------|---------------------|
| `Ctrl/Cmd + D`       | Toggle dark/light   |
| `Ctrl/Cmd + O`       | Open file dialog    |
| `Ctrl/Cmd + W`       | Close window        |
| `Ctrl/Cmd + Q`       | Quit app            |
| `F5`                  | Manual reload       |

### Edge Cases

- **Binary/non-UTF8 files**: Show error message in the content area.
- **Empty files**: Show a muted "Empty file" message.
- **Very large files (>1MB)**: Render anyway, but skip syntax highlighting for performance.
- **File deleted while open**: Show "File not found" message, keep watching in case it's recreated.
- **No file permissions**: Show error with the path.

## Build & Distribution

### Dependencies (Rust / Cargo.toml)

- `tauri` v2
- `pulldown-cmark` — markdown to HTML
- `syntect` — syntax highlighting
- `notify` — file watching
- `serde` / `serde_json` — config serialization
- `dirs` — platform config directory

### Dependencies (Frontend / package.json)

- `@tauri-apps/api` — Tauri JS bindings
- `@tauri-apps/cli` — build tooling
- Dev only. No runtime JS dependencies.

### Build Targets

- **Windows**: `.exe` installer (NSIS) + portable `.exe`.
- **macOS**: `.dmg` with `.app` bundle.
- Build via `cargo tauri build`.

### File Associations

Configured in `tauri.conf.json`:
- Extensions: `.md`, `.markdown`
- MIME: `text/markdown`

## Non-Goals

- Editing markdown.
- Multiple tabs or split views.
- Plugin system.
- Built-in search (webview Ctrl+F is sufficient).
- Auto-updater.
- Telemetry.

## Future Considerations (Not in v1)

- Frontmatter display (YAML/TOML metadata blocks).
- Mermaid / KaTeX diagram rendering.
- Print / export to PDF.
- Custom CSS theme loading from config.
- Table of contents sidebar (toggle).
