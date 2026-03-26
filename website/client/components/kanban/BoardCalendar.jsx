'use client';
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { getLabelColor } from '@/lib/utils/labelColors';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PRIORITY_CHIP = {
    high:   'bg-red-500/15 border-red-500/30 text-red-300',
    medium: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    low:    'bg-green-500/15 border-green-500/30 text-green-300',
};

/** Build a 6-week (42-cell) grid starting on the Sunday before the 1st of month. */
function buildGrid(year, month) {
    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
    });
}

function toKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function BoardCalendar({ columns, onCardClick }) {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());

    const prevMonth = () => {
        if (month === 0) { setYear(y => y - 1); setMonth(11); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 11) { setYear(y => y + 1); setMonth(0); }
        else setMonth(m => m + 1);
    };
    const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

    const grid = useMemo(() => buildGrid(year, month), [year, month]);
    const todayKey = toKey(today);

    // Build date → cards map from all columns
    const cardsByDate = useMemo(() => {
        const map = {};
        columns.forEach(col => {
            (col.cards ?? []).forEach(card => {
                if (!card.dueDate) return;
                const key = toKey(new Date(card.dueDate));
                if (!map[key]) map[key] = [];
                map[key].push({ ...card, columnName: col.name });
            });
        });
        return map;
    }, [columns]);

    const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Calendar header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle shrink-0">
                <div className="flex items-center gap-2">
                    <button
                        onClick={prevMonth}
                        className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h2 className="text-base font-bold text-text-primary w-44 text-center">{monthLabel}</h2>
                    <button
                        onClick={nextMonth}
                        className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                <button
                    onClick={goToday}
                    className="text-xs font-semibold px-3 py-1.5 rounded-md bg-surface-overlay border border-border-subtle text-text-secondary hover:text-text-primary hover:border-accent/40 transition-all"
                >
                    Today
                </button>
            </div>

            {/* Day-of-week header */}
            <div className="grid grid-cols-7 border-b border-border-subtle shrink-0">
                {DAYS.map(d => (
                    <div key={d} className="py-2 text-center text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                        {d}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6 overflow-hidden">
                {grid.map((date, idx) => {
                    const key = toKey(date);
                    const isCurrentMonth = date.getMonth() === month;
                    const isToday = key === todayKey;
                    const cards = cardsByDate[key] ?? [];

                    return (
                        <DayCell
                            key={idx}
                            date={date}
                            isCurrentMonth={isCurrentMonth}
                            isToday={isToday}
                            cards={cards}
                            onCardClick={onCardClick}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function DayCell({ date, isCurrentMonth, isToday, cards, onCardClick }) {
    const visible = cards.slice(0, 3);
    const overflow = cards.length - visible.length;

    return (
        <div
            className={cn(
                'border-r border-b border-border-subtle/60 p-1.5 flex flex-col gap-1 min-h-0 overflow-hidden',
                !isCurrentMonth && 'bg-surface-raised/20',
            )}
        >
            {/* Date number */}
            <span
                className={cn(
                    'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full shrink-0 self-start',
                    isToday
                        ? 'bg-accent text-white'
                        : isCurrentMonth
                            ? 'text-text-secondary'
                            : 'text-text-muted/40'
                )}
            >
                {date.getDate()}
            </span>

            {/* Card chips */}
            <div className="flex flex-col gap-0.5 min-h-0 overflow-hidden">
                {visible.map(card => (
                    <button
                        key={card._id}
                        onClick={() => onCardClick(card)}
                        title={`${card.title}${card.columnName ? ` · ${card.columnName}` : ''}`}
                        className={cn(
                            'w-full text-left text-[10px] font-medium px-1.5 py-0.5 rounded border truncate leading-tight transition-opacity hover:opacity-80 flex items-center gap-1',
                            PRIORITY_CHIP[card.priority] ?? 'bg-surface-overlay border-border-subtle text-text-secondary'
                        )}
                    >
                        {card.labels?.length > 0 && (
                            <span className="flex items-center gap-0.5 shrink-0">
                                {card.labels.slice(0, 3).map((label, i) => (
                                    <span key={i} className={cn('w-1.5 h-1.5 rounded-full', getLabelColor(label.color).dot)} />
                                ))}
                            </span>
                        )}
                        <span className="truncate">{card.title}</span>
                    </button>
                ))}
                {overflow > 0 && (
                    <span className="text-[10px] text-text-muted pl-1">+{overflow} more</span>
                )}
            </div>
        </div>
    );
}
