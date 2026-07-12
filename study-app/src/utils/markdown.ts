export function parseMarkdown(text: string): string {
  if (!text) return '';

  const lines = text.split('\n');
  let inList = false;
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  const result: string[] = [];

  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const parseInline = (str: string) => {
    let s = escapeHtml(str);
    // Inline code: `code`
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold: **text** or __text__
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    // Italic: *text* or _text_
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    s = s.replace(/_([^_]+)_/g, '<em>$1</em>');
    return s;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        result.push(`<pre><code>${codeBlockContent.join('\n')}</code></pre>`);
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // Start code block
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(escapeHtml(line));
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(`<h1>${parseInline(line.substring(2))}</h1>`);
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(`<h2>${parseInline(line.substring(3))}</h2>`);
      continue;
    }
    if (line.startsWith('### ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(`<h3>${parseInline(line.substring(4))}</h3>`);
      continue;
    }

    // Blockquotes
    if (line.startsWith('> ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(`<blockquote>${parseInline(line.substring(2))}</blockquote>`);
      continue;
    }

    // List items
    const listMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (listMatch) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      result.push(`<li>${parseInline(listMatch[2])}</li>`);
      continue;
    }

    // If we were in a list and this line is not a list item
    if (inList && line.trim() === '') {
      result.push('</ul>');
      inList = false;
      continue;
    }

    // Normal paragraph line
    if (inList) {
      result.push('</ul>');
      inList = false;
    }

    if (line.trim() === '') {
      result.push('<br/>');
    } else {
      result.push(`<p>${parseInline(line)}</p>`);
    }
  }

  if (inCodeBlock) {
    result.push(`<pre><code>${codeBlockContent.join('\n')}</code></pre>`);
  }
  if (inList) {
    result.push('</ul>');
  }

  return result.join('\n');
}
