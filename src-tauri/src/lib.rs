mod watcher;

use std::fs;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_dialog::DialogExt;
use watcher::FileWatcher;

pub struct WatcherState(pub Mutex<FileWatcher>);

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
async fn open_dialog(app: AppHandle) -> Option<String> {
    let file = app
        .dialog()
        .file()
        .add_filter("Markdown", &["md", "markdown", "txt"])
        .blocking_pick_file();
    file.and_then(|f| f.into_path().ok())
        .map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
fn read_dir(path: String) -> Result<Vec<DirEntry>, String> {
    let entries = fs::read_dir(&path).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for entry in entries.flatten() {
        let meta = entry.metadata().map_err(|e| e.to_string())?;
        result.push(DirEntry {
            name: entry.file_name().to_string_lossy().to_string(),
            path: entry.path().to_string_lossy().to_string(),
            is_dir: meta.is_dir(),
        });
    }
    result.sort_by(|a, b| {
        b.is_dir
            .cmp(&a.is_dir)
            .then(a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    Ok(result)
}

#[derive(serde::Serialize)]
struct DirEntry {
    name: String,
    path: String,
    is_dir: bool,
}

#[tauri::command]
fn watch_file(path: String, app: AppHandle, state: State<WatcherState>) {
    state.0.lock().unwrap().watch(path, app);
}

#[tauri::command]
fn unwatch_file(path: String, state: State<WatcherState>) {
    state.0.lock().unwrap().unwatch(&path);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let watcher = WatcherState(Mutex::new(FileWatcher::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            if let Some(path) = args.get(1) {
                let _ = app.emit("open-file", path.clone());
            }
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.set_focus();
            }
        }))
        .manage(watcher)
        .invoke_handler(tauri::generate_handler![
            read_file,
            save_file,
            open_dialog,
            read_dir,
            watch_file,
            unwatch_file,
        ])
        .setup(|app| {
            let args: Vec<String> = std::env::args().collect();
            if let Some(path) = args.get(1) {
                let handle = app.handle().clone();
                let path = path.clone();
                tauri::async_runtime::spawn(async move {
                    tokio::time::sleep(std::time::Duration::from_millis(300)).await;
                    let _ = handle.emit("open-file", path);
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
