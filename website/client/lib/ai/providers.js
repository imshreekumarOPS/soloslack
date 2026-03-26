/**
 * AI Provider Abstraction Layer
 * Direct client-side calls to OpenAI, Anthropic, and Gemini APIs.
 * Keys never leave the browser — stored in localStorage only.
 */

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// ── Provider implementations ─────────────────────────────────────

async function callOpenAI(apiKey, messages, { model = 'gpt-4o-mini', maxTokens = 1024, temperature = 0.7, stream = false } = {}) {
    const res = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages,
            max_tokens: maxTokens,
            temperature,
            stream,
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `OpenAI error: ${res.status}`);
    }

    if (stream) return res;

    const data = await res.json();
    return {
        text: data.choices[0]?.message?.content || '',
        model: data.model || model,
        provider: 'openai',
        usage: {
            inputTokens: data.usage?.prompt_tokens || 0,
            outputTokens: data.usage?.completion_tokens || 0,
            totalTokens: data.usage?.total_tokens || 0,
        },
    };
}

async function callAnthropic(apiKey, messages, { model = 'claude-sonnet-4-20250514', maxTokens = 1024, temperature = 0.7, stream = false } = {}) {
    // Extract system message if present
    const systemMsg = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content,
    }));

    const body = {
        model,
        max_tokens: maxTokens,
        temperature,
        messages: userMessages,
        stream,
    };
    if (systemMsg) body.system = systemMsg.content;

    const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Anthropic error: ${res.status}`);
    }

    if (stream) return res;

    const data = await res.json();
    const text = data.content?.map(b => b.text).join('') || '';
    return {
        text,
        model: data.model || model,
        provider: 'anthropic',
        usage: {
            inputTokens: data.usage?.input_tokens || 0,
            outputTokens: data.usage?.output_tokens || 0,
            totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
    };
}

async function callGemini(apiKey, messages, { model = 'gemini-2.0-flash', maxTokens = 1024, temperature = 0.7, stream = false } = {}) {
    // Convert OpenAI-style messages to Gemini format
    const systemMsg = messages.find(m => m.role === 'system');
    const contents = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

    const body = {
        contents,
        generationConfig: {
            maxOutputTokens: maxTokens,
            temperature,
        },
    };
    if (systemMsg) {
        body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }

    const endpoint = stream ? 'streamGenerateContent' : 'generateContent';
    const res = await fetch(`${GEMINI_URL}/${model}:${endpoint}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Gemini error: ${res.status}`);
    }

    if (stream) return res;

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
    return {
        text,
        model: data.modelVersion || model,
        provider: 'gemini',
        usage: {
            inputTokens: data.usageMetadata?.promptTokenCount || 0,
            outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
            totalTokens: data.usageMetadata?.totalTokenCount || 0,
        },
    };
}

// ── Embeddings ───────────────────────────────────────────────────

async function getOpenAIEmbedding(apiKey, text) {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: text,
        }),
    });
    if (!res.ok) throw new Error(`Embedding error: ${res.status}`);
    const data = await res.json();
    return data.data[0].embedding;
}

async function getGeminiEmbedding(apiKey, text) {
    const res = await fetch(`${GEMINI_URL}/text-embedding-004:embedContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text }] },
        }),
    });
    if (!res.ok) throw new Error(`Gemini embedding error: ${res.status}`);
    const data = await res.json();
    return data.embedding.values;
}

// ── Streaming helpers ────────────────────────────────────────────

export async function* streamOpenAI(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') return;
            try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) yield content;
            } catch { /* skip malformed chunks */ }
        }
    }
}

export async function* streamAnthropic(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            try {
                const parsed = JSON.parse(trimmed.slice(6));
                if (parsed.type === 'content_block_delta') {
                    yield parsed.delta?.text || '';
                }
            } catch { /* skip */ }
        }
    }
}

export async function* streamGemini(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Gemini streams JSON array chunks
        try {
            const data = JSON.parse(buffer);
            if (Array.isArray(data)) {
                for (const chunk of data) {
                    const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) yield text;
                }
                buffer = '';
            }
        } catch { /* incomplete JSON, keep buffering */ }
    }
}

// ── Unified interface ────────────────────────────────────────────

const PROVIDERS = {
    openai: { call: callOpenAI, stream: streamOpenAI, embed: getOpenAIEmbedding },
    anthropic: { call: callAnthropic, stream: streamAnthropic, embed: null },
    gemini: { call: callGemini, stream: streamGemini, embed: getGeminiEmbedding },
};

/**
 * Call any supported AI provider with a unified interface.
 * Messages use OpenAI format: [{ role: 'system'|'user'|'assistant', content: '...' }]
 */
export async function callProvider(provider, apiKey, messages, options = {}) {
    const p = PROVIDERS[provider];
    if (!p) throw new Error(`Unknown provider: ${provider}`);
    return p.call(apiKey, messages, options);
}

/**
 * Get a streaming response from any provider.
 * Returns an async generator that yields text chunks.
 */
export async function* streamProvider(provider, apiKey, messages, options = {}) {
    const p = PROVIDERS[provider];
    if (!p) throw new Error(`Unknown provider: ${provider}`);
    const response = await p.call(apiKey, messages, { ...options, stream: true });
    yield* p.stream(response);
}

/**
 * Get an embedding vector for text.
 * Currently supported: openai, gemini
 */
export async function getEmbedding(provider, apiKey, text) {
    const p = PROVIDERS[provider];
    if (!p?.embed) throw new Error(`Embeddings not supported for ${provider}`);
    return p.embed(apiKey, text);
}

/**
 * Cosine similarity between two vectors.
 */
export function cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Validate an API key by making a minimal request.
 */
export async function validateKey(provider, apiKey) {
    try {
        await callProvider(provider, apiKey, [{ role: 'user', content: 'hi' }], { maxTokens: 5 });
        return { valid: true };
    } catch (err) {
        return { valid: false, error: err.message };
    }
}
