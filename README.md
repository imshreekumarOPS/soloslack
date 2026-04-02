# SoloSlack

A premium, glassmorphic productivity workspace that combines flexible **Markdown Notes** with an intuitive **Kanban Board** system — powered by optional **AI features** across multiple providers.

## ✨ Features

### Notes
-   **Markdown editor** — split edit/preview modes with full GFM rendering (tables, code blocks, task lists)
-   **Mermaid diagrams** — render flowcharts, sequence diagrams, Gantt charts, and more inside notes
-   **Wiki-style linking** — type `[[Note Title]]` to link between notes with inline autocomplete
-   **Tags** — add, filter, and remove color-coded tags per note
-   **Pin notes** — starred notes float to the top
-   **Word count & reading time** — live stats in the editor toolbar
-   **Export** — download as Markdown (`.md`) or PDF (fully rendered with mermaid diagrams)

### Kanban Boards
-   **Boards & columns** — create boards with custom or template column layouts (Bug Tracker, Sprint Board, Content Pipeline, etc.)
-   **Cards** — create, edit, drag-and-drop between columns; set priority, due dates, tags, checklists, and labels (6 colors)
-   **Card comments** — add, edit, and delete comments on any card
-   **Column WIP limits** — set a max card count per column with visual warnings
-   **Calendar view** — monthly calendar plotting cards by due date
-   **Note ↔ Card linking** — link notes to kanban cards with bidirectional references
-   **Bulk operations** — bulk delete, move, archive, and restore cards
-   **Export** — JSON and CSV board exports

### Workspaces
-   **Color-coded workspaces** — organize boards and notes into named workspaces (8 color options)
-   **Workspace filtering** — select a workspace in the sidebar to scope boards and notes
-   **Drag-to-reorder** — reorder workspaces via drag-and-drop
-   **Cascade delete** — deleting a workspace removes all its boards, cards, comments, and notes

### AI Integration (Optional)
-   **Multi-provider** — works with OpenAI, Anthropic, and Gemini; API keys stay client-side only
-   **Writing assistant** — select text and choose Expand, Rewrite, Fix, Simplify, or Shorten
-   **Note summaries** — generate bullet-point summaries with one click
-   **Auto-tag** — AI suggests relevant tags; accept or dismiss individually
-   **Card description generation** — generate description and checklist from a card title
-   **Note-to-cards** — break a note into actionable kanban task cards
-   **Auto-prioritize** — AI-suggested priority adjustments for board cards
-   **Template generator** — describe a project and get a full board template
-   **Weekly digest** — AI-powered productivity summary
-   **Semantic search** — search across notes and cards by meaning using embeddings
-   **Custom prompts** — send custom prompts to AI directly from the note editor
-   **Analytics dashboard** — track AI token usage with charts, provider breakdown, and request logs (all data stored locally)

### General
-   **Dynamic dashboard** — overview of pinned notes, overdue cards, and recent boards
-   **Archive** — soft-delete notes and boards; restore or permanently delete from the archive page
-   **Undo system** — undo deletions and bulk operations via toast notifications or `Ctrl+Z`
-   **Toast notifications** — non-intrusive feedback with countdown and dismiss
-   **Light/dark theme** — toggle in the sidebar; persisted in `localStorage`
-   **Unified search** — full-text search across notes and cards with `Ctrl+K` / `⌘+K`
-   **Keyboard shortcuts** — press `?` for the full shortcut cheatsheet
-   **Focus mode** — distraction-free full-screen note editor (`Ctrl+Shift+F`)

## 🚀 Tech Stack

### Frontend
-   **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
-   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
-   **State Management**: React Context API
-   **Drag & Drop**: `@dnd-kit`
-   **Markdown**: `react-markdown`, `remark-gfm`
-   **Diagrams**: `mermaid`
-   **Charts**: `recharts`
-   **Icons**: `lucide-react`

### Backend
-   **Runtime**: Node.js
-   **Framework**: [Express.js](https://expressjs.com/)
-   **Database**: [MongoDB](https://www.mongodb.com/) (via Mongoose)
-   **Middleware**: CORS, Morgan, Dotenv

## 🛠️ Getting Started

### Prerequisites
-   Node.js (v18+)
-   MongoDB (Local or Atlas)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd soloslack
    ```

2.  **Setup the Server**:
    ```bash
    cd website/server
    npm install
    ```
    Create a `.env` file in `website/server`:
    ```env
    PORT=5000
    MONGODB_URI=your_mongodb_connection_string
    ```
    Start the server:
    ```bash
    npm run dev
    ```

3.  **Setup the Client**:
    ```bash
    cd ../client
    npm install
    ```
    Create a `.env.local` file in `website/client`:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:5000/api
    ```
    Start the client:
    ```bash
    npm run dev
    ```

4.  **Access the application**:
    Open [http://localhost:3000](http://localhost:3000) in your browser.

5.  **(Optional) Configure AI**:
    Go to **Settings** and add your API key for OpenAI, Anthropic, or Gemini. Keys are stored in your browser only — they never leave the client.

## 📁 Project Structure

```text
website/
├── client/                  # Next.js Frontend
│   ├── app/                 # Pages (Dashboard, Boards, Notes, Analytics, Archive, Settings)
│   ├── components/
│   │   ├── ai/              # AI feature components (AutoPrioritize, SemanticSearch, etc.)
│   │   ├── kanban/          # Board, Column, Card, Calendar components
│   │   ├── notes/           # NoteEditor, NotesList, MarkdownRenderer, MermaidBlock
│   │   ├── layout/          # Sidebar
│   │   ├── providers/       # AppProviders wrapper
│   │   └── ui/              # ToastContainer, UnifiedSearch, AnimatedIcon, etc.
│   ├── context/             # React Contexts (Boards, Notes, AI, Undo, Workspaces, Settings)
│   └── lib/
│       ├── ai/              # AI providers, prompts, token tracker
│       ├── api/             # API clients (notes, boards, cards, workspaces)
│       └── utils/           # Export utilities, label colors, helpers
└── server/                  # Express.js Backend
    └── src/
        ├── config/          # Database configuration
        ├── controllers/     # API logic (boards, cards, notes, comments, workspaces)
        ├── models/          # Mongoose schemas (Board, Card, Column, Note, Comment, Workspace)
        └── routes/          # Express routes
```

## 📡 API Endpoints Summary

-   **Notes**: `GET /api/notes`, `POST /api/notes`, `PATCH /api/notes/:id`, `DELETE /api/notes/:id`, `PATCH /api/notes/:id/restore`, bulk archive/delete/restore/tag
-   **Boards**: `GET /api/boards`, `POST /api/boards`, `PATCH /api/boards/:id`, `DELETE /api/boards/:id`, `GET /api/boards/:id/full`, reorder, import
-   **Columns**: `POST /api/columns`, `PATCH /api/columns/:id`, `DELETE /api/columns/:id`
-   **Cards**: `POST /api/cards`, `PATCH /api/cards/:id`, `DELETE /api/cards/:id`, move, bulk delete/move/archive, upcoming, WIP check
-   **Comments**: `GET /api/cards/:cardId/comments`, `POST`, `PATCH`, `DELETE`
-   **Workspaces**: `GET /api/workspaces`, `POST`, `PATCH`, `DELETE`, reorder

---

Built with ❤️ for productivity.
