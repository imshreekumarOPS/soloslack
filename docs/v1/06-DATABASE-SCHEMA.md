# Database Schema Reference
## Notes + Kanban Hybrid (Notban) — MongoDB

**Version:** 1.0.0  
**Date:** 2026-03-07  
**Database:** `notban_db`  
**ODM:** Mongoose  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Collections](#2-collections)
3. [Entity Relationship Diagram](#3-entity-relationship-diagram)
4. [Schema Definitions](#4-schema-definitions)
5. [Indexes](#5-indexes)
6. [Data Examples](#6-data-examples)
7. [Query Patterns](#7-query-patterns)
8. [Migration Notes](#8-migration-notes)

---

## 1. Overview

Notban uses **4 MongoDB collections** in a single database.

| Collection | Documents | Purpose |
|-----------|-----------|---------|
| `notes` | Notes content | Free-form notes with markdown body |
| `boards` | Kanban boards | Board metadata only |
| `columns` | Kanban columns | Columns belonging to a board |
| `cards` | Kanban cards | Cards belonging to a column |

MongoDB is a document database — relationships are handled via stored ObjectId references (manual joins in application code), not foreign key constraints.

---

## 2. Collections

### Naming Conventions

- Collection names: **lowercase plural** (`notes`, `boards`, `columns`, `cards`)
- Field names: **camelCase** (`createdAt`, `linkedNoteId`, `isArchived`)
- IDs: MongoDB auto-generated `ObjectId` (stored as `_id`)
- Timestamps: `createdAt` and `updatedAt` auto-managed by Mongoose `timestamps: true`

---

## 3. Entity Relationship Diagram

```
┌───────────────────────────┐
│          boards           │
│  _id      ObjectId  PK    │
│  name     String          │
│  description String       │
│  createdAt Date           │
│  updatedAt Date           │
└─────────────┬─────────────┘
              │ 1
              │ has many
              │ ∞
┌─────────────▼─────────────┐
│          columns          │
│  _id      ObjectId  PK    │
│  boardId  ObjectId  FK ───┤── boards._id
│  name     String          │
│  order    Number          │
│  createdAt Date           │
│  updatedAt Date           │
└─────────────┬─────────────┘
              │ 1
              │ has many
              │ ∞
┌─────────────▼─────────────┐       ┌───────────────────────────┐
│           cards           │       │          notes            │
│  _id         ObjectId  PK │       │  _id      ObjectId  PK    │
│  columnId    ObjectId  FK ┤── ──► │  title    String          │
│  boardId     ObjectId  FK ┤       │  body     String          │
│  title       String       │       │  tags     [String]        │
│  description String       │       │  isPinned Boolean         │
│  priority    String       │       │  linkedCards [ObjectId] ──┤── cards._id
│  order       Number       │       │  createdAt Date           │
│  linkedNoteId ObjectId FK ┼──────►│  updatedAt Date           │
│  dueDate     Date         │       └───────────────────────────┘
│  isArchived  Boolean      │
│  createdAt   Date         │
│  updatedAt   Date         │
└───────────────────────────┘

Relationships:
  Board   →[1:many]→  Column      (via Column.boardId)
  Column  →[1:many]→  Card        (via Card.columnId)
  Board   →[1:many]→  Card        (via Card.boardId — denormalized)
  Card    →[0:1]→     Note        (via Card.linkedNoteId — optional)
  Note    →[0:many]→  Card        (via Note.linkedCards[] — optional, bidirectional)
```

**Note on bidirectional linking:** The Note↔Card link is stored in both directions:
- `Card.linkedNoteId` — one optional note per card
- `Note.linkedCards[]` — array of card IDs on the note side

This is intentionally denormalized for easy lookup from either side. The application must keep these in sync when linking/unlinking.

---

## 4. Schema Definitions

### 4.1 Note Schema

```javascript
const noteSchema = new mongoose.Schema(
  {
    // Required: The display title of the note
    title: {
      type:      String,
      required:  [true, 'Note title is required'],
      trim:      true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    // The main content — stored as raw Markdown string
    // Frontend renders this with react-markdown
    body: {
      type:    String,
      default: '',
    },

    // Optional array of label strings (e.g. ["meeting", "q1", "work"])
    // Not normalized — just strings
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      }
    ],

    // Whether this note appears at the top of the notes list
    isPinned: {
      type:    Boolean,
      default: false,
    },

    // Array of Card ObjectIds that this note is linked to
    // Bidirectional with Card.linkedNoteId
    linkedCards: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'Card',
      }
    ],
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);
```

**Field Summary:**

| Field | Type | Required | Default | Constraint |
|-------|------|----------|---------|------------|
| `_id` | ObjectId | Auto | Auto | PK |
| `title` | String | Yes | — | max 200 chars |
| `body` | String | No | `""` | — |
| `tags` | String[] | No | `[]` | each max 50 chars |
| `isPinned` | Boolean | No | `false` | — |
| `linkedCards` | ObjectId[] | No | `[]` | refs Card |
| `createdAt` | Date | Auto | Auto | — |
| `updatedAt` | Date | Auto | Auto | — |

---

### 4.2 Board Schema

```javascript
const boardSchema = new mongoose.Schema(
  {
    // The display name of the board
    name: {
      type:      String,
      required:  [true, 'Board name is required'],
      trim:      true,
      maxlength: [100, 'Board name cannot exceed 100 characters'],
    },

    // Optional short description shown in board cards on the dashboard
    description: {
      type:      String,
      default:   '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);
```

**Field Summary:**

| Field | Type | Required | Default | Constraint |
|-------|------|----------|---------|------------|
| `_id` | ObjectId | Auto | Auto | PK |
| `name` | String | Yes | — | max 100 chars |
| `description` | String | No | `""` | max 500 chars |
| `createdAt` | Date | Auto | Auto | — |
| `updatedAt` | Date | Auto | Auto | — |

---

### 4.3 Column Schema

```javascript
const columnSchema = new mongoose.Schema(
  {
    // Which board this column belongs to
    boardId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Board',
      required: [true, 'boardId is required'],
    },

    // Display name (e.g. "To Do", "In Progress", "Done")
    name: {
      type:      String,
      required:  [true, 'Column name is required'],
      trim:      true,
      maxlength: [50, 'Column name cannot exceed 50 characters'],
    },

    // Determines left-to-right display order of columns in the board
    // 0-indexed integer. Lower number = further left.
    order: {
      type:    Number,
      required: true,
      default:  0,
      min:      0,
    },
  },
  { timestamps: true }
);
```

**Field Summary:**

| Field | Type | Required | Default | Constraint |
|-------|------|----------|---------|------------|
| `_id` | ObjectId | Auto | Auto | PK |
| `boardId` | ObjectId | Yes | — | FK → boards |
| `name` | String | Yes | — | max 50 chars |
| `order` | Number | Yes | `0` | ≥ 0 |
| `createdAt` | Date | Auto | Auto | — |
| `updatedAt` | Date | Auto | Auto | — |

---

### 4.4 Card Schema

```javascript
const cardSchema = new mongoose.Schema(
  {
    // Which column this card currently lives in
    columnId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Column',
      required: [true, 'columnId is required'],
    },

    // Denormalized boardId — stored here to allow efficient board-level queries
    // (e.g. "get all cards for a board" without joining through columns)
    boardId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Board',
      required: [true, 'boardId is required'],
    },

    // Display title of the card
    title: {
      type:      String,
      required:  [true, 'Card title is required'],
      trim:      true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    // Optional longer description (plain text or light markdown)
    description: {
      type:      String,
      default:   '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    // Visual priority indicator — drives badge color in UI
    priority: {
      type:    String,
      enum:    {
        values:  ['low', 'medium', 'high'],
        message: 'Priority must be low, medium, or high',
      },
      default: 'medium',
    },

    // Controls vertical position of this card within its column
    // 0-indexed integer. Lower = closer to top.
    order: {
      type:    Number,
      required: true,
      default:  0,
      min:      0,
    },

    // Optional one-to-one link to a Note document
    linkedNoteId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Note',
      default: null,
    },

    // Optional deadline date
    dueDate: {
      type:    Date,
      default: null,
    },

    // Soft-delete flag. Archived cards are hidden by default but not removed.
    isArchived: {
      type:    Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
```

**Field Summary:**

| Field | Type | Required | Default | Constraint |
|-------|------|----------|---------|------------|
| `_id` | ObjectId | Auto | Auto | PK |
| `columnId` | ObjectId | Yes | — | FK → columns |
| `boardId` | ObjectId | Yes | — | FK → boards |
| `title` | String | Yes | — | max 200 chars |
| `description` | String | No | `""` | max 2000 chars |
| `priority` | String | No | `"medium"` | enum: low/medium/high |
| `order` | Number | Yes | `0` | ≥ 0 |
| `linkedNoteId` | ObjectId | No | `null` | FK → notes |
| `dueDate` | Date | No | `null` | — |
| `isArchived` | Boolean | No | `false` | — |
| `createdAt` | Date | Auto | Auto | — |
| `updatedAt` | Date | Auto | Auto | — |

---

## 5. Indexes

```javascript
// ─── notes ───────────────────────────────────────────────────
// Text index for title search (supports $text queries)
noteSchema.index({ title: 'text' });

// Sort by most recently updated (notes list default sort)
noteSchema.index({ updatedAt: -1 });

// ─── columns ─────────────────────────────────────────────────
// Compound: fetch all columns for a board, sorted by order
columnSchema.index({ boardId: 1, order: 1 });

// ─── cards ───────────────────────────────────────────────────
// Compound: fetch all cards in a column, sorted by order
cardSchema.index({ columnId: 1, order: 1 });

// Fetch all cards across a board (for /boards/:id/full endpoint)
cardSchema.index({ boardId: 1 });

// Fetch non-archived cards (common filter)
cardSchema.index({ boardId: 1, isArchived: 1 });
```

---

## 6. Data Examples

### Example Note Document

```json
{
  "_id": { "$oid": "65f1a2b3c4d5e6f7a8b9c0d1" },
  "title": "Meeting Notes — Q1 Planning",
  "body": "## Agenda\n\n- Review Q1 roadmap\n- Set team goals\n- Assign owners\n\n## Notes\n\nDecided to focus on the **API redesign** as the top priority.",
  "tags": ["meeting", "planning", "q1"],
  "isPinned": false,
  "linkedCards": [
    { "$oid": "65d1e2f3a4b5c6d7e8f9a0b1" }
  ],
  "createdAt": { "$date": "2026-02-15T10:30:00.000Z" },
  "updatedAt": { "$date": "2026-03-01T14:22:00.000Z" }
}
```

### Example Board Document

```json
{
  "_id": { "$oid": "65a1b2c3d4e5f6a7b8c9d0e1" },
  "name": "My Work",
  "description": "Daily dev tasks",
  "createdAt": { "$date": "2026-01-01T00:00:00.000Z" },
  "updatedAt": { "$date": "2026-03-05T12:00:00.000Z" }
}
```

### Example Column Document

```json
{
  "_id": { "$oid": "65c1b2c3d4e5f6a7b8c9d0e1" },
  "boardId": { "$oid": "65a1b2c3d4e5f6a7b8c9d0e1" },
  "name": "To Do",
  "order": 0,
  "createdAt": { "$date": "2026-01-01T00:00:00.000Z" },
  "updatedAt": { "$date": "2026-01-01T00:00:00.000Z" }
}
```

### Example Card Document

```json
{
  "_id": { "$oid": "65d1e2f3a4b5c6d7e8f9a0b1" },
  "columnId": { "$oid": "65c1b2c3d4e5f6a7b8c9d0e1" },
  "boardId": { "$oid": "65a1b2c3d4e5f6a7b8c9d0e1" },
  "title": "Fix authentication bug",
  "description": "JWT token refresh is failing on mobile Safari. Investigate and patch.",
  "priority": "high",
  "order": 0,
  "linkedNoteId": { "$oid": "65f1a2b3c4d5e6f7a8b9c0d1" },
  "dueDate": null,
  "isArchived": false,
  "createdAt": { "$date": "2026-03-01T10:00:00.000Z" },
  "updatedAt": { "$date": "2026-03-06T15:30:00.000Z" }
}
```

---

## 7. Query Patterns

### Get all notes sorted by most recently updated

```javascript
await Note.find({})
  .sort({ isPinned: -1, updatedAt: -1 })
  .select('title body tags isPinned updatedAt')
  .lean();
```

### Search notes by title

```javascript
await Note.find({ $text: { $search: searchTerm } })
  .sort({ score: { $meta: 'textScore' } })
  .lean();
```

### Get all columns for a board, sorted by order

```javascript
await Column.find({ boardId: boardId })
  .sort({ order: 1 })
  .lean();
```

### Get all active cards for a board

```javascript
await Card.find({ boardId: boardId, isArchived: false })
  .sort({ columnId: 1, order: 1 })
  .lean();
```

### Load full board (board + columns + cards) efficiently

```javascript
const [board, columns, cards] = await Promise.all([
  Board.findById(boardId).lean(),
  Column.find({ boardId }).sort({ order: 1 }).lean(),
  Card.find({ boardId, isArchived: false }).sort({ order: 1 }).lean(),
]);
```

### Re-index card orders after a move

```javascript
// After moving a card, normalize orders in affected column
const cardsInColumn = await Card.find({ columnId, isArchived: false })
  .sort({ order: 1 });

const bulkOps = cardsInColumn.map((card, index) => ({
  updateOne: {
    filter: { _id: card._id },
    update: { $set: { order: index } },
  }
}));

await Card.bulkWrite(bulkOps);
```

### Cascade delete board (board → columns → cards)

```javascript
await Card.deleteMany({ boardId });
await Column.deleteMany({ boardId });
await Board.findByIdAndDelete(boardId);
```

---

## 8. Migration Notes

Since this is an MVP for personal use, formal migrations are not needed. However, if the schema changes:

**Approach for schema changes:**
1. Make schema changes in the Mongoose model file
2. Mongoose will silently ignore unknown fields on existing documents
3. New required fields with defaults will use the default on old documents
4. For breaking changes: write a one-time migration script using the MongoDB Node.js driver

**Example one-time migration script** (run manually):

```javascript
// scripts/migrate-add-isPinned.js
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);

  const result = await mongoose.connection.db
    .collection('notes')
    .updateMany(
      { isPinned: { $exists: false } },
      { $set: { isPinned: false } }
    );

  console.log(`Migrated ${result.modifiedCount} notes`);
  await mongoose.disconnect();
}

migrate();
```

---

*End of Database Schema Reference v1.0.0*
