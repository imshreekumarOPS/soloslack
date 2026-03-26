'use client';
import { useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useAI } from '@/context/AIContext';
import { Key, Save, Shield, Settings2, Sparkles, CheckCircle2, Eye, EyeOff, Cpu, Zap, AlertCircle } from 'lucide-react';

const PROVIDERS = [
    { key: 'openai', name: 'OpenAI', placeholder: 'sk-...', color: 'emerald' },
    { key: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-...', color: 'violet' },
    { key: 'gemini', name: 'Google Gemini', placeholder: 'AI...', color: 'amber' },
];

export default function SettingsPage() {
    const { serverEnv, updateServerEnv, theme, updateTheme, isLoaded, apiKeys } = useSettings();
    const { activeProvider, setActiveProvider, keyStatus, isValidating, setProviderKey, validateProviderKey } = useAI();
    const [localEnv, setLocalEnv] = useState({ ...serverEnv });
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isLoaded) {
            setLocalEnv({ ...serverEnv });
        }
    }, [isLoaded, serverEnv]);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveStatus(null);
        setError(null);
        
        // Simulate a small delay for UX
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const success = await updateServerEnv(localEnv);
        if (success) {
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 5000);
        } else {
            setError('Failed to update server environment variables.');
        }
        setIsSaving(false);
    };

    if (!isLoaded) return null;

    return (
        <div className="max-w-4xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="mb-10 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <div className="p-2.5 rounded-2xl bg-accent/10 text-accent shadow-inner">
                        <Settings2 className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">System Settings</h1>
                </div>
                <p className="text-text-secondary max-w-lg">Configure your database connection and server environment variables.</p>
            </header>

            <form onSubmit={handleSave} className="space-y-8">
                {/* Database Configuration Section */}
                <section className="glass-morphism rounded-3xl border border-border-subtle p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -top-12 -right-12 p-8 text-accent/5 pointer-events-none group-hover:text-accent/10 transition-all duration-700 scale-150 group-hover:rotate-12">
                        <Shield className="w-64 h-64" />
                    </div>
                    
                    <div className="flex items-center gap-3 mb-8 relative z-10">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-text-primary tracking-tight">Database Configuration</h2>
                    </div>

                    <div className="space-y-8 relative z-10">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">MongoDB Connection String</label>
                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">Required</span>
                            </div>
                            <div className="relative group/input">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within/input:text-accent">
                                    <Key className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    value={localEnv.MONGODB_URI}
                                    onChange={(e) => setLocalEnv({ ...localEnv, MONGODB_URI: e.target.value })}
                                    placeholder="mongodb://username:password@host:port/database"
                                    className="w-full bg-surface-overlay/40 border border-border-subtle focus:border-accent/40 focus:ring-4 focus:ring-accent/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-text-primary outline-none transition-all font-mono placeholder:text-text-muted/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em] px-1">Server Port</label>
                            <input
                                type="text"
                                value={localEnv.PORT}
                                onChange={(e) => setLocalEnv({ ...localEnv, PORT: e.target.value })}
                                placeholder="5000"
                                className="w-32 bg-surface-overlay/40 border border-border-subtle focus:border-accent/40 focus:ring-4 focus:ring-accent/5 rounded-2xl px-4 py-4 text-sm text-text-primary outline-none transition-all font-mono"
                            />
                        </div>

                        <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
                            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-amber-500/80">Server Restart Required</p>
                                <p className="text-xs text-text-secondary leading-relaxed font-medium">
                                    Updating these variables will modify the <code className="text-accent bg-accent/5 px-1 rounded">.env</code> file. The backend server will automatically restart to apply the new configuration.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* AI Configuration Section */}
                <section className="glass-morphism rounded-3xl border border-border-subtle p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -top-12 -right-12 p-8 text-purple-500/5 pointer-events-none group-hover:text-purple-500/10 transition-all duration-700 scale-150 group-hover:rotate-12">
                        <Cpu className="w-64 h-64" />
                    </div>

                    <div className="flex items-center gap-3 mb-2 relative z-10">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-text-primary tracking-tight">AI Integration</h2>
                        <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full uppercase border border-purple-500/20">BYOK</span>
                    </div>
                    <p className="text-xs text-text-secondary mb-6 relative z-10">
                        Bring Your Own Key — your API keys are stored locally and never sent to our servers. AI calls go directly from your browser to the provider.
                    </p>

                    <div className="space-y-4 relative z-10">
                        {/* Provider Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em] px-1">Active Provider</label>
                            <div className="flex gap-2">
                                {PROVIDERS.map((p) => (
                                    <button
                                        key={p.key}
                                        type="button"
                                        onClick={() => setActiveProvider(p.key)}
                                        className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                                            activeProvider === p.key
                                                ? p.color === 'emerald'
                                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                                    : p.color === 'violet'
                                                        ? 'bg-violet-500/20 border-violet-500/40 text-violet-400'
                                                        : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                                                : 'bg-surface-overlay/40 border-border-subtle text-text-secondary hover:border-border-strong'
                                        }`}
                                    >
                                        {p.name}
                                        {activeProvider === p.key && keyStatus[p.key]?.valid && (
                                            <CheckCircle2 className="w-3 h-3 inline ml-1.5" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* API Key Inputs */}
                        {PROVIDERS.map((p) => (
                            <AIKeyInput
                                key={p.key}
                                provider={p}
                                value={apiKeys[p.key] || ''}
                                onChange={(val) => setProviderKey(p.key, val)}
                                onValidate={() => validateProviderKey(p.key)}
                                status={keyStatus[p.key]}
                                isValidating={isValidating}
                                isActive={activeProvider === p.key}
                            />
                        ))}

                        {/* Privacy notice */}
                        <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 flex items-start gap-3">
                            <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-purple-400/80">Privacy First</p>
                                <p className="text-[11px] text-text-secondary leading-relaxed">
                                    Keys are stored in your browser's localStorage only. No AI prompts or responses are logged. Rate limited to 10 requests/minute to prevent accidental quota burn.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Appearance Section */}
                <section className="glass-morphism rounded-2xl border border-border-subtle p-6 shadow-xl overflow-hidden">
                    <div className="flex items-center gap-3 mb-6">
                        <Sparkles className="w-5 h-5 text-accent" />
                        <h2 className="text-xl font-semibold text-text-primary">Appearance</h2>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-surface-overlay/30 border border-border-subtle">
                        <div>
                            <p className="text-sm font-semibold text-text-primary">Theme Mode</p>
                            <p className="text-xs text-text-muted">Choose between light and dark visual experience</p>
                        </div>
                        <div className="flex gap-2 bg-surface-overlay p-1 rounded-lg border border-border-subtle">
                            <button
                                type="button"
                                onClick={() => updateTheme('light')}
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${theme === 'light' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-muted hover:text-text-primary'}`}
                            >
                                Light
                            </button>
                            <button
                                type="button"
                                onClick={() => updateTheme('dark')}
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${theme === 'dark' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-muted hover:text-text-primary'}`}
                            >
                                Dark
                            </button>
                        </div>
                    </div>
                </section>

                {/* Submit Panel */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6">
                    <div className="flex items-center gap-3">
                        {saveStatus === 'success' && (
                            <div className="flex items-center gap-2 text-emerald-500 animate-in fade-in zoom-in duration-500 font-bold bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-xs">Database configuration updated!</span>
                            </div>
                        )}
                        {error && (
                            <div className="flex items-center gap-2 text-red-500 animate-in fade-in slide-in-from-left-4 duration-500 font-bold bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20">
                                <Shield className="w-4 h-4" />
                                <span className="text-xs">{error}</span>
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full md:w-auto group relative px-10 py-4 bg-accent hover:bg-accent-hover text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-accent/40 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 overflow-hidden"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Applying Changes...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 group-hover:scale-125 transition-transform" />
                                Update Environment
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

function AIKeyInput({ provider, value, onChange, onValidate, status, isValidating, isActive }) {
    const [visible, setVisible] = useState(false);

    return (
        <div className={`space-y-2 p-4 rounded-xl border transition-all ${
            isActive ? 'bg-surface-overlay/30 border-purple-500/20' : 'bg-surface-overlay/10 border-border-subtle/50'
        }`}>
            <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-primary">
                    {provider.name} API Key
                    {isActive && <span className="text-purple-400 text-[10px] ml-1.5">(active)</span>}
                </label>
                <div className="flex items-center gap-2">
                    {status?.valid === true && (
                        <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                        </span>
                    )}
                    {status?.valid === false && status.error !== 'No key provided' && (
                        <span className="text-[10px] font-semibold text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Invalid
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <input
                        type={visible ? 'text' : 'password'}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={provider.placeholder}
                        className="w-full bg-surface-overlay border border-border-subtle focus:border-purple-500/40 focus:ring-2 focus:ring-purple-500/10 rounded-lg px-3 py-2 text-xs text-text-primary outline-none transition-all font-mono pr-8 placeholder:text-text-muted/30"
                    />
                    <button
                        type="button"
                        onClick={() => setVisible(!visible)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                    >
                        {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                </div>
                <button
                    type="button"
                    onClick={onValidate}
                    disabled={!value.trim() || isValidating}
                    className="px-3 py-2 rounded-lg bg-purple-500/10 text-purple-400 text-[11px] font-semibold hover:bg-purple-500/20 transition-colors disabled:opacity-30 shrink-0"
                >
                    {isValidating ? (
                        <div className="w-3 h-3 border border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                    ) : (
                        <Zap className="w-3.5 h-3.5" />
                    )}
                </button>
            </div>
        </div>
    );
}
