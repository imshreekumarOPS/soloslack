High Impact / Relatively Easy

Note templates — pre-built markdown skeletons (Daily Standup, Meeting Notes, Project Brief); one click inserts the template into a new note
Card quick-add shortcut — global Alt+C opens a mini modal: pick board → column → type title → done; add tasks without leaving the current page
Board card count badges — show (n) next to each board name in the sidebar so load is visible at a glance without opening the board
Collapsible sidebar sections — let users collapse the Navigation section to give the boards list more vertical space
Column color coding — assign an accent color to each column (e.g. red = Blocked, green = Done) for faster visual scanning

Medium Effort / High Value

Daily note — /daily route auto-creates or opens today's dated note (e.g. 2026-03-18.md); previous days linked at the top; zero-friction journaling inside the existing notes system
Global tag management — dedicated settings section listing every tag across notes and cards with usage counts; rename or merge tags globally without editing each item manually
Note version history — keep the last N auto-save snapshots per note; diff view and one-click restore; builds directly on the existing 1.5 s auto-save infrastructure
Board swimlanes — group cards by priority or tag horizontally inside each column; no schema changes needed, pure view layer using existing priority and tag fields
Recurring cards — mark a card as daily / weekly / monthly; on completion it auto-recreates itself in the same column; useful for habit tracking and repeating tasks

Bigger Features

Pomodoro timer — click a timer icon on any card to start a 25-min session; logs time spent on the card; small toolbar widget shows the active session
Note graph view — visual node graph of wiki-link connections between notes (like Obsidian); [[link]] data is already parsed, this is a rendering layer using react-force-graph or d3
Public share links for boards — generate a read-only shareable URL for a board; renders without auth; useful for sharing sprint status with collaborators
PWA + offline support — service worker and manifest; notes and board data cached locally; edits queue and sync when back online; biggest quality-of-life upgrade for a daily-use solo tool
Cross-board card move — "Move to board →" dropdown inside the card modal; cards are currently board-scoped; no schema changes needed, just update boardId and columnId
