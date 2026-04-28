# Card Layout Redesign — Notes & Ideas + 1:1 Coaching

**Date:** 2026-04-28
**Branch:** feat/card-layout-redesign

## Goal

Update the Notes & Ideas and 1:1 Coaching screens to use the same card-based visual language as the home screen — replacing the current border-bottom list rows with floating white cards on a gray background, and wrapping the detail panel in a matching white card.

## Design Tokens (match home screen exactly)

- **Card:** `bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)]`
- **List background:** `bg-[#f5f5f7]` with `p-3`
- **Selected card:** `bg-[#EFF6FF]` + `border border-[#93C5FD]` (1.5px)
- **Hover:** `hover:bg-[#fafafa] hover:shadow-[0_2px_8px_rgba(0,0,0,0.10)] transition-all`
- **Detail card:** same card token, `m-3` margin, `overflow-hidden`
- **Divider between panels:** removed (no `border-r`)

## Changes by File

### 1. `NotesSidebar.tsx`
- Already has `min-w-0` + `overflow-hidden` fix from previous session
- Change each note `<button>` from `border-b border-l-2` row to a card: `bg-white rounded-xl p-3 mb-2 shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-transparent`
- Selected: add `bg-[#EFF6FF] border-[#93C5FD]`
- Hover: `hover:bg-[#fafafa] hover:shadow-[0_2px_8px_rgba(0,0,0,0.10)]`
- Remove `border-b border-slate-200` and `border-l-2` from button className

### 2. `NotesPageClient.tsx`
- Sidebar container: remove `border-r border-slate-200`, add `bg-[#f5f5f7]`
- Detail container: change from `flex-1 overflow-y-auto` to `flex-1 min-h-0 overflow-hidden bg-[#f5f5f7] p-3`
- Wrap `<NoteDetail>` in `<div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden h-full flex flex-col">` — NoteDetail already uses `flex flex-col h-full` internally so it fills the card naturally
- Empty state div: give it the same `bg-[#f5f5f7]` background

### 3. `NoteDetail.tsx`
- Replace the "Delete" text button with an SVG trash icon button (Lucide `Trash2`, size 15, `text-slate-400 hover:text-red-500`)
- Add a Lucide `Pencil` icon button (size 15, `text-slate-400 hover:text-slate-600`) that focuses the title input on click
- Both icon buttons use: `w-8 h-8 flex items-center justify-center rounded-lg bg-[#f5f5f7] hover:bg-[#ebebf0] transition-colors`

### 4. `DesignerList.tsx`
- Remove `border-r` from container, add `bg-[#f5f5f7]`, add `p-3` to list area
- Change each designer `<button>` from `border-b border-l-2` row to card layout matching Option B:
  - Card: `bg-white rounded-xl p-3 mb-2 shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-transparent w-full text-left flex items-center gap-3`
  - Selected: `bg-[#EFF6FF] border-[#93C5FD]`
  - Hover: `hover:bg-[#fafafa]`
  - Right side: next 1:1 date (`d.nextOneOnOne`) right-aligned in `text-[10px] text-slate-400`; omit if null
  - Below date: undiscussed topic count — if `(d.topics ?? []).filter(t => !t.discussed).length > 0`, show `N topics` in `text-[10px] text-amber-600 font-medium`

### 5. `CoachingPageClient.tsx`
- Outer flex container: add `bg-[#f5f5f7]`
- Remove any implicit border between list and panel
- Wrap `<CoachingPanel>` in `<div className="flex-1 min-h-0 overflow-hidden bg-[#f5f5f7] p-3">` containing `<div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden h-full flex flex-col">`
- Empty state: update to use `bg-[#f5f5f7]`

## Out of Scope

- No changes to CoachingPanel tab content
- No changes to NoteDetail form fields or AI buttons
- No changes to Ideas tab or IdeasGrid
- No changes to any other screens
