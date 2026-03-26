'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useNotes } from '@/context/NotesContext';
import { useBoards } from '@/context/BoardsContext';
import { useWorkspaces } from '@/context/WorkspacesContext';
import BoardCard from '@/components/kanban/BoardCard';
import { timeAgo, formatDueDate, getDueDateStatus } from '@/lib/utils/formatDate';
import AnimatedIcon from '@/components/ui/AnimatedIcon';
import { cardsApi } from '@/lib/api/cardsApi';
import WeeklyDigest from '@/components/ai/WeeklyDigest';
import AutoPrioritize from '@/components/ai/AutoPrioritize';
import {
    FileText,
    LayoutDashboard,
    Plus,
    ArrowRight,
    Clock,
    ChevronRight,
    Zap,
    Calendar,
    AlertCircle,
    AlertTriangle,
    Pin,
} from 'lucide-react';

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

function getFormattedDate() {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

// ── Main Page ────────────────────────────────────────────────────

export default function Dashboard() {
    const { notes, fetchNotes, setActiveNote } = useNotes();
    const { boards, fetchBoards, setIsCreateBoardModalOpen } = useBoards();
    const { workspaces, fetchWorkspaces } = useWorkspaces();
    const [upcomingCards, setUpcomingCards] = useState([]);

    useEffect(() => {
        fetchNotes({ limit: 6 });
        fetchBoards();
        fetchWorkspaces();
        cardsApi.getUpcoming()
            .then(res => setUpcomingCards(res.data))
            .catch(() => {});
    }, [fetchNotes, fetchBoards, fetchWorkspaces]);

    // Most recently updated item across notes + boards
    const lastActiveAgo = useMemo(() => {
        const all = [
            ...notes.map(n => new Date(n.updatedAt)),
            ...boards.map(b => new Date(b.updatedAt)),
        ].filter(d => !isNaN(d));
        if (!all.length) return null;
        return timeAgo(new Date(Math.max(...all)));
    }, [notes, boards]);

    // Unified activity feed — latest 8 items across notes + boards
    const activityFeed = useMemo(() => {
        const noteItems = notes.map(n => ({ type: 'note', item: n, date: n.updatedAt }));
        const boardItems = boards.slice(0, 5).map(b => ({ type: 'board', item: b, date: b.updatedAt }));
        return [...noteItems, ...boardItems]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 8);
    }, [notes, boards]);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">

            {/* ── Header: Greeting + Primary CTAs ── */}
            <header className="animate-fade-in-up stagger-1 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold gradient-text leading-tight">
                        {getGreeting()}!
                    </h1>
                    <p className="text-text-muted text-sm mt-1.5">{getFormattedDate()}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <Link
                        href="/notes"
                        className="flex items-center gap-2 px-4 py-2.5 bg-surface-raised border border-border-subtle rounded-xl text-sm font-semibold text-text-primary hover:border-accent/40 hover:bg-surface-hover transition-all duration-200"
                    >
                        <Plus size={15} />
                        New Note
                        <kbd className="ml-0.5 px-1.5 py-0.5 rounded text-[10px] bg-surface-overlay text-text-muted font-mono">
                            Alt+N
                        </kbd>
                    </Link>
                    <button
                        onClick={() => setIsCreateBoardModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover transition-all duration-200 shadow-lg shadow-accent/20"
                    >
                        <Plus size={15} />
                        New Board
                        <kbd className="ml-0.5 px-1.5 py-0.5 rounded text-[10px] bg-white/20 text-white/80 font-mono">
                            Alt+B
                        </kbd>
                    </button>
                </div>
            </header>

            {/* ── Stats Strip ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up stagger-2">
                <StatCard
                    icon={<AnimatedIcon type="notes" active className="w-5 h-5" />}
                    iconClass="icon-gradient-indigo"
                    label="Notes"
                    value={notes.length}
                    borderHover="hover:border-indigo-500/40"
                    cardClass="stat-card-indigo"
                />
                <StatCard
                    icon={<AnimatedIcon type="boards" active className="w-5 h-5" />}
                    iconClass="icon-gradient-emerald"
                    label="Boards"
                    value={boards.length}
                    borderHover="hover:border-emerald-500/40"
                    cardClass="stat-card-emerald"
                />
                <StatCard
                    icon={<LayoutDashboard size={18} />}
                    iconClass="bg-gradient-to-br from-violet-500 to-purple-600"
                    label="Workspaces"
                    value={workspaces.length}
                    borderHover="hover:border-violet-500/40"
                    cardClass="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20"
                />
                <StatCard
                    icon={<Zap size={18} />}
                    iconClass="bg-gradient-to-br from-amber-500 to-orange-400"
                    label={lastActiveAgo ? 'Last Active' : 'Status'}
                    value={lastActiveAgo ?? '—'}
                    subtitle={lastActiveAgo ? 'ago' : 'Nothing yet'}
                    borderHover="hover:border-amber-500/40"
                    cardClass="stat-card-amber"
                    smallValue={!!lastActiveAgo}
                />
            </div>

            {/* ── Main Content: Boards grid + Activity feed ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up stagger-3">

                {/* Boards — left 2/3 */}
                <section className="lg:col-span-2 space-y-4">
                    <SectionHeader title="Your Boards" href="/boards" accentColor="bg-accent" />
                    {boards.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {boards.slice(0, 4).map((board, i) => (
                                <BoardCard key={board._id} board={board} index={i} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="No boards yet"
                            description="Create your first board to organize tasks with Kanban columns"
                            action={
                                <button
                                    onClick={() => setIsCreateBoardModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors"
                                >
                                    <Plus size={14} />
                                    Create Board
                                </button>
                            }
                        />
                    )}
                </section>

                {/* Activity feed — right 1/3 */}
                <section className="space-y-4">
                    <SectionHeader title="Recent Activity" accentColor="bg-emerald-500" />
                    {activityFeed.length > 0 ? (
                        <div className="space-y-2">
                            {activityFeed.map((entry) => (
                                <ActivityItem
                                    key={`${entry.type}-${entry.item._id}`}
                                    entry={entry}
                                    setActiveNote={setActiveNote}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="No activity yet"
                            description="Start creating notes or boards to see them here"
                            compact
                        />
                    )}
                </section>
            </div>

            {/* ── Due Soon ── */}
            {upcomingCards.length > 0 && (
                <section className="animate-fade-in-up stagger-4 space-y-4">
                    <SectionHeader title="Due Soon" accentColor="bg-red-500" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {upcomingCards.map(card => (
                            <DueSoonCard key={card._id} card={card} />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Recent Notes Grid ── */}
            {notes.length > 0 && (
                <section className="animate-fade-in-up stagger-5 space-y-4">
                    <SectionHeader title="Recent Notes" href="/notes" accentColor="bg-violet-500" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {notes.slice(0, 6).map((note) => (
                            <NoteCard key={note._id} note={note} setActiveNote={setActiveNote} />
                        ))}
                    </div>
                </section>
            )}

            {/* ── AI Sections ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up stagger-5">
                <WeeklyDigest notes={notes} boards={boards} upcomingCards={upcomingCards} />
                <AutoPrioritize
                    cards={upcomingCards}
                    onUpdateCard={async (cardId, data) => {
                        await cardsApi.update(cardId, data);
                        const res = await cardsApi.getUpcoming();
                        setUpcomingCards(res.data);
                    }}
                />
            </div>

        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────

function StatCard({ icon, iconClass, label, value, subtitle, borderHover, cardClass, smallValue }) {
    return (
        <div
            className={`rounded-2xl p-5 flex items-center gap-4 border transition-all duration-300 hover:scale-[1.02] card-glow ${cardClass} ${borderHover}`}
        >
            <div
                className={`w-11 h-11 rounded-xl ${iconClass} flex items-center justify-center text-white shadow-lg shrink-0`}
            >
                {icon}
            </div>
            <div className="min-w-0">
                <p className={`font-bold text-text-primary leading-none ${smallValue ? 'text-base' : 'text-2xl'}`}>
                    {value}
                    {subtitle && <span className="text-xs text-text-muted font-normal ml-1">{subtitle}</span>}
                </p>
                <p className="text-[11px] text-text-muted font-semibold uppercase tracking-widest mt-1">
                    {label}
                </p>
            </div>
        </div>
    );
}

function SectionHeader({ title, href, accentColor }) {
    return (
        <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <span className={`w-1.5 h-5 rounded-full ${accentColor} inline-block shrink-0`} />
                {title}
            </h2>
            {href && (
                <Link
                    href={href}
                    className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover font-semibold uppercase tracking-wider transition-colors"
                >
                    View all <ArrowRight size={11} />
                </Link>
            )}
        </div>
    );
}

function ActivityItem({ entry, setActiveNote }) {
    const isNote = entry.type === 'note';
    const item = entry.item;

    const handleClick = () => {
        if (isNote) {
            setActiveNote(item);
            window.location.href = '/notes';
        } else {
            window.location.href = `/boards/${item._id}`;
        }
    };

    return (
        <button
            onClick={handleClick}
            className="w-full group flex items-start gap-3 p-3 rounded-xl bg-surface-raised border border-border-subtle hover:border-accent/30 hover:bg-surface-hover transition-all duration-200 text-left"
        >
            <div
                className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 ${
                    isNote
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-500'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                }`}
            >
                {isNote ? <FileText size={13} /> : <LayoutDashboard size={13} />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                    {item.title || item.name || 'Untitled'}
                </p>
                <p className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1">
                    <Clock size={9} />
                    {timeAgo(entry.date)}&nbsp;·&nbsp;{isNote ? 'Note' : 'Board'}
                </p>
            </div>
            <ChevronRight
                size={12}
                className="text-text-muted shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
            />
        </button>
    );
}

function NoteCard({ note, setActiveNote }) {
    return (
        <button
            onClick={() => {
                setActiveNote(note);
                window.location.href = '/notes';
            }}
            className="group w-full text-left bg-surface-raised border border-border-subtle rounded-xl p-4 hover:border-accent/40 hover:bg-surface-hover transition-all duration-200 card-glow"
        >
            <div className="flex items-center gap-3 mb-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">
                    {(note.title || 'U')[0].toUpperCase()}
                </div>
                <h4 className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors flex-1">
                    {note.title || 'Untitled'}
                </h4>
                {note.isPinned && (
                    <Pin className="w-3 h-3 text-accent fill-accent shrink-0" />
                )}
            </div>
            <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                {note.body ? note.body.substring(0, 100) : 'No content'}
            </p>
            <p className="text-[10px] text-text-muted mt-2.5 flex items-center gap-1">
                <Clock size={9} />
                {timeAgo(note.updatedAt)}
            </p>
        </button>
    );
}

const PRIORITY_DOT = { high: '#f87171', medium: '#fbbf24', low: '#4ade80' };

function DueSoonCard({ card }) {
    const status = getDueDateStatus(card.dueDate);
    const dateText = formatDueDate(card.dueDate);

    const statusStyles = {
        overdue: {
            border: 'rgba(239,68,68,0.35)',
            bg: 'rgba(239,68,68,0.08)',
            badgeBg: 'rgba(239,68,68,0.15)',
            badgeBorder: 'rgba(239,68,68,0.3)',
            badgeColor: '#f87171',
            icon: <AlertCircle size={11} />,
            label: 'Overdue',
        },
        soon: {
            border: 'rgba(245,158,11,0.35)',
            bg: 'rgba(245,158,11,0.06)',
            badgeBg: 'rgba(245,158,11,0.15)',
            badgeBorder: 'rgba(245,158,11,0.3)',
            badgeColor: '#fbbf24',
            icon: <AlertTriangle size={11} />,
            label: 'Due soon',
        },
    };

    const s = statusStyles[status] ?? statusStyles.soon;

    return (
        <Link
            href={`/boards/${card.boardId?._id}`}
            style={{ borderColor: s.border, backgroundColor: s.bg }}
            className="group flex flex-col gap-2 p-3.5 rounded-xl border transition-all duration-200 hover:scale-[1.02] card-glow"
        >
            {/* Status badge + priority dot */}
            <div className="flex items-center justify-between">
                <span
                    style={{ backgroundColor: s.badgeBg, borderColor: s.badgeBorder, color: s.badgeColor }}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border"
                >
                    {s.icon}
                    {s.label}
                </span>
                <span
                    style={{ backgroundColor: PRIORITY_DOT[card.priority] ?? '#94a3b8' }}
                    className="w-2 h-2 rounded-full shrink-0"
                    title={card.priority}
                />
            </div>

            {/* Card title */}
            <p className="text-sm font-semibold text-text-primary leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                {card.title}
            </p>

            {/* Footer: due date + board name */}
            <div className="flex items-center justify-between mt-auto pt-1">
                <span className="flex items-center gap-1 text-[10px] text-text-muted">
                    <Calendar size={9} />
                    {dateText}
                </span>
                {card.boardId?.name && (
                    <span className="text-[10px] text-text-muted truncate max-w-[100px]">
                        {card.boardId.name}
                    </span>
                )}
            </div>
        </Link>
    );
}

function EmptyState({ title, description, action, compact }) {
    return (
        <div
            className={`border border-dashed border-border-subtle rounded-2xl text-center text-text-muted glass ${
                compact ? 'p-6' : 'p-10'
            }`}
        >
            <p className={`font-medium ${compact ? 'text-sm' : 'text-base'} mb-1`}>{title}</p>
            <p className="text-xs">{description}</p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
