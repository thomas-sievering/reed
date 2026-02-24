#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod markdown;

use std::env;
use std::path::Path;
use tauri::{Emitter, Manager, Window};

#[tauri::command]
fn render_file(path: String) -> Result<String, String> {
    markdown::render_markdown(&path)
}

#[tauri::command]
fn open_file_dialog() -> Result<Option<String>, String> {
    let file_path = rfd::FileDialog::new()
        .add_filter("Markdown", &["md", "markdown"])
        .pick_file();

    Ok(file_path.map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
fn set_window_title(window: Window, filename: String) -> Result<(), String> {
    window
        .set_title(&format!("{} — reed", filename))
        .map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Check for CLI arguments
            let args: Vec<String> = env::args().collect();

            // If there's a file path argument (args[0] is the exe path, args[1] would be the file)
            if args.len() > 1 {
                let file_path = &args[1];

                // Verify the file exists and is a markdown file
                if Path::new(file_path).exists() {
                    // Get the main window
                    if let Some(window) = app.get_webview_window("main") {
                        // Emit event to frontend
                        let _ = window.emit("file-opened", file_path.clone());

                        // Set window title
                        if let Some(filename) = Path::new(file_path).file_name() {
                            let _ = window.set_title(&format!(
                                "{} — reed",
                                filename.to_string_lossy()
                            ));
                        }
                    }
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            render_file,
            open_file_dialog,
            set_window_title
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
