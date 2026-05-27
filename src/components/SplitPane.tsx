import { useRef, useState, useCallback, useEffect } from 'react';

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

const STORAGE_KEY = 'mdviewer-split-ratio';

export function SplitPane({ left, right }: SplitPaneProps) {
  const [ratio, setRatio] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseFloat(saved) : 0.5;
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = Math.max(0.15, Math.min(0.85, (e.clientX - rect.left) / rect.width));
      setRatio(newRatio);
      localStorage.setItem(STORAGE_KEY, String(newRatio));
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <div ref={containerRef} className="split-pane">
      <div className="split-left" style={{ width: `${ratio * 100}%` }}>
        {left}
      </div>
      <div className="split-divider" onMouseDown={onMouseDown} />
      <div className="split-right" style={{ width: `${(1 - ratio) * 100}%` }}>
        {right}
      </div>
    </div>
  );
}
