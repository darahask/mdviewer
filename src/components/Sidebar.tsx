import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useStore } from '../store';

interface DirEntry {
  name: string;
  path: string;
  is_dir: boolean;
}

function FolderTree({ basePath }: { basePath: string }) {
  const [entries, setEntries] = useState<DirEntry[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [subEntries, setSubEntries] = useState<Record<string, DirEntry[]>>({});
  const { openTab } = useStore();

  useEffect(() => {
    if (!basePath) return;
    const dir = basePath.substring(0, basePath.lastIndexOf('/')) || '/';
    invoke<DirEntry[]>('read_dir', { path: dir })
      .then(setEntries)
      .catch(() => setEntries([]));
  }, [basePath]);

  async function handleDoubleClick(entry: DirEntry) {
    if (entry.is_dir) {
      const key = entry.path;
      if (expanded.has(key)) {
        setExpanded((s) => { const n = new Set(s); n.delete(key); return n; });
      } else {
        const sub = await invoke<DirEntry[]>('read_dir', { path: entry.path }).catch(() => []);
        setSubEntries((s) => ({ ...s, [key]: sub }));
        setExpanded((s) => new Set([...s, key]));
      }
    } else if (entry.name.match(/\.(md|markdown|txt)$/i)) {
      const content = await invoke<string>('read_file', { path: entry.path }).catch(() => '');
      openTab(entry.path, content);
    }
  }

  function renderEntries(list: DirEntry[], depth = 0) {
    return list.map((entry) => (
      <div key={entry.path}>
        <div
          className={`sidebar-entry${entry.is_dir ? ' is-dir' : ''}`}
          style={{ paddingLeft: `${12 + depth * 14}px` }}
          onDoubleClick={() => handleDoubleClick(entry)}
          title={entry.path}
        >
          <span className="entry-icon">
            {entry.is_dir ? (expanded.has(entry.path) ? '▾' : '▸') : '·'}
          </span>
          <span className="entry-name">{entry.name}</span>
        </div>
        {entry.is_dir && expanded.has(entry.path) && subEntries[entry.path] && (
          renderEntries(subEntries[entry.path], depth + 1)
        )}
      </div>
    ));
  }

  return <div className="folder-tree">{renderEntries(entries)}</div>;
}

export function Sidebar() {
  const { recentFiles, tabs, openTab, activeTabId } = useStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  async function openRecent(path: string) {
    const existing = tabs.find((t) => t.path === path);
    if (existing) {
      useStore.getState().setActiveTab(existing.id);
      return;
    }
    const content = await invoke<string>('read_file', { path }).catch(() => '');
    openTab(path, content);
  }

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-section-title">Recent</div>
        {recentFiles.length === 0 && (
          <div className="sidebar-empty">No recent files</div>
        )}
        {recentFiles.map((path) => (
          <div
            key={path}
            className="sidebar-entry"
            onDoubleClick={() => openRecent(path)}
            title={path}
          >
            <span className="entry-icon">·</span>
            <span className="entry-name">{path.split('/').pop()}</span>
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Folder</div>
        {activeTab ? (
          <FolderTree basePath={activeTab.path} />
        ) : (
          <div className="sidebar-empty">Open a file to browse its folder</div>
        )}
      </div>
    </div>
  );
}
