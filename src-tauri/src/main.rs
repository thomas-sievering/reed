#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod markdown;
mod watcher;

use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State, Window};
use watcher::FileWatcher;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct AppConfig {
    theme: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            theme: "dark".to_string(),
        }
    }
}

fn config_file_path() -> Result<PathBuf, String> {
    let config_dir = dirs::config_dir().ok_or_else(|| "No config directory found".to_string())?;
    Ok(config_dir.join("reed").join("config.json"))
}

#[tauri::command]
fn render_file(path: String) -> Result<String, String> {
    markdown::render_markdown(&path)
}

#[tauri::command]
async fn open_file_dialog(app_handle: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let file_path = app_handle
        .dialog()
        .file()
        .add_filter("Markdown", &["md", "markdown"])
        .blocking_pick_file();

    Ok(file_path.map(|p| p.as_path().unwrap().to_string_lossy().to_string()))
}

#[tauri::command]
fn set_window_title(window: Window, filename: String) -> Result<(), String> {
    window
        .set_title(&format!("{} \u{2014} reed", filename))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn start_watching(
    path: String,
    watcher: State<Mutex<FileWatcher>>,
    app_handle: AppHandle,
) -> Result<(), String> {
    let watcher = watcher.lock().unwrap();
    watcher.watch_file(path, app_handle)
}

#[tauri::command]
fn stop_watching(watcher: State<Mutex<FileWatcher>>) -> Result<(), String> {
    let watcher = watcher.lock().unwrap();
    watcher.stop_watching();
    Ok(())
}

#[tauri::command]
fn load_config() -> Result<AppConfig, String> {
    let path = config_file_path()?;
    if !path.exists() {
        return Ok(AppConfig::default());
    }

    let raw = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str::<AppConfig>(&raw).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_config(config: AppConfig) -> Result<(), String> {
    let path = config_file_path()?;
    let parent = path
        .parent()
        .ok_or_else(|| "Invalid config path".to_string())?;

    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    let serialized = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(path, serialized).map_err(|e| e.to_string())
}

#[tauri::command]
fn quit_app(app_handle: AppHandle) {
    app_handle.exit(0);
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(Mutex::new(FileWatcher::new()))
        .setup(|app| {
            let args: Vec<String> = env::args().collect();

            if args.len() > 1 {
                let file_path = &args[1];

                if Path::new(file_path).exists() {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("file-opened", file_path.clone());

                        if let Some(filename) = Path::new(file_path).file_name() {
                            let _ = window
                                .set_title(&format!("{} \u{2014} reed", filename.to_string_lossy()));
                        }
                    }
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            render_file,
            open_file_dialog,
            set_window_title,
            start_watching,
            stop_watching,
            load_config,
            save_config,
            quit_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
