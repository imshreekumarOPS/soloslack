# Product Requirements Document (PRD)
## Notes + Kanban Hybrid — MVP

**Version:** 1.0.0  
**Date:** 2026-03-07  
**Author:** Personal Project  
**Status:** Draft → Active  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Non-Goals](#3-goals--non-goals)
4. [User Personas](#4-user-personas)
5. [Feature Requirements](#5-feature-requirements)
6. [User Stories](#6-user-stories)
7. [Functional Requirements](#7-functional-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Constraints & Assumptions](#9-constraints--assumptions)
10. [Success Metrics](#10-success-metrics)
11. [Out of Scope (Future)](#11-out-of-scope-future)

---

## 1. Overview

**Product Name:** Notban *(Notes + Kanban)*  
**Type:** Personal productivity web application  
**Platform:** Web (desktop-first, responsive)  
**Purpose:** A minimal hybrid tool that combines free-form note-taking with structured Kanban board task management — all in one place, for personal use.

Most productivity tools force a choice: either you get a note-taking app (Notion, Obsidian) or a task board (Trello, Linear). This MVP merges both into a single, distraction-free workspace where notes and tasks live side-by-side and can reference each other.

---

## 2. Problem Statement

Personal productivity is fragmented. Notes live in one app, tasks in another. Context is lost when switching between them. For a solo user, this adds friction and cognitive overhead.

**Core pains being solved:**
- Switching between apps breaks focus
- Notes and tasks are disconnected — a note about a project has no link to the tasks for that project
- Most tools are over-engineered with features that are never used
- Self-hosted / personal-use tools should be simple to run and maintain

---

## 3. Goals & Non-Goals

### Goals (MVP)

| # | Goal |
|---|------|
| G1 | Create, edit, delete, and organize notes with rich-text support |
| G2 | Create and manage Kanban boards with columns and cards |
| G3 | Link notes to Kanban cards (or boards) |
| G4 | Simple, clean UI that loads fast and stays out of the way |
| G5 | Data persisted in MongoDB (self-hosted) |
| G6 | RESTful API via Express.js serving the Next.js frontend |

### Non-Goals (MVP)

| # | Non-Goal | Reason |
|---|----------|--------|
| NG1 | Multi-user / team collaboration | Personal use only |
| NG2 | Authentication / login | Single user, no auth needed in MVP |
| NG3 | Real-time sync / WebSockets | Overkill for MVP |
| NG4 | Mobile app | Web responsive is sufficient |
| NG5 | File uploads / attachments | Out of scope for MVP |
| NG6 | Calendar / scheduling | Future feature |
| NG7 | AI features | Future feature |

---

## 4. User Personas

### Primary Persona — "Solo Dev / Builder"

Since this is a personal-use tool, there is effectively one user persona.

| Attribute | Detail |
|-----------|--------|
| **Who** | Developer / indie builder (you) |
| **Technical level** | High — comfortable running local servers, using CLIs |
| **Usage pattern** | Daily — capturing notes, tracking work-in-progress tasks |
| **Devices** | Desktop browser (primary), occasional mobile view |
| **Key need** | Speed and simplicity — open, write, close |
| **Frustrations** | Bloated UIs, sync issues, too many clicks to do simple things |

---

## 5. Feature Requirements

### F1 — Notes Module

| ID | Feature | Priority |
|----|---------|----------|
| F1.1 | Create a new note with a title and body | P0 (Must Have) |
| F1.2 | Edit note title and body inline | P0 |
| F1.3 | Delete a note | P0 |
| F1.4 | Notes list sidebar with search/filter | P0 |
| F1.5 | Markdown rendering in note body | P1 (Should Have) |
| F1.6 | Auto-save on edit (debounced) | P1 |
| F1.7 | Tags / labels on notes | P2 (Nice to Have) |
| F1.8 | Note-to-card linking | P1 |
| F1.9 | Timestamps (created at, updated at) | P1 |
| F1.10 | Pin a note to top of list | P2 |

### F2 — Kanban Module

| ID | Feature | Priority |
|----|---------|----------|
| F2.1 | Create multiple Kanban boards | P0 |
| F2.2 | Add, rename, delete columns within a board | P0 |
| F2.3 | Add, edit, delete cards within columns | P0 |
| F2.4 | Drag-and-drop cards between columns | P1 |
| F2.5 | Card has title + optional description | P0 |
| F2.6 | Card has a priority tag (Low / Medium / High) | P1 |
| F2.7 | Card has a status indicator (driven by column position) | P0 |
| F2.8 | Due date on a card | P2 |
| F2.9 | Link a card to a note | P1 |
| F2.10 | Archive a card (soft-delete) | P2 |

### F3 — Navigation / Shell

| ID | Feature | Priority |
|----|---------|----------|
| F3.1 | Sidebar navigation: Notes view, Boards view | P0 |
| F3.2 | Ability to switch between notes and boards seamlessly | P0 |
| F3.3 | Board selector (list all boards) | P0 |
| F3.4 | Responsive layout (functional on smaller screens) | P1 |
| F3.5 | Dark mode / Light mode toggle | P2 |

---

## 6. User Stories

### Notes

```
AS a user
I WANT TO quickly open the app and write a new note
SO THAT I can capture an idea without friction

AS a user
I WANT TO search through my notes by title
SO THAT I can find what I wrote without scrolling

AS a user
I WANT TO write notes in Markdown
SO THAT I can format them (headings, bullets, code blocks) without a bloated editor

AS a user
I WANT TO link a note to a Kanban card
SO THAT I can keep context (research, decisions) attached to a task
```

### Kanban

```
AS a user
I WANT TO create a Kanban board for a project
SO THAT I can track its tasks from To-Do to Done

AS a user
I WANT TO drag cards between columns
SO THAT I can visually update task status

AS a user
I WANT TO add a description to a card
SO THAT I remember what the task actually involves

AS a user
I WANT TO quickly add a new card by pressing Enter or a button
SO THAT task capture is fast
```

### General

```
AS a user
I WANT TO see both my recent notes and active boards on a dashboard
SO THAT I have a quick overview of what I'm working on

AS a user
I WANT the app to auto-save my edits
SO THAT I never lose work by forgetting to hit Save
```

---

## 7. Functional Requirements

### 7.1 Notes

**FR-N-01:** The system shall allow creation of a note with at minimum a `title` field.  
**FR-N-02:** The note body shall accept Markdown syntax and render it in view mode.  
**FR-N-03:** Editing shall be in-place — clicking the note opens it in an editable state.  
**FR-N-04:** Changes to a note shall be auto-saved with a debounce of no more than 1500ms.  
**FR-N-05:** Notes shall display a `last updated` timestamp.  
**FR-N-06:** The notes list shall support text search filtering by title.  
**FR-N-07:** Deleting a note shall prompt for confirmation before permanently removing it.  
**FR-N-08:** A note can optionally be linked to one or more Kanban cards via a `linkedCards` array field.  

### 7.2 Kanban Boards

**FR-K-01:** The system shall support multiple independent Kanban boards.  
**FR-K-02:** Each board shall have a name and an ordered list of columns.  
**FR-K-03:** Default columns on new board creation: `To Do`, `In Progress`, `Done`.  
**FR-K-04:** Columns shall be renameable and deletable (deleting a column with cards shall warn the user).  
**FR-K-05:** Cards within a column shall be orderable by drag-and-drop.  
**FR-K-06:** A card shall have: `title` (required), `description` (optional), `priority` (Low/Medium/High), `createdAt`, `updatedAt`.  
**FR-K-07:** Moving a card between columns shall update its `columnId` in the database.  
**FR-K-08:** A card can optionally reference a note via a `linkedNoteId` field.  

### 7.3 Navigation

**FR-U-01:** The application shall have a persistent left sidebar for navigation.  
**FR-U-02:** The sidebar shall list: Dashboard, Notes, Boards (with sub-list of board names).  
**FR-U-03:** The active view shall be visually highlighted in the sidebar.  

---

## 8. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Page load time (initial) | < 2 seconds on localhost |
| NFR-02 | API response time (GET requests) | < 200ms |
| NFR-03 | API response time (POST/PATCH) | < 400ms |
| NFR-04 | Auto-save delay | ≤ 1500ms after last keystroke |
| NFR-05 | App should work offline (read-only) | Not required in MVP |
| NFR-06 | Code maintainability | Clear folder structure, consistent naming |
| NFR-07 | Browser support | Latest Chrome, Firefox, Edge |
| NFR-08 | MongoDB data integrity | Proper indexing on frequently queried fields |

---

## 9. Constraints & Assumptions

### Constraints

- **Single user** — no multi-tenancy, no authentication in MVP
- **Local development first** — the app is designed to run locally (`localhost`), not deployed to production in MVP phase
- **MongoDB** must be running locally (or via Docker) — no cloud DB in MVP
- **No real-time sync** — standard HTTP request/response cycle only

### Assumptions

- The user runs Node.js (v18+) locally
- The user runs MongoDB locally (v6+) or via Docker
- The frontend runs on port `3000`, the backend API on port `5000`
- All data is stored in a single MongoDB database (`notban_db`)

---

## 10. Success Metrics

Since this is a personal tool, success is defined qualitatively:

| Metric | Target |
|--------|--------|
| Daily use | App is opened and used daily without frustration |
| Note creation time | Less than 5 seconds from opening app to typing first character |
| Task management | All active projects tracked in Kanban boards |
| Zero data loss | No note or task data lost due to bugs |
| Stability | App runs for weeks without needing a restart |

---

## 11. Out of Scope (Future)

These features are intentionally deferred from the MVP but may be considered later:

| Feature | Notes |
|---------|-------|
| Authentication / user accounts | Add if deploying to server |
| Collaborative editing | Multi-user support |
| File attachments | Images, PDFs on cards/notes |
| Calendar view | Deadline tracking with calendar UI |
| AI-assisted writing | Summarize notes, generate task lists |
| Export (PDF, Markdown file) | Export notes as files |
| Labels / Tags system | Filterable taxonomy |
| Full-text search | Search inside note body, not just title |
| Board templates | Predefined column layouts |
| Notifications / reminders | Due date alerts |

---

*End of PRD v1.0.0*
