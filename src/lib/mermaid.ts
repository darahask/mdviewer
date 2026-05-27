import type mermaidLib from 'mermaid';

let mermaid: typeof mermaidLib | null = null;
let initialized = false;

async function ensureMermaid() {
  if (!mermaid) {
    const mod = await import('mermaid');
    mermaid = mod.default;
  }
  if (!initialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      themeVariables: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
      },
      securityLevel: 'loose',
    });
    initialized = true;
  }
  return mermaid;
}

export async function renderMermaidBlocks(container: HTMLElement) {
  const blocks = container.querySelectorAll<HTMLElement>('.mermaid-block');
  if (blocks.length === 0) return;

  const m = await ensureMermaid();

  for (const block of blocks) {
    const encoded = block.getAttribute('data-src');
    if (!encoded) continue;
    const definition = decodeURIComponent(encoded);
    try {
      const id = `mermaid-${Math.random().toString(36).slice(2)}`;
      const { svg } = await m.render(id, definition);
      block.innerHTML = svg;
      block.classList.add('mermaid-rendered');
    } catch (err) {
      block.innerHTML = `<pre class="mermaid-error">Diagram error: ${String(err)}</pre>`;
    }
  }
}
