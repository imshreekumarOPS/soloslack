# Build & Implementation Plan
## Notes + Kanban Hybrid (Notban) — MVP

**Version:** 1.0.0  
**Date:** 2026-03-07  
**Estimated Total Time:** ~3–5 days of focused work  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Phase 0 — Project Setup](#phase-0--project-setup)
4. [Phase 1 — Backend Foundation](#phase-1--backend-foundation)
5. [Phase 2 — Frontend Foundation](#phase-2--frontend-foundation)
6. [Phase 3 — Notes Feature](#phase-3--notes-feature)
7. [Phase 4 — Kanban Feature](#phase-4--kanban-feature)
8. [Phase 5 — Cross-Linking & Polish](#phase-5--cross-linking--polish)
9. [Phase 6 — Testing & Hardening](#phase-6--testing--hardening)
10. [Code Snippets & Patterns](#10-code-snippets--patterns)
11. [Common Pitfalls](#11-common-pitfalls)

---

## 1. Overview

This plan breaks the build into **6 sequential phases**. Each phase has a clear deliverable — at the end of each phase, the app is in a runnable, testable state.

| Phase | Focus | Est. Time |
|-------|-------|-----------|
| 0 | Project scaffolding, folder structure, tooling | 1–2 hours |
| 1 | Express server, MongoDB, all Mongoose models, all routes | 4–6 hours |
| 2 | Next.js shell, layout, sidebar, routing, API client | 3–4 hours |
| 3 | Notes: list, create, edit, delete, search, autosave | 4–5 hours |
| 4 | Kanban: boards, columns, cards, drag-and-drop | 6–8 hours |
| 5 | Cross-linking notes↔cards, dashboard, dark mode | 2–3 hours |
| 6 | Final testing, bug fixes, README | 2–3 hours |

**Total: ~22–31 hours of focused development**

---

## 2. Prerequisites

Before starting, ensure the following are installed:

```bash
# Verify installations
node --version     # v18.x or higher
npm --version      # v9.x or higher
mongod --version   # v6.x or higher (or use Docker)
```

**If MongoDB is not installed, run via Docker:**
```bash
docker run -d \
  --name notban-mongo \
  -p 27017:27017 \
  mongo:6
```

---

## Phase 0 — Project Setup

**Goal:** A clean monorepo with both `client` and `server` folders initialized.

### Step 0.1 — Create root folder and structure

```bash
mkdir notban && cd notban
mkdir client server
git init
```

**Create `.gitignore` at root:**
```
# Root .gitignore
node_modules/
.env
.env.local
*.log
.DS_Store
.next/
dist/
```

### Step 0.2 — Initialize the server

```bash
cd server
npm init -y
```

**Install server dependencies:**
```bash
npm install express mongoose cors dotenv morgan
npm install --save-dev nodemon
```

**Update `server/package.json` scripts:**
```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js"
  }
}
```

### Step 0.3 — Initialize the client

```bash
cd ../client
npx create-next-app@latest . --app --tailwind --eslint --src-dir=no --import-alias="@/*"
```

**Install client dependencies:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install react-markdown
npm install clsx tailwind-merge
```

**Create `.env.local` in `client/`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Step 0.4 — Create all empty files/folders

```bash
# Server structure
cd ../server
mkdir -p src/config src/routes src/controllers src/models src/middleware
touch src/app.js src/server.js
touch src/config/db.js src/config/env.js
touch src/routes/index.js src/routes/notes.routes.js
touch src/routes/boards.routes.js src/routes/columns.routes.js src/routes/cards.routes.js
touch src/controllers/notes.controller.js src/controllers/boards.controller.js
touch src/controllers/columns.controller.js src/controllers/cards.controller.js
touch src/models/Note.js src/models/Board.js src/models/Column.js src/models/Card.js
touch src/middleware/errorHandler.js src/middleware/notFound.js src/middleware/requestLogger.js
touch .env

# Client structure
cd ../client
mkdir -p context lib/api lib/hooks lib/utils
mkdir -p components/layout components/notes components/kanban components/ui
mkdir -p app/notes/"[id]" app/boards/"[id]"
touch context/NotesContext.jsx context/BoardsContext.jsx
touch lib/api/notesApi.js lib/api/boardsApi.js lib/api/cardsApi.js
touch lib/hooks/useDebounce.js lib/hooks/useNotes.js lib/hooks/useBoards.js
touch lib/utils/formatDate.js lib/utils/cn.js
```

**Deliverable:** Both `client` and `server` folders exist with all files in place. Running `npm run dev` in server logs no errors (just "Cannot GET /"). Running `npm run dev` in client opens Next.js default page at `localhost:3000`.

---

## Phase 1 — Backend Foundation

**Goal:** A fully working Express API with all routes and MongoDB models. Testable with Postman/Bruno before any frontend work.

### Step 1.1 — Environment & DB config

**`server/.env`:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/notban_db
NODE_ENV=development
```

**`server/src/config/db.js`:**
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`DB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### Step 1.2 — Express app setup

**`server/src/app.js`:**
```javascript
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes/index');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', routes);

// 404 handler (must be after routes)
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
```

**`server/src/server.js`:**
```javascript
require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

start();
```

### Step 1.3 — Middleware

**`server/src/middleware/errorHandler.js`:**
```javascript
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    statusCode,
  });
};

module.exports = errorHandler;
```

**`server/src/middleware/notFound.js`:**
```javascript
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    statusCode: 404,
  });
};

module.exports = notFound;
```

### Step 1.4 — Mongoose Models

**`server/src/models/Note.js`:**
```javascript
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, maxlength: 200, trim: true },
    body:        { type: String, default: '' },
    tags:        [{ type: String, trim: true }],
    isPinned:    { type: Boolean, default: false },
    linkedCards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
  },
  { timestamps: true }
);

noteSchema.index({ title: 'text' });
noteSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
```

**`server/src/models/Board.js`:**
```javascript
const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, maxlength: 100, trim: true },
    description: { type: String, default: '', maxlength: 500 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Board', boardSchema);
```

**`server/src/models/Column.js`:**
```javascript
const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema(
  {
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
    name:    { type: String, required: true, maxlength: 50, trim: true },
    order:   { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

columnSchema.index({ boardId: 1, order: 1 });

module.exports = mongoose.model('Column', columnSchema);
```

**`server/src/models/Card.js`:**
```javascript
const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
  {
    columnId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Column', required: true },
    boardId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Board',  required: true },
    title:        { type: String, required: true, maxlength: 200, trim: true },
    description:  { type: String, default: '', maxlength: 2000 },
    priority:     { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    order:        { type: Number, required: true, default: 0 },
    linkedNoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', default: null },
    dueDate:      { type: Date, default: null },
    isArchived:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

cardSchema.index({ columnId: 1, order: 1 });
cardSchema.index({ boardId: 1 });

module.exports = mongoose.model('Card', cardSchema);
```

### Step 1.5 — Controllers

Build all 4 controllers following the patterns in the API Documentation. Each controller function follows this pattern:

```javascript
// Template for any controller action
exports.actionName = async (req, res, next) => {
  try {
    // 1. Extract params/body
    // 2. Validate required fields
    // 3. Call Mongoose model
    // 4. Send success response
  } catch (error) {
    next(error); // passes to errorHandler middleware
  }
};
```

Key notes:
- Notes controller: include `search` query param filtering, sort by `updatedAt: -1`
- Boards controller `create`: also create 3 default columns after creating the board
- Boards controller `delete`: cascade delete — delete all `Column` and `Card` documents where `boardId` matches
- Cards controller `move`: re-index order of affected cards in source and destination columns
- All `DELETE` handlers: return `res.status(204).send()` (no body)

### Step 1.6 — Routes

**`server/src/routes/index.js`:**
```javascript
const express = require('express');
const router = express.Router();

router.use('/notes',   require('./notes.routes'));
router.use('/boards',  require('./boards.routes'));
router.use('/columns', require('./columns.routes'));
router.use('/cards',   require('./cards.routes'));

module.exports = router;
```

Each route file maps HTTP methods to controller functions per the API spec.

### ✅ Phase 1 Checkpoint

Test all endpoints with Postman or Bruno before moving on:

```
POST   /api/notes           → creates note
GET    /api/notes            → returns array
PATCH  /api/notes/:id        → updates note
DELETE /api/notes/:id        → deletes note

POST   /api/boards           → creates board + 3 columns
GET    /api/boards/:id/full  → returns board + columns + cards
POST   /api/cards            → creates card
PATCH  /api/cards/:id/move   → moves card to new column
```

---

## Phase 2 — Frontend Foundation

**Goal:** Next.js app shell with sidebar, routing working, API client layer ready.

### Step 2.1 — Tailwind Config

Update `client/tailwind.config.js` with all custom tokens from the Design Document Section 2.

### Step 2.2 — Root Layout

**`client/app/layout.jsx`:**
- Renders `<Sidebar>` on the left
- Renders `{children}` on the right (`flex-1`)
- Sets dark background on `<body>`: `bg-surface-base text-text-primary`
- Imports Inter font from `next/font/google`

### Step 2.3 — Sidebar Component

Build `components/layout/Sidebar.jsx`:
- Display app name "Notban"
- Navigation links: Dashboard (`/`), Notes (`/notes`), Boards (`/boards`)
- Board list: fetches from `boardsApi.getAll()` and renders each as a link to `/boards/[id]`
- "+ New Board" button (triggers modal or inline input)
- Use `usePathname()` from `next/navigation` to highlight the active route

### Step 2.4 — API Client Layer

**`client/lib/api/notesApi.js`:**
```javascript
const BASE = process.env.NEXT_PUBLIC_API_URL;

const request = async (url, options = {}) => {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Request failed');
  }
  if (res.status === 204) return null;
  return res.json();
};

export const notesApi = {
  getAll:   (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/notes${qs ? '?' + qs : ''}`);
  },
  getById:  (id)     => request(`/notes/${id}`),
  create:   (data)   => request('/notes', { method: 'POST', body: JSON.stringify(data) }),
  update:   (id, d)  => request(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
  delete:   (id)     => request(`/notes/${id}`, { method: 'DELETE' }),
};
```

Build `boardsApi.js` and `cardsApi.js` following the same pattern.

### Step 2.5 — Utility Helpers

**`client/lib/utils/cn.js`** (class name helper):
```javascript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

**`client/lib/hooks/useDebounce.js`:**
```javascript
import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 1500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

**`client/lib/utils/formatDate.js`:**
```javascript
export function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60)       return 'just now';
  if (seconds < 3600)     return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400)    return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800)   return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
```

### ✅ Phase 2 Checkpoint

- Sidebar renders, navigation links work
- Visiting `/notes` shows the Notes page (empty state)
- Visiting `/boards` shows the Boards page (empty state)
- No console errors

---

## Phase 3 — Notes Feature

**Goal:** Full CRUD notes with search and auto-save.

### Step 3.1 — Notes Context

**`client/context/NotesContext.jsx`:**
```javascript
'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import { notesApi } from '@/lib/api/notesApi';

const NotesContext = createContext(null);

export function NotesProvider({ children }) {
  const [notes, setNotes]           = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [loading, setLoading]       = useState(false);

  const fetchNotes = useCallback(async (params) => {
    setLoading(true);
    try {
      const res = await notesApi.getAll(params);
      setNotes(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  const createNote = async (data) => {
    const res = await notesApi.create(data);
    setNotes(prev => [res.data, ...prev]);
    setActiveNote(res.data);
    return res.data;
  };

  const updateNote = async (id, data) => {
    const res = await notesApi.update(id, data);
    setNotes(prev => prev.map(n => n._id === id ? res.data : n));
    if (activeNote?._id === id) setActiveNote(res.data);
  };

  const deleteNote = async (id) => {
    await notesApi.delete(id);
    setNotes(prev => prev.filter(n => n._id !== id));
    if (activeNote?._id === id) setActiveNote(null);
  };

  return (
    <NotesContext.Provider value={{
      notes, activeNote, loading,
      setActiveNote, fetchNotes, createNote, updateNote, deleteNote
    }}>
      {children}
    </NotesContext.Provider>
  );
}

export const useNotes = () => useContext(NotesContext);
```

### Step 3.2 — Build Notes Page Components

Build in this order:

1. **`NoteSearch.jsx`** — controlled input, calls `fetchNotes({ search: value })` on change
2. **`NoteItem.jsx`** — displays title, body preview, timestamp; onClick sets `activeNote`
3. **`NotesList.jsx`** — renders `NoteSearch` + list of `NoteItem` + "+ New Note" button
4. **`NoteEditor.jsx`** — the main right panel:
   - Editable `<h1>` or `<textarea>` for title
   - Large `<textarea>` for body (Markdown)
   - Uses `useDebounce` — when debounced value changes, call `updateNote()`
   - Shows save status ("Saving..." / "Saved ✓")
   - Delete button with confirm dialog

### Step 3.3 — Notes Page Layout

**`client/app/notes/page.jsx`:**
```jsx
'use client';
import { useEffect } from 'react';
import { NotesProvider, useNotes } from '@/context/NotesContext';
import NotesList from '@/components/notes/NotesList';
import NoteEditor from '@/components/notes/NoteEditor';

function NotesContent() {
  const { fetchNotes, activeNote } = useNotes();
  useEffect(() => { fetchNotes(); }, []);

  return (
    <div className="flex h-full">
      <NotesList />
      <div className="flex-1 overflow-auto">
        {activeNote
          ? <NoteEditor />
          : <EmptyState message="Select a note or create a new one" />
        }
      </div>
    </div>
  );
}

export default function NotesPage() {
  return (
    <NotesProvider>
      <NotesContent />
    </NotesProvider>
  );
}
```

### ✅ Phase 3 Checkpoint

- Create a new note → appears in list
- Click note → opens in editor
- Type in editor → auto-saves after 1.5s
- Search → filters list
- Delete → removes from list with confirm dialog

---

## Phase 4 — Kanban Feature

**Goal:** Full Kanban board with drag-and-drop.

### Step 4.1 — Boards Context

Similar to NotesContext — manages `boards[]`, `activeBoard` (with columns and cards), CRUD methods, and `moveCard`.

### Step 4.2 — Boards List Page

**`client/app/boards/page.jsx`:**
- Fetches all boards
- Renders grid of `BoardCard` components
- "+ New Board" button → modal with name input → calls `createBoard()`

### Step 4.3 — Board View Page

**`client/app/boards/[id]/page.jsx`:**
- On mount: calls `boardsApi.getBoardFull(id)`
- Renders `KanbanBoard` with columns and cards

### Step 4.4 — KanbanBoard Component

```jsx
// components/kanban/KanbanBoard.jsx
import { DndContext, closestCorners, DragOverlay } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';

export default function KanbanBoard({ board, columns, cards }) {
  // columns: array of column objects
  // cards: { [columnId]: Card[] } — grouped by column

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    // Determine source column, destination column, new order
    // Call moveCard API
  };

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
      <div className="flex gap-4 p-6 h-full overflow-x-auto">
        <SortableContext items={columns.map(c => c._id)} strategy={horizontalListSortingStrategy}>
          {columns.map(col => (
            <KanbanColumn key={col._id} column={col} cards={cards[col._id] || []} />
          ))}
        </SortableContext>
        <AddColumnButton boardId={board._id} />
      </div>
    </DndContext>
  );
}
```

### Step 4.5 — KanbanColumn Component

```jsx
// Receives: column object, cards array
// Renders: column header (name, card count, rename/delete actions)
// Renders: list of KanbanCard (wrapped in SortableContext)
// Renders: "Add card" inline input at bottom
```

### Step 4.6 — KanbanCard Component

```jsx
// Wrapped in useSortable from @dnd-kit/sortable
// Renders: priority badge, title, description preview, metadata
// onClick: opens CardModal
```

### Step 4.7 — CardModal Component

Modal showing full card detail:
- Editable title (inline `<input>`)
- Editable description (`<textarea>`)
- Priority selector (3 buttons: Low / Medium / High)
- Linked note display / link button
- Delete card button
- Auto-saves on field change (debounced)

### Step 4.8 — Drag and Drop Logic

The `handleDragEnd` function in `KanbanBoard`:

```javascript
const handleDragEnd = async ({ active, over }) => {
  if (!over || active.id === over.id) return;

  const activeCard = findCardById(active.id);
  const overColumn = findColumnByCardOrColumnId(over.id);

  if (!activeCard || !overColumn) return;

  // Optimistic update in state
  moveCardInState(activeCard._id, overColumn._id, newOrder);

  // API call
  try {
    await cardsApi.moveCard(activeCard._id, {
      newColumnId: overColumn._id,
      newOrder: newOrder
    });
  } catch (err) {
    // Rollback optimistic update
    rollbackCardMove();
  }
};
```

### ✅ Phase 4 Checkpoint

- Create a new board → appears in boards list + sidebar
- Open a board → columns display
- Add a card → appears in column
- Open card → CardModal shows, can edit title/description/priority
- Drag card between columns → moves, persists on page reload

---

## Phase 5 — Cross-Linking & Polish

**Goal:** Note↔Card linking, dashboard, final UI polish.

### Step 5.1 — Note ↔ Card Linking

In `CardModal.jsx`:
- "Link a note" button → opens a small modal/popover with a note search
- Selecting a note sets `card.linkedNoteId`
- Display linked note as a chip: `📄 Note title →` (clicking navigates to the note)

In `NoteEditor.jsx`:
- "Linked cards" section at the bottom
- Shows any cards that link to this note
- "+ Link to a card" opens board/card selector

### Step 5.2 — Dashboard Page

**`client/app/page.jsx`:**
- Greeting: "Good morning/afternoon/evening"
- Today's date
- Recent notes section (last 3 notes as cards)
- Boards section (all boards as clickable tiles)

### Step 5.3 — UI Polish Pass

Go through each component and clean up:
- Consistent spacing (use the Tailwind spacing scale from Design Doc)
- Empty states on all list views (notes empty, board empty, column empty)
- Loading spinners on async data fetches
- Error messages if API call fails
- Transition/hover states on interactive elements

### Step 5.4 — Dark Mode Toggle (optional P2)

Add dark/light mode toggle using `next-themes` or manual `localStorage` + class toggle on `<html>`.

---

## Phase 6 — Testing & Hardening

**Goal:** App is stable, no obvious bugs, ready for daily use.

### Step 6.1 — Manual Test Checklist

**Notes:**
- [ ] Create note with only title
- [ ] Create note with long markdown body
- [ ] Auto-save triggers and shows "Saved" indicator
- [ ] Search filters correctly
- [ ] Delete requires confirmation
- [ ] Deleting active note clears editor

**Kanban:**
- [ ] Create board with custom name
- [ ] Default columns appear (To Do, In Progress, Done)
- [ ] Add column with custom name
- [ ] Rename column
- [ ] Delete empty column (no warning)
- [ ] Delete column with cards (shows warning)
- [ ] Add card, verify in list
- [ ] Open card modal, edit all fields
- [ ] Priority badge updates immediately
- [ ] Drag card within same column (reorder)
- [ ] Drag card to different column
- [ ] Page reload preserves all changes

**Cross-linking:**
- [ ] Link a card to a note from card modal
- [ ] Linked note chip appears on card
- [ ] Clicking chip navigates to note

**Navigation:**
- [ ] All sidebar links navigate correctly
- [ ] Active sidebar item is highlighted
- [ ] New board appears in sidebar immediately after creation

### Step 6.2 — Edge Case Handling

- Empty board name → validation error shown
- Empty note title → use "Untitled" as fallback
- Network error on save → show error toast
- Deleting a board that has linked notes → linked cards' `linkedNoteId` will be stale (acceptable in MVP — add cleanup in future)

### Step 6.3 — README

Create `notban/README.md`:

```markdown
# Notban — Notes + Kanban Hybrid

Personal productivity app combining notes and kanban boards.

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+ (or Docker)

### Run MongoDB
docker run -d --name notban-mongo -p 27017:27017 mongo:6

### Start Backend
cd server
cp .env.example .env   # edit if needed
npm install
npm run dev

### Start Frontend
cd client
npm install
npm run dev

Open http://localhost:3000
```

---

## 10. Code Snippets & Patterns

### Pattern: Controller with error handling

```javascript
exports.createNote = async (req, res, next) => {
  try {
    const { title, body, tags } = req.body;

    if (!title?.trim()) {
      const err = new Error('Title is required');
      err.statusCode = 400;
      return next(err);
    }

    const note = await Note.create({ title: title.trim(), body, tags });

    res.status(201).json({
      success: true,
      data: note,
      message: 'Note created successfully',
    });
  } catch (error) {
    next(error);
  }
};
```

### Pattern: Optimistic update with rollback

```javascript
// In BoardsContext or component
const moveCard = async (cardId, newColumnId, newOrder) => {
  // Save original state
  const originalColumns = { ...columnCards };

  // Apply optimistic update
  setColumnCards(applyCardMove(columnCards, cardId, newColumnId, newOrder));

  try {
    await cardsApi.moveCard(cardId, { newColumnId, newOrder });
  } catch (error) {
    // Rollback
    setColumnCards(originalColumns);
    // Show error
    console.error('Failed to move card:', error.message);
  }
};
```

### Pattern: Debounced auto-save in NoteEditor

```javascript
const [title, setTitle] = useState(note.title);
const [body, setBody]   = useState(note.body);
const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'

const debouncedTitle = useDebounce(title, 1500);
const debouncedBody  = useDebounce(body, 1500);

useEffect(() => {
  // Skip on initial mount
  if (debouncedTitle === note.title && debouncedBody === note.body) return;

  setSaveStatus('saving');
  updateNote(note._id, { title: debouncedTitle, body: debouncedBody })
    .then(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    })
    .catch(() => setSaveStatus('error'));
}, [debouncedTitle, debouncedBody]);
```

---

## 11. Common Pitfalls

| Pitfall | Prevention |
|---------|------------|
| Forgetting `'use client'` on components that use hooks/context | Add to every interactive component |
| CORS errors on first run | Verify `origin` in `cors()` matches `localhost:3000` exactly |
| MongoDB `ObjectId` comparison fails | Use `.toString()` when comparing: `col._id.toString() === id` |
| Drag-and-drop flickers on drop | Apply optimistic update before API call |
| Auto-save fires on initial render | Guard with `useRef` to skip first effect run |
| Note body textarea doesn't grow | Use `resize-y` Tailwind class or auto-resize textarea hook |
| Cards order becomes inconsistent | Always re-index all cards in affected columns after a move |
| `next/navigation` hooks fail in server components | Add `'use client'` to any component using `useRouter`, `usePathname`, `useParams` |
| Tailwind classes not applied | Ensure `content` paths in `tailwind.config.js` include all JSX file paths |

---

*End of Build & Implementation Plan v1.0.0*
