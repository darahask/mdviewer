import { useRef, useState, useEffect, useCallback } from 'react';

interface ResizablePanelProps {
  side: 'left' | 'right';
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey: string;
  children: React.ReactNode;
  className?: string;
}

export function ResizablePanel({
  side,
  defaultWidth,
  minWidth = 140,
  maxWidth = 480,
  storageKey,
  children,
  className,
}: ResizablePanelProps) {
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? parseInt(saved, 10) : defaultWidth;
  });
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = side === 'left'
        ? e.clientX - startX.current
        : startX.current - e.clientX;
      const next = Math.max(minWidth, Math.min(maxWidth, startWidth.current + delta));
      setWidth(next);
      localStorage.setItem(storageKey, String(next));
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
  }, [side, minWidth, maxWidth, storageKey]);

  const handle = (
    <div
      className={`panel-resize-handle panel-resize-${side}`}
      onMouseDown={onMouseDown}
    />
  );

  return (
    <div className={`resizable-panel ${className ?? ''}`} style={{ width, minWidth: width, maxWidth: width }}>
      {side === 'right' && handle}
      {children}
      {side === 'left' && handle}
    </div>
  );
}
