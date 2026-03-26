'use client';
import { useEffect, useRef, useState, useId } from 'react';

export default function MermaidBlock({ chart }) {
    const containerRef = useRef(null);
    const [error, setError] = useState(null);
    const uniqueId = `mermaid-${useId().replace(/:/g, '')}`;

    useEffect(() => {
        let cancelled = false;

        async function render() {
            try {
                const mermaid = (await import('mermaid')).default;
                mermaid.initialize({
                    startOnLoad: false,
                    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
                    securityLevel: 'strict',
                    fontFamily: 'inherit',
                });

                const { svg } = await mermaid.render(uniqueId, chart.trim());
                if (!cancelled && containerRef.current) {
                    containerRef.current.innerHTML = svg;
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || 'Invalid Mermaid syntax');
                    // mermaid render may leave a phantom element in the DOM
                    const phantom = document.getElementById('d' + uniqueId);
                    phantom?.remove();
                }
            }
        }

        render();
        return () => { cancelled = true; };
    }, [chart, uniqueId]);

    if (error) {
        return (
            <div className="border border-red-400/40 bg-red-400/5 rounded-lg p-4 my-3 text-sm">
                <p className="text-red-400 font-medium mb-1">Mermaid diagram error</p>
                <pre className="text-text-muted text-xs whitespace-pre-wrap">{error}</pre>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="my-3 flex justify-center [&>svg]:max-w-full"
        />
    );
}
