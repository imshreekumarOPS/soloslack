import { cn } from '@/lib/utils/cn';

export default function Badge({ priority }) {
    const styles = {
        low: "bg-green-500/10 text-green-400 border-green-500/20",
        medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        high: "bg-red-500/10 text-red-400 border-red-500/20",
    };

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border uppercase tracking-wider",
            styles[priority] || styles.medium
        )}>
            <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                priority === 'low' && "bg-green-500",
                priority === 'medium' && "bg-amber-500",
                priority === 'high' && "bg-red-500"
            )} />
            {priority}
        </span>
    );
}
