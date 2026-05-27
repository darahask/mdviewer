use notify::{Config, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};

pub struct FileWatcher {
    watchers: Arc<Mutex<HashMap<String, RecommendedWatcher>>>,
}

impl FileWatcher {
    pub fn new() -> Self {
        Self {
            watchers: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn watch(&self, path: String, app: AppHandle) {
        let path_clone = path.clone();
        let mut watchers = self.watchers.lock().unwrap();

        if watchers.contains_key(&path) {
            return;
        }

        let app_handle = app.clone();
        let watch_path = path.clone();

        let watcher = RecommendedWatcher::new(
            move |res: notify::Result<notify::Event>| {
                if let Ok(event) = res {
                    if matches!(
                        event.kind,
                        EventKind::Modify(_) | EventKind::Create(_)
                    ) {
                        let _ = app_handle.emit("file-changed", &watch_path);
                    }
                }
            },
            Config::default(),
        );

        if let Ok(mut w) = watcher {
            let pb = PathBuf::from(&path_clone);
            let _ = w.watch(&pb, RecursiveMode::NonRecursive);
            watchers.insert(path, w);
        }
    }

    pub fn unwatch(&self, path: &str) {
        let mut watchers = self.watchers.lock().unwrap();
        watchers.remove(path);
    }
}
