import { useStore } from '../store';
import { invoke } from '@tauri-apps/api/core';

export function TabBar() {
  const { tabs, activeTabId, closeTab, setActiveTab, openTab } = useStore();

  async function handleNewTab() {
    const path = await invoke<string | null>('open_dialog');
    if (!path) return;
    const content = await invoke<string>('read_file', { path });
    openTab(path, content);
  }

  function handleClose(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    closeTab(id);
  }

  function handleMiddleClick(e: React.MouseEvent, id: string) {
    if (e.button === 1) closeTab(id);
  }

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab${tab.id === activeTabId ? ' active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
          onMouseDown={(e) => handleMiddleClick(e, tab.id)}
          title={tab.path}
        >
          <span className="tab-name">
            {tab.isDirty && <span className="tab-dirty">●</span>}
            {tab.filename}
          </span>
          <button
            className="tab-close"
            onClick={(e) => handleClose(e, tab.id)}
            title="Close tab"
          >
            ×
          </button>
        </div>
      ))}
      <button className="tab-new" onClick={handleNewTab} title="Open file (Ctrl+T)">
        +
      </button>
    </div>
  );
}
