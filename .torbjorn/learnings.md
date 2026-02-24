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
