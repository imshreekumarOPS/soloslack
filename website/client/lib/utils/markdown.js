/**
 * Simple utility to strip markdown syntax from a string.
 * This is useful for previews in lists where we want clean text.
 */
export function stripMarkdown(markdown) {
    if (!markdown) return '';
    
    return markdown
        // Strip headers
        .replace(/^#+\s+/gm, '')
        // Strip links [text](url) -> text
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        // Strip bold/italic
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        // Strip code blocks and inline code
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        // Strip blockquotes
        .replace(/^\s*>\s+/gm, '')
        // Strip horizontal rules
        .replace(/^\s*[-*_]{3,}\s*$/gm, '')
        // Strip extra newlines
        .replace(/\n+/g, ' ')
        .trim();
}
