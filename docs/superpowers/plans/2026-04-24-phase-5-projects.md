# Phase 5: Projects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully functional Projects page with status-colored cards, attention/blocker callouts, inline decision logging, and an add/edit modal that links designers from the coaching roster.

**Architecture:** Server page fetches all projects with decisions and designers, serializes them, and passes to a client orchestrator. The orchestrator owns all local state and mutation handlers. `ProjectCard` is a pure display component. API routes handle all mutations.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma 6, PostgreSQL, Auth.js v5, Tailwind v4, Zod

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `prisma/schema.prisma` | Modify | Add new fields, ProjectDesigner join table |
| `src/types/index.ts` | Modify | Add ProjectItem, ProjectDecisionItem, ProjectDesignerItem types |
| `src/app/api/projects/route.ts` | Create | GET (list) + POST (create) |
| `src/app/api/projects/[id]/route.ts` | Create | PATCH (update) + DELETE |
| `src/app/api/projects/[id]/decisions/route.ts` | Create | POST (add decision) |
| `src/app/api/projects/[id]/decisions/[did]/route.ts` | Create | DELETE decision |
| `src/components/projects/ProjectCard.tsx` | Create | Pure display card component |
| `src/components/projects/ProjectModal.tsx` | Create | Add/edit modal |
| `src/components/projects/ProjectsPageClient.tsx` | Create | Client orchestrator with state + handlers |
| `src/app/(dashboard)/projects/page.tsx` | Create | Server page — auth, Prisma fetch, serialization |
| `src/__tests__/api/projects.test.ts` | Create | API route tests |

Note: `src/components/layout/Sidebar.tsx` already has `/projects` in `NAV_ITEMS` — no change needed.

---

## Task 1: Schema migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update the Project model in `prisma/schema.prisma`**

Replace the existing `Project` model (lines 145–158) with:

```prisma
model Project {
  id             String        @id @default(uuid())
  userId         String        @map("user_id")
  name           String
  phase          ProjectPhase  @default(DISCOVERY)
  status         ProjectStatus @default(ON_TRACK)
  description    String?
  dueDate        DateTime?     @map("due_date") @db.Date
  sprintSnapshot String?       @map("sprint_snapshot")
  stakeholders   String?
  attention      String?
  blockers       String?
  createdAt      DateTime      @default(now()) @map("created_at")

  user      User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  decisions ProjectDecision[]
  designers ProjectDesigner[]

  @@map("projects")
}
```

- [ ] **Step 2: Add the `ProjectDesigner` join table after `ProjectDecision`**

Add after the `ProjectDecision` model block:

```prisma
model ProjectDesigner {
  projectId  String @map("project_id")
  designerId String @map("designer_id")

  project  Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  designer Designer @relation(fields: [designerId], references: [id], onDelete: Cascade)

  @@id([projectId, designerId])
  @@map("project_designers")
}
```

- [ ] **Step 3: Add `projects` relation field to the `Designer` model**

Inside the `Designer` model, add after `notes DesignerNote[]`:

```prisma
  projects ProjectDesigner[]
```

- [ ] **Step 4: Run migration**

```bash
cd app
npx prisma migrate dev --name phase5-projects-schema
```

Expected output:
```
✔ Generated Prisma Client
The following migration was created: 20260424000000_phase5_projects_schema
```

- [ ] **Step 5: Regenerate Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 6: Verify schema in Prisma Studio (optional)**

```bash
npx prisma studio
```

Check that `projects` table has new columns and `project_designers` table exists.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: phase5 schema — add project fields and ProjectDesigner join table"
```

---

## Task 2: Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/types/projects.test.ts`:

```typescript
// Type-level test — verifies shape at compile time
import { ProjectItem, ProjectDecisionItem, ProjectDesignerItem } from "@/types"

describe("ProjectItem type", () => {
  it("has the required fields", () => {
    const decision: ProjectDecisionItem = {
      id: "d1",
      projectId: "p1",
      text: "Used shadcn",
      createdAt: "2026-04-24T00:00:00.000Z",
    }

    const designer: ProjectDesignerItem = {
      designerId: "des-1",
      designer: { id: "des-1", name: "Alice Chen" },
    }

    const project: ProjectItem = {
      id: "p1",
      userId: "u1",
      name: "Hotel Redesign",
      phase: "DESIGN",
      status: "AT_RISK",
      description: "Revamping booking flow",
      dueDate: "2026-06-30",
      sprintSnapshot: "8 tickets, 3 in review",
      stakeholders: "Sarah PM, Dev lead",
      attention: "Dev handoff docs incomplete",
      blockers: null,
      createdAt: "2026-04-24T00:00:00.000Z",
      decisions: [decision],
      designers: [designer],
    }

    expect(project.name).toBe("Hotel Redesign")
    expect(project.decisions).toHaveLength(1)
    expect(project.designers).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd app
npx jest src/__tests__/types/projects.test.ts --no-coverage
```

Expected: FAIL — `ProjectItem` not found in `@/types`

- [ ] **Step 3: Add types to `src/types/index.ts`**

Append to the end of the file:

```typescript
export type ProjectPhase =
  | "DISCOVERY"
  | "DESIGN"
  | "DEV_HANDOFF"
  | "IN_DEVELOPMENT"
  | "LIVE"
  | "ON_HOLD"

export type ProjectStatus = "ON_TRACK" | "AT_RISK" | "BLOCKED" | "COMPLETE"

export interface ProjectDecisionItem {
  id: string
  projectId: string
  text: string
  createdAt: string
}

export interface ProjectDesignerItem {
  designerId: string
  designer: { id: string; name: string }
}

export interface ProjectItem {
  id: string
  userId: string
  name: string
  phase: ProjectPhase
  status: ProjectStatus
  description: string | null
  dueDate: string | null
  sprintSnapshot: string | null
  stakeholders: string | null
  attention: string | null
  blockers: string | null
  createdAt: string
  decisions: ProjectDecisionItem[]
  designers: ProjectDesignerItem[]
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/types/projects.test.ts --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/__tests__/types/projects.test.ts
git commit -m "feat: add ProjectItem, ProjectDecisionItem, ProjectDesignerItem types"
```

---

## Task 3: GET + POST /api/projects

**Files:**
- Create: `src/app/api/projects/route.ts`
- Create: `src/__tests__/api/projects.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/api/projects.test.ts`:

```typescript
// @jest-environment node
const mockAuth = jest.fn()
const mockProjectFindMany = jest.fn()
const mockProjectCreate = jest.fn()
const mockProjectDesignerDeleteMany = jest.fn()
const mockProjectDesignerCreateMany = jest.fn()

jest.mock("@/lib/auth", () => ({ auth: (...args: any[]) => mockAuth(...args) }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findMany: (...args: any[]) => mockProjectFindMany(...args),
      findUnique: jest.fn(),
      create: (...args: any[]) => mockProjectCreate(...args),
      update: jest.fn(),
      delete: jest.fn(),
    },
    projectDesigner: {
      deleteMany: (...args: any[]) => mockProjectDesignerDeleteMany(...args),
      createMany: (...args: any[]) => mockProjectDesignerCreateMany(...args),
    },
    projectDecision: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

function makeReq(body?: any) {
  return { json: async () => body } as any
}

const fakeProject = {
  id: "proj-1",
  userId: "user-1",
  name: "Hotel Redesign",
  phase: "DESIGN",
  status: "ON_TRACK",
  description: null,
  dueDate: null,
  sprintSnapshot: null,
  stakeholders: null,
  attention: null,
  blockers: null,
  createdAt: new Date("2026-04-24"),
  decisions: [],
  designers: [],
}

describe("GET /api/projects", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/projects/route")
    mockAuth.mockResolvedValue(null)
    const res = await GET(makeReq())
    expect(res.status).toBe(401)
  })

  it("returns projects list for session user", async () => {
    const { GET } = await import("@/app/api/projects/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockProjectFindMany.mockResolvedValue([fakeProject])
    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    expect(mockProjectFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } })
    )
  })
})

describe("POST /api/projects", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/projects/route")
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeReq({ name: "Project A" }))
    expect(res.status).toBe(401)
  })

  it("returns 422 for missing name", async () => {
    const { POST } = await import("@/app/api/projects/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    const res = await POST(makeReq({}))
    expect(res.status).toBe(422)
  })

  it("creates project and returns 201", async () => {
    const { POST } = await import("@/app/api/projects/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockProjectCreate.mockResolvedValue(fakeProject)
    const res = await POST(makeReq({ name: "Hotel Redesign" }))
    expect(res.status).toBe(201)
    expect(mockProjectCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: "Hotel Redesign", userId: "user-1" }) })
    )
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/api/projects.test.ts --no-coverage
```

Expected: FAIL — `@/app/api/projects/route` not found

- [ ] **Step 3: Create `src/app/api/projects/route.ts`**

```typescript
import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const INCLUDE_ALL = {
  decisions: { orderBy: { createdAt: "desc" as const } },
  designers: {
    include: { designer: { select: { id: true, name: true } } },
  },
}

function serialize(p: any) {
  return {
    ...p,
    dueDate: p.dueDate ? p.dueDate.toISOString().split("T")[0] : null,
    createdAt: p.createdAt.toISOString(),
    decisions: p.decisions.map((d: any) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
    })),
  }
}

export async function GET(_req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: INCLUDE_ALL,
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(projects.map(serialize))
}

const PostSchema = z.object({
  name: z.string().min(1).max(200),
  phase: z.enum(["DISCOVERY", "DESIGN", "DEV_HANDOFF", "IN_DEVELOPMENT", "LIVE", "ON_HOLD"]).optional(),
  status: z.enum(["ON_TRACK", "AT_RISK", "BLOCKED", "COMPLETE"]).optional(),
  description: z.string().optional(),
  dueDate: z.string().nullable().optional(),
  sprintSnapshot: z.string().optional(),
  stakeholders: z.string().optional(),
  attention: z.string().nullable().optional(),
  blockers: z.string().nullable().optional(),
  designerIds: z.array(z.string()).optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { designerIds, dueDate, ...rest } = parsed.data

  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      name: rest.name,
      phase: rest.phase ?? "DISCOVERY",
      status: rest.status ?? "ON_TRACK",
      description: rest.description ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      sprintSnapshot: rest.sprintSnapshot ?? null,
      stakeholders: rest.stakeholders ?? null,
      attention: rest.attention ?? null,
      blockers: rest.blockers ?? null,
      designers: designerIds?.length
        ? { create: designerIds.map((id) => ({ designerId: id })) }
        : undefined,
    },
    include: INCLUDE_ALL,
  })

  return NextResponse.json(serialize(project), { status: 201 })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/__tests__/api/projects.test.ts --no-coverage
```

Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/projects/route.ts src/__tests__/api/projects.test.ts
git commit -m "feat: GET + POST /api/projects with tests"
```

---

## Task 4: PATCH + DELETE /api/projects/[id]

**Files:**
- Create: `src/app/api/projects/[id]/route.ts`
- Modify: `src/__tests__/api/projects.test.ts`

- [ ] **Step 1: Add PATCH + DELETE tests to `src/__tests__/api/projects.test.ts`**

Add these two `describe` blocks at the bottom of the file (after the POST describe):

```typescript
describe("PATCH /api/projects/[id]", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    const { PATCH } = await import("@/app/api/projects/[id]/route")
    mockAuth.mockResolvedValue(null)
    const res = await PATCH(makeReq({ name: "Updated" }), { params: { id: "proj-1" } })
    expect(res.status).toBe(401)
  })

  it("returns 404 when project not found", async () => {
    const { PATCH } = await import("@/app/api/projects/[id]/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    const { prisma } = await import("@/lib/prisma")
    ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(null)
    const res = await PATCH(makeReq({ name: "Updated" }), { params: { id: "proj-1" } })
    expect(res.status).toBe(404)
  })

  it("returns 403 when project belongs to another user", async () => {
    const { PATCH } = await import("@/app/api/projects/[id]/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    const { prisma } = await import("@/lib/prisma")
    ;(prisma.project.findUnique as jest.Mock).mockResolvedValue({ ...fakeProject, userId: "other-user" })
    const res = await PATCH(makeReq({ name: "Updated" }), { params: { id: "proj-1" } })
    expect(res.status).toBe(403)
  })
})

describe("DELETE /api/projects/[id]", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    const { DELETE } = await import("@/app/api/projects/[id]/route")
    mockAuth.mockResolvedValue(null)
    const res = await DELETE(makeReq(), { params: { id: "proj-1" } })
    expect(res.status).toBe(401)
  })

  it("deletes project and returns ok", async () => {
    const { DELETE } = await import("@/app/api/projects/[id]/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    const { prisma } = await import("@/lib/prisma")
    ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(fakeProject)
    ;(prisma.project.delete as jest.Mock).mockResolvedValue(fakeProject)
    const res = await DELETE(makeReq(), { params: { id: "proj-1" } })
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Run tests to verify new ones fail**

```bash
npx jest src/__tests__/api/projects.test.ts --no-coverage
```

Expected: FAIL — `@/app/api/projects/[id]/route` not found

- [ ] **Step 3: Create `src/app/api/projects/[id]/route.ts`**

```typescript
import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const INCLUDE_ALL = {
  decisions: { orderBy: { createdAt: "desc" as const } },
  designers: {
    include: { designer: { select: { id: true, name: true } } },
  },
}

function serialize(p: any) {
  return {
    ...p,
    dueDate: p.dueDate ? p.dueDate.toISOString().split("T")[0] : null,
    createdAt: p.createdAt.toISOString(),
    decisions: p.decisions.map((d: any) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
    })),
  }
}

const PatchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phase: z.enum(["DISCOVERY", "DESIGN", "DEV_HANDOFF", "IN_DEVELOPMENT", "LIVE", "ON_HOLD"]).optional(),
  status: z.enum(["ON_TRACK", "AT_RISK", "BLOCKED", "COMPLETE"]).optional(),
  description: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  sprintSnapshot: z.string().nullable().optional(),
  stakeholders: z.string().nullable().optional(),
  attention: z.string().nullable().optional(),
  blockers: z.string().nullable().optional(),
  designerIds: z.array(z.string()).optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const project = await prisma.project.findUnique({ where: { id: params.id } })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (project.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { designerIds, dueDate, ...rest } = parsed.data

  if (designerIds !== undefined) {
    await prisma.projectDesigner.deleteMany({ where: { projectId: params.id } })
    if (designerIds.length > 0) {
      await prisma.projectDesigner.createMany({
        data: designerIds.map((did) => ({ projectId: params.id, designerId: did })),
      })
    }
  }

  const updated = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
    },
    include: INCLUDE_ALL,
  })

  return NextResponse.json(serialize(updated))
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const project = await prisma.project.findUnique({ where: { id: params.id } })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (project.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.project.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Run all project tests to verify they pass**

```bash
npx jest src/__tests__/api/projects.test.ts --no-coverage
```

Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/projects/[id]/route.ts src/__tests__/api/projects.test.ts
git commit -m "feat: PATCH + DELETE /api/projects/[id] with tests"
```

---

## Task 5: Decision routes

**Files:**
- Create: `src/app/api/projects/[id]/decisions/route.ts`
- Create: `src/app/api/projects/[id]/decisions/[did]/route.ts`
- Create: `src/__tests__/api/project-decisions.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/api/project-decisions.test.ts`:

```typescript
// @jest-environment node
const mockAuth = jest.fn()
const mockProjectFindUnique = jest.fn()
const mockDecisionCreate = jest.fn()
const mockDecisionFindUnique = jest.fn()
const mockDecisionDelete = jest.fn()

jest.mock("@/lib/auth", () => ({ auth: (...args: any[]) => mockAuth(...args) }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    project: { findUnique: (...args: any[]) => mockProjectFindUnique(...args) },
    projectDecision: {
      create: (...args: any[]) => mockDecisionCreate(...args),
      findUnique: (...args: any[]) => mockDecisionFindUnique(...args),
      delete: (...args: any[]) => mockDecisionDelete(...args),
    },
  },
}))

function makeReq(body?: any) {
  return { json: async () => body } as any
}

const fakeProject = { id: "proj-1", userId: "user-1" }

describe("POST /api/projects/[id]/decisions", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/projects/[id]/decisions/route")
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeReq({ text: "Decision A" }), { params: { id: "proj-1" } })
    expect(res.status).toBe(401)
  })

  it("returns 422 for empty text", async () => {
    const { POST } = await import("@/app/api/projects/[id]/decisions/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockProjectFindUnique.mockResolvedValue(fakeProject)
    const res = await POST(makeReq({ text: "" }), { params: { id: "proj-1" } })
    expect(res.status).toBe(422)
  })

  it("creates decision and returns 201", async () => {
    const { POST } = await import("@/app/api/projects/[id]/decisions/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockProjectFindUnique.mockResolvedValue(fakeProject)
    mockDecisionCreate.mockResolvedValue({
      id: "dec-1", projectId: "proj-1", text: "Decision A", createdAt: new Date("2026-04-24"),
    })
    const res = await POST(makeReq({ text: "Decision A" }), { params: { id: "proj-1" } })
    expect(res.status).toBe(201)
  })
})

describe("DELETE /api/projects/[id]/decisions/[did]", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    const { DELETE } = await import("@/app/api/projects/[id]/decisions/[did]/route")
    mockAuth.mockResolvedValue(null)
    const res = await DELETE(makeReq(), { params: { id: "proj-1", did: "dec-1" } })
    expect(res.status).toBe(401)
  })

  it("returns 403 when decision belongs to another user's project", async () => {
    const { DELETE } = await import("@/app/api/projects/[id]/decisions/[did]/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockDecisionFindUnique.mockResolvedValue({
      id: "dec-1",
      project: { userId: "other-user" },
    })
    const res = await DELETE(makeReq(), { params: { id: "proj-1", did: "dec-1" } })
    expect(res.status).toBe(403)
  })

  it("deletes decision and returns ok", async () => {
    const { DELETE } = await import("@/app/api/projects/[id]/decisions/[did]/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockDecisionFindUnique.mockResolvedValue({
      id: "dec-1",
      project: { userId: "user-1" },
    })
    mockDecisionDelete.mockResolvedValue({})
    const res = await DELETE(makeReq(), { params: { id: "proj-1", did: "dec-1" } })
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/api/project-decisions.test.ts --no-coverage
```

Expected: FAIL — routes not found

- [ ] **Step 3: Create `src/app/api/projects/[id]/decisions/route.ts`**

```typescript
import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const PostSchema = z.object({
  text: z.string().min(1).max(500),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const project = await prisma.project.findUnique({ where: { id: params.id } })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (project.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const decision = await prisma.projectDecision.create({
    data: { projectId: params.id, text: parsed.data.text },
  })

  return NextResponse.json({ ...decision, createdAt: decision.createdAt.toISOString() }, { status: 201 })
}
```

- [ ] **Step 4: Create `src/app/api/projects/[id]/decisions/[did]/route.ts`**

```typescript
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; did: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const decision = await prisma.projectDecision.findUnique({
    where: { id: params.did },
    include: { project: { select: { userId: true } } },
  })
  if (!decision) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (decision.project.userId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.projectDecision.delete({ where: { id: params.did } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx jest src/__tests__/api/project-decisions.test.ts --no-coverage
```

Expected: PASS (all tests)

- [ ] **Step 6: Commit**

```bash
git add src/app/api/projects/[id]/decisions/ src/__tests__/api/project-decisions.test.ts
git commit -m "feat: decision API routes — POST + DELETE with tests"
```

---

## Task 6: ProjectCard component

**Files:**
- Create: `src/components/projects/ProjectCard.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/ProjectCard.test.tsx`:

```typescript
import { render, screen, fireEvent } from "@testing-library/react"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { ProjectItem } from "@/types"

const baseProject: ProjectItem = {
  id: "p1",
  userId: "u1",
  name: "Hotel Redesign",
  phase: "DESIGN",
  status: "AT_RISK",
  description: "Revamping the booking flow",
  dueDate: "2026-06-30",
  sprintSnapshot: "8 tickets, 3 in review",
  stakeholders: "Sarah PM, Dev lead",
  attention: "Dev handoff docs incomplete",
  blockers: null,
  createdAt: "2026-04-24T00:00:00.000Z",
  decisions: [
    { id: "d1", projectId: "p1", text: "Used shadcn", createdAt: "2026-04-12T00:00:00.000Z" },
  ],
  designers: [
    { designerId: "des-1", designer: { id: "des-1", name: "Alice Chen" } },
  ],
}

describe("ProjectCard", () => {
  const onEdit = jest.fn()
  const onDelete = jest.fn()
  const onDecisionAdd = jest.fn()
  const onDecisionDelete = jest.fn()

  beforeEach(() => jest.clearAllMocks())

  it("renders project name", () => {
    render(<ProjectCard project={baseProject} onEdit={onEdit} onDelete={onDelete} onDecisionAdd={onDecisionAdd} onDecisionDelete={onDecisionDelete} />)
    expect(screen.getByText("Hotel Redesign")).toBeInTheDocument()
  })

  it("renders attention callout when attention is set", () => {
    render(<ProjectCard project={baseProject} onEdit={onEdit} onDelete={onDelete} onDecisionAdd={onDecisionAdd} onDecisionDelete={onDecisionDelete} />)
    expect(screen.getByText("Dev handoff docs incomplete")).toBeInTheDocument()
  })

  it("does not render blocker callout when blockers is null", () => {
    render(<ProjectCard project={baseProject} onEdit={onEdit} onDelete={onDelete} onDecisionAdd={onDecisionAdd} onDecisionDelete={onDecisionDelete} />)
    expect(screen.queryByText("Blocked")).not.toBeInTheDocument()
  })

  it("calls onEdit when Edit button is clicked", () => {
    render(<ProjectCard project={baseProject} onEdit={onEdit} onDelete={onDelete} onDecisionAdd={onDecisionAdd} onDecisionDelete={onDecisionDelete} />)
    fireEvent.click(screen.getByRole("button", { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledWith(baseProject)
  })

  it("calls onDecisionAdd when decision is logged", () => {
    render(<ProjectCard project={baseProject} onEdit={onEdit} onDelete={onDelete} onDecisionAdd={onDecisionAdd} onDecisionDelete={onDecisionDelete} />)
    const input = screen.getByPlaceholderText("Log a decision…")
    fireEvent.change(input, { target: { value: "New decision" } })
    fireEvent.click(screen.getByRole("button", { name: /log/i }))
    expect(onDecisionAdd).toHaveBeenCalledWith("p1", "New decision")
  })

  it("renders existing decision text", () => {
    render(<ProjectCard project={baseProject} onEdit={onEdit} onDelete={onDelete} onDecisionAdd={onDecisionAdd} onDecisionDelete={onDecisionDelete} />)
    expect(screen.getByText("Used shadcn")).toBeInTheDocument()
  })

  it("renders designer names", () => {
    render(<ProjectCard project={baseProject} onEdit={onEdit} onDelete={onDelete} onDecisionAdd={onDecisionAdd} onDecisionDelete={onDecisionDelete} />)
    expect(screen.getByText("Alice Chen")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/components/ProjectCard.test.tsx --no-coverage
```

Expected: FAIL — `ProjectCard` not found

- [ ] **Step 3: Create `src/components/projects/ProjectCard.tsx`**

```tsx
"use client"

import { useState } from "react"
import { ProjectItem } from "@/types"

const STATUS_BORDER: Record<string, string> = {
  ON_TRACK: "border-l-[#1D7A1D]",
  AT_RISK:  "border-l-[#B45309]",
  BLOCKED:  "border-l-[#D70015]",
  COMPLETE: "border-l-[#6E6E73]",
}

const STATUS_BADGE_BG: Record<string, string> = {
  ON_TRACK: "bg-[#E3F3E3] text-[#1D7A1D]",
  AT_RISK:  "bg-[#FFF8E1] text-[#B45309]",
  BLOCKED:  "bg-[#FFEAEA] text-[#D70015]",
  COMPLETE: "bg-[#F5F5F7] text-[#6E6E73]",
}

const PHASE_COLOR: Record<string, string> = {
  DISCOVERY:      "text-[#7C3AED]",
  DESIGN:         "text-[#0071E3]",
  DEV_HANDOFF:    "text-[#B45309]",
  IN_DEVELOPMENT: "text-[#1D7A1D]",
  LIVE:           "text-[#059669]",
  ON_HOLD:        "text-[#6E6E73]",
}

const PHASE_LABEL: Record<string, string> = {
  DISCOVERY:      "Discovery",
  DESIGN:         "Design",
  DEV_HANDOFF:    "Dev Handoff",
  IN_DEVELOPMENT: "In Development",
  LIVE:           "Live",
  ON_HOLD:        "On Hold",
}

const STATUS_LABEL: Record<string, string> = {
  ON_TRACK: "On track",
  AT_RISK:  "At risk",
  BLOCKED:  "Blocked",
  COMPLETE: "Complete",
}

interface Props {
  project: ProjectItem
  onEdit: (project: ProjectItem) => void
  onDelete: (id: string) => void
  onDecisionAdd: (projectId: string, text: string) => void
  onDecisionDelete: (projectId: string, decisionId: string) => void
}

export function ProjectCard({ project, onEdit, onDelete, onDecisionAdd, onDecisionDelete }: Props) {
  const [decisionText, setDecisionText] = useState("")

  const designerNames = project.designers.map((d) => d.designer.name).join(", ")

  function handleLog() {
    const trimmed = decisionText.trim()
    if (!trimmed) return
    onDecisionAdd(project.id, trimmed)
    setDecisionText("")
  }

  function handleDeleteConfirm() {
    if (window.confirm(`Delete "${project.name}"? This cannot be undone.`)) {
      onDelete(project.id)
    }
  }

  return (
    <div
      className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${STATUS_BORDER[project.status] ?? "border-l-slate-300"}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold text-[#1d1d1f] mb-1.5">{project.name}</div>
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE_BG[project.status]}`}>
              {STATUS_LABEL[project.status]}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#f0f0f5] ${PHASE_COLOR[project.phase]}`}>
              {PHASE_LABEL[project.phase]}
            </span>
            {project.dueDate && (
              <span className="text-[11px] text-[#6e6e73]">
                Due {new Date(project.dueDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(project)}
            className="border border-[#d2d2d7] rounded-md px-2 py-1 text-xs text-[#6e6e73] hover:bg-slate-50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleDeleteConfirm}
            className="border border-[#d2d2d7] rounded-md px-2 py-1 text-xs text-[#d70015] hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-[13px] text-[#494949] leading-relaxed mb-3">{project.description}</p>
      )}

      {/* 3-col metadata */}
      {(designerNames || project.stakeholders || project.sprintSnapshot) && (
        <div className="grid grid-cols-3 gap-3 mb-3">
          {designerNames && (
            <div>
              <div className="text-[10px] font-bold text-[#6e6e73] uppercase tracking-wider mb-1">Designers</div>
              <div className="text-xs text-[#494949]">{designerNames}</div>
            </div>
          )}
          {project.stakeholders && (
            <div>
              <div className="text-[10px] font-bold text-[#6e6e73] uppercase tracking-wider mb-1">Stakeholders</div>
              <div className="text-xs text-[#494949]">{project.stakeholders}</div>
            </div>
          )}
          {project.sprintSnapshot && (
            <div>
              <div className="text-[10px] font-bold text-[#6e6e73] uppercase tracking-wider mb-1">Sprint snapshot</div>
              <div className="text-xs text-[#494949]">{project.sprintSnapshot}</div>
            </div>
          )}
        </div>
      )}

      {/* Attention callout */}
      {project.attention && (
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-3 py-2.5 mb-3">
          <div className="text-[10px] font-bold text-[#B45309] uppercase tracking-wider mb-0.5">Needs attention</div>
          <div className="text-xs text-[#92400E] leading-relaxed">{project.attention}</div>
        </div>
      )}

      {/* Blockers callout */}
      {project.blockers && (
        <div className="bg-[#FFF5F5] border border-[#FECACA] rounded-lg px-3 py-2.5 mb-3">
          <div className="text-[10px] font-bold text-[#D70015] uppercase tracking-wider mb-0.5">Blocked</div>
          <div className="text-xs text-[#991B1B] leading-relaxed">{project.blockers}</div>
        </div>
      )}

      {/* Decision log */}
      <div>
        {project.decisions.length > 0 && (
          <div className="text-[10px] font-bold text-[#6e6e73] uppercase tracking-wider mb-1.5">
            Decision log ({project.decisions.length})
          </div>
        )}
        {project.decisions.map((d) => (
          <div key={d.id} className="flex items-start gap-2 py-1.5 border-t border-[#e5e5ea] group">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0071e3] flex-shrink-0 mt-1.5" />
            <div className="flex-1 text-xs text-[#494949] leading-relaxed">{d.text}</div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[11px] text-[#6e6e73]">
                {new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <button
                onClick={() => onDecisionDelete(project.id, d.id)}
                className="text-[10px] text-[#6e6e73] opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                aria-label="Delete decision"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <div className="flex gap-1.5 mt-2">
          <input
            placeholder="Log a decision…"
            value={decisionText}
            onChange={(e) => setDecisionText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLog()}
            className="flex-1 text-xs px-2.5 py-1.5 border border-[#d2d2d7] rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <button
            onClick={handleLog}
            className="bg-[#0071e3] text-white border-none rounded-md px-3 py-1.5 text-xs cursor-pointer hover:bg-blue-600 transition-colors"
          >
            + Log
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/__tests__/components/ProjectCard.test.tsx --no-coverage
```

Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/projects/ProjectCard.tsx src/__tests__/components/ProjectCard.test.tsx
git commit -m "feat: ProjectCard pure display component with decision log"
```

---

## Task 7: ProjectModal component

**Files:**
- Create: `src/components/projects/ProjectModal.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/ProjectModal.test.tsx`:

```typescript
import { render, screen, fireEvent } from "@testing-library/react"
import { ProjectModal } from "@/components/projects/ProjectModal"
import { DesignerItem } from "@/types"

const designers: Pick<DesignerItem, "id" | "name">[] = [
  { id: "des-1", name: "Alice Chen" },
  { id: "des-2", name: "Ben Park" },
]

describe("ProjectModal", () => {
  const onClose = jest.fn()
  const onSave = jest.fn()

  beforeEach(() => jest.clearAllMocks())

  it("renders modal title 'Add Project' when no project prop", () => {
    render(<ProjectModal isOpen onClose={onClose} onSave={onSave} allDesigners={designers} />)
    expect(screen.getByText("Add Project")).toBeInTheDocument()
  })

  it("renders modal title 'Edit Project' when project prop provided", () => {
    const project = {
      id: "p1", userId: "u1", name: "Hotel Redesign",
      phase: "DESIGN" as const, status: "AT_RISK" as const,
      description: null, dueDate: null, sprintSnapshot: null,
      stakeholders: null, attention: null, blockers: null,
      createdAt: "2026-04-24T00:00:00.000Z", decisions: [], designers: [],
    }
    render(<ProjectModal isOpen onClose={onClose} onSave={onSave} project={project} allDesigners={designers} />)
    expect(screen.getByText("Edit Project")).toBeInTheDocument()
  })

  it("calls onSave with form data when Save is clicked", () => {
    render(<ProjectModal isOpen onClose={onClose} onSave={onSave} allDesigners={designers} />)
    fireEvent.change(screen.getByPlaceholderText("Project name"), { target: { value: "New Project" } })
    fireEvent.click(screen.getByRole("button", { name: /save/i }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: "New Project" }))
  })

  it("calls onClose when Cancel is clicked", () => {
    render(<ProjectModal isOpen onClose={onClose} onSave={onSave} allDesigners={designers} />)
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it("does not render when isOpen is false", () => {
    render(<ProjectModal isOpen={false} onClose={onClose} onSave={onSave} allDesigners={designers} />)
    expect(screen.queryByText("Add Project")).not.toBeInTheDocument()
  })

  it("lists designers as checkboxes", () => {
    render(<ProjectModal isOpen onClose={onClose} onSave={onSave} allDesigners={designers} />)
    expect(screen.getByText("Alice Chen")).toBeInTheDocument()
    expect(screen.getByText("Ben Park")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/components/ProjectModal.test.tsx --no-coverage
```

Expected: FAIL — `ProjectModal` not found

- [ ] **Step 3: Create `src/components/projects/ProjectModal.tsx`**

```tsx
"use client"

import { useState, useEffect } from "react"
import { ProjectItem, ProjectPhase, ProjectStatus } from "@/types"

export interface ProjectFormData {
  name: string
  phase: ProjectPhase
  status: ProjectStatus
  description: string
  dueDate: string
  sprintSnapshot: string
  stakeholders: string
  attention: string
  blockers: string
  designerIds: string[]
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ProjectFormData) => void
  project?: ProjectItem
  allDesigners: { id: string; name: string }[]
}

const PHASES: { value: ProjectPhase; label: string }[] = [
  { value: "DISCOVERY", label: "Discovery" },
  { value: "DESIGN", label: "Design" },
  { value: "DEV_HANDOFF", label: "Dev Handoff" },
  { value: "IN_DEVELOPMENT", label: "In Development" },
  { value: "LIVE", label: "Live" },
  { value: "ON_HOLD", label: "On Hold" },
]

const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "ON_TRACK", label: "On Track" },
  { value: "AT_RISK", label: "At Risk" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "COMPLETE", label: "Complete" },
]

function emptyForm(): ProjectFormData {
  return {
    name: "", phase: "DISCOVERY", status: "ON_TRACK",
    description: "", dueDate: "", sprintSnapshot: "",
    stakeholders: "", attention: "", blockers: "", designerIds: [],
  }
}

function projectToForm(p: ProjectItem): ProjectFormData {
  return {
    name: p.name,
    phase: p.phase,
    status: p.status,
    description: p.description ?? "",
    dueDate: p.dueDate ?? "",
    sprintSnapshot: p.sprintSnapshot ?? "",
    stakeholders: p.stakeholders ?? "",
    attention: p.attention ?? "",
    blockers: p.blockers ?? "",
    designerIds: p.designers.map((d) => d.designerId),
  }
}

export function ProjectModal({ isOpen, onClose, onSave, project, allDesigners }: Props) {
  const [form, setForm] = useState<ProjectFormData>(emptyForm)

  useEffect(() => {
    if (isOpen) {
      setForm(project ? projectToForm(project) : emptyForm())
    }
  }, [isOpen, project])

  if (!isOpen) return null

  function set<K extends keyof ProjectFormData>(key: K, value: ProjectFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleDesigner(id: string) {
    setForm((prev) => ({
      ...prev,
      designerIds: prev.designerIds.includes(id)
        ? prev.designerIds.filter((d) => d !== id)
        : [...prev.designerIds, id],
    }))
  }

  function handleSave() {
    if (!form.name.trim()) return
    onSave(form)
  }

  const inputClass = "w-full text-sm px-3 py-2 border border-[#d2d2d7] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
  const labelClass = "block text-[11px] font-bold text-[#6e6e73] uppercase tracking-wider mb-1"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-bold text-[#1d1d1f] mb-5">
          {project ? "Edit Project" : "Add Project"}
        </h2>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className={labelClass}>Name *</label>
            <input
              placeholder="Project name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Phase + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Phase</label>
              <select value={form.phase} onChange={(e) => set("phase", e.target.value as ProjectPhase)} className={inputClass}>
                {PHASES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value as ProjectStatus)} className={inputClass}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={inputClass + " resize-none"}
            />
          </div>

          {/* Due date + Sprint snapshot */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Due date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Sprint snapshot</label>
              <input
                placeholder="e.g. 8 tickets, 3 in review"
                value={form.sprintSnapshot}
                onChange={(e) => set("sprintSnapshot", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Stakeholders */}
          <div>
            <label className={labelClass}>Stakeholders</label>
            <input
              placeholder="e.g. Sarah PM, Dev lead"
              value={form.stakeholders}
              onChange={(e) => set("stakeholders", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Designers */}
          {allDesigners.length > 0 && (
            <div>
              <label className={labelClass}>Designers</label>
              <div className="border border-[#d2d2d7] rounded-lg p-2 space-y-1 max-h-32 overflow-y-auto">
                {allDesigners.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5">
                    <input
                      type="checkbox"
                      checked={form.designerIds.includes(d.id)}
                      onChange={() => toggleDesigner(d.id)}
                      className="rounded"
                    />
                    <span className="text-sm text-[#1d1d1f]">{d.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Attention */}
          <div>
            <label className={labelClass}>Needs attention (optional)</label>
            <textarea
              rows={2}
              placeholder="Leave empty to hide this callout"
              value={form.attention}
              onChange={(e) => set("attention", e.target.value)}
              className={inputClass + " resize-none"}
            />
          </div>

          {/* Blockers */}
          <div>
            <label className={labelClass}>Blockers (optional)</label>
            <textarea
              rows={2}
              placeholder="Leave empty to hide this callout"
              value={form.blockers}
              onChange={(e) => set("blockers", e.target.value)}
              className={inputClass + " resize-none"}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#6e6e73] border border-[#d2d2d7] rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim()}
            className="px-4 py-2 text-sm text-white bg-[#0071e3] rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/__tests__/components/ProjectModal.test.tsx --no-coverage
```

Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/projects/ProjectModal.tsx src/__tests__/components/ProjectModal.test.tsx
git commit -m "feat: ProjectModal add/edit form with designer multi-select"
```

---

## Task 8: ProjectsPageClient orchestrator

**Files:**
- Create: `src/components/projects/ProjectsPageClient.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/ProjectsPageClient.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ProjectsPageClient } from "@/components/projects/ProjectsPageClient"
import { ProjectItem } from "@/types"

// Mock fetch
global.fetch = jest.fn()

const mockProjects: ProjectItem[] = [
  {
    id: "p1", userId: "u1", name: "Hotel Redesign",
    phase: "DESIGN", status: "ON_TRACK",
    description: null, dueDate: null, sprintSnapshot: null,
    stakeholders: null, attention: null, blockers: null,
    createdAt: "2026-04-24T00:00:00.000Z",
    decisions: [], designers: [],
  },
]

describe("ProjectsPageClient", () => {
  beforeEach(() => jest.clearAllMocks())

  it("renders projects from initialProjects", () => {
    render(<ProjectsPageClient initialProjects={mockProjects} allDesigners={[]} />)
    expect(screen.getByText("Hotel Redesign")).toBeInTheDocument()
  })

  it("renders empty state when no projects", () => {
    render(<ProjectsPageClient initialProjects={[]} allDesigners={[]} />)
    expect(screen.getByText(/no projects yet/i)).toBeInTheDocument()
  })

  it("renders Add Project button", () => {
    render(<ProjectsPageClient initialProjects={[]} allDesigners={[]} />)
    expect(screen.getByRole("button", { name: /add project/i })).toBeInTheDocument()
  })

  it("opens modal when Add Project is clicked", () => {
    render(<ProjectsPageClient initialProjects={[]} allDesigners={[]} />)
    fireEvent.click(screen.getByRole("button", { name: /add project/i }))
    expect(screen.getByText("Add Project")).toBeInTheDocument()
  })

  it("removes project from list on delete after confirmation", async () => {
    window.confirm = jest.fn(() => true)
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
    render(<ProjectsPageClient initialProjects={mockProjects} allDesigners={[]} />)
    fireEvent.click(screen.getByRole("button", { name: /delete/i }))
    await waitFor(() => expect(screen.queryByText("Hotel Redesign")).not.toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/components/ProjectsPageClient.test.tsx --no-coverage
```

Expected: FAIL — `ProjectsPageClient` not found

- [ ] **Step 3: Create `src/components/projects/ProjectsPageClient.tsx`**

```tsx
"use client"

import { useState } from "react"
import { ProjectItem, ProjectDecisionItem } from "@/types"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { ProjectModal, ProjectFormData } from "@/components/projects/ProjectModal"

interface Props {
  initialProjects: ProjectItem[]
  allDesigners: { id: string; name: string }[]
}

const STATUS_ORDER: Record<string, number> = {
  BLOCKED: 0,
  AT_RISK: 1,
  ON_TRACK: 2,
  COMPLETE: 3,
}

export function ProjectsPageClient({ initialProjects, allDesigners }: Props) {
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectItem | undefined>(undefined)

  const sorted = [...projects].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
  )

  function updateProject(id: string, patch: Partial<ProjectItem>) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function openAdd() {
    setEditingProject(undefined)
    setModalOpen(true)
  }

  function openEdit(project: ProjectItem) {
    setEditingProject(project)
    setModalOpen(true)
  }

  async function handleSave(data: ProjectFormData) {
    if (editingProject) {
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          description: data.description || null,
          dueDate: data.dueDate || null,
          sprintSnapshot: data.sprintSnapshot || null,
          stakeholders: data.stakeholders || null,
          attention: data.attention || null,
          blockers: data.blockers || null,
        }),
      })
      if (res.ok) {
        const updated: ProjectItem = await res.json()
        updateProject(editingProject.id, updated)
      }
    } else {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          description: data.description || null,
          dueDate: data.dueDate || null,
          sprintSnapshot: data.sprintSnapshot || null,
          stakeholders: data.stakeholders || null,
          attention: data.attention || null,
          blockers: data.blockers || null,
        }),
      })
      if (res.ok) {
        const created: ProjectItem = await res.json()
        setProjects((prev) => [...prev, created])
      }
    }
    setModalOpen(false)
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id))
    }
  }

  async function handleDecisionAdd(projectId: string, text: string) {
    const res = await fetch(`/api/projects/${projectId}/decisions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
    if (res.ok) {
      const decision: ProjectDecisionItem = await res.json()
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, decisions: [decision, ...p.decisions] }
            : p
        )
      )
    }
  }

  async function handleDecisionDelete(projectId: string, decisionId: string) {
    const res = await fetch(`/api/projects/${projectId}/decisions/${decisionId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, decisions: p.decisions.filter((d) => d.id !== decisionId) }
            : p
        )
      )
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1d1d1f]">Projects</h1>
        <button
          onClick={openAdd}
          className="bg-[#0071e3] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          + Add Project
        </button>
      </div>

      {/* Cards */}
      {sorted.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-[#6e6e73] text-sm">
          No projects yet — add your first one
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl">
          {sorted.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={openEdit}
              onDelete={handleDelete}
              onDecisionAdd={handleDecisionAdd}
              onDecisionDelete={handleDecisionDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        project={editingProject}
        allDesigners={allDesigners}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/__tests__/components/ProjectsPageClient.test.tsx --no-coverage
```

Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/projects/ProjectsPageClient.tsx src/__tests__/components/ProjectsPageClient.test.tsx
git commit -m "feat: ProjectsPageClient orchestrator with state and mutation handlers"
```

---

## Task 9: Server page

**Files:**
- Create: `src/app/(dashboard)/projects/page.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/pages/projects-page.test.tsx`:

```typescript
// This test verifies the server page module exports a default async function.
// Full integration is tested manually in the browser.

describe("projects server page module", () => {
  it("exports a default async function", async () => {
    // The page imports prisma and auth — only check module shape, not execution
    const mod = await import("@/app/(dashboard)/projects/page")
    expect(typeof mod.default).toBe("function")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/pages/projects-page.test.tsx --no-coverage
```

Expected: FAIL — module not found

- [ ] **Step 3: Create `src/app/(dashboard)/projects/page.tsx`**

```tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ProjectsPageClient } from "@/components/projects/ProjectsPageClient"
import { ProjectItem } from "@/types"

export default async function ProjectsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [projects, designers] = await Promise.all([
    prisma.project.findMany({
      where: { userId: session.user.id },
      include: {
        decisions: { orderBy: { createdAt: "desc" } },
        designers: {
          include: { designer: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.designer.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  const serialized: ProjectItem[] = projects.map((p) => ({
    id: p.id,
    userId: p.userId,
    name: p.name,
    phase: p.phase,
    status: p.status,
    description: p.description ?? null,
    dueDate: p.dueDate ? p.dueDate.toISOString().split("T")[0] : null,
    sprintSnapshot: p.sprintSnapshot ?? null,
    stakeholders: p.stakeholders ?? null,
    attention: p.attention ?? null,
    blockers: p.blockers ?? null,
    createdAt: p.createdAt.toISOString(),
    decisions: p.decisions.map((d) => ({
      id: d.id,
      projectId: d.projectId,
      text: d.text,
      createdAt: d.createdAt.toISOString(),
    })),
    designers: p.designers.map((pd) => ({
      designerId: pd.designerId,
      designer: { id: pd.designer.id, name: pd.designer.name },
    })),
  }))

  return (
    <div className="h-full flex flex-col">
      <ProjectsPageClient initialProjects={serialized} allDesigners={designers} />
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/pages/projects-page.test.tsx --no-coverage
```

Expected: PASS

- [ ] **Step 5: Run all tests**

```bash
npx jest --no-coverage
```

Expected: All tests pass

- [ ] **Step 6: Start the dev server and verify manually**

```bash
npm run dev
```

Visit `http://localhost:3000/projects`. Verify:
- Page loads with "Projects" heading and "+ Add Project" button
- Clicking "+ Add Project" opens the modal with all fields
- Adding a project creates a card with the correct status-colored border
- Editing a project pre-fills the modal
- Logging a decision adds it to the card immediately
- Deleting prompts confirmation then removes the card
- Projects link in the sidebar is active when on `/projects`

- [ ] **Step 7: Commit**

```bash
git add src/app/(dashboard)/projects/page.tsx src/__tests__/pages/projects-page.test.tsx
git commit -m "feat: projects server page — auth, Prisma fetch, serialization"
```
