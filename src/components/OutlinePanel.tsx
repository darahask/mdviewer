import { useMemo, useState } from 'react';

interface Heading {
  level: number;
  text: string;
  id: string;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
}

function extractHeadings(markdown: string): Heading[] {
  const lines = markdown.split('\n');
  const headings: Heading[] = [];
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (!match) continue;
    const text = match[2].replace(/\*+|`/g, '').trim();
    headings.push({ level: match[1].length, text, id: slugify(text) });
  }
  return headings;
}

interface OutlinePanelProps {
  content: string;
  getContainer: () => HTMLDivElement | null;
}

export function OutlinePanel({ content, getContainer }: OutlinePanelProps) {
  const headings = useMemo(() => extractHeadings(content), [content]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  if (headings.length === 0) {
    return (
      <div className="outline-panel">
        <div className="outline-title">Outline</div>
        <div className="outline-empty">No headings</div>
      </div>
    );
  }

  // Build tree: each heading can collapse its children
  const minLevel = Math.min(...headings.map((h) => h.level));

  function toggleCollapse(id: string) {
    setCollapsed((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function scrollTo(id: string) {
    const el = getContainer()?.querySelector(`#${CSS.escape(id)}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Determine which headings are hidden (their ancestor is collapsed)
  const visible: boolean[] = headings.map(() => true);
  for (let i = 0; i < headings.length; i++) {
    if (!visible[i]) continue;
    if (collapsed.has(headings[i].id)) {
      // Hide all subsequent headings that are deeper
      for (let j = i + 1; j < headings.length; j++) {
        if (headings[j].level > headings[i].level) {
          visible[j] = false;
        } else {
          break;
        }
      }
    }
  }

  // Check if a heading has children
  function hasChildren(i: number): boolean {
    return i + 1 < headings.length && headings[i + 1].level > headings[i].level;
  }

  return (
    <div className="outline-panel">
      <div className="outline-title">Outline</div>
      <div className="outline-list">
        {headings.map((h, i) => {
          if (!visible[i]) return null;
          const indent = (h.level - minLevel) * 12;
          const isCollapsed = collapsed.has(h.id);
          const children = hasChildren(i);

          return (
            <div
              key={`${h.id}-${i}`}
              className={`outline-item level-${h.level}`}
              style={{ paddingLeft: `${10 + indent}px` }}
              onClick={() => scrollTo(h.id)}
              title={h.text}
            >
              <span
                className="outline-toggle"
                onClick={(e) => {
                  if (!children) return;
                  e.stopPropagation();
                  toggleCollapse(h.id);
                }}
                style={{ visibility: children ? 'visible' : 'hidden' }}
              >
                {isCollapsed ? '▸' : '▾'}
              </span>
              <span className="outline-text">{h.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
