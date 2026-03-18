# Design Documentation
## Notes + Kanban Hybrid (Notban) — MVP

**Version:** 1.0.0  
**Date:** 2026-03-07  
**Type:** UI/UX Design Specification  

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Design Tokens](#2-design-tokens)
3. [Typography](#3-typography)
4. [Color System](#4-color-system)
5. [Spacing & Layout Grid](#5-spacing--layout-grid)
6. [Component Specifications](#6-component-specifications)
7. [Page Layouts](#7-page-layouts)
8. [Interaction Patterns](#8-interaction-patterns)
9. [Responsive Behavior](#9-responsive-behavior)
10. [Accessibility Guidelines](#10-accessibility-guidelines)

---

## 1. Design Philosophy

### Core Principles

**1. Minimal surface area** — Every element on screen should earn its place. If it doesn't directly help the user capture a thought or manage a task, it's removed.

**2. Keyboard-first thinking** — The app should feel fast to use without reaching for the mouse. Common actions (new note, new card) should have obvious keyboard shortcuts.

**3. Content is the hero** — The note body, the Kanban board — these are the main characters. UI chrome (navigation, buttons, labels) should recede into the background.

**4. No visual noise** — Avoid gradients, shadows, animations that don't carry meaning. Flat, clean, and direct.

**5. Dark by default** — Developer audience; dark mode is the primary experience. Light mode is available as a toggle.

### Visual Tone

- **Clean and focused** — whitespace is generous
- **Monochromatic with one accent** — neutral grays + single primary accent color
- **Dense enough to be productive** — not so sparse that it wastes screen space
- **Inspired by:** Linear, Obsidian, Raycast

---

## 2. Design Tokens

Design tokens are the single source of truth for all visual decisions. In Tailwind, these map to `tailwind.config.js`.

```javascript
// tailwind.config.js — extend section
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Base surfaces (dark mode)
        'surface-base':   '#0f0f0f',  // App background
        'surface-raised': '#1a1a1a',  // Sidebar, panels
        'surface-overlay':'#232323',  // Cards, inputs
        'surface-hover':  '#2a2a2a',  // Hover states
        'surface-active': '#333333',  // Active/pressed

        // Borders
        'border-subtle':  '#2a2a2a',  // Faint dividers
        'border-default': '#3a3a3a',  // Standard borders
        'border-strong':  '#555555',  // Emphasized borders

        // Text
        'text-primary':   '#f0f0f0',  // Main readable text
        'text-secondary': '#9a9a9a',  // Subdued text (timestamps, labels)
        'text-muted':     '#5a5a5a',  // Placeholder, disabled
        'text-inverse':   '#0f0f0f',  // Text on light backgrounds

        // Accent (Primary)
        'accent':         '#6366f1',  // Indigo — primary CTAs, active states
        'accent-hover':   '#4f52d1',
        'accent-subtle':  '#1e1f4a',  // Accent-tinted background

        // Priority colors
        'priority-low':    '#22c55e', // Green
        'priority-medium': '#f59e0b', // Amber
        'priority-high':   '#ef4444', // Red

        // Semantic
        'success': '#22c55e',
        'warning': '#f59e0b',
        'error':   '#ef4444',
        'info':    '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'xs':   ['11px', { lineHeight: '16px' }],
        'sm':   ['13px', { lineHeight: '20px' }],
        'base': ['14px', { lineHeight: '22px' }],
        'md':   ['15px', { lineHeight: '24px' }],
        'lg':   ['18px', { lineHeight: '28px' }],
        'xl':   ['22px', { lineHeight: '32px' }],
        '2xl':  ['28px', { lineHeight: '36px' }],
      },
      borderRadius: {
        'sm':  '4px',
        'md':  '6px',
        'lg':  '8px',
        'xl':  '12px',
        'full': '9999px',
      },
      spacing: {
        // Custom spacing scale
        '0.5': '2px',
        '1':   '4px',
        '1.5': '6px',
        '2':   '8px',
        '3':   '12px',
        '4':   '16px',
        '5':   '20px',
        '6':   '24px',
        '8':   '32px',
        '10':  '40px',
        '12':  '48px',
        '16':  '64px',
      }
    }
  }
}
```

---

## 3. Typography

### Font Choices

| Role | Font | Fallback |
|------|------|---------|
| UI / Body | Inter | system-ui, sans-serif |
| Code blocks in notes | JetBrains Mono | Fira Code, monospace |

### Type Scale

| Name | Size | Line Height | Weight | Use Case |
|------|------|-------------|--------|----------|
| `text-xs` | 11px | 16px | 400 | Timestamps, meta labels |
| `text-sm` | 13px | 20px | 400 | Secondary text, sidebar items |
| `text-base` | 14px | 22px | 400 | Body text, card descriptions |
| `text-md` | 15px | 24px | 500 | Note body (comfortable reading) |
| `text-lg` | 18px | 28px | 600 | Section headings, board names |
| `text-xl` | 22px | 32px | 700 | Page titles, note titles |
| `text-2xl` | 28px | 36px | 700 | Large headings (sparingly) |

### Markdown Typography (Note body)

When rendering Markdown in notes, use these styles:

```
h1 → text-xl, font-bold, text-text-primary, mb-4, mt-6
h2 → text-lg, font-semibold, text-text-primary, mb-3, mt-5
h3 → text-md, font-semibold, text-text-primary, mb-2, mt-4
p  → text-md, text-text-primary, mb-3, leading-relaxed
code (inline) → font-mono, text-sm, bg-surface-hover, px-1 rounded
pre (block) → font-mono, text-sm, bg-surface-overlay, p-4 rounded-lg, overflow-x-auto
ul → list-disc, pl-6, mb-3, text-md
ol → list-decimal, pl-6, mb-3, text-md
blockquote → border-l-2 border-accent, pl-4, italic, text-text-secondary
hr → border-border-subtle, my-6
a → text-accent, underline hover:text-accent-hover
```

---

## 4. Color System

### Dark Mode Palette (Primary)

```
Background layers (dark to light):
┌─────────────────────────────────────────────────────────┐
│  surface-base    #0f0f0f  ← App root background         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  surface-raised  #1a1a1a  ← Sidebar, panels       │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  surface-overlay  #232323  ← Cards, inputs  │  │  │
│  │  │  ┌───────────────────────────────────────┐  │  │  │
│  │  │  │  surface-hover  #2a2a2a  ← On hover   │  │  │  │
│  │  │  └───────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Priority Color Usage

```
● Low    #22c55e (green)  — calm, not urgent
● Medium #f59e0b (amber)  — needs attention
● High   #ef4444 (red)    — urgent
```

Priority badges use a dot + text pattern:
```
[●  Low]   [●  Medium]   [●  High]
 green       amber         red
```

### Accent Color Usage

The accent color (`#6366f1` — indigo) is used **sparingly** for:
- Active navigation items (left sidebar highlight)
- Primary CTA buttons ("New Note", "New Board", "Add Card")
- Focus rings on inputs
- Active/selected state on cards/notes
- Progress indicators

**Never use accent for:** borders, backgrounds of large areas, text body.

---

## 5. Spacing & Layout Grid

### App Shell Layout

```
┌──────────────────────────────────────────────────────────────┐
│  APP WINDOW (full viewport)                                  │
│                                                              │
│  ┌──────────┐  ┌────────────────────────────────────────┐   │
│  │          │  │                                        │   │
│  │ SIDEBAR  │  │          MAIN CONTENT AREA             │   │
│  │          │  │                                        │   │
│  │ 240px    │  │          flex-1 (fills remaining)      │   │
│  │ fixed    │  │                                        │   │
│  │          │  │                                        │   │
│  └──────────┘  └────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Sidebar:** `w-60` (240px), fixed height `h-screen`, overflow-y scroll  
**Main area:** `flex-1`, `min-w-0`, `overflow-auto`

### Notes Layout (Split Pane)

```
MAIN CONTENT AREA
┌────────────────────┬────────────────────────────────────────┐
│                    │                                        │
│   NOTES LIST       │       NOTE EDITOR                      │
│                    │                                        │
│   w-72 (288px)     │       flex-1                           │
│   border-r         │                                        │
│   overflow-y-auto  │       padding: p-8                     │
│                    │                                        │
└────────────────────┴────────────────────────────────────────┘
```

### Kanban Layout (Horizontal scroll)

```
MAIN CONTENT AREA
┌────────────────────────────────────────────────────────────┐
│  BOARD HEADER (board name, actions)    h-14                │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌──────────┐  │
│  │           │ │           │ │           │ │  + Add   │  │
│  │ COLUMN 1  │ │ COLUMN 2  │ │ COLUMN 3  │ │ Column   │  │
│  │ w-72      │ │ w-72      │ │ w-72      │ │          │  │
│  │           │ │           │ │           │ └──────────┘  │
│  │ [card]    │ │ [card]    │ │ [card]    │               │
│  │ [card]    │ │ [card]    │ │           │               │
│  └───────────┘ └───────────┘ └───────────┘               │
│                                                            │
│  overflow-x: auto  (horizontal scroll)                     │
└────────────────────────────────────────────────────────────┘
```

Column width: `w-72` (288px)  
Column gap: `gap-4` (16px)  
Board padding: `p-6`

---

## 6. Component Specifications

### 6.1 Sidebar

```
┌──────────────────────────┐
│  📋 Notban          [⚙]  │  ← App name + settings icon
├──────────────────────────┤
│                          │
│  ⊞  Dashboard            │  ← Nav item (inactive)
│  📝  Notes               │  ← Nav item (active — accent bg)
│  ■   Boards              │  ← Nav item (inactive)
│                          │
├──────────────────────────┤
│  BOARDS                  │  ← Section label (xs, muted)
│                          │
│    · My Work             │  ← Board list item
│    · Side Projects       │
│    · Reading List        │
│  + New Board             │  ← Action button
│                          │
└──────────────────────────┘
```

**Specs:**
- Width: `w-60`
- Background: `bg-surface-raised`
- Right border: `border-r border-border-subtle`
- Nav item height: `h-9` with `px-3 py-2`
- Nav item hover: `bg-surface-hover`
- Active item: `bg-accent-subtle text-accent font-medium`
- Section label: `text-xs text-text-muted uppercase tracking-widest px-3 mt-4 mb-1`
- Board list items: `text-sm text-text-secondary` with left indentation `pl-6`

### 6.2 Note List Item

```
┌──────────────────────────────────────┐
│  Meeting Notes — Q1 Planning         │  ← Title (text-sm, font-medium)
│  Discussed roadmap items and...      │  ← Body preview (text-xs, muted, 2 lines)
│  2 hours ago                         │  ← Timestamp (text-xs, muted)
└──────────────────────────────────────┘
```

**Specs:**
- Height: auto (min `h-16`)
- Padding: `px-3 py-3`
- Border bottom: `border-b border-border-subtle`
- Hover: `bg-surface-hover`
- Active/selected: `bg-accent-subtle border-l-2 border-accent`
- Title: `text-sm font-medium text-text-primary truncate`
- Preview: `text-xs text-text-muted line-clamp-2`
- Timestamp: `text-xs text-text-muted mt-1`

### 6.3 Kanban Card

```
┌──────────────────────────────────────┐
│  ● High                              │  ← Priority badge (optional)
│                                      │
│  Fix authentication bug              │  ← Card title
│                                      │
│  Update the JWT token refresh...     │  ← Description preview (optional)
│                                      │
│  📄  Linked note              Apr 2  │  ← Metadata row
└──────────────────────────────────────┘
```

**Specs:**
- Width: inherits column width (`w-full`)
- Background: `bg-surface-overlay`
- Border: `border border-border-subtle`
- Border radius: `rounded-lg`
- Padding: `p-3`
- Shadow: none (flat design)
- Hover: `border-border-strong bg-surface-hover cursor-pointer`
- Dragging: `opacity-50 rotate-1 shadow-lg scale-105`
- Title: `text-sm font-medium text-text-primary`
- Description preview: `text-xs text-text-muted mt-1 line-clamp-2`
- Metadata row: `flex items-center justify-between mt-2`

### 6.4 Priority Badge

```
[● Low]  [● Medium]  [● High]
```

**Specs:**
- Container: `inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5`
- Dot: `w-1.5 h-1.5 rounded-full`

```
Low:    bg-green-500/10 text-green-400  dot: bg-green-500
Medium: bg-amber-500/10 text-amber-400  dot: bg-amber-500
High:   bg-red-500/10   text-red-400    dot: bg-red-500
```

### 6.5 Button Variants

**Primary (filled)**
```
bg-accent hover:bg-accent-hover text-white
text-sm font-medium rounded-md px-3 py-1.5
```

**Secondary (outlined)**
```
border border-border-default hover:bg-surface-hover text-text-primary
text-sm font-medium rounded-md px-3 py-1.5
```

**Ghost (no border)**
```
hover:bg-surface-hover text-text-secondary hover:text-text-primary
text-sm rounded-md px-3 py-1.5
```

**Danger (destructive)**
```
bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30
text-sm font-medium rounded-md px-3 py-1.5
```

**Icon button**
```
hover:bg-surface-hover text-text-secondary hover:text-text-primary
p-1.5 rounded-md
```

### 6.6 Input / Textarea

```
bg-surface-overlay border border-border-default
hover:border-border-strong
focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30
text-sm text-text-primary placeholder:text-text-muted
rounded-md px-3 py-2
```

### 6.7 Modal

```
┌──────────────────────────────────────────────────────────────┐
│  Overlay: bg-black/60 backdrop-blur-sm fixed inset-0         │
│                                                              │
│           ┌────────────────────────────────────┐            │
│           │  Modal                     [✕]      │            │
│           │  bg-surface-raised                  │            │
│           │  border border-border-default       │            │
│           │  rounded-xl p-6                     │            │
│           │  max-w-lg w-full                    │            │
│           │  shadow-2xl                         │            │
│           │                                     │            │
│           │  [Content]                          │            │
│           │                                     │            │
│           │  [Cancel]   [Confirm]               │            │
│           └────────────────────────────────────┘            │
└──────────────────────────────────────────────────────────────┘
```

### 6.8 Column Header

```
┌──────────────────────────┐
│  To Do  (4)      [···]   │
└──────────────────────────┘
```

**Specs:**
- Height: `h-10`
- Layout: `flex items-center justify-between px-2 mb-3`
- Name: `text-sm font-semibold text-text-secondary`
- Count: `text-xs text-text-muted bg-surface-overlay rounded-full px-1.5 py-0.5 ml-2`
- Menu icon: icon button (appears on hover)

---

## 7. Page Layouts

### 7.1 Dashboard Page (`/`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Good morning ☀️                          Saturday, Mar 7, 2026  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  RECENT NOTES                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │              │ │              │ │              │            │
│  │  Note card   │ │  Note card   │ │  Note card   │            │
│  │              │ │              │ │              │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│                                                    View all →   │
│                                                                 │
│  YOUR BOARDS                                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │  My Work     │ │ Side Projects│ │  + New Board │            │
│  │  3 cols      │ │  2 cols      │ │              │            │
│  │  12 cards    │ │   5 cards    │ │              │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Notes Page (`/notes`)

```
┌──────────────────────┬───────────────────────────────────────┐
│  Notes          [+]  │                                       │
│  ──────────────────  │  Select a note or create a new one   │
│  [🔍 Search...]      │                                       │
│  ──────────────────  │  (Empty state illustration)           │
│                      │                                       │
│  · Meeting Notes     │                                       │
│  · Project Ideas     │                                       │
│  · Reading List      │                                       │
│  · ...               │                                       │
│                      │                                       │
└──────────────────────┴───────────────────────────────────────┘

(when note selected)

┌──────────────────────┬───────────────────────────────────────┐
│  Notes          [+]  │  Meeting Notes — Q1          [⋯] [🗑] │
│  ──────────────────  │  ───────────────────────────────────  │
│  [🔍 Search...]      │  Updated 2 hours ago                  │
│  ──────────────────  │                                       │
│                      │  [Note title — editable inline]       │
│ ▶ Meeting Notes      │                                       │
│  · Project Ideas     │  [Markdown body — full editor]        │
│  · Reading List      │  Write in markdown...                 │
│                      │                                       │
│                      │  ─────────────────────────────────    │
│                      │  Linked cards: [Card chip] [+]        │
└──────────────────────┴───────────────────────────────────────┘
```

### 7.3 Board Page (`/boards/[id]`)

```
┌────────────────────────────────────────────────────────────────┐
│  My Work Board                              [+ Add Column]     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ To Do   (3)  │  │ In Progress  │  │   Done  (5)  │         │
│  │──────────────│  │──────────────│  │──────────────│         │
│  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │         │
│  │ │● High    │ │  │ │● Medium  │ │  │ │          │ │         │
│  │ │Fix auth  │ │  │ │Write docs│ │  │ │Setup CI  │ │         │
│  │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │         │
│  │ ┌──────────┐ │  │              │  │ ┌──────────┐ │         │
│  │ │Add search│ │  │              │  │ │Deploy v1 │ │         │
│  │ └──────────┘ │  │              │  │ └──────────┘ │         │
│  │              │  │              │  │              │         │
│  │  [+ Add card]│  │  [+ Add card]│  │  [+ Add card]│         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 8. Interaction Patterns

### 8.1 Note Auto-Save

```
User types
    ↓
onChange fires → setBody(value)
    ↓
debounce 1500ms starts
    ↓ (user keeps typing — timer resets)
    ↓ (user stops — 1500ms passes)
API PATCH /notes/:id
    ↓
Status indicator: "Saving..." → "Saved ✓"
    ↓ (fades out after 2 seconds)
```

Visual indicator: small text in top-right of note editor area
- `text-xs text-text-muted` — "Saving..." with subtle animation
- `text-xs text-success` — "Saved" fades after 2s

### 8.2 Adding a Card (Inline)

Clicking "+ Add card" at the bottom of a column reveals an inline input:

```
┌──────────────────────────────┐
│  [Card title input...]       │
│  [Add]  [Cancel]             │
└──────────────────────────────┘
```

Pressing `Enter` submits. Pressing `Escape` cancels.

### 8.3 Drag and Drop Cards

- Library: `@dnd-kit/core` + `@dnd-kit/sortable`
- Drag handle: entire card is draggable
- While dragging: card shows semi-transparent ghost; source position shows placeholder
- Drop target: column highlights with `border-accent bg-accent-subtle/5`
- Animation: 150ms ease transition on drop

### 8.4 Delete Confirmation

Before deleting a note or board, show a confirmation dialog:

```
┌────────────────────────────────────────┐
│  Delete Note?                    [✕]   │
│                                        │
│  "Meeting Notes — Q1 Planning" will    │
│  be permanently deleted.               │
│                                        │
│  [Cancel]          [Delete]            │
└────────────────────────────────────────┘
```

- Cancel: `ghost` button
- Delete: `danger` button

### 8.5 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | New Note (on Notes page) |
| `Ctrl/Cmd + K` | Quick command palette (future) |
| `Escape` | Close modal / cancel inline edit |
| `Enter` | Submit inline card input |
| `/` | Focus search (on Notes page) |

---

## 9. Responsive Behavior

The app is **desktop-first** but should not break on smaller screens.

### Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| `sm` | 640px | — |
| `md` | 768px | Sidebar collapses to icon-only bar |
| `lg` | 1024px | Full sidebar visible |
| `xl` | 1280px | Notes split view comfortable |

### Mobile / Tablet Behavior

- **< 768px (md):** Sidebar becomes a bottom nav or hamburger menu. Notes list and editor stack vertically (full width each, tab-switch between them). Kanban board scrolls horizontally.
- **768–1024px:** Sidebar is narrower (icon + label). Split panes are compressed.
- **> 1024px:** Full layout as designed.

> Note: MVP focus is desktop. Mobile is functional but not polished.

---

## 10. Accessibility Guidelines

| Guideline | Implementation |
|-----------|---------------|
| Color contrast | All text meets WCAG AA (4.5:1 minimum) |
| Focus indicators | `focus:ring-2 focus:ring-accent` on all interactive elements |
| Keyboard navigation | All actions reachable via keyboard |
| Screen reader | `aria-label` on icon-only buttons |
| Semantic HTML | Use `<main>`, `<nav>`, `<article>`, `<section>` correctly |
| Modal focus trap | Focus trapped inside modals when open |
| Drag-and-drop fallback | Cards can be moved via context menu as keyboard fallback |
| Motion preference | Respect `prefers-reduced-motion` for D&D animations |

```css
/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Appendix: Component Checklist

| Component | Spec Written | Dark Mode | Hover State | Focus State | Responsive |
|-----------|:---:|:---:|:---:|:---:|:---:|
| Sidebar | ✅ | ✅ | ✅ | ✅ | ✅ |
| NoteListItem | ✅ | ✅ | ✅ | ✅ | — |
| NoteEditor | ✅ | ✅ | — | ✅ | ✅ |
| KanbanBoard | ✅ | ✅ | — | — | ✅ |
| KanbanColumn | ✅ | ✅ | — | — | — |
| KanbanCard | ✅ | ✅ | ✅ | ✅ | — |
| CardModal | ✅ | ✅ | — | ✅ | ✅ |
| Button variants | ✅ | ✅ | ✅ | ✅ | — |
| Input / Textarea | ✅ | ✅ | ✅ | ✅ | — |
| Priority Badge | ✅ | ✅ | — | — | — |

---

*End of Design Document v1.0.0*
