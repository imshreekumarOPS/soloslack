'use client';
import { cn } from '@/lib/utils/cn';

/**
 * AnimatedIcon component to render premium SVG icons with CSS animations
 * @param {Object} props
 * @param {string} props.type - The type of icon ('dashboard', 'notes', 'boards', 'settings', 'bolt')
 * @param {boolean} props.active - Whether the animation should be active (loops)
 * @param {string} props.className - Additional CSS classes
 */
export default function AnimatedIcon({ type, active = false, className = "w-6 h-6" }) {
    const renderIcon = () => {
        switch (type) {
            case 'dashboard':
                return (
                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full stroke-current" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
                        <rect className={cn("transition-all duration-300 opacity-0 fill-current", active && "opacity-20 translate-x-1 translate-y-1")} x="14.5" y="7" width="4" height="4" rx="1" />
                    </svg>
                );
            case 'notes':
                return (
                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full stroke-current" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        <line x1="9" y1="13" x2="15" y2="13" className={cn("transition-all duration-500 stroke-current origin-left scale-x-0 opacity-0", active && "scale-x-100 opacity-100")} />
                        <line x1="9" y1="16" x2="12" y2="16" className={cn("transition-all duration-500 delay-150 stroke-current origin-left scale-x-0 opacity-0", active && "scale-x-100 opacity-100")} />
                    </svg>
                );
            case 'boards':
                return (
                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full stroke-current" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125c-.621 0-1.125.504-1.125 1.125v12.75c0 .621.504 1.125 1.125 1.125Z" />
                        <rect x="5.5" y="7" width="2" height="6" rx="0.5" className={cn("transition-all duration-500 fill-current opacity-10", active && "translate-x-6 opacity-30")} />
                    </svg>
                );
            case 'settings':
                return (
                    <svg viewBox="0 0 24 24" fill="none" className={cn("w-full h-full stroke-current transition-transform duration-700", active && "rotate-180")} strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                );
            case 'bolt':
                return (
                    <svg viewBox="0 0 24 24" fill="none" className={cn("w-full h-full stroke-current", active && "animate-pulse")} strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div className={cn("relative flex items-center justify-center transition-all duration-300", className, active && "scale-110")}>
            {renderIcon()}
        </div>
    );
}
