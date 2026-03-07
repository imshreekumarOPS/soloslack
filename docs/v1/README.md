# Notban — Notes + Kanban Hybrid

> A minimal personal productivity app. Write notes. Track tasks. Everything in one place.

---

## What is it?

Notban combines free-form **note-taking** with structured **Kanban board** task management. No sign-up, no sync fees, no bloat — just your notes and tasks, running locally.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + TailwindCSS |
| Backend | Express.js (Node.js) |
| Database | MongoDB |
| ODM | Mongoose |

Frontend and backend are in **separate folders** (`client/` and `server/`).

---

## Quick Start

### 1. Prerequisites

- Node.js v18+
- MongoDB v6+ (local or Docker)

```bash
# Start MongoDB via Docker (if not installed locally)
docker run -d --name notban-mongo -p 27017:27017 mongo:6
```

### 2. Clone and install

```bash
git clone <repo-url> notban
cd notban

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 3. Configure environment

```bash
# server/.env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/notban_db
NODE_ENV=development

# client/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Run

Open two terminals:

```bash
# Terminal 1 — Backend
cd server && npm run dev
# → Server running on http://localhost:5000

# Terminal 2 — Frontend
cd client && npm run dev
# → Next.js ready on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## Documentation Index

All project documentation lives in the `docs/` folder:

| File | Contents |
|------|---------|
| `01-PRD.md` | Product Requirements Document — what we're building and why |
| `02-ARCHITECTURE.md` | System architecture, folder structure, tech decisions |
| `03-DESIGN.md` | UI/UX design spec — tokens, components, layouts |
| `04-API.md` | Full REST API reference with examples |
| `05-BUILD-PLAN.md` | Step-by-step build and implementation guide |
| `06-DATABASE-SCHEMA.md` | MongoDB schema definitions, indexes, query patterns |

---

## Features (MVP)

- **Notes** — Create and edit Markdown notes, auto-saved as you type
- **Kanban Boards** — Multiple boards with drag-and-drop cards
- **Cross-linking** — Link notes to Kanban cards and vice versa
- **Dashboard** — Quick overview of recent notes and active boards

---

*Personal MVP — built for daily use.*
