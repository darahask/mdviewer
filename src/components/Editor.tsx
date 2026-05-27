import { useEffect, useRef } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, historyKeymap, history } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { search, searchKeymap } from '@codemirror/search';

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
}

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '15px',
    fontFamily: '"Cascadia Code", "Consolas", monospace',
    backgroundColor: '#ffffff',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: '"Cascadia Code", "Consolas", monospace',
    lineHeight: '1.6',
  },
  '.cm-content': {
    padding: '16px 20px',
    caretColor: '#1a1a1a',
  },
  '.cm-line': { padding: '0' },
  '.cm-activeLine': { backgroundColor: '#f0f4f8' },
  '.cm-gutters': {
    backgroundColor: '#f6f8fa',
    borderRight: '1px solid #d0d7de',
    color: '#6e7781',
    minWidth: '48px',
  },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 8px 0 4px' },
  '.cm-focused': { outline: 'none' },
  '.cm-cursor': { borderLeftColor: '#1a1a1a' },
  '.cm-selectionBackground': { backgroundColor: '#d4e4f0 !important' },
  // Search panel styling
  '.cm-search': {
    padding: '6px 10px',
    background: '#f6f8fa',
    borderTop: '1px solid #d0d7de',
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    flexWrap: 'wrap',
    fontFamily: '"Inter", system-ui, sans-serif',
    fontSize: '13px',
  },
  '.cm-search input': {
    border: '1px solid #d0d7de',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '13px',
    fontFamily: '"Inter", system-ui, sans-serif',
    outline: 'none',
    background: '#ffffff',
  },
  '.cm-search input:focus': { borderColor: '#0969da' },
  '.cm-search button': {
    border: '1px solid #d0d7de',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '12px',
    background: '#ffffff',
    cursor: 'pointer',
    fontFamily: '"Inter", system-ui, sans-serif',
  },
  '.cm-search button:hover': { background: '#eaeef2' },
  '.cm-search label': { fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' },
  '.cm-searchMatch': { backgroundColor: '#fff3b0', outline: '1px solid #f0c000' },
  '.cm-searchMatch-selected': { backgroundColor: '#f0c000' },
});

export function Editor({ content, onChange }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: content,
        extensions: [
          history(),
          lineNumbers(),
          highlightActiveLine(),
          markdown(),
          syntaxHighlighting(defaultHighlightStyle),
          search({ top: false }),
          keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
          editorTheme,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
          EditorView.lineWrapping,
        ],
      }),
      parent: containerRef.current,
    });

    viewRef.current = view;
    return () => view.destroy();
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== content) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: content },
      });
    }
  }, [content]);

  return <div ref={containerRef} className="editor-container" />;
}
