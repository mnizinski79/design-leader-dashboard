# Phase 5: Projects — Design Spec

## Goal

Build a fully functional Projects page that mirrors the HTML prototype: status-colored cards with attention and blocker callouts, inline decision logging, and an add/edit modal. Designers are linked to real coaching roster entries via a many-to-many join table.

## Architecture

Same pattern as Phase 4 coaching: a server page fetches all data and passes it to a client orchestrator, which owns all state and mutation handlers. Pure display components (ProjectCard) receive data and callbacks only — no fetch calls inside them.

```
server page (projects/page.tsx)
  └── ProjectsPageClient.tsx  (client, owns state + handlers)
        └── ProjectCard.tsx   (pure display, no state)
        └── ProjectModal.tsx  (add/edit modal)
```

API routes handle all mutations. The client optimistically updates local state then reconciles on success.

## Tech Stack

- Next.js 14 App Router, TypeScript
- Prisma 6 + PostgreSQL
- Auth.js v5 JWT sessions
- Tailwind v4 + shadcn/ui
- Existing Designer model (coaching roster) for many-to-many linking

---

## Section 1: Data Model

### Schema changes to `prisma/schema.prisma`

**Modified model — Project:**

```prisma
model Project {
  id            String         @id @default(uuid())
  userId        String         @map("user_id")
  name          String
  phase         ProjectPhase   @default(DISCOVERY)
  status        ProjectStatus  @default(ON_TRACK)
  description   String?
  dueDate       DateTime?      @db.Date @map("due_date")
  sprintSnapshot String?       @map("sprint_snapshot")
  stakeholders  String?
  attention     String?        // null = no callout; text = show amber callout
  blockers      String?        // null = no callout; text = show red callout
  createdAt     DateTime       @default(now()) @map("created_at")
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  decisions     ProjectDecision[]
  designers     ProjectDesigner[]
  @@map("projects")
}
```

Note: `attention` changes from `Boolean` to `String?`. Existing rows with `attention = true` will need a migration default.

**New join table — ProjectDesigner:**

```prisma
model ProjectDesigner {
  projectId  String   @map("project_id")
  designerId String   @map("designer_id")
  project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  designer   Designer @relation(fields: [designerId], references: [id], onDelete: Cascade)
  @@id([projectId, designerId])
  @@map("project_designers")
}
```

**Existing enums (unchanged):**

```prisma
enum ProjectPhase {
  DISCOVERY
  DESIGN
  DEV_HANDOFF
  IN_DEVELOPMENT
  LIVE
  ON_HOLD
}

enum ProjectStatus {
  ON_TRACK
  AT_RISK
  BLOCKED
  COMPLETE
}
```

**Designer model addition** — add `projects ProjectDesigner[]` relation field.

### Migration

Run `npx prisma migrate dev --name phase5-projects-schema` after schema changes. The migration will:
1. Add nullable columns (description, dueDate, sprintSnapshot, stakeholders, blockers)
2. Change `attention` from boolean to text (nullable) — existing `true` rows become null (they had no text)
3. Create `project_designers` join table

---

## Section 2: File Structure

### New files

```
src/app/(dashboard)/projects/page.tsx
src/components/projects/ProjectsPageClient.tsx
src/components/projects/ProjectCard.tsx
src/components/projects/ProjectModal.tsx
src/app/api/projects/route.ts
src/app/api/projects/[id]/route.ts
src/app/api/projects/[id]/decisions/route.ts
src/app/api/projects/[id]/decisions/[did]/route.ts
```

### Modified files

```
prisma/schema.prisma                        — schema changes (Section 1)
src/components/nav/Sidebar.tsx              — activate Projects nav link
```

---

## Section 3: Page Behavior + UX

### Projects list page

- Header: "Projects" h1 + "Add Project" button (top right)
- Cards sorted: BLOCKED → AT_RISK → ON_TRACK → COMPLETE
- Empty state: centered message "No projects yet — add your first one"

### Card anatomy

Each card has a colored left border matching its status:

| Status | Border color |
|---|---|
| ON_TRACK | `#1D7A1D` (green) |
| AT_RISK | `#B45309` (amber) |
| BLOCKED | `#D70015` (red) |
| COMPLETE | `#6E6E73` (gray) |

Card sections (all optional fields hidden when null/empty):

1. **Header row** — project name (bold), status badge, phase badge, due date ("Due Jun 30, 2026"), Edit + Delete buttons
2. **Description** — paragraph text, shown only if set
3. **3-col metadata grid** — Designers | Stakeholders | Sprint snapshot (column hidden if empty)
4. **Attention callout** — amber background box with "Needs attention" label + text; shown only if `attention` is non-null
5. **Blockers callout** — red background box with "Blocked" label + text; shown only if `blockers` is non-null
6. **Decision log** — list of decisions (newest first) + inline "Log a decision…" input + "+ Log" button

### Badge colors

**Phase badges** (all use `background: #f0f0f5`):

| Phase | Text color |
|---|---|
| DISCOVERY | `#7C3AED` |
| DESIGN | `#0071E3` |
| DEV_HANDOFF | `#B45309` |
| IN_DEVELOPMENT | `#1D7A1D` |
| LIVE | `#059669` |
| ON_HOLD | `#6E6E73` |

**Status badges:**

| Status | Background | Text color |
|---|---|---|
| ON_TRACK | `#E3F3E3` | `#1D7A1D` |
| AT_RISK | `#FFF8E1` | `#B45309` |
| BLOCKED | `#FFEAEA` | `#D70015` |
| COMPLETE | `#F5F5F7` | `#6E6E73` |

### Add/Edit modal fields

| Field | Type | Required |
|---|---|---|
| Name | text input | Yes |
| Phase | select | Yes |
| Status | select | Yes |
| Description | textarea | No |
| Due date | date input | No |
| Designers | multi-select (coaching roster) | No |
| Stakeholders | text input | No |
| Sprint snapshot | text input | No |
| Needs attention | textarea | No (empty = no callout) |
| Blockers | textarea | No (empty = no callout) |

Edit mode pre-fills all fields. Saving calls PATCH with the full updated payload.

### Decision log UX

- Inline input on each card — type and click "+ Log"
- New decision appears immediately (optimistic insert at top of list)
- Decisions are not editable — delete only (small ✕ button on hover)
- DELETE call removes from server; local state updated on success

---

## Section 4: API Routes

### `GET /api/projects`

Returns all projects for the session user, including decisions (sorted newest first) and designers (with designer name).

Response shape:
```typescript
{
  id: string
  name: string
  phase: ProjectPhase
  status: ProjectStatus
  description: string | null
  dueDate: string | null        // ISO date string
  sprintSnapshot: string | null
  stakeholders: string | null
  attention: string | null
  blockers: string | null
  createdAt: string
  decisions: { id: string; text: string; createdAt: string }[]
  designers: { designerId: string; designer: { id: string; name: string } }[]
}[]
```

### `POST /api/projects`

Creates a new project. Body:
```typescript
{
  name: string
  phase?: ProjectPhase
  status?: ProjectStatus
  description?: string
  dueDate?: string           // ISO date string or null
  sprintSnapshot?: string
  stakeholders?: string
  attention?: string
  blockers?: string
  designerIds?: string[]
}
```

Creates `ProjectDesigner` rows for each designerId. Returns the created project with the same shape as GET.

### `PATCH /api/projects/[id]`

Updates a project. Accepts partial body with any fields from POST. If `designerIds` is present, performs a full replace: `deleteMany` all existing `ProjectDesigner` rows for this project, then `createMany` with new set. Verifies project belongs to session user.

### `DELETE /api/projects/[id]`

Deletes the project. Cascade in schema removes decisions and designer links. Verifies ownership.

### `POST /api/projects/[id]/decisions`

Adds a decision. Body: `{ text: string }`. Returns the created decision `{ id, text, createdAt }`.

### `DELETE /api/projects/[id]/decisions/[did]`

Deletes a single decision. Verifies the decision belongs to a project owned by the session user.

---

## Section 5: Component Interfaces

### `ProjectCard` props

```typescript
interface ProjectCardProps {
  project: SerializedProject          // full project object
  allDesigners: SerializedDesigner[]  // for display only (names already on project.designers)
  onEdit: (project: SerializedProject) => void
  onDelete: (id: string) => void
  onDecisionAdd: (projectId: string, text: string) => void
  onDecisionDelete: (projectId: string, decisionId: string) => void
}
```

### `ProjectModal` props

```typescript
interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ProjectFormData) => void
  project?: SerializedProject         // undefined = add mode, defined = edit mode
  allDesigners: SerializedDesigner[]  // coaching roster for multi-select
}
```

### `ProjectsPageClient` props

```typescript
interface ProjectsPageClientProps {
  initialProjects: SerializedProject[]
  allDesigners: SerializedDesigner[]
}
```

---

## Section 6: Error Handling

- All API routes return `{ error: string }` with appropriate HTTP status on failure
- Client shows a simple alert or inline error message on mutation failure (no toast library required)
- Optimistic updates are rolled back on API error
- Delete confirms with `window.confirm` before proceeding (no custom modal needed)

---

## Out of Scope (Phase 5)

- Kanban board view (the existing `KanbanBoard.tsx` stub can remain but is not wired)
- Project filtering / search
- Due date reminders or notifications
- Project archiving
- Rich text in decisions or descriptions
