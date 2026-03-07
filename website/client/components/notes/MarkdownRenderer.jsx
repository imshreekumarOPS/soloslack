import ReactMarkdown from 'react-markdown';

export default function MarkdownRenderer({ content }) {
    return (
        <div className="prose prose-invert max-w-none 
      prose-h1:text-xl prose-h1:font-bold prose-h1:text-text-primary prose-h1:mb-4 prose-h1:mt-6
      prose-h2:text-lg prose-h2:font-semibold prose-h2:text-text-primary prose-h2:mb-3 prose-h2:mt-5
      prose-h3:text-md prose-h3:font-semibold prose-h3:text-text-primary prose-h3:mb-2 prose-h3:mt-4
      prose-p:text-md prose-p:text-text-primary prose-p:mb-3 prose-p:leading-relaxed
      prose-code:font-mono prose-code:text-sm prose-code:bg-surface-hover prose-code:px-1 prose-code:rounded
      prose-pre:font-mono prose-pre:text-sm prose-pre:bg-surface-overlay prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
      prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-3 prose-ul:text-md
      prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-3 prose-ol:text-md
      prose-blockquote:border-l-2 prose-blockquote:border-accent prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-text-secondary
      prose-hr:border-border-subtle prose-hr:my-6
      prose-a:text-accent prose-a:underline hover:prose-a:text-accent-hover"
        >
            <ReactMarkdown>{content}</ReactMarkdown>
        </div>
    );
}
