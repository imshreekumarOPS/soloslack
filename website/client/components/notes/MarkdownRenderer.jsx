import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MermaidBlock from './MermaidBlock';

// Custom link renderer — intercepts wiki:// scheme for [[Note]] links
function WikiAwareLink({ href, children, onWikiLink }) {
    if (href?.startsWith('wiki://')) {
        const noteId = href.slice(7);
        if (noteId === 'unresolved') {
            return (
                <span className="text-text-muted/60 cursor-default" title="Note not found">
                    [[{children}]]
                </span>
            );
        }
        return (
            <button
                onClick={() => onWikiLink?.(noteId)}
                className="text-accent hover:underline inline-flex items-center gap-0.5 font-medium"
            >
                <span className="text-[11px] opacity-70">↗</span>{children}
            </button>
        );
    }
    return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

export default function MarkdownRenderer({ content, onWikiLink }) {
    const components = {
        a: ({ href, children }) => (
            <WikiAwareLink href={href} onWikiLink={onWikiLink}>{children}</WikiAwareLink>
        ),
        code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            if (match?.[1] === 'mermaid') {
                return <MermaidBlock chart={String(children)} />;
            }
            return <code className={className} {...props}>{children}</code>;
        },
        pre: ({ children }) => {
            // If the child is a MermaidBlock, don't wrap in <pre>
            const child = children?.props ?? {};
            if (/language-mermaid/.test(child.className || '')) {
                return <>{children}</>;
            }
            return <pre>{children}</pre>;
        },
    };

    return (
        <div className="prose dark:prose-invert max-w-none
      prose-headings:text-text-primary prose-headings:font-bold
      prose-p:text-text-primary prose-p:leading-relaxed
      prose-a:text-accent prose-a:no-underline hover:prose-a:underline
      prose-code:text-accent prose-code:bg-accent/10 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-surface-raised prose-pre:text-text-primary prose-pre:border prose-pre:border-border-subtle
      prose-strong:text-text-primary
      prose-blockquote:border-l-accent prose-blockquote:text-text-secondary prose-blockquote:bg-surface-raised/30
      prose-table:border prose-table:border-border-subtle
      prose-th:bg-surface-raised prose-th:text-text-primary
      prose-td:text-text-secondary"
        >
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{content}</ReactMarkdown>
        </div>
    );
}
