import { useEffect, useRef, useState } from 'react';
import { renderMarkdown, renderMermaidBlocks } from '../lib/markdown';

interface PreviewProps {
  content: string;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export function Preview({ content, containerRef }: PreviewProps) {
  const [html, setHtml] = useState('');
  const localRef = useRef<HTMLDivElement>(null);
  const divRef = containerRef ?? localRef;

  useEffect(() => {
    let cancelled = false;
    renderMarkdown(content).then((result) => {
      if (!cancelled) setHtml(result);
    });
    return () => { cancelled = true; };
  }, [content]);

  useEffect(() => {
    if (!divRef.current || !html) return;
    renderMermaidBlocks(divRef.current);
  }, [html, divRef]);

  return (
    <div
      ref={divRef}
      className="preview-container"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
