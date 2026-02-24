# Learnings

- This is a Tauri v2 project. Tauri v2 uses `@tauri-apps/cli@^2` and `@tauri-apps/api@^2`. The Rust crate is `tauri = "2"`.
- Project root is D:/personal/projects/reed. Rust code goes in src-tauri/, frontend in ui/.
- Tauri v2 uses `tauri::Builder` with `.invoke_handler(tauri::generate_handler![...])` for commands.
- Tauri v2 events use `app.emit("event-name", payload)` from Rust and `listen("event-name", callback)` from JS via `@tauri-apps/api/event`.
- For file watching, use `notify` crate v6+ with `RecommendedWatcher`.
- For CLI args in Tauri v2, use `std::env::args()` in setup closure.
- tauri.conf.json v2 schema: `app.windows[]` for window config, `bundle` for packaging.
- The frontend has NO framework — plain HTML/CSS/JS only. No bundler needed.
- Tauri v2 dev server config in tauri.conf.json uses `"devUrl"` and `"frontendDist"` under `"app"` key (not `"build"` like v1).
- Always read spec.md for the full specification before implementing.

<!-- raw -->
- [2026-02-24T14:27:57Z] R-001 done: "Scaffold the Tauri v2 project structure for "reed". Create package.json with @tauri-apps/cli@^2 and @tauri-apps/api@^2 as devDependencies (no runtime deps). Create src-tauri/Cargo.toml with tauri v2 (features: ["tray-icon"] not needed, just default), pulldown-cmark (with GFM extensions via features), syntect, notify v6, serde/serde_json, dirs. Create src-tauri/tauri.conf.json with: identifier "com.reed.app", app name "reed", window defaults 900x700, min 400x300, title "reed", frontendDist "../ui", no devUrl needed for now. Create stub src-tauri/src/main.rs with an empty Tauri app that compiles. Create ui/index.html with a basic HTML5 document, ui/style.css (empty), ui/main.js (empty). Create a .gitignore ignoring node_modules/, target/, dist/. Run `npm install` and verify `cargo check --manifest-path src-tauri/Cargo.toml` compiles. Read spec.md for full project structure details." (model: codex, 1 iterations)

<!-- raw -->
- [2026-02-24T14:29:47Z] R-003 done: "Implement the markdown parsing module in src-tauri/src/markdown.rs. Read spec.md for full requirements. Create a function `render_markdown(path: &str) -> Result<String, String>` that: reads a file from disk, converts markdown to HTML using pulldown-cmark with GFM extensions enabled (tables, strikethrough, task lists, footnotes). For now, skip syntect highlighting (that's a separate task). Handle edge cases from spec: non-UTF8 files return an error message HTML, empty files return muted "Empty file" HTML, files >1MB should set a flag to skip syntax highlighting later. Export the module from main.rs with `mod markdown;`. Ensure cargo check passes." (model: codex, 1 iterations)

<!-- raw -->
- [2026-02-24T14:31:24Z] R-005 done: "Add syntax highlighting to the markdown pipeline using syntect. Read spec.md for requirements. In src-tauri/src/markdown.rs, integrate syntect to highlight fenced code blocks. Use pulldown-cmark's event iterator to detect CodeBlock events, extract the language tag, and use syntect's `html::highlighted_html_for_string()` with a built-in theme (use "base16-ocean.dark" or similar dark theme — the CSS will handle light/dark switching). Generate inline CSS styles (no class-based highlighting). For files >1MB, skip syntax highlighting for performance (just wrap code in `<pre><code>`). Ensure cargo check passes." (model: codex, 1 iterations)
