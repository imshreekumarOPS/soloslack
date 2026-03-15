import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownRenderer({ content }) {
    return (
        <div className="prose prose-invert max-w-none 
      prose-headings:text-text-primary prose-headings:font-bold
      prose-p:text-text-primary prose-p:leading-relaxed
      prose-a:text-accent prose-a:no-underline hover:prose-a:underline
      prose-code:text-accent prose-code:bg-accent/10 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
      prose-strong:text-text-primary
      prose-blockquote:border-l-accent prose-blockquote:text-text-secondary prose-blockquote:bg-surface-raised/30
      prose-table:border prose-table:border-border-subtle
      prose-th:bg-surface-raised prose-th:text-text-primary
      prose-td:text-text-secondary"
        >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
    );
}
