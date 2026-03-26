'use client';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAI } from '@/context/AIContext';

/**
 * Small sparkle icon button used next to all AI-enabled features.
 * Disabled + tooltip when AI is not configured.
 */
export default function AISparkleButton({ onClick, loading, disabled, title, className, size = 'sm' }) {
    const { isConfigured } = useAI();

    const sizeClasses = {
        xs: 'p-0.5',
        sm: 'p-1',
        md: 'p-1.5',
    };

    const iconSizes = {
        xs: 'w-3 h-3',
        sm: 'w-3.5 h-3.5',
        md: 'w-4 h-4',
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || loading || !isConfigured}
            title={!isConfigured ? 'Configure an AI API key in Settings to use this feature' : title}
            className={cn(
                'rounded-md transition-all inline-flex items-center gap-1',
                sizeClasses[size],
                isConfigured
                    ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
                    : 'text-text-muted opacity-40 cursor-not-allowed',
                loading && 'animate-pulse',
                className,
            )}
        >
            <Sparkles className={cn(iconSizes[size], loading && 'animate-spin')} />
        </button>
    );
}

/**
 * Larger AI action button with text label.
 */
export function AIActionButton({ onClick, loading, disabled, children, className }) {
    const { isConfigured } = useAI();

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || loading || !isConfigured}
            title={!isConfigured ? 'Configure an AI API key in Settings' : undefined}
            className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                isConfigured
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/30'
                    : 'bg-surface-overlay text-text-muted opacity-40 cursor-not-allowed border border-border-subtle',
                loading && 'animate-pulse',
                className,
            )}
        >
            <Sparkles className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            {loading ? 'Thinking...' : children}
        </button>
    );
}
