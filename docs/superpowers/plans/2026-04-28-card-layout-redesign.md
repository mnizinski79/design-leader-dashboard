# Card Layout Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace border-bottom list rows on Notes & Ideas and 1:1 Coaching with floating white cards on a gray background, and wrap detail panels in matching white cards — matching the home screen visual language.

**Architecture:** Five targeted file edits, no logic changes. Styling uses Tailwind arbitrary values to match the home screen card token (`bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)]`). The gray background (`#f5f5f7`) on list containers makes white cards float visually; the detail panel gets the same treatment.

**Tech Stack:** Next.js 14, React, Tailwind CSS, Lucide React (icons), `cn()` from `@/lib/utils` (clsx + tailwind-merge)

---

## File Map

| File | Change |
|------|--------|
| `src/components/notes/NotesSidebar.tsx` | Note rows → white cards; gray list background |
| `src/components/notes/NotesPageClient.tsx` | Remove sidebar border-r; wrap detail in card |
| `src/components/notes/NoteDetail.tsx` | Replace text "Delete" with Pencil + Trash2 icon buttons |
| `src/components/coaching/DesignerList.tsx` | Designer rows → white cards with next 1:1 + pending topics |
| `src/components/coaching/CoachingPageClient.tsx` | Gray background; wrap CoachingPanel in white card |

---

## Task 1: NotesSidebar — card-ify note list items

**Files:**
- Modify: `src/components/notes/NotesSidebar.tsx`
- Test: `src/__tests__/components/NotesSidebar.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/NotesSidebar.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { NotesSidebar } from "@/components/notes/NotesSidebar"
import type { NoteItem, NoteTagItem } from "@/types"

const baseNotes: NoteItem[] = [
  { id: "n1", title: "Army Hotel Updates", project: "General", date: "2026-04-23", body: "", tags: [] },
  { id: "n2", title: "Agentic Voice", project: "Design System", date: "2026-04-21", body: "", tags: [{ id: "t1", name: "dls" }] },
]
const allTags: NoteTagItem[] = [{ id: "t1", name: "dls" }]

describe("NotesSidebar", () => {
  it("renders note titles as buttons", () => {
    render(<NotesSidebar notes={baseNotes} allTags={allTags} selectedId={null} onSelect={jest.fn()} />)
    expect(screen.getByText("Army Hotel Updates")).toBeInTheDocument()
    expect(screen.getByText("Agentic Voice")).toBeInTheDocument()
  })

  it("calls onSelect with the correct id when a note is clicked", () => {
    const onSelect = jest.fn()
    render(<NotesSidebar notes={baseNotes} allTags={allTags} selectedId={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText("Army Hotel Updates"))
    expect(onSelect).toHaveBeenCalledWith("n1")
  })

  it("applies selected styling to the active note", () => {
    render(<NotesSidebar notes={baseNotes} allTags={allTags} selectedId="n1" onSelect={jest.fn()} />)
    const btn = screen.getByText("Army Hotel Updates").closest("button")
    expect(btn?.className).toContain("bg-[#EFF6FF]")
  })

  it("renders tag chip for notes with tags", () => {
    render(<NotesSidebar notes={baseNotes} allTags={allTags} selectedId={null} onSelect={jest.fn()} />)
    expect(screen.getByText("dls")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Users/mnizinski/Documents/Code Experiments/Design Leader Dashboard/app"
npx jest NotesSidebar --no-coverage
```

Expected: FAIL — `bg-[#EFF6FF]` not found in className (old code uses `bg-blue-50`).

- [ ] **Step 3: Replace NotesSidebar.tsx with card layout**

Full replacement for `src/components/notes/NotesSidebar.tsx`:

```tsx
"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import type { NoteItem, NoteTagItem } from "@/types"

interface Props {
  notes: NoteItem[]
  allTags: NoteTagItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function NotesSidebar({ notes, allTags, selectedId, onSelect }: Props) {
  const [search, setSearch] = useState("")
  const [project, setProject] = useState("")
  const [tagFilter, setTagFilter] = useState("")

  const projects = useMemo(() => {
    const set = new Set(notes.map(n => n.project))
    return Array.from(set).sort()
  }, [notes])

  const filtered = useMemo(() => {
    return notes.filter(n => {
      if (search && !n.title.toLowerCase().includes(search.toLowerCase())) return false
      if (project && n.project !== project) return false
      if (tagFilter && !n.tags.some(t => t.id === tagFilter)) return false
      return true
    })
  }, [notes, search, project, tagFilter])

  return (
    <div className="flex flex-col h-full bg-[#f5f5f7]">
      <div className="p-3 space-y-2">
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        />
        <div className="flex gap-2 overflow-hidden">
          <select
            value={project}
            onChange={e => setProject(e.target.value)}
            className="flex-1 min-w-0 text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          >
            <option value="">All projects</option>
            {projects.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={tagFilter}
            onChange={e => setTagFilter(e.target.value)}
            className="flex-1 min-w-0 text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          >
            <option value="">All tags</option>
            {allTags.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No notes match your filters</p>
        ) : (
          filtered.map(note => (
            <button
              key={note.id}
              onClick={() => onSelect(note.id)}
              className={cn(
                "w-full text-left p-3 mb-2 bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-transparent hover:bg-[#fafafa] hover:shadow-[0_2px_8px_rgba(0,0,0,0.10)] transition-all",
                selectedId === note.id && "bg-[#EFF6FF] border-[#93C5FD]"
              )}
            >
              <p className="text-sm font-medium text-slate-800 truncate">{note.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{note.project} · {note.date}</p>
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {note.tags.slice(0, 3).map(t => (
                    <span key={t.id} className="text-xs bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest NotesSidebar --no-coverage
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/notes/NotesSidebar.tsx src/__tests__/components/NotesSidebar.test.tsx
git commit -m "feat: card-ify note list items in NotesSidebar"
```

---

## Task 2: NotesPageClient — gray background + detail card wrap

**Files:**
- Modify: `src/components/notes/NotesPageClient.tsx`

- [ ] **Step 1: Update the notes panel layout**

In `src/components/notes/NotesPageClient.tsx`, replace the `{activeTab === "notes" ? (` branch (lines 106–134) with:

```tsx
{activeTab === "notes" ? (
  <div className="flex h-full">
    {/* Sidebar */}
    <div className="w-72 shrink-0 overflow-y-auto">
      <NotesSidebar
        notes={notes}
        allTags={allTags}
        selectedId={selectedNoteId}
        onSelect={handleSelectNote}
      />
    </div>

    {/* Detail panel */}
    <div className="flex-1 min-h-0 overflow-hidden bg-[#f5f5f7] p-3">
      {selectedNote ? (
        <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden h-full flex flex-col">
          <NoteDetail
            key={selectedNote.id}
            note={selectedNote}
            allTags={allTags}
            onUpdate={handleUpdateNote}
            onDelete={handleDeleteNote}
            onTagsChange={handleTagsChange}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-slate-400">Select a note or create a new one</p>
        </div>
      )}
    </div>
  </div>
) : (
```

Key changes:
- Sidebar container: removed `border-r border-slate-200`; NotesSidebar provides its own `bg-[#f5f5f7]`
- Detail container: `flex-1 min-h-0 overflow-hidden bg-[#f5f5f7] p-3` (padding creates gap around card)
- NoteDetail wrapped in white card div with `h-full flex flex-col` so NoteDetail's internal `flex flex-col h-full` fills it

- [ ] **Step 2: Run the full test suite to confirm no regressions**

```bash
npx jest --no-coverage
```

Expected: all existing tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/notes/NotesPageClient.tsx
git commit -m "feat: gray background and detail card wrap in NotesPageClient"
```

---

## Task 3: NoteDetail — pencil + trash icon buttons

**Files:**
- Modify: `src/components/notes/NoteDetail.tsx`
- Test: `src/__tests__/components/NoteDetail.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/NoteDetail.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import { NoteDetail } from "@/components/notes/NoteDetail"
import type { NoteItem, NoteTagItem } from "@/types"

const mockNote: NoteItem = {
  id: "n1",
  title: "Test Note",
  project: "Design System",
  date: "2026-04-28",
  body: "Some content here",
  tags: [],
}

const mockRouterPush = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush, refresh: jest.fn() }),
}))

describe("NoteDetail", () => {
  const onUpdate = jest.fn()
  const onDelete = jest.fn()
  const onTagsChange = jest.fn()

  it("renders the note title", () => {
    render(<NoteDetail note={mockNote} allTags={[]} onUpdate={onUpdate} onDelete={onDelete} onTagsChange={onTagsChange} />)
    expect(screen.getByDisplayValue("Test Note")).toBeInTheDocument()
  })

  it("renders a delete button with trash icon aria-label", () => {
    render(<NoteDetail note={mockNote} allTags={[]} onUpdate={onUpdate} onDelete={onDelete} onTagsChange={onTagsChange} />)
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument()
  })

  it("renders an edit button with pencil icon aria-label", () => {
    render(<NoteDetail note={mockNote} allTags={[]} onUpdate={onUpdate} onDelete={onDelete} onTagsChange={onTagsChange} />)
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest NoteDetail --no-coverage
```

Expected: FAIL — no button with name "edit" found (old code has text "Delete" only).

- [ ] **Step 3: Update NoteDetail.tsx imports and add titleInputRef**

At the top of `src/components/notes/NoteDetail.tsx`:

Replace:
```tsx
import { useState, useEffect, useCallback } from "react"
```
With:
```tsx
import { useState, useEffect, useCallback, useRef } from "react"
```

Replace:
```tsx
import { ClaudePanel } from "@/components/claude/ClaudePanel"
import { SplitButton } from "@/components/claude/SplitButton"
```
With:
```tsx
import { Pencil, Trash2 } from "lucide-react"
import { ClaudePanel } from "@/components/claude/ClaudePanel"
import { SplitButton } from "@/components/claude/SplitButton"
```

After the `const [claudeLabel, setClaudeLabel] = useState("")` line, add:
```tsx
const titleInputRef = useRef<HTMLInputElement>(null)
```

- [ ] **Step 4: Replace the title input and action buttons**

In `NoteDetail.tsx`, replace the entire `<div className="flex items-start justify-between gap-4">` block (lines 99–115) with:

```tsx
<div className="flex items-start justify-between gap-4">
  <input
    id="note-title"
    ref={titleInputRef}
    aria-label="Note title"
    className="flex-1 text-xl font-semibold text-slate-900 border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-400 focus:outline-none py-1 bg-transparent"
    value={title}
    onChange={e => setTitle(e.target.value)}
    onBlur={() => { if (title !== note.title) save({ title }) }}
    placeholder="Note title"
  />
  <div className="flex gap-1.5 shrink-0">
    <button
      aria-label="Edit note title"
      onClick={() => titleInputRef.current?.focus()}
      className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#f5f5f7] hover:bg-[#ebebf0] transition-colors text-slate-400 hover:text-slate-600"
    >
      <Pencil size={14} />
    </button>
    <button
      aria-label="Delete note"
      onClick={handleDelete}
      className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#f5f5f7] hover:bg-[#ebebf0] transition-colors text-slate-400 hover:text-red-500"
    >
      <Trash2 size={14} />
    </button>
  </div>
</div>
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx jest NoteDetail --no-coverage
```

Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/notes/NoteDetail.tsx src/__tests__/components/NoteDetail.test.tsx
git commit -m "feat: replace text delete button with pencil and trash icon buttons in NoteDetail"
```

---

## Task 4: DesignerList — card layout with next 1:1 and pending topics

**Files:**
- Modify: `src/components/coaching/DesignerList.tsx`
- Test: `src/__tests__/components/DesignerList.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/DesignerList.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { DesignerList } from "@/components/coaching/DesignerList"
import type { DesignerItem } from "@/types"

const baseDesigner: DesignerItem = {
  id: "d1",
  userId: "u1",
  name: "Jade Maddox",
  role: "Senior Designer",
  roleLevel: "Senior",
  dreyfusStage: "PROFICIENT",
  avatarClass: "av-blue",
  nextOneOnOne: "2026-04-29",
  createdAt: "2026-01-01T00:00:00.000Z",
  ninetyDayPlan: null,
  skills: [],
  sessions: [],
  goals: [],
  feedback: [],
  topics: [
    { id: "t1", designerId: "d1", title: "Career growth", discussed: false, createdAt: "2026-04-01T00:00:00.000Z" },
    { id: "t2", designerId: "d1", title: "Old topic", discussed: true, createdAt: "2026-03-01T00:00:00.000Z" },
  ],
  notes: [],
}

describe("DesignerList", () => {
  it("renders designer name", () => {
    render(<DesignerList designers={[baseDesigner]} selectedId={null} onSelect={jest.fn()} />)
    expect(screen.getByText("Jade Maddox")).toBeInTheDocument()
  })

  it("calls onSelect with designer id on click", () => {
    const onSelect = jest.fn()
    render(<DesignerList designers={[baseDesigner]} selectedId={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText("Jade Maddox"))
    expect(onSelect).toHaveBeenCalledWith("d1")
  })

  it("shows next 1:1 date", () => {
    render(<DesignerList designers={[baseDesigner]} selectedId={null} onSelect={jest.fn()} />)
    expect(screen.getByText("2026-04-29")).toBeInTheDocument()
  })

  it("shows pending topic count for undiscussed topics only", () => {
    render(<DesignerList designers={[baseDesigner]} selectedId={null} onSelect={jest.fn()} />)
    expect(screen.getByText("1 topic")).toBeInTheDocument()
  })

  it("applies selected card styling to the active designer", () => {
    render(<DesignerList designers={[baseDesigner]} selectedId="d1" onSelect={jest.fn()} />)
    const btn = screen.getByText("Jade Maddox").closest("button")
    expect(btn?.className).toContain("bg-[#EFF6FF]")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest DesignerList --no-coverage
```

Expected: FAIL — `bg-[#EFF6FF]`, next 1:1 date, and topic count not found.

- [ ] **Step 3: Replace DesignerList.tsx with card layout**

Full replacement for `src/components/coaching/DesignerList.tsx`:

```tsx
"use client"

import { cn } from "@/lib/utils"
import { DesignerItem, DreyfusStage } from "@/types"
import { DREYFUS_LABELS } from "@/components/coaching/lib/coaching-framework"

interface Props {
  designers: DesignerItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const AVATAR_BG: Record<string, string> = {
  "av-blue":   "#0071E3",
  "av-purple": "#7C3AED",
  "av-teal":   "#0D9488",
  "av-pink":   "#DB2777",
  "av-amber":  "#D97706",
  "av-green":  "#1D7A1D",
}

const STAGE_COLORS: Record<DreyfusStage, string> = {
  NOVICE: "bg-slate-100 text-slate-600",
  ADVANCED_BEGINNER: "bg-blue-100 text-blue-700",
  COMPETENT: "bg-green-100 text-green-700",
  PROFICIENT: "bg-purple-100 text-purple-700",
  EXPERT: "bg-amber-100 text-amber-700",
}

export function DesignerList({ designers, selectedId, onSelect }: Props) {
  return (
    <div className="w-64 shrink-0 flex flex-col h-full bg-[#f5f5f7]">
      <div className="flex-1 overflow-y-auto p-3">
        {designers.length === 0 && (
          <p className="text-sm text-muted-foreground p-4 text-center">No designers yet</p>
        )}
        {designers.map((d) => {
          const isSelected = d.id === selectedId
          const initials = d.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
          const pendingTopics = (d.topics ?? []).filter(t => !t.discussed).length

          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelect(d.id)}
              className={cn(
                "w-full text-left p-3 mb-2 bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-transparent flex items-center gap-3 hover:bg-[#fafafa] hover:shadow-[0_2px_8px_rgba(0,0,0,0.10)] transition-all",
                isSelected && "bg-[#EFF6FF] border-[#93C5FD]"
              )}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 text-white"
                style={{ background: AVATAR_BG[d.avatarClass] ?? "#0071E3" }}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{d.name}</p>
                <p className="text-xs text-muted-foreground truncate">{d.role}</p>
                {d.dreyfusStage && (
                  <span className={`inline-block text-xs px-1.5 py-0.5 rounded mt-0.5 ${STAGE_COLORS[d.dreyfusStage]}`}>
                    {DREYFUS_LABELS[d.dreyfusStage]}
                  </span>
                )}
              </div>
              {(d.nextOneOnOne || pendingTopics > 0) && (
                <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                  {d.nextOneOnOne && (
                    <span className="text-[10px] text-slate-400">{d.nextOneOnOne}</span>
                  )}
                  {pendingTopics > 0 && (
                    <span className="text-[10px] text-amber-600 font-medium">
                      {pendingTopics} topic{pendingTopics > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest DesignerList --no-coverage
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/coaching/DesignerList.tsx src/__tests__/components/DesignerList.test.tsx
git commit -m "feat: card layout with next 1:1 date and pending topics in DesignerList"
```

---

## Task 5: CoachingPageClient — gray background + wrap panel in card

**Files:**
- Modify: `src/components/coaching/CoachingPageClient.tsx`

- [ ] **Step 1: Update the coaching flex container**

In `src/components/coaching/CoachingPageClient.tsx`, replace the `<div className="flex flex-1 overflow-hidden">` block (line 265 onwards — the whole inner layout) with:

```tsx
<div className="flex flex-1 overflow-hidden bg-[#f5f5f7]">
  <DesignerList
    designers={designers}
    selectedId={selectedId}
    onSelect={(id) => {
      setSelectedId(id)
      setActiveTab("skills")
    }}
  />

  {!selected ? (
    <div className="flex-1 flex items-center justify-center bg-[#f5f5f7] text-muted-foreground text-sm">
      Select a designer or add one to get started
    </div>
  ) : (
    <div className="flex-1 min-h-0 overflow-hidden p-3">
      <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden h-full flex flex-col">
        <CoachingPanel
          key={selected.id}
          designer={selected}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onDreyfusChange={handleDreyfusChange}
          onSkillsSave={handleSkillsSave}
          onSessionAdd={handleSessionAdd}
          onSessionDelete={handleSessionDelete}
          onTopicAdd={handleTopicAdd}
          onTopicToggle={handleTopicToggle}
          onTopicDelete={handleTopicDelete}
          onGoalAdd={handleGoalAdd}
          onGoalStatusChange={handleGoalStatusChange}
          onGoalDelete={handleGoalDelete}
          onFeedbackAdd={handleFeedbackAdd}
          onFeedbackDelete={handleFeedbackDelete}
          onNoteAdd={handleNoteAdd}
          onNoteUpdate={handleNoteUpdate}
          onNoteDelete={handleNoteDelete}
          onOpenClaude={handleOpenClaude}
          onPlanSave={handlePlanSave}
          onPlanDelete={handlePlanDelete}
        />
      </div>
    </div>
  )}

  {showAddModal && (
    <AddDesignerModal
      onClose={() => setShowAddModal(false)}
      onCreated={handleDesignerCreated}
    />
  )}

  <ClaudePanel
    isOpen={claudeOpen}
    onClose={() => setClaudeOpen(false)}
    prompt={claudePrompt}
    contextLabel={claudeLabel}
    systemPrompt={claudeSystemPrompt}
    onSave={claudeSaveHandler}
  />
</div>
```

- [ ] **Step 2: Run full test suite**

```bash
npx jest --no-coverage
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/coaching/CoachingPageClient.tsx
git commit -m "feat: gray background and CoachingPanel card wrap in CoachingPageClient"
```

---

## Task 6: Visual verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Log in and verify Notes & Ideas**

Go to `http://localhost:3000/notes`. Sign in with `mike.nizinski@ihg.com` / `password123456`.

Check:
- List area has a gray (`#f5f5f7`) background
- Each note appears as a white floating card with subtle shadow
- Clicking a note turns it light blue with a blue border ring
- Hovering an unselected note lifts its shadow slightly
- Selected note detail appears in a white card (no hard border between list and detail)
- Pencil and trash icons appear top-right of the detail panel (no "Delete" text)
- Split buttons show copy icon on the right side

- [ ] **Step 3: Verify 1:1 & Coaching**

Go to `http://localhost:3000/coaching`.

Check:
- Designer list has gray background, each designer is a white card
- Next 1:1 date appears right-aligned on each card
- Designers with undiscussed topics show amber "N topics" text
- Selecting a designer shows the CoachingPanel inside a white card
- Hover and selected states match Notes screen

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete card layout redesign for Notes and Coaching screens"
```
