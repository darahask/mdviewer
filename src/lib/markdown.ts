import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
// @ts-ignore — no types for this package
import markdownItTaskLists from 'markdown-it-task-lists';
import DOMPurify from 'dompurify';
import { renderMermaidBlocks } from './mermaid';
import { createHighlighter, type Highlighter } from 'shiki';

let highlighter: Highlighter | null = null;

async function ensureHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ['github-light'],
      langs: [
        'javascript', 'typescript', 'jsx', 'tsx',
        'python', 'rust', 'go', 'java', 'c', 'cpp',
        'css', 'html', 'json', 'yaml', 'toml', 'bash',
        'shell', 'markdown', 'sql', 'dockerfile',
        'ruby', 'php', 'swift', 'kotlin', 'scala',
      ],
    });
  }
  return highlighter;
}

// Pre-warm
ensureHighlighter();

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: false,
});

// Only add id attributes to headings (for scroll sync) — no visible anchor link
md.use(markdownItAnchor, {
  slugify: (s: string) =>
    s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
});

md.use(markdownItTaskLists, { enabled: true });

// Override fence renderer
md.renderer.rules.fence = (tokens, idx, _options, _env, _self) => {
  const token = tokens[idx];
  const lang = token.info.trim().toLowerCase();
  if (lang === 'mermaid') {
    const encoded = encodeURIComponent(token.content);
    return `<div class="mermaid-block" data-src="${encoded}"></div>`;
  }
  // Use placeholder for async Shiki rendering
  const code = encodeURIComponent(token.content);
  const escapedLang = encodeURIComponent(token.info.trim() || 'text');
  return `<pre class="shiki-placeholder" data-lang="${escapedLang}" data-code="${code}"><code></code></pre>`;
};

export async function renderMarkdown(raw: string): Promise<string> {
  const hl = await ensureHighlighter();

  let html = md.render(raw);

  // Replace shiki placeholders
  const placeholderRe = /<pre class="shiki-placeholder" data-lang="([^"]*)" data-code="([^"]*)"><code><\/code><\/pre>/g;
  html = html.replace(placeholderRe, (_match, langEnc, codeEnc) => {
    const lang = decodeURIComponent(langEnc) || 'text';
    const code = decodeURIComponent(codeEnc);
    try {
      return hl.codeToHtml(code, { lang, theme: 'github-light' });
    } catch {
      return hl.codeToHtml(code, { lang: 'text', theme: 'github-light' });
    }
  });

  // Sanitize — allow SVG elements for mermaid and Shiki output
  const clean = DOMPurify.sanitize(html, {
    ADD_TAGS: [
      'svg', 'path', 'circle', 'rect', 'line', 'polygon', 'polyline',
      'ellipse', 'g', 'defs', 'marker', 'use', 'text', 'tspan', 'span',
    ],
    ADD_ATTR: [
      'viewBox', 'xmlns', 'd', 'fill', 'stroke', 'stroke-width',
      'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r',
      'transform', 'id', 'class', 'style', 'marker-end', 'marker-start',
      'data-src', 'tabindex',
    ],
  });

  return clean;
}

export { renderMermaidBlocks };
