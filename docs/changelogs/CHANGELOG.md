# Changelog

All notable changes to SoloSlack are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased] — v1.4.0 — AI, Workspaces, Comments & Data Integrity

### Added
- **AI integration** — multi-provider (OpenAI, Anthropic, Gemini) AI features: writing assistant, note summaries, auto-tagging, card description generation, note-to-cards, auto-prioritize, board template generator, weekly digest, workflow suggestions, semantic search, and custom prompts
- **Analytics dashboard** — new `/analytics` page with token usage charts, provider breakdown, model usage, and request logs; all data stored locally
- **Workspaces** — create color-coded workspaces to organize boards and notes; full CRUD with drag-to-reorder and filtering
- **Card comments** — add, edit, and delete comments on kanban cards
- **Card labels** — up to 6 labels per card with 6 color options
- **Mermaid diagrams** — render flowcharts, sequence diagrams, and more in notes via ` ```mermaid ` code blocks with dark mode support
- **Bulk operations** — bulk delete/move cards, bulk archive/delete/restore/tag notes
- **Undo system** — undo deletions and bulk operations via toast notifications or `Ctrl+Z`
- **PDF export** — export notes as rendered PDF (includes mermaid diagrams); CSV board export; bulk note export
- **AI settings** — configure and validate API keys for 3 providers in the settings page

### Enhanced
- Sidebar redesigned with workspace section, color dots, inline create/edit, and workspace-scoped board filtering
- Card modal with labels, comments, and AI description generation
- Note editor with AI toolbar (summary, auto-tag, custom prompt, writing assistant) and export menu
- WIP limit enforcement on card create and move
- **UI sizing** — bumped minimum text sizes from 9–10px to 11px and enlarged small icons across all components for better readability

### Fixed
- **Workspace delete fully cascades** — removes all boards, columns, cards, comments, and notes
- **Board soft-delete archives its cards** — restoring a board restores its cards too
- **Board permanent delete cleans up note links** — removes card refs from `Note.linkedCards[]`
- **Note soft-delete/bulk-archive unlinks cards** — sets `Card.linkedNoteId = null` on referencing cards
- **AI dropdown hover fix** — converted from unreliable `group-hover` to click-toggle with backdrop dismiss
- **NoteEditor linked cards key warning** — filtered stale entries to fix React duplicate-key warning

---

## [Unreleased] — v1.3.0

### Added
- **Drag-to-reorder boards** — grab the grip handle on any board in the sidebar and drag it to a new position; order persists to the database
- **Focus mode** — distraction-free full-screen note editor that hides the sidebar and notes list; toggle with the `⊡` button in the toolbar or `Ctrl+Shift+F` / `⌘+Shift+F`; exit with `Escape`

---

## [1.1.0] — Archive, Search & Rebranding

### Added
- **Unified search** — full-text search across note titles, note body, and card titles/descriptions; triggered with `Ctrl+K` / `⌘+K`
- **Keyboard shortcut cheatsheet** — press `?` anywhere to open a modal listing every shortcut
- **Archive** — soft-delete notes and boards into an archive instead of permanent deletion; restore or permanently delete from the archive page
- **Permanent delete** — explicit hard-delete from the archive with cascade removal of all columns and cards
- Rebranded from *NoteKanban* to **SoloSlack**

### Fixed
- Markdown preview now respects light/dark theme correctly
- `NoteSearch` debounced to prevent excessive API calls on every keystroke

---

## [1.0.1] — Stability Pass

### Fixed
- Note data loss bug when switching between notes with unsaved changes — pending auto-save is now flushed before switching
- Card modal validation preventing saves under certain edge cases
- Board deletion edge cases in settings page

---

## [1.0.0] — Initial Release

### Added
- **Notes** — create, edit, pin, and delete markdown notes with auto-save (1.5 s debounce) and manual save
- **Markdown editor** — split edit / preview modes with full GFM rendering (tables, code blocks, task lists)
- **Wiki-style note linking** — type `[[Note Title]]` in the editor to link notes; autocomplete picker appears inline; links are clickable in preview
- **Note tags** — add, filter, and remove colour-coded tags per note
- **Note word count + reading time** — live stats shown in the editor toolbar
- **Markdown export** — download any note as a `.md` file with YAML front-matter (title, tags, date)
- **Kanban boards** — create boards with custom or default columns (To Do · In Progress · Done)
- **Board templates** — choose a pre-built column layout when creating a board (Bug Tracker, Sprint Board, Content Pipeline, etc.)
- **Cards** — create, edit, move between columns, set priority (high / medium / low), due dates, and tags
- **Card checklists** — subtask checklist inside each card with a completion progress bar on the card face
- **Card due date reminders** — visual overdue indicators on cards; "Due Soon" section on the dashboard
- **Column WIP limits** — set a max card count per column; column header highlights when the limit is exceeded
- **Drag-and-drop cards** — move cards within and across columns via drag-and-drop using `@dnd-kit`
- **Note ↔ Card linking** — link a note to one or more kanban cards; linked cards shown at the bottom of the note editor
- **Board calendar view** — monthly calendar that plots cards by their due date
- **Pin notes / boards** — starred items float to the top of their list
- **Dashboard** — overview of pinned notes, overdue cards, and recently updated boards
- **Archive page** — view and manage archived notes and boards
- **Settings page** — configure API keys and server environment variables
- **Light / dark theme** — toggle in the sidebar footer; persisted in `localStorage`; flash-of-wrong-theme prevented with an inline script
- **Sidebar board filter** — type to filter the board list in the sidebar without leaving the current page
- Global keyboard shortcuts: `Ctrl+K` search · `?` shortcuts modal · `Alt+N` go to notes · `Alt+B` new board
