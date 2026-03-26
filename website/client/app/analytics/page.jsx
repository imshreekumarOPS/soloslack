'use client';
import { useState, useEffect, useMemo } from 'react';
import { BarChart3, ArrowUpRight, ArrowDownRight, Zap, Send, Download, Trash2, Info } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import {
    getUsageSummary, getUsageByDay, getUsageByWeek, getUsageByMonth,
    getUsageByModel, getUsageByProvider, clearUsage, getUsage,
} from '@/lib/ai/tokenTracker';
import { cn } from '@/lib/utils/cn';

const PROVIDER_COLORS = {
    openai: '#10b981',
    anthropic: '#8b5cf6',
    gemini: '#f59e0b',
};

const MODEL_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
    '#06b6d4', '#ef4444', '#f97316', '#14b8a6', '#a855f7',
];

function formatNumber(num) {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString();
}

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface-overlay border border-border-subtle rounded-xl px-3 py-2 shadow-xl text-xs">
            <p className="text-text-muted font-medium mb-1">{label}</p>
            {payload.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-text-secondary capitalize">{entry.name}:</span>
                    <span className="text-text-primary font-semibold">{formatNumber(entry.value)}</span>
                </div>
            ))}
        </div>
    );
}

export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState('month');
    const [chartView, setChartView] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // Memoized data
    const summary = useMemo(() => mounted ? getUsageSummary(timeRange) : null, [timeRange, mounted]);
    const allTimeSummary = useMemo(() => mounted ? getUsageSummary('all') : null, [mounted]);
    const modelBreakdown = useMemo(() => mounted ? getUsageByModel(timeRange) : [], [timeRange, mounted]);
    const providerBreakdown = useMemo(() => mounted ? getUsageByProvider(timeRange) : [], [timeRange, mounted]);

    const chartData = useMemo(() => {
        if (!mounted) return [];
        if (chartView === 'daily') return getUsageByDay(timeRange);
        if (chartView === 'weekly') return getUsageByWeek(timeRange);
        return getUsageByMonth(timeRange);
    }, [chartView, timeRange, mounted]);

    const recentRecords = useMemo(() => {
        if (!mounted) return [];
        return getUsage(timeRange).slice(-50).reverse();
    }, [timeRange, mounted]);

    const handleClearData = () => {
        if (!confirm('Clear all AI usage data? This cannot be undone.')) return;
        clearUsage();
        // Force re-render
        setMounted(false);
        setTimeout(() => setMounted(true), 0);
    };

    if (!mounted) {
        return (
            <div className="p-6 md:p-10 max-w-6xl mx-auto">
                <div className="flex items-center justify-center py-20 text-text-muted text-sm">Loading...</div>
            </div>
        );
    }

    const hasData = summary && summary.requestCount > 0;

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border-subtle flex items-center justify-center text-text-muted">
                        <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-text-primary">AI Analytics</h1>
                        <p className="text-xs text-text-muted">Track your AI token usage across providers and models</p>
                    </div>
                </div>
                {hasData && (
                    <button
                        onClick={handleClearData}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear Data
                    </button>
                )}
            </header>

            {/* Time Range Selector */}
            <div className="flex gap-1 bg-surface-overlay border border-border-default rounded-lg p-1 w-fit">
                {[
                    { key: 'week', label: 'Week' },
                    { key: 'month', label: 'Month' },
                    { key: 'year', label: 'Year' },
                    { key: 'all', label: 'All Time' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setTimeRange(key)}
                        className={cn(
                            'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                            timeRange === key
                                ? 'bg-accent text-white'
                                : 'text-text-secondary hover:text-text-primary'
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {!hasData ? (
                <div className="border border-dashed border-border-subtle rounded-2xl p-16 text-center">
                    <BarChart3 className="w-10 h-10 text-text-muted/30 mx-auto mb-4" />
                    <p className="text-sm text-text-muted mb-1">No usage data yet</p>
                    <p className="text-xs text-text-muted/60">Token usage will appear here as you use AI features</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            label="Total Tokens"
                            value={formatNumber(summary.totalTokens)}
                            icon={<Zap className="w-4 h-4" />}
                            color="text-purple-400"
                            bgColor="bg-purple-500/10"
                            borderColor="border-purple-500/20"
                        />
                        <StatCard
                            label="Input Tokens"
                            value={formatNumber(summary.inputTokens)}
                            sublabel="Sent"
                            icon={<Send className="w-4 h-4" />}
                            color="text-blue-400"
                            bgColor="bg-blue-500/10"
                            borderColor="border-blue-500/20"
                        />
                        <StatCard
                            label="Output Tokens"
                            value={formatNumber(summary.outputTokens)}
                            sublabel="Received"
                            icon={<Download className="w-4 h-4" />}
                            color="text-emerald-400"
                            bgColor="bg-emerald-500/10"
                            borderColor="border-emerald-500/20"
                        />
                        <StatCard
                            label="Requests"
                            value={formatNumber(summary.requestCount)}
                            sublabel="API Calls"
                            icon={<ArrowUpRight className="w-4 h-4" />}
                            color="text-amber-400"
                            bgColor="bg-amber-500/10"
                            borderColor="border-amber-500/20"
                        />
                    </div>

                    {/* Usage Chart */}
                    <div className="bg-surface-raised border border-border-subtle rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-text-primary">Token Usage Over Time</h2>
                            <div className="flex gap-1 bg-surface-overlay border border-border-subtle rounded-lg p-0.5">
                                {[
                                    { key: 'daily', label: 'Daily' },
                                    { key: 'weekly', label: 'Weekly' },
                                    { key: 'monthly', label: 'Monthly' },
                                ].map(({ key, label }) => (
                                    <button
                                        key={key}
                                        onClick={() => setChartView(key)}
                                        className={cn(
                                            'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                                            chartView === key
                                                ? 'bg-accent/20 text-accent'
                                                : 'text-text-muted hover:text-text-primary'
                                        )}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {chartData.length === 0 ? (
                            <div className="flex items-center justify-center h-[280px] text-text-muted text-xs">
                                No data for this period
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="inputGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="outputGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                                    <XAxis
                                        dataKey={chartView === 'daily' ? 'date' : chartView === 'weekly' ? 'week' : 'month'}
                                        tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                                        axisLine={{ stroke: 'var(--color-border-subtle)' }}
                                        tickLine={false}
                                        tickFormatter={(v) => {
                                            if (chartView === 'daily') {
                                                const d = new Date(v);
                                                return `${d.getMonth() + 1}/${d.getDate()}`;
                                            }
                                            return v;
                                        }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={formatNumber}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="inputTokens"
                                        name="Input"
                                        stroke="#6366f1"
                                        strokeWidth={2}
                                        fill="url(#inputGrad)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="outputTokens"
                                        name="Output"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fill="url(#outputGrad)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Model & Provider Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* By Model */}
                        <div className="bg-surface-raised border border-border-subtle rounded-2xl p-5">
                            <h2 className="text-sm font-bold text-text-primary mb-4">Usage by Model</h2>
                            {modelBreakdown.length === 0 ? (
                                <div className="flex items-center justify-center h-[200px] text-text-muted text-xs">No data</div>
                            ) : (
                                <>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={modelBreakdown}
                                                dataKey="totalTokens"
                                                nameKey="model"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={2}
                                            >
                                                {modelBreakdown.map((_, i) => (
                                                    <Cell key={i} fill={MODEL_COLORS[i % MODEL_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="space-y-2 mt-3">
                                        {modelBreakdown.map((m, i) => (
                                            <div key={m.model} className="flex items-center gap-2 text-xs">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: MODEL_COLORS[i % MODEL_COLORS.length] }}
                                                />
                                                <span className="text-text-primary font-medium truncate flex-1">{m.model}</span>
                                                <span className="text-text-muted shrink-0">{formatNumber(m.totalTokens)} tokens</span>
                                                <span className="text-text-muted/60 shrink-0">({m.requests} calls)</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* By Provider */}
                        <div className="bg-surface-raised border border-border-subtle rounded-2xl p-5">
                            <h2 className="text-sm font-bold text-text-primary mb-4">Usage by Provider</h2>
                            {providerBreakdown.length === 0 ? (
                                <div className="flex items-center justify-center h-[200px] text-text-muted text-xs">No data</div>
                            ) : (
                                <>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={providerBreakdown} layout="vertical" barCategoryGap={8}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" horizontal={false} />
                                            <XAxis
                                                type="number"
                                                tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={formatNumber}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="provider"
                                                tick={{ fontSize: 11, fill: 'var(--color-text-primary)', fontWeight: 500 }}
                                                axisLine={false}
                                                tickLine={false}
                                                width={80}
                                                tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="inputTokens" name="Input" stackId="a" radius={[0, 0, 0, 0]}>
                                                {providerBreakdown.map((entry) => (
                                                    <Cell key={entry.provider} fill={PROVIDER_COLORS[entry.provider] || '#6366f1'} fillOpacity={0.6} />
                                                ))}
                                            </Bar>
                                            <Bar dataKey="outputTokens" name="Output" stackId="a" radius={[0, 4, 4, 0]}>
                                                {providerBreakdown.map((entry) => (
                                                    <Cell key={entry.provider} fill={PROVIDER_COLORS[entry.provider] || '#6366f1'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                    <div className="space-y-2 mt-3">
                                        {providerBreakdown.map((p) => (
                                            <div key={p.provider} className="flex items-center gap-2 text-xs">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: PROVIDER_COLORS[p.provider] || '#6366f1' }}
                                                />
                                                <span className="text-text-primary font-medium capitalize flex-1">{p.provider}</span>
                                                <span className="text-text-muted shrink-0">
                                                    {formatNumber(p.inputTokens)} in / {formatNumber(p.outputTokens)} out
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Recent Activity Table */}
                    <div className="bg-surface-raised border border-border-subtle rounded-2xl p-5">
                        <h2 className="text-sm font-bold text-text-primary mb-4">Recent Requests</h2>
                        {recentRecords.length === 0 ? (
                            <p className="text-xs text-text-muted text-center py-8">No recent requests</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-border-subtle">
                                            <th className="text-left py-2 px-3 text-text-muted font-semibold uppercase tracking-wider text-[10px]">Time</th>
                                            <th className="text-left py-2 px-3 text-text-muted font-semibold uppercase tracking-wider text-[10px]">Provider</th>
                                            <th className="text-left py-2 px-3 text-text-muted font-semibold uppercase tracking-wider text-[10px]">Model</th>
                                            <th className="text-right py-2 px-3 text-text-muted font-semibold uppercase tracking-wider text-[10px]">Input</th>
                                            <th className="text-right py-2 px-3 text-text-muted font-semibold uppercase tracking-wider text-[10px]">Output</th>
                                            <th className="text-right py-2 px-3 text-text-muted font-semibold uppercase tracking-wider text-[10px]">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentRecords.slice(0, 20).map((r, i) => (
                                            <tr key={i} className="border-b border-border-subtle/50 hover:bg-surface-hover/30 transition-colors">
                                                <td className="py-2 px-3 text-text-muted">
                                                    {new Date(r.timestamp).toLocaleString(undefined, {
                                                        month: 'short', day: 'numeric',
                                                        hour: '2-digit', minute: '2-digit',
                                                    })}
                                                </td>
                                                <td className="py-2 px-3">
                                                    <span
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                                                        style={{
                                                            backgroundColor: `${PROVIDER_COLORS[r.provider] || '#6366f1'}20`,
                                                            color: PROVIDER_COLORS[r.provider] || '#6366f1',
                                                        }}
                                                    >
                                                        <span
                                                            className="w-1.5 h-1.5 rounded-full"
                                                            style={{ backgroundColor: PROVIDER_COLORS[r.provider] || '#6366f1' }}
                                                        />
                                                        {r.provider}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 text-text-primary font-medium">{r.model}</td>
                                                <td className="py-2 px-3 text-right text-blue-400">{formatNumber(r.inputTokens)}</td>
                                                <td className="py-2 px-3 text-right text-emerald-400">{formatNumber(r.outputTokens)}</td>
                                                <td className="py-2 px-3 text-right text-text-primary font-semibold">{formatNumber(r.totalTokens)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {recentRecords.length > 20 && (
                                    <p className="text-[10px] text-text-muted text-center mt-2">
                                        Showing latest 20 of {recentRecords.length} requests
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Info Footer */}
                    <div className="flex items-start gap-2 text-[11px] text-text-muted/60 bg-surface-overlay/30 border border-border-subtle rounded-xl px-4 py-3">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <p>Usage data is stored locally in your browser. It tracks tokens from all AI features (summaries, card generation, templates, etc.) and is never sent to any server.</p>
                    </div>
                </>
            )}
        </div>
    );
}

function StatCard({ label, value, sublabel, icon, color, bgColor, borderColor }) {
    return (
        <div className={cn('rounded-2xl border p-4 space-y-2', bgColor, borderColor)}>
            <div className="flex items-center justify-between">
                <span className={cn('text-[10px] font-bold uppercase tracking-wider', color)}>{label}</span>
                <span className={cn(color)}>{icon}</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            {sublabel && <p className="text-[10px] text-text-muted">{sublabel}</p>}
        </div>
    );
}
