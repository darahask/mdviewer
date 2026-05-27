import { useEffect, useState, useCallback, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { useStore } from './store';
import { Toolbar } from './components/Toolbar';
import { TabBar } from './components/TabBar';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { SplitPane } from './components/SplitPane';
import { Toast } from './components/Toast';
import { OutlinePanel } from './components/OutlinePanel';
import { PreviewFind } from './components/PreviewFind';
import { ResizablePanel } from './components/ResizablePanel';

export default function App() {
  const {
    tabs, activeTabId, viewMode, sidebarOpen,
    openTab, updateTabContent, markTabSaved, closeTab,
    setViewMode, toggleSidebar,
  } = useStore();

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showOutline, setShowOutline] = useState(true);
  const [showPreviewFind, setShowPreviewFind] = useState(false);
  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Direct ref to the Preview's container div
  const previewDivRef = useRef<HTMLDivElement>(null);
  const getPreviewContainer = useCallback(() => previewDivRef.current, []);

  useEffect(() => {
    const unlisten = listen<string>('open-file', async (event) => {
      const path = event.payload;
      if (!path || !path.match(/\.(md|markdown|txt)$/i)) return;
      const content = await invoke<string>('read_file', { path }).catch(() => '');
      openTab(path, content);
    });
    return () => { unlisten.then((fn) => fn()); };
  }, [openTab]);

  useEffect(() => {
    const unlisten = listen<string>('file-changed', async (event) => {
      const path = event.payload;
      const tab = useStore.getState().tabs.find((t) => t.path === path);
      if (!tab) return;
      const content = await invoke<string>('read_file', { path }).catch(() => tab.content);
      useStore.setState((s) => ({
        tabs: s.tabs.map((t) => t.path === path ? { ...t, content, isDirty: false } : t),
      }));
      setToastMsg('File updated');
    });
    return () => { unlisten.then((fn) => fn()); };
  }, []);

  useEffect(() => {
    tabs.forEach((tab) => {
      invoke('watch_file', { path: tab.path }).catch(() => {});
    });
  }, [tabs.length]); // eslint-disable-line

  const saveActive = useCallback(async () => {
    if (!activeTab) return;
    await invoke('save_file', { path: activeTab.path, content: activeTab.content });
    markTabSaved(activeTab.id);
    setToastMsg('Saved');
  }, [activeTab, markTabSaved]);

  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        switch (e.key) {
          case 'f':
            // In preview/split: open preview find bar.
            // In editor: CodeMirror's own searchKeymap handles it natively.
            if (viewMode === 'preview' || viewMode === 'split') {
              e.preventDefault();
              setShowPreviewFind(true);
            }
            break;
          case 's': e.preventDefault(); await saveActive(); break;
          case 'b': e.preventDefault(); toggleSidebar(); break;
          case '1': e.preventDefault(); setViewMode('editor'); break;
          case '2': e.preventDefault(); setViewMode('preview'); break;
          case '3': e.preventDefault(); setViewMode('split'); break;
          case 'w': e.preventDefault(); if (activeTabId) closeTab(activeTabId); break;
          case 't': {
            e.preventDefault();
            const path = await invoke<string | null>('open_dialog');
            if (path) {
              const content = await invoke<string>('read_file', { path }).catch(() => '');
              openTab(path, content);
            }
            break;
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveActive, toggleSidebar, setViewMode, activeTabId, closeTab, openTab, viewMode]);

  const handleContentChange = (content: string) => {
    if (activeTab) updateTabContent(activeTab.id, content);
  };

  const showOutlinePanel = showOutline && (viewMode === 'preview' || viewMode === 'split');

  const previewEl = (
    <div className="preview-wrapper">
      <Preview content={activeTab?.content ?? ''} containerRef={previewDivRef} />
      {showPreviewFind && (
        <PreviewFind
          getContainer={getPreviewContainer}
          onClose={() => setShowPreviewFind(false)}
        />
      )}
    </div>
  );

  const renderContent = () => {
    if (!activeTab) {
      return (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <div className="empty-title">No file open</div>
          <div className="empty-hint">
            Click <kbd>+</kbd> in the tab bar or double-click a file in the sidebar
          </div>
        </div>
      );
    }

    const editor = <Editor content={activeTab.content} onChange={handleContentChange} />;

    if (viewMode === 'editor') return <div className="single-pane">{editor}</div>;
    if (viewMode === 'preview') return <div className="single-pane">{previewEl}</div>;
    return <SplitPane left={editor} right={previewEl} />;
  };

  return (
    <div className="app">
      <Toolbar
        showOutline={showOutlinePanel}
        onToggleOutline={() => setShowOutline((v) => !v)}
        onPreviewFind={() => setShowPreviewFind(true)}
        viewMode={viewMode}
      />
      <div className="app-body">
        {sidebarOpen && (
          <ResizablePanel side="left" defaultWidth={220} storageKey="mdviewer-sidebar-width" className="panel-left">
            <Sidebar />
          </ResizablePanel>
        )}
        <div className="main-area">
          <TabBar />
          <div className="content-area">
            {renderContent()}
            {showOutlinePanel && activeTab && (
              <ResizablePanel side="right" defaultWidth={200} storageKey="mdviewer-outline-width" className="panel-right">
                <OutlinePanel
                  content={activeTab.content}
                  getContainer={getPreviewContainer}
                />
              </ResizablePanel>
            )}
          </div>
        </div>
      </div>
      {toastMsg && <Toast message={toastMsg} onDone={() => setToastMsg(null)} />}
    </div>
  );
}
