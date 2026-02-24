# reed

A minimal, fast markdown reader built with [Tauri v2](https://v2.tauri.app). Opens `.md` files with clean typography and nothing else. No editor, no tabs, no bloat.

![Dark theme](https://img.shields.io/badge/theme-dark-1a1a2e) ![Light theme](https://img.shields.io/badge/theme-light-fafafa)

## Features

- **Fast** — Sub-second startup. Feels like opening a text file.
- **Minimal** — The window is the document. No chrome, no distractions.
- **Auto-reload** — Watches the open file for changes and re-renders instantly. Great for previewing files while an AI agent or editor modifies them.
- **Dark & light themes** — Toggle with `Ctrl+D`. Preference is persisted.
- **GFM support** — Tables, task lists, strikethrough, footnotes.
- **Syntax highlighting** — Fenced code blocks highlighted via [syntect](https://github.com/trevp/syntect).
- **Cross-platform** — Windows and macOS.

## Usage

```
reed path/to/file.md
```

Or launch without arguments to get a drop zone / file picker.

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + D` | Toggle dark/light theme |
| `Ctrl/Cmd + O` | Open file |
| `Ctrl/Cmd + W` | Close window |
| `Ctrl/Cmd + Q` | Quit |
| `F5` | Reload |

## Build

Requires [Rust](https://rustup.rs) and [Node.js](https://nodejs.org).

```bash
npm install
npx tauri dev     # development
npx tauri build   # production binary
```

## Stack

- **Backend**: Rust — [Tauri v2](https://v2.tauri.app), [pulldown-cmark](https://crates.io/crates/pulldown-cmark), [syntect](https://crates.io/crates/syntect), [notify](https://crates.io/crates/notify)
- **Frontend**: Plain HTML, CSS, JS — no framework, no bundler

## License

MIT
