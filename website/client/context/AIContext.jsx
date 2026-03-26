'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSettings } from './SettingsContext';
import { callProvider, streamProvider, getEmbedding, validateKey } from '@/lib/ai/providers';
import { logUsage } from '@/lib/ai/tokenTracker';

const AIContext = createContext(null);

// Rate limit: max 10 requests per minute per the spec
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

export function AIProvider({ children }) {
    const { apiKeys, updateApiKeys } = useSettings();

    // Which provider is currently active
    const [activeProvider, setActiveProvider] = useState(() => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('notban_ai_provider') || null;
    });

    // Validation state per provider
    const [keyStatus, setKeyStatus] = useState({ openai: null, anthropic: null, gemini: null });
    const [isValidating, setIsValidating] = useState(false);

    // Rate limiting
    const requestLog = useRef([]);

    // Persist active provider
    useEffect(() => {
        if (activeProvider) {
            localStorage.setItem('notban_ai_provider', activeProvider);
        } else {
            localStorage.removeItem('notban_ai_provider');
        }
    }, [activeProvider]);

    // Auto-select provider if only one key is set
    useEffect(() => {
        if (activeProvider) return;
        const providers = ['openai', 'anthropic', 'gemini'];
        const available = providers.filter(p => apiKeys[p]?.trim());
        if (available.length === 1) setActiveProvider(available[0]);
    }, [apiKeys, activeProvider]);

    const isConfigured = Boolean(activeProvider && apiKeys[activeProvider]?.trim());

    // Check rate limit
    const checkRateLimit = useCallback(() => {
        const now = Date.now();
        requestLog.current = requestLog.current.filter(t => now - t < RATE_WINDOW_MS);
        if (requestLog.current.length >= RATE_LIMIT) {
            const oldestReq = requestLog.current[0];
            const waitSec = Math.ceil((RATE_WINDOW_MS - (now - oldestReq)) / 1000);
            throw new Error(`Rate limit reached. Please wait ${waitSec}s before trying again.`);
        }
        requestLog.current.push(now);
    }, []);

    // Get remaining requests count
    const getRemainingRequests = useCallback(() => {
        const now = Date.now();
        requestLog.current = requestLog.current.filter(t => now - t < RATE_WINDOW_MS);
        return RATE_LIMIT - requestLog.current.length;
    }, []);

    /**
     * Unified AI request function.
     * @param {Array} messages - OpenAI-format messages
     * @param {Object} options - { maxTokens, temperature }
     * @returns {{ text: string, usage: object }}
     */
    const askAI = useCallback(async (messages, options = {}) => {
        if (!isConfigured) throw new Error('AI is not configured. Add an API key in Settings.');
        checkRateLimit();
        const result = await callProvider(activeProvider, apiKeys[activeProvider], messages, options);
        // Auto-log token usage for analytics
        if (result.usage) {
            logUsage({
                provider: result.provider || activeProvider,
                model: result.model || 'unknown',
                inputTokens: result.usage.inputTokens,
                outputTokens: result.usage.outputTokens,
                totalTokens: result.usage.totalTokens,
            });
        }
        return result;
    }, [isConfigured, activeProvider, apiKeys, checkRateLimit]);

    /**
     * Streaming AI request. Returns an async generator yielding text chunks.
     */
    const askAIStream = useCallback(async function* (messages, options = {}) {
        if (!isConfigured) throw new Error('AI is not configured. Add an API key in Settings.');
        checkRateLimit();
        yield* streamProvider(activeProvider, apiKeys[activeProvider], messages, options);
    }, [isConfigured, activeProvider, apiKeys, checkRateLimit]);

    /**
     * Get embedding vector for text (for semantic search).
     */
    const embed = useCallback(async (text) => {
        if (!isConfigured) throw new Error('AI is not configured.');
        // Anthropic doesn't support embeddings — fall back to available provider
        const provider = activeProvider === 'anthropic'
            ? (apiKeys.openai ? 'openai' : apiKeys.gemini ? 'gemini' : null)
            : activeProvider;
        if (!provider) throw new Error('Embeddings require an OpenAI or Gemini key.');
        const key = apiKeys[provider];
        checkRateLimit();
        return getEmbedding(provider, key, text);
    }, [isConfigured, activeProvider, apiKeys, checkRateLimit]);

    /**
     * Validate a specific provider key.
     */
    const validateProviderKey = useCallback(async (provider) => {
        const key = apiKeys[provider]?.trim();
        if (!key) {
            setKeyStatus(s => ({ ...s, [provider]: { valid: false, error: 'No key provided' } }));
            return false;
        }
        setIsValidating(true);
        try {
            const result = await validateKey(provider, key);
            setKeyStatus(s => ({ ...s, [provider]: result }));
            return result.valid;
        } finally {
            setIsValidating(false);
        }
    }, [apiKeys]);

    /**
     * Update provider key and optionally validate.
     */
    const setProviderKey = useCallback((provider, key) => {
        updateApiKeys({ [provider]: key });
        setKeyStatus(s => ({ ...s, [provider]: null }));
    }, [updateApiKeys]);

    return (
        <AIContext.Provider value={{
            // State
            activeProvider,
            setActiveProvider,
            isConfigured,
            keyStatus,
            isValidating,

            // Core functions
            askAI,
            askAIStream,
            embed,

            // Key management
            setProviderKey,
            validateProviderKey,

            // Rate limiting
            getRemainingRequests,
        }}>
            {children}
        </AIContext.Provider>
    );
}

export const useAI = () => {
    const context = useContext(AIContext);
    if (!context) throw new Error('useAI must be used within an AIProvider');
    return context;
};
