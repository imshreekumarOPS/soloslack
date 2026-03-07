# System Architecture Document
## Notes + Kanban Hybrid (Notban) — MVP

**Version:** 1.0.0  
**Date:** 2026-03-07  
**Status:** Approved for MVP  

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [High-Level System Diagram](#2-high-level-system-diagram)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Database Architecture](#5-database-architecture)
6. [Data Flow](#6-data-flow)
7. [Folder Structure](#7-folder-structure)
8. [Technology Stack](#8-technology-stack)
9. [Environment Configuration](#9-environment-configuration)
10. [Communication Protocol](#10-communication-protocol)
11. [Error Handling Strategy](#11-error-handling-strategy)
12. [Scalability Considerations](#12-scalability-considerations)

---

## 1. Architecture Overview

Notban follows a **decoupled client-server architecture** — the frontend and backend are completely separate applications that communicate over HTTP via a REST API.

```
┌─────────────────────────────────────────────────────────────┐
│                      NOTBAN SYSTEM                          │
│                                                             │
│  ┌──────────────────┐         ┌──────────────────────────┐  │
│  │   FRONTEND       │  HTTP   │        BACKEND           │  │
│  │   Next.js        │ ──────► │   Express.js API         │  │
│  │   TailwindCSS    │ ◄────── │   REST Endpoints         │  │
│  │   Port: 3000     │  JSON   │   Port: 5000             │  │
│  └──────────────────┘         └──────────┬───────────────┘  │
│                                          │                  │
│                               ┌──────────▼───────────────┐  │
│                               │        DATABASE          │  │
│                               │        MongoDB           │  │
│                               │        Port: 27017       │  │
│                               └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**

| Decision | Choice | Reason |
|----------|--------|--------|
| Frontend/Backend separation | Yes — separate folders | Clean separation of concerns; frontend can be swapped independently |
| API style | REST (not GraphQL) | Simpler for MVP; no complex querying needed |
| State management | React Context + useState | No Redux needed for MVP scale |
| Real-time | None (polling acceptable) | WebSockets add complexity; not needed for personal use |
| Auth | None in MVP | Single-user personal app |
| ORM/ODM | Mongoose | Provides schema validation on top of MongoDB |

---

## 2. High-Level System Diagram

```
USER (Browser)
     │
     │ HTTP GET/POST/PATCH/DELETE
     ▼
┌────────────────────────────────────────────────────────────────┐
│  FRONTEND — Next.js App (localhost:3000)                       │
│                                                                │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐   │
│  │  Pages   │  │  Components  │  │  API Client Layer      │   │
│  │          │  │              │  │  (fetch / axios)        │   │
│  │ /        │  │  Sidebar     │  │                         │   │
│  │ /notes   │  │  NoteEditor  │  │  notesApi.js           │   │
│  │ /notes/  │  │  KanbanBoard │  │  boardsApi.js          │   │
│  │  [id]    │  │  CardModal   │  │  cardsApi.js           │   │
│  │ /boards  │  │  ...         │  │                         │   │
│  │ /boards/ │  └──────────────┘  └───────────────────────┘   │
│  │  [id]    │                                                  │
│  └──────────┘                                                  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Context / State (AppContext, NotesContext, BoardContext) │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                    REST API calls (JSON)
                    CORS enabled
                              │
┌─────────────────────────────▼──────────────────────────────────┐
│  BACKEND — Express.js API Server (localhost:5000)              │
│                                                                │
│  ┌────────────┐  ┌────────────────┐  ┌──────────────────────┐ │
│  │  Routes    │  │  Controllers   │  │   Middleware          │ │
│  │            │  │                │  │                       │ │
│  │ /api/notes │  │ notesCtrl.js   │  │ cors()               │ │
│  │ /api/boards│  │ boardsCtrl.js  │  │ express.json()       │ │
│  │ /api/cards │  │ cardsCtrl.js   │  │ errorHandler.js      │ │
│  │ /api/cols  │  │ columnsCtrl.js │  │ requestLogger.js     │ │
│  └────────────┘  └───────┬────────┘  └──────────────────────┘ │
│                          │                                     │
│  ┌───────────────────────▼──────────────────────────────────┐  │
│  │  Models (Mongoose Schemas)                                │  │
│  │  Note.js  │  Board.js  │  Column.js  │  Card.js          │  │
│  └───────────────────────┬──────────────────────────────────┘  │
└──────────────────────────┼─────────────────────────────────────┘
                           │
                  Mongoose ODM
                           │
┌──────────────────────────▼─────────────────────────────────────┐
│  DATABASE — MongoDB (localhost:27017)                          │
│                                                                │
│  Database: notban_db                                           │
│                                                                │
│  Collections:                                                  │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌──────────────┐  │
│  │  notes    │ │  boards   │ │  columns  │ │    cards     │  │
│  └───────────┘ └───────────┘ └───────────┘ └──────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Frontend Architecture

### 3.1 Framework & Routing

Next.js App Router (v14+) is used. Pages use the `/app` directory convention.

```
app/
├── layout.jsx          ← Root layout (Sidebar + main content wrapper)
├── page.jsx            ← Dashboard / home page
├── notes/
│   ├── page.jsx        ← Notes list view
│   └── [id]/
│       └── page.jsx    ← Individual note editor
└── boards/
    ├── page.jsx        ← Boards list view
    └── [id]/
        └── page.jsx    ← Individual Kanban board view
```

### 3.2 Component Architecture

Components follow a **feature-based** grouping pattern.

```
components/
├── layout/
│   ├── Sidebar.jsx          ← Main navigation sidebar
│   ├── Header.jsx           ← Optional top header bar
│   └── MainContent.jsx      ← Content area wrapper
├── notes/
│   ├── NotesList.jsx        ← Scrollable list of note cards
│   ├── NoteItem.jsx         ← Single note preview in list
│   ├── NoteEditor.jsx       ← Full note editing view (title + body)
│   ├── NoteSearch.jsx       ← Search/filter input
│   └── MarkdownRenderer.jsx ← Renders markdown body
├── kanban/
│   ├── BoardList.jsx        ← Grid of all boards
│   ├── BoardCard.jsx        ← Single board preview tile
│   ├── KanbanBoard.jsx      ← Full board view with columns
│   ├── KanbanColumn.jsx     ← Single column with cards
│   ├── KanbanCard.jsx       ← Single draggable card
│   └── CardModal.jsx        ← Card detail / edit modal
└── ui/
    ├── Button.jsx
    ├── Input.jsx
    ├── Modal.jsx
    ├── Badge.jsx
    ├── ConfirmDialog.jsx
    └── LoadingSpinner.jsx
```

### 3.3 State Management

No external state library (Redux, Zustand) is used in MVP. State is managed using:

- **React `useState`** — local component state (form inputs, modal open/close)
- **React `useContext`** — shared application state (notes list, boards list, active board)
- **React `useEffect`** — data fetching on mount / route change

**Context structure:**

```
AppProvider (wraps entire app)
├── NotesContext
│   ├── notes[]
│   ├── activeNote
│   ├── fetchNotes()
│   ├── createNote()
│   ├── updateNote()
│   └── deleteNote()
└── BoardsContext
    ├── boards[]
    ├── activeBoard
    ├── fetchBoards()
    ├── fetchBoardById()
    ├── createBoard()
    ├── updateCard()
    └── moveCard()
```

### 3.4 API Client Layer

All HTTP calls are centralized in `/lib/api/` — no raw `fetch` calls scattered in components.

```javascript
// lib/api/notesApi.js — example structure
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const notesApi = {
  getAll:    ()       => fetch(`${BASE}/notes`).then(r => r.json()),
  getById:   (id)     => fetch(`${BASE}/notes/${id}`).then(r => r.json()),
  create:    (data)   => fetch(`${BASE}/notes`, { method: 'POST', ... }),
  update:    (id, d)  => fetch(`${BASE}/notes/${id}`, { method: 'PATCH', ... }),
  delete:    (id)     => fetch(`${BASE}/notes/${id}`, { method: 'DELETE' }),
};
```

---

## 4. Backend Architecture

### 4.1 Server Setup

Express.js server with modular routing.

```
server/
├── src/
│   ├── app.js              ← Express app instance (middleware setup)
│   ├── server.js           ← Entry point (starts HTTP server)
│   ├── config/
│   │   ├── db.js           ← MongoDB connection
│   │   └── env.js          ← Environment config loader
│   ├── routes/
│   │   ├── index.js        ← Mounts all route modules
│   │   ├── notes.routes.js
│   │   ├── boards.routes.js
│   │   ├── columns.routes.js
│   │   └── cards.routes.js
│   ├── controllers/
│   │   ├── notes.controller.js
│   │   ├── boards.controller.js
│   │   ├── columns.controller.js
│   │   └── cards.controller.js
│   ├── models/
│   │   ├── Note.js
│   │   ├── Board.js
│   │   ├── Column.js
│   │   └── Card.js
│   └── middleware/
│       ├── errorHandler.js
│       ├── notFound.js
│       └── requestLogger.js
├── .env
└── package.json
```

### 4.2 Request Lifecycle

```
HTTP Request
    │
    ▼
Express Middleware Stack
    ├── cors()                     — Allow frontend origin
    ├── express.json()             — Parse JSON body
    ├── requestLogger.js           — Log method + path
    │
    ▼
Route Handler (e.g. /api/notes)
    │
    ▼
Controller Function
    ├── Validate input
    ├── Call Mongoose model
    ├── Handle errors (try/catch)
    └── Send JSON response
    │
    ▼
HTTP Response (JSON)
```

### 4.3 Response Format

All API responses follow a consistent envelope format:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Note created successfully"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Note not found",
  "statusCode": 404
}
```

---

## 5. Database Architecture

### 5.1 Collections Overview

| Collection | Purpose | Key References |
|-----------|---------|----------------|
| `notes` | Stores all notes | `linkedCards[]` → Card IDs |
| `boards` | Stores board metadata | — |
| `columns` | Stores columns per board | `boardId` → Board |
| `cards` | Stores cards per column | `columnId` → Column, `linkedNoteId` → Note |

### 5.2 Schema Definitions

#### Note Schema

```javascript
{
  _id:         ObjectId,          // MongoDB auto-generated
  title:       String,            // Required, max 200 chars
  body:        String,            // Markdown content, optional
  tags:        [String],          // Array of tag strings
  isPinned:    Boolean,           // Default: false
  linkedCards: [ObjectId],        // Refs to Card._id
  createdAt:   Date,              // Auto (timestamps: true)
  updatedAt:   Date               // Auto (timestamps: true)
}
```

#### Board Schema

```javascript
{
  _id:         ObjectId,
  name:        String,            // Required, max 100 chars
  description: String,            // Optional
  createdAt:   Date,
  updatedAt:   Date
}
```

#### Column Schema

```javascript
{
  _id:         ObjectId,
  boardId:     ObjectId,          // Required, ref: 'Board'
  name:        String,            // Required, max 50 chars
  order:       Number,            // Integer, controls column order
  createdAt:   Date,
  updatedAt:   Date
}
```

#### Card Schema

```javascript
{
  _id:           ObjectId,
  columnId:      ObjectId,        // Required, ref: 'Column'
  boardId:       ObjectId,        // Required, ref: 'Board' (denormalized for easier queries)
  title:         String,          // Required, max 200 chars
  description:   String,          // Optional, max 2000 chars
  priority:      String,          // Enum: 'low' | 'medium' | 'high', default: 'medium'
  order:         Number,          // Integer, controls card order within column
  linkedNoteId:  ObjectId,        // Optional, ref: 'Note'
  dueDate:       Date,            // Optional
  isArchived:    Boolean,         // Default: false
  createdAt:     Date,
  updatedAt:     Date
}
```

### 5.3 Indexes

```javascript
// Notes
notes.createIndex({ title: 'text' })         // Text search on title
notes.createIndex({ updatedAt: -1 })         // Sort by recent

// Columns
columns.createIndex({ boardId: 1, order: 1 }) // Fetch columns by board, sorted

// Cards
cards.createIndex({ columnId: 1, order: 1 })  // Fetch cards by column, sorted
cards.createIndex({ boardId: 1 })             // Fetch all cards for a board
```

---

## 6. Data Flow

### 6.1 Loading a Kanban Board

```
User navigates to /boards/[id]
         │
         ▼
Page component mounts
         │
         ▼
useEffect → boardsApi.getBoardById(id)
         │
         ▼
GET /api/boards/:id/full
         │
         ▼
Controller: Board.findById() + Column.find({boardId}) + Card.find({boardId})
         │
         ▼
Response: { board, columns, cards } — all in one request
         │
         ▼
State: setBoard(), setColumns(), setCards()
         │
         ▼
Render: KanbanBoard → KanbanColumn[] → KanbanCard[]
```

### 6.2 Auto-saving a Note

```
User types in NoteEditor
         │
         ▼
onChange handler fires
         │
         ▼
debounce(1500ms) — resets on each keystroke
         │
         ▼ (after 1500ms of inactivity)
notesApi.update(note._id, { title, body })
         │
         ▼
PATCH /api/notes/:id
         │
         ▼
Note.findByIdAndUpdate(id, { title, body }, { new: true })
         │
         ▼
Response: updated note
         │
         ▼
UI: show "Saved" indicator briefly
```

### 6.3 Drag-and-Drop Card Move

```
User drags card from Column A to Column B
         │
         ▼
onDragEnd handler (dnd-kit)
         │
         ▼
Optimistic UI update: move card in local state immediately
         │
         ▼
cardsApi.moveCard(cardId, { newColumnId, newOrder })
         │
         ▼
PATCH /api/cards/:id/move
         │
         ▼
Controller:
  Card.findByIdAndUpdate(cardId, { columnId: newColumnId, order: newOrder })
  // Re-index orders of cards in both old and new columns
         │
         ▼
Response: { success: true }
         │
         ▼
(If API fails → rollback optimistic update in UI)
```

---

## 7. Folder Structure

### Root Level

```
notban/
├── client/                 ← Next.js frontend
├── server/                 ← Express.js backend
├── .gitignore
└── README.md
```

### Client (Frontend)

```
client/
├── app/
│   ├── layout.jsx
│   ├── page.jsx
│   ├── globals.css
│   ├── notes/
│   │   ├── page.jsx
│   │   └── [id]/page.jsx
│   └── boards/
│       ├── page.jsx
│       └── [id]/page.jsx
├── components/
│   ├── layout/
│   ├── notes/
│   ├── kanban/
│   └── ui/
├── context/
│   ├── AppContext.jsx
│   ├── NotesContext.jsx
│   └── BoardsContext.jsx
├── lib/
│   ├── api/
│   │   ├── notesApi.js
│   │   ├── boardsApi.js
│   │   └── cardsApi.js
│   ├── hooks/
│   │   ├── useDebounce.js
│   │   ├── useNotes.js
│   │   └── useBoards.js
│   └── utils/
│       ├── formatDate.js
│       └── cn.js          ← clsx + tailwind-merge helper
├── public/
├── .env.local
├── next.config.js
├── tailwind.config.js
└── package.json
```

### Server (Backend)

```
server/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── notes.routes.js
│   │   ├── boards.routes.js
│   │   ├── columns.routes.js
│   │   └── cards.routes.js
│   ├── controllers/
│   │   ├── notes.controller.js
│   │   ├── boards.controller.js
│   │   ├── columns.controller.js
│   │   └── cards.controller.js
│   ├── models/
│   │   ├── Note.js
│   │   ├── Board.js
│   │   ├── Column.js
│   │   └── Card.js
│   └── middleware/
│       ├── errorHandler.js
│       ├── notFound.js
│       └── requestLogger.js
├── .env
├── .gitignore
└── package.json
```

---

## 8. Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React framework, file-based routing, SSR/CSR |
| React | 18.x | UI component library |
| TailwindCSS | 3.x | Utility-first CSS styling |
| @dnd-kit/core | latest | Drag-and-drop for Kanban cards |
| @dnd-kit/sortable | latest | Sortable list utilities |
| react-markdown | latest | Markdown rendering in notes |
| clsx | latest | Conditional class name utility |
| tailwind-merge | latest | Merge Tailwind classes safely |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18.x+ | JavaScript runtime |
| Express.js | 4.x | HTTP server and routing |
| Mongoose | 7.x | MongoDB ODM / schema validation |
| cors | latest | Cross-origin resource sharing |
| dotenv | latest | Environment variable loading |
| morgan | latest | HTTP request logging (dev) |

### Database

| Technology | Version | Purpose |
|------------|---------|---------|
| MongoDB | 6.x | Primary document database |

### Development Tools

| Tool | Purpose |
|------|---------|
| nodemon | Auto-restart server on file change |
| ESLint | Code linting |
| Prettier | Code formatting |
| Postman / Bruno | API testing |

---

## 9. Environment Configuration

### Client — `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Server — `.env`

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/notban_db
NODE_ENV=development
```

---

## 10. Communication Protocol

### HTTP Methods & Conventions

| Action | Method | Example |
|--------|--------|---------|
| Fetch all resources | GET | `GET /api/notes` |
| Fetch single resource | GET | `GET /api/notes/:id` |
| Create resource | POST | `POST /api/notes` |
| Update resource (partial) | PATCH | `PATCH /api/notes/:id` |
| Delete resource | DELETE | `DELETE /api/notes/:id` |

### CORS Configuration

```javascript
// server/src/app.js
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
```

### Content Type

All requests and responses use `Content-Type: application/json`.

---

## 11. Error Handling Strategy

### Backend

All controllers use `try/catch`. A global error handler middleware catches unhandled errors.

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    statusCode
  });
};
```

**Error types handled:**
- `404` — Resource not found (Note, Board, Card does not exist)
- `400` — Validation error (required field missing, invalid enum value)
- `500` — Unexpected server error

### Frontend

- API errors are caught in the API client layer and returned as `{ error: string }`
- Components display user-friendly error messages (e.g., toast or inline error text)
- Optimistic updates (e.g., drag-and-drop) are rolled back on API failure

---

## 12. Scalability Considerations

This is a personal MVP, not designed for scale. However, the architecture naturally supports growth:

| Current (MVP) | Future Path |
|---------------|-------------|
| No auth | Add JWT-based auth + user model |
| Single MongoDB instance | Atlas (cloud) or replica set |
| REST API | Add GraphQL layer if queries get complex |
| No caching | Add Redis for hot data |
| React Context state | Migrate to Zustand if state becomes complex |
| No real-time | Add Socket.io for live collaboration |
| Separate folders | Containerize with Docker Compose |

---

*End of Architecture Document v1.0.0*
