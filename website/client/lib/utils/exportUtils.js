// ── Helpers ────────────────────────────────────────────────────────────────

function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function slugify(text) {
    return (text || 'untitled').replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').toLowerCase();
}

function escapeCsvField(value) {
    if (value == null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

// ── Board Export: JSON ─────────────────────────────────────────────────────

export const exportBoardToJson = (boardData) => {
    if (!boardData || !boardData.board) return;

    const exportData = {
        board: {
            name: boardData.board.name,
            description: boardData.board.description
        },
        columns: boardData.columns.map(col => ({
            name: col.name,
            order: col.order,
            cards: (col.cards || []).map(card => ({
                title: card.title,
                description: card.description,
                priority: card.priority,
                tags: card.tags,
                order: card.order,
                dueDate: card.dueDate,
                linkedNoteId: card.linkedNoteId
            }))
        }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    triggerDownload(blob, `${boardData.board.name.replace(/\s+/g, '_')}_export.json`);
};

// ── Board Export: CSV ──────────────────────────────────────────────────────

export const exportBoardToCsv = (boardData) => {
    if (!boardData || !boardData.board) return;

    const headers = ['Column', 'Card Title', 'Description', 'Priority', 'Due Date', 'Labels', 'Checklist Progress', 'Order'];
    const rows = [headers.map(escapeCsvField).join(',')];

    boardData.columns.forEach(col => {
        const cards = col.cards || [];
        if (cards.length === 0) {
            // Include empty columns so the structure is visible
            rows.push([col.name, '', '', '', '', '', '', ''].map(escapeCsvField).join(','));
        } else {
            cards.forEach(card => {
                const labels = (card.labels || []).map(l => l.text).join('; ');
                const checklistTotal = (card.checklist || []).length;
                const checklistDone = (card.checklist || []).filter(c => c.completed).length;
                const checklistStr = checklistTotal > 0 ? `${checklistDone}/${checklistTotal}` : '';
                const dueDate = card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '';

                rows.push([
                    col.name,
                    card.title,
                    card.description || '',
                    card.priority || '',
                    dueDate,
                    labels,
                    checklistStr,
                    card.order ?? '',
                ].map(escapeCsvField).join(','));
            });
        }
    });

    const csv = rows.join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }); // BOM for Excel
    triggerDownload(blob, `${boardData.board.name.replace(/\s+/g, '_')}_export.csv`);
};

// ── Note Export: Markdown ──────────────────────────────────────────────────

export const exportNoteToMarkdown = (note) => {
    if (!note) return;

    const date = new Date(note.updatedAt).toISOString().split('T')[0];
    const frontmatter = [
        '---',
        `title: "${note.title || 'Untitled'}"`,
        (note.tags || []).length > 0
            ? `tags: [${note.tags.map(t => `"${t}"`).join(', ')}]`
            : 'tags: []',
        `date: ${date}`,
        '---',
        '',
    ].join('\n');

    const content = frontmatter + (note.body || '');
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    triggerDownload(blob, `${slugify(note.title)}.md`);
};

// ── Notes Bulk Export: Markdown ────────────────────────────────────────────

export const exportNotesToMarkdown = (notes) => {
    if (!notes || notes.length === 0) return;

    if (notes.length === 1) {
        exportNoteToMarkdown(notes[0]);
        return;
    }

    const sections = notes.map(note => {
        const date = new Date(note.updatedAt).toISOString().split('T')[0];
        const tagsStr = (note.tags || []).length > 0
            ? `Tags: ${note.tags.join(', ')}`
            : '';
        return [
            `# ${note.title || 'Untitled'}`,
            '',
            `> Date: ${date}${tagsStr ? ' | ' + tagsStr : ''}`,
            '',
            note.body || '',
            '',
            '---',
            '',
        ].join('\n');
    });

    const content = sections.join('\n');
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    triggerDownload(blob, `notes_export_${new Date().toISOString().split('T')[0]}.md`);
};

// ── Note Export: PDF ───────────────────────────────────────────────────────

export const exportNoteToPdf = (note, renderedHtml) => {
    if (!note) return;

    const title = note.title || 'Untitled';
    const date = new Date(note.updatedAt).toLocaleDateString();
    const tagsHtml = (note.tags || []).length > 0
        ? `<div style="margin-bottom:16px;display:flex;gap:6px;flex-wrap:wrap">${note.tags.map(t =>
            `<span style="background:#6366f1;color:#fff;padding:2px 10px;border-radius:12px;font-size:12px">${t}</span>`
        ).join('')}</div>`
        : '';

    // Use pre-rendered HTML from the preview DOM (includes mermaid diagrams),
    // falling back to the regex converter if not available
    const bodyHtml = renderedHtml || markdownToHtml(note.body || '');

    const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  @media print { @page { margin: 1in; } }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; max-width: 720px; margin: 0 auto; padding: 40px 20px; line-height: 1.7; }
  h1 { font-size: 28px; margin-bottom: 4px; color: #1a1a2e; }
  .meta { font-size: 13px; color: #666; margin-bottom: 12px; }
  h2 { font-size: 22px; margin-top: 28px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
  h3 { font-size: 18px; margin-top: 22px; }
  p { margin: 10px 0; }
  code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
  pre { background: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 3px solid #6366f1; margin: 12px 0; padding: 8px 16px; color: #555; background: #f9fafb; }
  ul, ol { padding-left: 24px; }
  li { margin: 4px 0; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; font-size: 14px; }
  th { background: #f3f4f6; font-weight: 600; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
  img { max-width: 100%; }
  a { color: #6366f1; }
  .checklist-item { list-style: none; margin-left: -20px; }
  .checklist-item input { margin-right: 6px; }
</style>
</head><body>
<h1>${escapeHtml(title)}</h1>
<div class="meta">${date}</div>
${tagsHtml}
${bodyHtml}
</body></html>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        return false;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    // Wait for content to render before triggering print
    printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
    };
    // Fallback for browsers that don't fire onload for document.write
    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
    }, 500);
};

// ── Markdown → HTML (lightweight, no deps) ─────────────────────────────────

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function markdownToHtml(md) {
    let html = escapeHtml(md);

    // Code blocks (``` ... ```)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
        `<pre><code>${code.trim()}</code></pre>`
    );

    // Inline code
    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Headers
    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

    // Blockquotes
    html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>');

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');

    // Bold + italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // Checklists
    html = html.replace(/^- \[x\]\s+(.+)$/gm, '<li class="checklist-item"><input type="checkbox" checked disabled> $1</li>');
    html = html.replace(/^- \[ \]\s+(.+)$/gm, '<li class="checklist-item"><input type="checkbox" disabled> $1</li>');

    // Unordered lists
    html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');

    // Ordered lists
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

    // Wrap consecutive <li> in <ul>
    html = html.replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

    // Tables
    html = html.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)+)/gm, (_, headerRow, _sep, bodyRows) => {
        const headers = headerRow.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
        const rows = bodyRows.trim().split('\n').map(row => {
            const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
            return `<tr>${cells}</tr>`;
        }).join('');
        return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    });

    // Paragraphs: wrap remaining lines that aren't inside tags
    html = html.replace(/^(?!<[a-z/])(.*\S.*)$/gm, '<p>$1</p>');

    // Clean up consecutive blockquotes
    html = html.replace(/<\/blockquote>\n<blockquote>/g, '<br>');

    return html;
}
