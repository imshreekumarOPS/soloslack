# API Documentation
## Notes + Kanban Hybrid (Notban) — REST API

**Version:** 1.0.0  
**Base URL:** `http://localhost:5000/api`  
**Date:** 2026-03-07  
**Format:** All requests/responses use `application/json`

---

## Table of Contents

1. [API Overview](#1-api-overview)
2. [Response Format](#2-response-format)
3. [Error Codes](#3-error-codes)
4. [Notes Endpoints](#4-notes-endpoints)
5. [Boards Endpoints](#5-boards-endpoints)
6. [Columns Endpoints](#6-columns-endpoints)
7. [Cards Endpoints](#7-cards-endpoints)
8. [Composite Endpoints](#8-composite-endpoints)

---

## 1. API Overview

### Base URL

```
http://localhost:5000/api
```

### Resource Hierarchy

```
/api/notes              ← standalone notes
/api/boards             ← board metadata
/api/boards/:id/full    ← board + columns + cards in one call
/api/columns            ← columns (belong to a board)
/api/cards              ← cards (belong to a column)
/api/cards/:id/move     ← special endpoint for drag-and-drop moves
```

### HTTP Methods Used

| Method | Meaning |
|--------|---------|
| `GET` | Read (safe, idempotent) |
| `POST` | Create |
| `PATCH` | Partial update |
| `DELETE` | Delete |

---

## 2. Response Format

All endpoints return a consistent JSON envelope.

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Human-readable success message"
}
```

For lists:
```json
{
  "success": true,
  "data": [ ... ],
  "count": 12,
  "message": "Notes fetched successfully"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Human-readable error description",
  "statusCode": 404
}
```

---

## 3. Error Codes

| HTTP Status | When Used |
|-------------|-----------|
| `200 OK` | Successful GET, PATCH |
| `201 Created` | Successful POST |
| `204 No Content` | Successful DELETE |
| `400 Bad Request` | Missing required field, invalid value |
| `404 Not Found` | Resource (note, board, card) does not exist |
| `500 Internal Server Error` | Unexpected server error |

---

## 4. Notes Endpoints

### `GET /api/notes`

Fetch all notes, sorted by `updatedAt` descending (most recent first).

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Filter notes by title (case-insensitive) |
| `limit` | number | Max results (default: 50) |
| `skip` | number | Offset for pagination (default: 0) |

**Example Request:**
```
GET /api/notes?search=meeting&limit=20
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
      "title": "Meeting Notes — Q1 Planning",
      "body": "## Agenda\n- Review roadmap\n- Set Q1 goals",
      "tags": ["meeting", "planning"],
      "isPinned": false,
      "linkedCards": [],
      "createdAt": "2026-02-15T10:30:00.000Z",
      "updatedAt": "2026-03-01T14:22:00.000Z"
    }
  ],
  "count": 1,
  "message": "Notes fetched successfully"
}
```

---

### `GET /api/notes/:id`

Fetch a single note by ID.

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | MongoDB ObjectId of the note |

**Example Request:**
```
GET /api/notes/65f1a2b3c4d5e6f7a8b9c0d1
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "title": "Meeting Notes — Q1 Planning",
    "body": "## Agenda\n- Review roadmap\n- Set Q1 goals",
    "tags": ["meeting", "planning"],
    "isPinned": false,
    "linkedCards": ["65f2a3b4c5d6e7f8a9b0c1d2"],
    "createdAt": "2026-02-15T10:30:00.000Z",
    "updatedAt": "2026-03-01T14:22:00.000Z"
  },
  "message": "Note fetched successfully"
}
```

**Error (not found):**
```json
{
  "success": false,
  "error": "Note not found",
  "statusCode": 404
}
```

---

### `POST /api/notes`

Create a new note.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | **Yes** | Note title (max 200 chars) |
| `body` | string | No | Markdown content |
| `tags` | string[] | No | Array of tag strings |
| `isPinned` | boolean | No | Default: `false` |

**Example Request:**
```json
{
  "title": "New Project Ideas",
  "body": "## Ideas\n- Build a CLI tool\n- Write a blog post",
  "tags": ["projects", "ideas"]
}
```

**Example Response** `201 Created`:
```json
{
  "success": true,
  "data": {
    "_id": "65f3c4d5e6f7a8b9c0d1e2f3",
    "title": "New Project Ideas",
    "body": "## Ideas\n- Build a CLI tool\n- Write a blog post",
    "tags": ["projects", "ideas"],
    "isPinned": false,
    "linkedCards": [],
    "createdAt": "2026-03-07T09:00:00.000Z",
    "updatedAt": "2026-03-07T09:00:00.000Z"
  },
  "message": "Note created successfully"
}
```

**Error (missing title):**
```json
{
  "success": false,
  "error": "Title is required",
  "statusCode": 400
}
```

---

### `PATCH /api/notes/:id`

Update a note (partial update — only send fields you want to change).

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | MongoDB ObjectId of the note |

**Request Body (all optional):**

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | New title |
| `body` | string | New markdown body |
| `tags` | string[] | New tags array (replaces existing) |
| `isPinned` | boolean | Toggle pin status |
| `linkedCards` | string[] | Array of Card IDs to link |

**Example Request:**
```json
{
  "body": "## Updated Agenda\n- New item added",
  "tags": ["meeting", "planning", "q1"]
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "title": "Meeting Notes — Q1 Planning",
    "body": "## Updated Agenda\n- New item added",
    "tags": ["meeting", "planning", "q1"],
    "isPinned": false,
    "linkedCards": [],
    "updatedAt": "2026-03-07T10:15:00.000Z"
  },
  "message": "Note updated successfully"
}
```

---

### `DELETE /api/notes/:id`

Permanently delete a note.

**Example Request:**
```
DELETE /api/notes/65f1a2b3c4d5e6f7a8b9c0d1
```

**Response** `204 No Content` (empty body on success)

**Error (not found):**
```json
{
  "success": false,
  "error": "Note not found",
  "statusCode": 404
}
```

---

## 5. Boards Endpoints

### `GET /api/boards`

Fetch all boards.

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "name": "My Work",
      "description": "Daily work tasks",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-03-05T12:00:00.000Z"
    },
    {
      "_id": "65a2b3c4d5e6f7a8b9c0d1e2",
      "name": "Side Projects",
      "description": "",
      "createdAt": "2026-01-15T00:00:00.000Z",
      "updatedAt": "2026-02-20T08:00:00.000Z"
    }
  ],
  "count": 2,
  "message": "Boards fetched successfully"
}
```

---

### `GET /api/boards/:id`

Fetch a single board's metadata only.

**Example Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "name": "My Work",
    "description": "Daily work tasks",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-03-05T12:00:00.000Z"
  },
  "message": "Board fetched successfully"
}
```

---

### `POST /api/boards`

Create a new board. Automatically creates 3 default columns: `To Do`, `In Progress`, `Done`.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | **Yes** | Board name (max 100 chars) |
| `description` | string | No | Short description |

**Example Request:**
```json
{
  "name": "Reading List",
  "description": "Books and articles to read"
}
```

**Example Response** `201 Created`:
```json
{
  "success": true,
  "data": {
    "board": {
      "_id": "65b3c4d5e6f7a8b9c0d1e2f3",
      "name": "Reading List",
      "description": "Books and articles to read",
      "createdAt": "2026-03-07T09:00:00.000Z",
      "updatedAt": "2026-03-07T09:00:00.000Z"
    },
    "columns": [
      { "_id": "65c1...", "name": "To Do",       "order": 0 },
      { "_id": "65c2...", "name": "In Progress",  "order": 1 },
      { "_id": "65c3...", "name": "Done",          "order": 2 }
    ]
  },
  "message": "Board created successfully"
}
```

---

### `PATCH /api/boards/:id`

Update board name or description.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | New board name |
| `description` | string | New description |

---

### `DELETE /api/boards/:id`

Delete a board and all its columns and cards (cascading delete).

**Response** `204 No Content`

> **Warning:** This is irreversible. The controller deletes: Board → all Columns with that boardId → all Cards with that boardId.

---

## 6. Columns Endpoints

### `GET /api/columns?boardId=:boardId`

Fetch all columns for a specific board, sorted by `order`.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `boardId` | string | **Yes** | The board's ObjectId |

**Example Request:**
```
GET /api/columns?boardId=65a1b2c3d4e5f6a7b8c9d0e1
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    { "_id": "65c1...", "boardId": "65a1...", "name": "To Do",       "order": 0 },
    { "_id": "65c2...", "boardId": "65a1...", "name": "In Progress",  "order": 1 },
    { "_id": "65c3...", "boardId": "65a1...", "name": "Done",          "order": 2 }
  ],
  "count": 3,
  "message": "Columns fetched successfully"
}
```

---

### `POST /api/columns`

Add a new column to a board.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `boardId` | string | **Yes** | Parent board ID |
| `name` | string | **Yes** | Column name (max 50 chars) |
| `order` | number | No | Position (defaults to last) |

**Example Request:**
```json
{
  "boardId": "65a1b2c3d4e5f6a7b8c9d0e1",
  "name": "Review"
}
```

---

### `PATCH /api/columns/:id`

Rename a column or reorder it.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | New column name |
| `order` | number | New order position |

---

### `DELETE /api/columns/:id`

Delete a column. **All cards in this column are also deleted.**

**Response** `204 No Content`

---

## 7. Cards Endpoints

### `GET /api/cards?columnId=:columnId`

Fetch all cards for a specific column, sorted by `order`. Excludes archived cards by default.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `columnId` | string | **Yes** | The column's ObjectId |
| `includeArchived` | boolean | No | Include archived cards (default: false) |

---

### `GET /api/cards/:id`

Fetch a single card by ID.

**Example Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65d1e2f3a4b5c6d7e8f9a0b1",
    "columnId": "65c1b2c3d4e5f6a7b8c9d0e1",
    "boardId": "65a1b2c3d4e5f6a7b8c9d0e1",
    "title": "Fix authentication bug",
    "description": "JWT token refresh is failing on mobile Safari. Investigate and patch.",
    "priority": "high",
    "order": 0,
    "linkedNoteId": null,
    "dueDate": null,
    "isArchived": false,
    "createdAt": "2026-03-01T10:00:00.000Z",
    "updatedAt": "2026-03-06T15:30:00.000Z"
  },
  "message": "Card fetched successfully"
}
```

---

### `POST /api/cards`

Create a new card.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `columnId` | string | **Yes** | Parent column ID |
| `boardId` | string | **Yes** | Parent board ID |
| `title` | string | **Yes** | Card title (max 200 chars) |
| `description` | string | No | Card body text |
| `priority` | string | No | `"low"`, `"medium"`, `"high"` (default: `"medium"`) |
| `dueDate` | string | No | ISO 8601 date string |
| `linkedNoteId` | string | No | Note ObjectId to link |

**Example Request:**
```json
{
  "columnId": "65c1b2c3d4e5f6a7b8c9d0e1",
  "boardId": "65a1b2c3d4e5f6a7b8c9d0e1",
  "title": "Write API documentation",
  "priority": "medium"
}
```

**Example Response** `201 Created`:
```json
{
  "success": true,
  "data": {
    "_id": "65e2f3a4b5c6d7e8f9a0b1c2",
    "columnId": "65c1...",
    "boardId": "65a1...",
    "title": "Write API documentation",
    "description": "",
    "priority": "medium",
    "order": 2,
    "linkedNoteId": null,
    "isArchived": false,
    "createdAt": "2026-03-07T09:30:00.000Z",
    "updatedAt": "2026-03-07T09:30:00.000Z"
  },
  "message": "Card created successfully"
}
```

---

### `PATCH /api/cards/:id`

Update a card's fields (title, description, priority, dueDate, linkedNoteId, isArchived).

**Request Body (all optional):**

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | New title |
| `description` | string | New description |
| `priority` | string | `"low"` / `"medium"` / `"high"` |
| `dueDate` | string | ISO date or `null` |
| `linkedNoteId` | string | Note ID or `null` |
| `isArchived` | boolean | Archive/unarchive card |

---

### `PATCH /api/cards/:id/move`

Move a card to a different column or reorder within same column. This is the dedicated endpoint for drag-and-drop operations.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `newColumnId` | string | **Yes** | Target column ID (can be same column for reorder) |
| `newOrder` | number | **Yes** | New position index in target column |

**What the controller does:**
1. Update the card's `columnId` to `newColumnId`
2. Update the card's `order` to `newOrder`
3. Re-index the `order` of all other cards in the source column (fill gap)
4. Re-index the `order` of all other cards in the destination column (shift down)

**Example Request:**
```json
{
  "newColumnId": "65c2b3c4d5e6f7a8b9c0d1e2",
  "newOrder": 0
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65d1e2f3...",
    "columnId": "65c2b3c4...",
    "order": 0,
    "updatedAt": "2026-03-07T10:00:00.000Z"
  },
  "message": "Card moved successfully"
}
```

---

### `DELETE /api/cards/:id`

Permanently delete a card.

**Response** `204 No Content`

---

## 8. Composite Endpoints

### `GET /api/boards/:id/full`

**Recommended for loading a board view.** Returns board metadata, all columns, and all cards in a single request — avoids multiple waterfall API calls from the frontend.

**Example Response:**
```json
{
  "success": true,
  "data": {
    "board": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "name": "My Work",
      "description": "Daily work tasks"
    },
    "columns": [
      {
        "_id": "65c1b2c3d4e5f6a7b8c9d0e1",
        "name": "To Do",
        "order": 0,
        "cards": [
          {
            "_id": "65d1e2f3a4b5c6d7e8f9a0b1",
            "title": "Fix authentication bug",
            "priority": "high",
            "order": 0,
            "linkedNoteId": null
          },
          {
            "_id": "65d2e3f4a5b6c7d8e9f0a1b2",
            "title": "Add search feature",
            "priority": "medium",
            "order": 1,
            "linkedNoteId": null
          }
        ]
      },
      {
        "_id": "65c2b3c4d5e6f7a8b9c0d1e2",
        "name": "In Progress",
        "order": 1,
        "cards": [
          {
            "_id": "65d3e4f5a6b7c8d9e0f1a2b3",
            "title": "Write API docs",
            "priority": "medium",
            "order": 0,
            "linkedNoteId": "65f1a2b3c4d5e6f7a8b9c0d1"
          }
        ]
      },
      {
        "_id": "65c3b4c5d6e7f8a9b0c1d2e3",
        "name": "Done",
        "order": 2,
        "cards": []
      }
    ]
  },
  "message": "Board loaded successfully"
}
```

**Implementation note:** The controller runs:
```javascript
const board   = await Board.findById(id);
const columns = await Column.find({ boardId: id }).sort({ order: 1 });
const cards   = await Card.find({ boardId: id, isArchived: false }).sort({ order: 1 });

// Group cards into their columns
const columnsWithCards = columns.map(col => ({
  ...col.toObject(),
  cards: cards.filter(c => c.columnId.toString() === col._id.toString())
}));
```

---

## Appendix: Quick Reference Table

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notes` | GET | Get all notes |
| `/api/notes/:id` | GET | Get one note |
| `/api/notes` | POST | Create note |
| `/api/notes/:id` | PATCH | Update note |
| `/api/notes/:id` | DELETE | Delete note |
| `/api/boards` | GET | Get all boards |
| `/api/boards/:id` | GET | Get one board |
| `/api/boards/:id/full` | GET | Get board + columns + cards |
| `/api/boards` | POST | Create board |
| `/api/boards/:id` | PATCH | Update board |
| `/api/boards/:id` | DELETE | Delete board (cascade) |
| `/api/columns?boardId=` | GET | Get columns for board |
| `/api/columns` | POST | Create column |
| `/api/columns/:id` | PATCH | Update column |
| `/api/columns/:id` | DELETE | Delete column (cascade) |
| `/api/cards?columnId=` | GET | Get cards for column |
| `/api/cards/:id` | GET | Get one card |
| `/api/cards` | POST | Create card |
| `/api/cards/:id` | PATCH | Update card |
| `/api/cards/:id/move` | PATCH | Move card (D&D) |
| `/api/cards/:id` | DELETE | Delete card |

---

*End of API Documentation v1.0.0*
