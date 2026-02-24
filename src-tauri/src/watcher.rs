use notify::{
    Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher as NotifyWatcher,
};
use std::path::PathBuf;
use std::sync::mpsc::{channel, Receiver, Sender};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

use crate::markdown;

const DEBOUNCE_DURATION_MS: u64 = 200;

pub struct FileWatcher {
    watcher: Arc<Mutex<Option<RecommendedWatcher>>>,
    current_path: Arc<Mutex<Option<PathBuf>>>,
}

impl FileWatcher {
    pub fn new() -> Self {
        Self {
            watcher: Arc::new(Mutex::new(None)),
            current_path: Arc::new(Mutex::new(None)),
        }
    }

    pub fn watch_file(&self, path: String, app_handle: AppHandle) -> Result<(), String> {
        let path_buf = PathBuf::from(&path);

        // Stop watching the old file
        self.stop_watching();

        // Update current path
        {
            let mut current = self.current_path.lock().unwrap();
            *current = Some(path_buf.clone());
        }

        // Create channel for watcher events
        let (tx, rx): (Sender<notify::Result<Event>>, Receiver<notify::Result<Event>>) =
            channel();

        // Create the watcher
        let mut watcher =
            RecommendedWatcher::new(tx, Config::default()).map_err(|e| e.to_string())?;

        // Watch the file's parent directory (notify can't watch individual files on some platforms)
        if let Some(parent) = path_buf.parent() {
            watcher
                .watch(parent, RecursiveMode::NonRecursive)
                .map_err(|e| e.to_string())?;
        } else {
            return Err("File path has no parent directory".to_string());
        }

        // Store the watcher
        {
            let mut w = self.watcher.lock().unwrap();
            *w = Some(watcher);
        }

        // Spawn a thread to handle file events
        let current_path_clone = self.current_path.clone();
        thread::spawn(move || {
            let mut last_event_time: Option<Instant> = None;

            for res in rx {
                match res {
                    Ok(event) => {
                        // Check if this event is for the file we're watching
                        let should_process = {
                            let current = current_path_clone.lock().unwrap();
                            if let Some(ref watched_path) = *current {
                                event.paths.iter().any(|p| p == watched_path)
                            } else {
                                false
                            }
                        };

                        if !should_process {
                            continue;
                        }

                        // Handle different event kinds
                        match event.kind {
                            EventKind::Modify(_) | EventKind::Create(_) => {
                                // Debounce: only process if 200ms have elapsed since last event
                                let now = Instant::now();
                                if let Some(last_time) = last_event_time {
                                    if now.duration_since(last_time)
                                        < Duration::from_millis(DEBOUNCE_DURATION_MS)
                                    {
                                        continue;
                                    }
                                }
                                last_event_time = Some(now);

                                // Re-read and re-render the file
                                let current = current_path_clone.lock().unwrap();
                                if let Some(ref watched_path) = *current {
                                    let path_str = watched_path.to_string_lossy().to_string();

                                    // Check if file still exists
                                    if !watched_path.exists() {
                                        let _ = app_handle.emit("file-deleted", path_str);
                                        continue;
                                    }

                                    // Re-render the markdown
                                    match markdown::render_markdown(&path_str) {
                                        Ok(html) => {
                                            let _ = app_handle.emit("file-changed", html);
                                        }
                                        Err(err) => {
                                            eprintln!("Error re-rendering markdown: {}", err);
                                        }
                                    }
                                }
                            }
                            EventKind::Remove(_) => {
                                // File was deleted
                                let current = current_path_clone.lock().unwrap();
                                if let Some(ref watched_path) = *current {
                                    let path_str = watched_path.to_string_lossy().to_string();
                                    let _ = app_handle.emit("file-deleted", path_str);
                                }
                            }
                            _ => {}
                        }
                    }
                    Err(e) => {
                        eprintln!("Watch error: {}", e);
                    }
                }
            }
        });

        Ok(())
    }

    pub fn stop_watching(&self) {
        let mut watcher = self.watcher.lock().unwrap();
        *watcher = None; // Drop the watcher, which stops watching

        let mut current = self.current_path.lock().unwrap();
        *current = None;
    }
}
