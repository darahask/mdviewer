import { useState, useRef, useEffect, useCallback } from 'react';

interface PreviewFindProps {
  getContainer: () => HTMLDivElement | null;
  onClose: () => void;
}

export function PreviewFind({ getContainer, onClose }: PreviewFindProps) {
  const [query, setQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const markTagName = 'mark';

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const clearMarks = useCallback(() => {
    const container = getContainer();
    if (!container) return;
    container.querySelectorAll(markTagName).forEach((el) => {
      const parent = el.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(el.textContent ?? ''), el);
      parent.normalize();
    });
  }, [getContainer]);

  const highlight = useCallback((q: string) => {
    clearMarks();
    const container = getContainer();
    if (!container || !q) { setMatchCount(0); setCurrentMatch(0); return; }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if ((node.parentElement?.closest('mark') === null) &&
          !['SCRIPT', 'STYLE'].includes(node.parentElement?.tagName ?? '')) {
        nodes.push(node as Text);
      }
    }

    let count = 0;
    const marks: HTMLElement[] = [];
    for (const textNode of nodes) {
      const text = textNode.textContent ?? '';
      if (!regex.test(text)) continue;
      regex.lastIndex = 0;

      const frag = document.createDocumentFragment();
      let last = 0;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        const mark = document.createElement('mark');
        mark.className = 'preview-find-match';
        mark.textContent = m[0];
        frag.appendChild(mark);
        marks.push(mark);
        last = m.index + m[0].length;
        count++;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      textNode.parentNode?.replaceChild(frag, textNode);
    }

    setMatchCount(count);
    const first = count > 0 ? 1 : 0;
    setCurrentMatch(first);
    if (marks[0]) {
      marks[0].classList.add('preview-find-current');
      marks[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [clearMarks, getContainer]);

  useEffect(() => {
    const timer = setTimeout(() => highlight(query), 150);
    return () => clearTimeout(timer);
  }, [query, highlight]);

  function navigate(dir: 1 | -1) {
    const container = getContainer();
    if (!container) return;
    const marks = Array.from(container.querySelectorAll<HTMLElement>('.preview-find-match'));
    if (marks.length === 0) return;
    marks.forEach((m) => m.classList.remove('preview-find-current'));
    const next = ((currentMatch - 1 + dir + marks.length) % marks.length);
    marks[next].classList.add('preview-find-current');
    marks[next].scrollIntoView({ behavior: 'smooth', block: 'center' });
    setCurrentMatch(next + 1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); navigate(e.shiftKey ? -1 : 1); }
    if (e.key === 'Escape') { clearMarks(); onClose(); }
  }

  useEffect(() => {
    return () => clearMarks();
  }, [clearMarks]);

  return (
    <div className="preview-find-bar">
      <input
        ref={inputRef}
        type="text"
        placeholder="Find in preview..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="preview-find-input"
      />
      <span className="preview-find-count">
        {matchCount > 0 ? `${currentMatch}/${matchCount}` : query ? '0 results' : ''}
      </span>
      <button onClick={() => navigate(-1)} title="Previous (Shift+Enter)">↑</button>
      <button onClick={() => navigate(1)} title="Next (Enter)">↓</button>
      <button onClick={() => { clearMarks(); onClose(); }} title="Close (Esc)">✕</button>
    </div>
  );
}
