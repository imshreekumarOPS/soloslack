/**
 * AI Prompt Templates for all AI features.
 * Each function returns an array of messages in OpenAI format.
 */

// ── Phase 1: Quick Wins ──────────────────────────────────────────

export function noteSummaryPrompt(noteTitle, noteBody) {
    return [
        {
            role: 'system',
            content: 'You are a concise note summarizer. Return a bullet-point summary (3-6 bullets) of the given note. Use markdown bullet points. Do not add any preamble — start directly with the bullets.',
        },
        {
            role: 'user',
            content: `Summarize this note:\n\nTitle: ${noteTitle}\n\n${noteBody}`,
        },
    ];
}

export function cardDescriptionPrompt(cardTitle) {
    return [
        {
            role: 'system',
            content: `You are a project management assistant. Given a task/card title, generate a brief description and checklist items. Return ONLY valid JSON with this exact structure:
{
  "description": "Brief overview of the task (1-3 sentences)",
  "checklist": ["Checklist item 1", "Checklist item 2", "..."]
}
Include 4-10 checklist items covering acceptance criteria and subtasks. Keep items concise and actionable. No markdown, no preamble — just the JSON object.`,
        },
        {
            role: 'user',
            content: `Generate a description and checklist for this task card:\n\nTitle: ${cardTitle}`,
        },
    ];
}

export function autoTagPrompt(noteTitle, noteBody) {
    return [
        {
            role: 'system',
            content: 'You are a tag suggestion engine. Given a note, suggest 2-3 relevant, short tags (1-2 words each, lowercase, no spaces — use hyphens). Return ONLY a JSON array of strings. Example: ["machine-learning", "python", "tutorial"]',
        },
        {
            role: 'user',
            content: `Suggest tags for this note:\n\nTitle: ${noteTitle}\n\n${noteBody?.substring(0, 1500) || ''}`,
        },
    ];
}

// ── Phase 2: Workflow Assistants ─────────────────────────────────

export function noteToCardsPrompt(noteTitle, noteBody) {
    return [
        {
            role: 'system',
            content: `You are a project breakdown assistant. Given a note (often a project brief or plan), break it into actionable task cards for a Kanban board. Return ONLY a JSON array of card objects, each with: { "title": "...", "description": "...", "priority": "low"|"medium"|"high" }. Generate 3-8 cards. Keep titles short and descriptions concise.`,
        },
        {
            role: 'user',
            content: `Break this note into task cards:\n\nTitle: ${noteTitle}\n\n${noteBody}`,
        },
    ];
}

export function writingAssistantPrompt(selectedText, action) {
    const instructions = {
        expand: 'Expand the following text with more detail, examples, and explanation. Keep the same tone and style.',
        rewrite: 'Rewrite the following text to be clearer and more polished while preserving the meaning.',
        fix: 'Fix all grammar, spelling, and punctuation errors in the following text. Preserve the original meaning and style.',
        simplify: 'Simplify the following text to be easier to understand. Use shorter sentences and simpler words.',
        shorten: 'Make the following text more concise while keeping the key information.',
    };

    return [
        {
            role: 'system',
            content: `You are a writing assistant. ${instructions[action] || instructions.rewrite} Return ONLY the modified text with no preamble, explanation, or quotes.`,
        },
        {
            role: 'user',
            content: selectedText,
        },
    ];
}

export function templateGeneratorPrompt(projectDescription) {
    return [
        {
            role: 'system',
            content: `You are a project template generator for a Kanban board app. Given a project description, generate a complete board template. Return ONLY valid JSON with this structure:
{
  "name": "Board Name",
  "description": "Short board description",
  "columns": [
    {
      "name": "Column Name",
      "wipLimit": null,
      "cards": [
        { "title": "Card title", "description": "Card description", "priority": "low"|"medium"|"high" }
      ]
    }
  ]
}
Generate 3-5 columns with 2-4 starter cards each. Make it practical and immediately useful.`,
        },
        {
            role: 'user',
            content: `Generate a board template for: ${projectDescription}`,
        },
    ];
}

export function weeklyDigestPrompt(stats) {
    return [
        {
            role: 'system',
            content: 'You are a productivity assistant. Given a weekly activity summary, write a brief, motivating weekly digest (4-6 sentences). Mention highlights, flag any concerns (overdue cards, stale items), and suggest 1-2 focus areas for next week. Be conversational and supportive, not robotic.',
        },
        {
            role: 'user',
            content: `Here's my weekly activity summary:\n\n${JSON.stringify(stats, null, 2)}`,
        },
    ];
}

// ── Phase 3: Intelligence Layer ──────────────────────────────────

export function autoPrioritizePrompt(cards) {
    return [
        {
            role: 'system',
            content: `You are a task prioritization assistant. Given a list of Kanban cards with their details, suggest priority adjustments. Return ONLY a JSON array of objects: [{ "cardId": "...", "suggestedPriority": "low"|"medium"|"high", "reason": "brief reason" }]. Only include cards whose priority should change. Consider: due dates (sooner = higher), description complexity, and current priority mismatches.`,
        },
        {
            role: 'user',
            content: `Analyze these cards and suggest priority changes:\n\n${JSON.stringify(cards.map(c => ({
                id: c._id,
                title: c.title,
                description: c.description?.substring(0, 200),
                priority: c.priority,
                dueDate: c.dueDate,
                checklistTotal: c.checklist?.length || 0,
                checklistDone: c.checklist?.filter(i => i.completed).length || 0,
            })), null, 2)}`,
        },
    ];
}

export function workflowSuggestionsPrompt(boardData) {
    return [
        {
            role: 'system',
            content: `You are a workflow optimization advisor for Kanban boards. Analyze the board data and suggest 2-4 actionable improvements. Return ONLY a JSON array of objects: [{ "title": "Short title", "description": "1-2 sentence suggestion", "type": "bottleneck"|"wip"|"stale"|"optimization" }]. Look for: column bottlenecks (too many cards), stale cards, WIP limit suggestions, and process improvements.`,
        },
        {
            role: 'user',
            content: `Analyze this board:\n\n${JSON.stringify(boardData, null, 2)}`,
        },
    ];
}
