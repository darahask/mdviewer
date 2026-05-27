import { useStore, ViewMode } from '../store';

interface ToolbarProps {
  showOutline: boolean;
  onToggleOutline: () => void;
  onPreviewFind: () => void;
  viewMode: ViewMode;
}

export function Toolbar({ showOutline, onToggleOutline, onPreviewFind, viewMode }: ToolbarProps) {
  const { setViewMode, toggleSidebar, sidebarOpen } = useStore();

  const modeBtn = (mode: ViewMode, label: string, title: string) => (
    <button
      className={`toolbar-btn${viewMode === mode ? ' active' : ''}`}
      onClick={() => setViewMode(mode)}
      title={title}
    >
      {label}
    </button>
  );

  const canFind = viewMode === 'preview' || viewMode === 'split';
  const canOutline = viewMode === 'preview' || viewMode === 'split';

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button
          className={`toolbar-btn icon-btn${sidebarOpen ? ' active' : ''}`}
          onClick={toggleSidebar}
          title="Toggle sidebar (Ctrl+B)"
        >
          ☰
        </button>
        <span className="app-title">mdviewer</span>
      </div>
      <div className="toolbar-center">
        {modeBtn('editor', 'Editor', 'Editor only (Ctrl+1)')}
        {modeBtn('preview', 'Preview', 'Preview only (Ctrl+2)')}
        {modeBtn('split', 'Split', 'Side by side (Ctrl+3)')}
      </div>
      <div className="toolbar-right">
        {canFind && (
          <button
            className="toolbar-btn icon-btn"
            onClick={onPreviewFind}
            title="Find in preview (Ctrl+F)"
          >
            🔍
          </button>
        )}
        {canOutline && (
          <button
            className={`toolbar-btn icon-btn${showOutline ? ' active' : ''}`}
            onClick={onToggleOutline}
            title="Toggle outline panel"
          >
            ≡
          </button>
        )}
      </div>
    </div>
  );
}
