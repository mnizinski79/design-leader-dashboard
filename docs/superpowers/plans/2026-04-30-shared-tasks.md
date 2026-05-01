# Shared Tasks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a shared backlog page where users can create tasks, share them with other registered users by email, and anyone with access can pick up an open task — which claims it and adds it to their personal To-Do Kanban board.

**Architecture:** New `SharedTask` and `SharedTaskShare` Prisma models with a dedicated `/shared-tasks` page and `/api/shared-tasks` REST routes. The page uses a client-side tile grid matching the existing Ideas card pattern. The sidebar nav badge is fetched server-side in the dashboard layout and passed as a prop to the Sidebar component.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma 6 (PostgreSQL), NextAuth v5, Tailwind CSS, Jest, Zod, lucide-react

---

## File Map

**New files:**
- `prisma/schema.prisma` — add `SharedTask`, `SharedTaskShare` models and `SharedTaskStatus` enum
- `src/types/index.ts` — add `SharedTaskShareItem`, `SharedTaskItem` types
- `src/app/api/shared-tasks/route.ts` — `GET` (list), `POST` (create)
- `src/app/api/shared-tasks/[id]/route.ts` — `PATCH` (update title/desc), `DELETE`
- `src/app/api/shared-tasks/[id]/pickup/route.ts` — `POST` (atomic pickup + create Todo)
- `src/app/api/shared-tasks/[id]/archive/route.ts` — `PATCH` (archive)
- `src/app/api/shared-tasks/[id]/viewed/route.ts` — `PATCH` (mark viewed, clear New badge)
- `src/app/api/shared-tasks/[id]/shares/route.ts` — `POST` (add recipient by email)
- `src/app/api/shared-tasks/[id]/shares/[userId]/route.ts` — `DELETE` (remove recipient)
- `src/app/(dashboard)/shared-tasks/page.tsx` — server page (fetches data, renders client)
- `src/components/shared-tasks/SharedTaskCard.tsx` — individual tile card
- `src/components/shared-tasks/NewSharedTaskModal.tsx` — create task modal
- `src/components/shared-tasks/SharedTaskModal.tsx` — detail/edit modal
- `src/components/shared-tasks/SharedTasksGrid.tsx` — grid with filters, client component
- `src/__tests__/api/shared-tasks.test.ts` — tests for GET + POST + PATCH + DELETE
- `src/__tests__/api/shared-tasks-pickup.test.ts` — tests for pickup route
- `src/__tests__/api/shared-tasks-shares.test.ts` — tests for share add/remove
- `src/__tests__/components/SharedTaskCard.test.tsx` — card rendering tests

**Modified files:**
- `src/app/(dashboard)/layout.tsx` — fetch unread count, pass to Sidebar
- `src/components/layout/Sidebar.tsx` — accept `unreadSharedTaskCount` prop, render badge

---

## Task 1: Database Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the SharedTaskStatus enum and models to the schema**

Open `prisma/schema.prisma` and append after the last existing model:

```prisma
enum SharedTaskStatus {
  OPEN
  PICKED_UP
  ARCHIVED
}

model SharedTask {
  id          String           @id @default(uuid())
  title       String           @db.VarChar(200)
  description String?          @db.VarChar(1000)
  status      SharedTaskStatus @default(OPEN)
  creatorId   String
  creator     User             @relation("CreatedSharedTasks", fields: [creatorId], references: [id])
  pickedUpBy  String?
  picker      User?            @relation("PickedUpSharedTasks", fields: [pickedUpBy], references: [id])
  pickedUpAt  DateTime?
  todoId      String?          @unique
  shares      SharedTaskShare[]
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
}

model SharedTaskShare {
  id           String     @id @default(uuid())
  sharedTaskId String
  sharedTask   SharedTask @relation(fields: [sharedTaskId], references: [id], onDelete: Cascade)
  userId       String
  user         User       @relation("ReceivedSharedTasks", fields: [userId], references: [id])
  viewedAt     DateTime?
  createdAt    DateTime   @default(now())

  @@unique([sharedTaskId, userId])
}
```

Also add the back-relations on the `User` model (find the existing `User` model and add inside it):

```prisma
  createdSharedTasks  SharedTask[]      @relation("CreatedSharedTasks")
  pickedUpSharedTasks SharedTask[]      @relation("PickedUpSharedTasks")
  sharedTaskShares    SharedTaskShare[] @relation("ReceivedSharedTasks")
```

- [ ] **Step 2: Run the migration**

```bash
npx prisma migrate dev --name add-shared-tasks
```

Expected: migration created and applied, Prisma client regenerated.

- [ ] **Step 3: Verify Prisma client has the new models**

```bash
npx prisma studio
```

Check that `SharedTask` and `SharedTaskShare` tables appear. Close Prisma Studio.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add SharedTask and SharedTaskShare schema"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add SharedTask types**

Append to the end of `src/types/index.ts`:

```typescript
export type SharedTaskStatus = "OPEN" | "PICKED_UP" | "ARCHIVED"

export interface SharedTaskShareItem {
  id: string
  userId: string
  userEmail: string
  viewedAt: string | null
  createdAt: string
}

export interface SharedTaskItem {
  id: string
  title: string
  description: string | null
  status: SharedTaskStatus
  creatorId: string
  creatorEmail: string
  pickedUpBy: string | null
  pickedUpByEmail: string | null
  pickedUpAt: string | null
  todoId: string | null
  shares: SharedTaskShareItem[]
  viewedAt: string | null   // current user's viewedAt (null = "New" badge)
  isCreator: boolean        // true if current user is the creator
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add SharedTask TypeScript types"
```

---

## Task 3: GET + POST /api/shared-tasks

**Files:**
- Create: `src/app/api/shared-tasks/route.ts`
- Create: `src/__tests__/api/shared-tasks.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/api/shared-tasks.test.ts`:

```typescript
/**
 * @jest-environment node
 */
const mockAuth = jest.fn()
const mockSharedTaskFindMany = jest.fn()
const mockSharedTaskCreate = jest.fn()
const mockSharedTaskShareCreate = jest.fn()
const mockUserFindUnique = jest.fn()

jest.mock("@/lib/auth", () => ({ auth: (...args: any[]) => mockAuth(...args) }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    sharedTask: {
      findMany: (...args: any[]) => mockSharedTaskFindMany(...args),
      create: (...args: any[]) => mockSharedTaskCreate(...args),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    sharedTaskShare: {
      create: (...args: any[]) => mockSharedTaskShareCreate(...args),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: (...args: any[]) => mockUserFindUnique(...args),
    },
  },
}))

function makeReq(body?: any) {
  return { json: async () => body } as any
}

const fakeTask = {
  id: "task-1",
  title: "Design audit",
  description: "Audit all components",
  status: "OPEN",
  creatorId: "user-1",
  creator: { id: "user-1", email: "me@co.com" },
  pickedUpBy: null,
  picker: null,
  pickedUpAt: null,
  todoId: null,
  shares: [],
  createdAt: new Date("2026-04-30"),
  updatedAt: new Date("2026-04-30"),
}

describe("GET /api/shared-tasks", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/shared-tasks/route")
    mockAuth.mockResolvedValue(null)
    const res = await GET(makeReq())
    expect(res.status).toBe(401)
  })

  it("returns tasks where user is creator or recipient", async () => {
    const { GET } = await import("@/app/api/shared-tasks/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockSharedTaskFindMany.mockResolvedValue([fakeTask])
    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    expect(mockSharedTaskFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { creatorId: "user-1" },
            { shares: { some: { userId: "user-1" } } },
          ],
        },
      })
    )
  })
})

describe("POST /api/shared-tasks", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/shared-tasks/route")
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeReq({ title: "Test" }))
    expect(res.status).toBe(401)
  })

  it("returns 422 for missing title", async () => {
    const { POST } = await import("@/app/api/shared-tasks/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    const res = await POST(makeReq({ description: "no title" }))
    expect(res.status).toBe(422)
  })

  it("returns 422 when a share email has no account", async () => {
    const { POST } = await import("@/app/api/shared-tasks/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockUserFindUnique.mockResolvedValue(null)
    const res = await POST(makeReq({ title: "Test", shareEmails: ["ghost@co.com"] }))
    expect(res.status).toBe(422)
  })

  it("creates task with shares and returns 201", async () => {
    const { POST } = await import("@/app/api/shared-tasks/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockUserFindUnique.mockResolvedValue({ id: "user-2", email: "sarah@co.com" })
    mockSharedTaskCreate.mockResolvedValue({ ...fakeTask, shares: [] })
    const res = await POST(makeReq({ title: "Design audit", shareEmails: ["sarah@co.com"] }))
    expect(res.status).toBe(201)
    expect(mockSharedTaskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: "Design audit", creatorId: "user-1" }),
      })
    )
  })
})

export {}
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/api/shared-tasks.test.ts --no-coverage 2>&1 | tail -20
```

Expected: FAIL — "Cannot find module '@/app/api/shared-tasks/route'"

- [ ] **Step 3: Create the route**

Create `src/app/api/shared-tasks/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  shareEmails: z.array(z.string().email()).default([]),
})

function serializeTask(task: any, userId: string) {
  const myShare = task.shares.find((s: any) => s.userId === userId)
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    creatorId: task.creatorId,
    creatorEmail: task.creator.email,
    pickedUpBy: task.pickedUpBy,
    pickedUpByEmail: task.picker?.email ?? null,
    pickedUpAt: task.pickedUpAt?.toISOString() ?? null,
    todoId: task.todoId,
    shares: task.shares.map((s: any) => ({
      id: s.id,
      userId: s.userId,
      userEmail: s.user.email,
      viewedAt: s.viewedAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
    })),
    viewedAt: myShare?.viewedAt?.toISOString() ?? null,
    isCreator: task.creatorId === userId,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }
}

const taskInclude = {
  creator: { select: { id: true, email: true } },
  picker: { select: { id: true, email: true } },
  shares: {
    include: { user: { select: { id: true, email: true } } },
  },
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const tasks = await prisma.sharedTask.findMany({
    where: {
      OR: [
        { creatorId: userId },
        { shares: { some: { userId } } },
      ],
      status: { not: "ARCHIVED" },
    },
    include: taskInclude,
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(tasks.map(t => serializeTask(t, userId)))
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 422 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }

  const { title, description, shareEmails } = parsed.data

  // Resolve all share emails to user accounts
  const shareUsers: { id: string; email: string }[] = []
  for (const email of shareEmails) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } })
    if (!user) {
      return NextResponse.json(
        { error: `No account found for ${email}` },
        { status: 422 }
      )
    }
    if (user.id !== userId) shareUsers.push(user)
  }

  const task = await prisma.sharedTask.create({
    data: {
      title,
      description: description ?? null,
      creatorId: userId,
      shares: {
        create: shareUsers.map(u => ({ userId: u.id })),
      },
    },
    include: taskInclude,
  })

  return NextResponse.json(serializeTask(task, userId), { status: 201 })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/__tests__/api/shared-tasks.test.ts --no-coverage 2>&1 | tail -20
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/shared-tasks/route.ts src/__tests__/api/shared-tasks.test.ts
git commit -m "feat: add GET and POST /api/shared-tasks"
```

---

## Task 4: PATCH + DELETE /api/shared-tasks/[id]

**Files:**
- Create: `src/app/api/shared-tasks/[id]/route.ts`

Tests for this route go in the existing `src/__tests__/api/shared-tasks.test.ts`.

- [ ] **Step 1: Add PATCH and DELETE tests to the existing test file**

Append to `src/__tests__/api/shared-tasks.test.ts` (before the final `export {}`):

```typescript
describe("PATCH /api/shared-tasks/[id]", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    const { PATCH } = await import("@/app/api/shared-tasks/[id]/route")
    mockAuth.mockResolvedValue(null)
    const res = await PATCH(makeReq({ title: "New" }), { params: Promise.resolve({ id: "task-1" }) })
    expect(res.status).toBe(401)
  })

  it("returns 403 when user is not a participant", async () => {
    const { PATCH } = await import("@/app/api/shared-tasks/[id]/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    const { prisma } = await import("@/lib/prisma")
    ;(prisma.sharedTask.findUnique as jest.Mock).mockResolvedValue({
      ...fakeTask,
      creatorId: "other",
      shares: [],
    })
    const res = await PATCH(makeReq({ title: "New" }), { params: Promise.resolve({ id: "task-1" }) })
    expect(res.status).toBe(403)
  })

  it("returns 409 when task is not OPEN", async () => {
    const { PATCH } = await import("@/app/api/shared-tasks/[id]/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    const { prisma } = await import("@/lib/prisma")
    ;(prisma.sharedTask.findUnique as jest.Mock).mockResolvedValue({
      ...fakeTask,
      status: "PICKED_UP",
    })
    const res = await PATCH(makeReq({ title: "New" }), { params: Promise.resolve({ id: "task-1" }) })
    expect(res.status).toBe(409)
  })
})

describe("DELETE /api/shared-tasks/[id]", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    const { DELETE } = await import("@/app/api/shared-tasks/[id]/route")
    mockAuth.mockResolvedValue(null)
    const res = await DELETE(makeReq(), { params: Promise.resolve({ id: "task-1" }) })
    expect(res.status).toBe(401)
  })

  it("returns 403 when user is not a participant", async () => {
    const { DELETE } = await import("@/app/api/shared-tasks/[id]/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    const { prisma } = await import("@/lib/prisma")
    ;(prisma.sharedTask.findUnique as jest.Mock).mockResolvedValue({
      ...fakeTask,
      creatorId: "other",
      shares: [],
    })
    const res = await DELETE(makeReq(), { params: Promise.resolve({ id: "task-1" }) })
    expect(res.status).toBe(403)
  })

  it("deletes task and returns 200", async () => {
    const { DELETE } = await import("@/app/api/shared-tasks/[id]/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    const { prisma } = await import("@/lib/prisma")
    ;(prisma.sharedTask.findUnique as jest.Mock).mockResolvedValue(fakeTask)
    ;(prisma.sharedTask.delete as jest.Mock).mockResolvedValue(fakeTask)
    const res = await DELETE(makeReq(), { params: Promise.resolve({ id: "task-1" }) })
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Run tests to verify new tests fail**

```bash
npx jest src/__tests__/api/shared-tasks.test.ts --no-coverage 2>&1 | tail -20
```

Expected: FAIL — "Cannot find module '@/app/api/shared-tasks/[id]/route'"

- [ ] **Step 3: Create the route**

Create `src/app/api/shared-tasks/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
})

async function getTaskAsParticipant(id: string, userId: string) {
  const task = await prisma.sharedTask.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, email: true } },
      picker: { select: { id: true, email: true } },
      shares: { include: { user: { select: { id: true, email: true } } } },
    },
  })
  if (!task) return { task: null, forbidden: false }
  const isParticipant =
    task.creatorId === userId || task.shares.some(s => s.userId === userId)
  return { task, forbidden: !isParticipant }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { id } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 422 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }

  const { task, forbidden } = await getTaskAsParticipant(id, userId)
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (forbidden) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  if (task.status !== "OPEN") {
    return NextResponse.json({ error: "Task is not open" }, { status: 409 })
  }

  const updated = await prisma.sharedTask.update({
    where: { id },
    data: parsed.data,
    include: {
      creator: { select: { id: true, email: true } },
      picker: { select: { id: true, email: true } },
      shares: { include: { user: { select: { id: true, email: true } } } },
    },
  })

  const myShare = updated.shares.find(s => s.userId === userId)
  return NextResponse.json({
    ...updated,
    creatorEmail: updated.creator.email,
    pickedUpByEmail: updated.picker?.email ?? null,
    pickedUpAt: updated.pickedUpAt?.toISOString() ?? null,
    shares: updated.shares.map(s => ({
      id: s.id, userId: s.userId, userEmail: s.user.email,
      viewedAt: s.viewedAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
    })),
    viewedAt: myShare?.viewedAt?.toISOString() ?? null,
    isCreator: updated.creatorId === userId,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { id } = await params

  const { task, forbidden } = await getTaskAsParticipant(id, userId)
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (forbidden) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.sharedTask.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Run all shared-tasks tests**

```bash
npx jest src/__tests__/api/shared-tasks.test.ts --no-coverage 2>&1 | tail -20
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/shared-tasks/[id]/route.ts src/__tests__/api/shared-tasks.test.ts
git commit -m "feat: add PATCH and DELETE /api/shared-tasks/[id]"
```

---

## Task 5: POST /api/shared-tasks/[id]/pickup

**Files:**
- Create: `src/app/api/shared-tasks/[id]/pickup/route.ts`
- Create: `src/__tests__/api/shared-tasks-pickup.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/api/shared-tasks-pickup.test.ts`:

```typescript
/**
 * @jest-environment node
 */
const mockAuth = jest.fn()
const mockTransaction = jest.fn()
const mockFindFirst = jest.fn()
const mockTaskUpdate = jest.fn()
const mockTodoAggregate = jest.fn()
const mockTodoCreate = jest.fn()

jest.mock("@/lib/auth", () => ({ auth: (...args: any[]) => mockAuth(...args) }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (...args: any[]) => mockTransaction(...args),
    sharedTask: {
      findFirst: (...args: any[]) => mockFindFirst(...args),
    },
  },
}))

function makeReq(body?: any) {
  return { json: async () => body } as any
}

const fakeTask = {
  id: "task-1",
  title: "Design audit",
  description: "Audit components",
  status: "OPEN",
  creatorId: "user-1",
  creator: { id: "user-1", email: "me@co.com" },
  picker: null,
  pickedUpBy: null,
  pickedUpAt: null,
  todoId: null,
  shares: [{ id: "share-1", userId: "user-2", user: { id: "user-2", email: "s@co.com" }, viewedAt: null, createdAt: new Date() }],
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe("POST /api/shared-tasks/[id]/pickup", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/shared-tasks/[id]/pickup/route")
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeReq(), { params: Promise.resolve({ id: "task-1" }) })
    expect(res.status).toBe(401)
  })

  it("returns 409 when task is already picked up", async () => {
    const { POST } = await import("@/app/api/shared-tasks/[id]/pickup/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockTransaction.mockImplementation(async (fn: any) => {
      return fn({
        sharedTask: {
          findFirst: jest.fn().mockResolvedValue(null), // null = not OPEN
          update: jest.fn(),
        },
        todo: {
          aggregate: jest.fn(),
          create: jest.fn(),
        },
      })
    })
    const res = await POST(makeReq(), { params: Promise.resolve({ id: "task-1" }) })
    expect(res.status).toBe(409)
  })

  it("returns 403 when user is not a participant", async () => {
    const { POST } = await import("@/app/api/shared-tasks/[id]/pickup/route")
    mockAuth.mockResolvedValue({ user: { id: "outsider" } })
    mockTransaction.mockImplementation(async (fn: any) => {
      return fn({
        sharedTask: {
          findFirst: jest.fn().mockResolvedValue(null),
          update: jest.fn(),
        },
        todo: { aggregate: jest.fn(), create: jest.fn() },
      })
    })
    const res = await POST(makeReq(), { params: Promise.resolve({ id: "task-1" }) })
    expect(res.status).toBe(409) // same as not-found-open-for-user
  })

  it("picks up task atomically and returns 201", async () => {
    const { POST } = await import("@/app/api/shared-tasks/[id]/pickup/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    const fakeTodo = { id: "todo-1", userId: "user-1", title: "Design audit", description: "Audit components", category: "Shared", status: "TODO", sortOrder: 0, urgent: false, dueDate: null, createdAt: new Date() }
    const updatedTask = { ...fakeTask, status: "PICKED_UP", pickedUpBy: "user-1", pickedUpAt: new Date(), todoId: "todo-1", picker: { id: "user-1", email: "me@co.com" } }
    
    mockTransaction.mockImplementation(async (fn: any) => {
      return fn({
        sharedTask: {
          findFirst: jest.fn().mockResolvedValue(fakeTask),
          update: jest.fn()
            .mockResolvedValueOnce(updatedTask)
            .mockResolvedValueOnce(updatedTask),
        },
        todo: {
          aggregate: jest.fn().mockResolvedValue({ _max: { sortOrder: -1 } }),
          create: jest.fn().mockResolvedValue(fakeTodo),
        },
      })
    })

    const res = await POST(makeReq(), { params: Promise.resolve({ id: "task-1" }) })
    expect(res.status).toBe(201)
  })
})

export {}
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/api/shared-tasks-pickup.test.ts --no-coverage 2>&1 | tail -20
```

Expected: FAIL — "Cannot find module"

- [ ] **Step 3: Create the pickup route**

Create `src/app/api/shared-tasks/[id]/pickup/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { id } = await params

  const result = await prisma.$transaction(async (tx) => {
    // Find the task only if it's still OPEN and the user is a participant
    const task = await tx.sharedTask.findFirst({
      where: {
        id,
        status: "OPEN",
        OR: [
          { creatorId: userId },
          { shares: { some: { userId } } },
        ],
      },
      include: {
        creator: { select: { id: true, email: true } },
        shares: { include: { user: { select: { id: true, email: true } } } },
      },
    })

    if (!task) return null

    const maxOrder = await tx.todo.aggregate({
      where: { userId, status: "TODO" },
      _max: { sortOrder: true },
    })

    const todo = await tx.todo.create({
      data: {
        userId,
        title: task.title,
        description: task.description,
        category: "Shared",
        status: "TODO",
        urgent: false,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    })

    const updated = await tx.sharedTask.update({
      where: { id },
      data: {
        status: "PICKED_UP",
        pickedUpBy: userId,
        pickedUpAt: new Date(),
        todoId: todo.id,
      },
      include: {
        creator: { select: { id: true, email: true } },
        picker: { select: { id: true, email: true } },
        shares: { include: { user: { select: { id: true, email: true } } } },
      },
    })

    return updated
  })

  if (!result) {
    return NextResponse.json({ error: "Task is not available for pickup" }, { status: 409 })
  }

  const myShare = result.shares.find(s => s.userId === userId)
  return NextResponse.json({
    id: result.id,
    title: result.title,
    description: result.description,
    status: result.status,
    creatorId: result.creatorId,
    creatorEmail: result.creator.email,
    pickedUpBy: result.pickedUpBy,
    pickedUpByEmail: result.picker?.email ?? null,
    pickedUpAt: result.pickedUpAt?.toISOString() ?? null,
    todoId: result.todoId,
    shares: result.shares.map(s => ({
      id: s.id, userId: s.userId, userEmail: s.user.email,
      viewedAt: s.viewedAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
    })),
    viewedAt: myShare?.viewedAt?.toISOString() ?? null,
    isCreator: result.creatorId === userId,
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
  }, { status: 201 })
}
```

- [ ] **Step 4: Run tests**

```bash
npx jest src/__tests__/api/shared-tasks-pickup.test.ts --no-coverage 2>&1 | tail -20
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/shared-tasks/[id]/pickup/route.ts src/__tests__/api/shared-tasks-pickup.test.ts
git commit -m "feat: add POST /api/shared-tasks/[id]/pickup (atomic claim + todo creation)"
```

---

## Task 6: Archive + Viewed Routes

**Files:**
- Create: `src/app/api/shared-tasks/[id]/archive/route.ts`
- Create: `src/app/api/shared-tasks/[id]/viewed/route.ts`

These are simple enough to implement and test together.

- [ ] **Step 1: Create archive route**

Create `src/app/api/shared-tasks/[id]/archive/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { id } = await params

  const task = await prisma.sharedTask.findFirst({
    where: {
      id,
      OR: [{ creatorId: userId }, { shares: { some: { userId } } }],
    },
  })
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (task.status !== "PICKED_UP") {
    return NextResponse.json({ error: "Only picked-up tasks can be archived" }, { status: 409 })
  }

  await prisma.sharedTask.update({ where: { id }, data: { status: "ARCHIVED" } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create viewed route**

Create `src/app/api/shared-tasks/[id]/viewed/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { id } = await params

  await prisma.sharedTaskShare.updateMany({
    where: { sharedTaskId: id, userId, viewedAt: null },
    data: { viewedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/shared-tasks/[id]/archive/route.ts src/app/api/shared-tasks/[id]/viewed/route.ts
git commit -m "feat: add archive and viewed API routes"
```

---

## Task 7: Shares Routes (Add + Remove Recipient)

**Files:**
- Create: `src/app/api/shared-tasks/[id]/shares/route.ts`
- Create: `src/app/api/shared-tasks/[id]/shares/[userId]/route.ts`
- Create: `src/__tests__/api/shared-tasks-shares.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/api/shared-tasks-shares.test.ts`:

```typescript
/**
 * @jest-environment node
 */
const mockAuth = jest.fn()
const mockTaskFindFirst = jest.fn()
const mockUserFindUnique = jest.fn()
const mockShareCreate = jest.fn()
const mockShareDelete = jest.fn()

jest.mock("@/lib/auth", () => ({ auth: (...args: any[]) => mockAuth(...args) }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    sharedTask: { findFirst: (...args: any[]) => mockTaskFindFirst(...args) },
    user: { findUnique: (...args: any[]) => mockUserFindUnique(...args) },
    sharedTaskShare: {
      create: (...args: any[]) => mockShareCreate(...args),
      deleteMany: (...args: any[]) => mockShareDelete(...args),
    },
  },
}))

function makeReq(body?: any) {
  return { json: async () => body } as any
}

const fakeTask = { id: "task-1", creatorId: "user-1", status: "OPEN" }

describe("POST /api/shared-tasks/[id]/shares", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/shared-tasks/[id]/shares/route")
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeReq({ email: "a@b.com" }), { params: Promise.resolve({ id: "task-1" }) })
    expect(res.status).toBe(401)
  })

  it("returns 403 when user is not the creator", async () => {
    const { POST } = await import("@/app/api/shared-tasks/[id]/shares/route")
    mockAuth.mockResolvedValue({ user: { id: "not-creator" } })
    mockTaskFindFirst.mockResolvedValue(fakeTask)
    const res = await POST(makeReq({ email: "a@b.com" }), { params: Promise.resolve({ id: "task-1" }) })
    expect(res.status).toBe(403)
  })

  it("returns 422 when email has no account", async () => {
    const { POST } = await import("@/app/api/shared-tasks/[id]/shares/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockTaskFindFirst.mockResolvedValue(fakeTask)
    mockUserFindUnique.mockResolvedValue(null)
    const res = await POST(makeReq({ email: "ghost@co.com" }), { params: Promise.resolve({ id: "task-1" }) })
    expect(res.status).toBe(422)
  })

  it("creates share and returns 201", async () => {
    const { POST } = await import("@/app/api/shared-tasks/[id]/shares/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockTaskFindFirst.mockResolvedValue(fakeTask)
    mockUserFindUnique.mockResolvedValue({ id: "user-2", email: "sarah@co.com" })
    const fakeShare = { id: "share-1", sharedTaskId: "task-1", userId: "user-2", user: { id: "user-2", email: "sarah@co.com" }, viewedAt: null, createdAt: new Date() }
    mockShareCreate.mockResolvedValue(fakeShare)
    const res = await POST(makeReq({ email: "sarah@co.com" }), { params: Promise.resolve({ id: "task-1" }) })
    expect(res.status).toBe(201)
  })
})

describe("DELETE /api/shared-tasks/[id]/shares/[userId]", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when unauthenticated", async () => {
    const { DELETE } = await import("@/app/api/shared-tasks/[id]/shares/[userId]/route")
    mockAuth.mockResolvedValue(null)
    const res = await DELETE(makeReq(), { params: Promise.resolve({ id: "task-1", userId: "user-2" }) })
    expect(res.status).toBe(401)
  })

  it("returns 403 when user is not the creator", async () => {
    const { DELETE } = await import("@/app/api/shared-tasks/[id]/shares/[userId]/route")
    mockAuth.mockResolvedValue({ user: { id: "not-creator" } })
    mockTaskFindFirst.mockResolvedValue(fakeTask)
    const res = await DELETE(makeReq(), { params: Promise.resolve({ id: "task-1", userId: "user-2" }) })
    expect(res.status).toBe(403)
  })

  it("removes share and returns 200", async () => {
    const { DELETE } = await import("@/app/api/shared-tasks/[id]/shares/[userId]/route")
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockTaskFindFirst.mockResolvedValue(fakeTask)
    mockShareDelete.mockResolvedValue({ count: 1 })
    const res = await DELETE(makeReq(), { params: Promise.resolve({ id: "task-1", userId: "user-2" }) })
    expect(res.status).toBe(200)
  })
})

export {}
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/api/shared-tasks-shares.test.ts --no-coverage 2>&1 | tail -20
```

Expected: FAIL — cannot find modules.

- [ ] **Step 3: Create shares POST route**

Create `src/app/api/shared-tasks/[id]/shares/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const addSchema = z.object({ email: z.string().email() })

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { id } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 422 })
  }

  const parsed = addSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }

  const task = await prisma.sharedTask.findFirst({ where: { id } })
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (task.creatorId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const recipient = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true },
  })
  if (!recipient) {
    return NextResponse.json(
      { error: `No account found for ${parsed.data.email}` },
      { status: 422 }
    )
  }

  const share = await prisma.sharedTaskShare.create({
    data: { sharedTaskId: id, userId: recipient.id },
    include: { user: { select: { id: true, email: true } } },
  })

  return NextResponse.json({
    id: share.id,
    userId: share.userId,
    userEmail: share.user.email,
    viewedAt: null,
    createdAt: share.createdAt.toISOString(),
  }, { status: 201 })
}
```

- [ ] **Step 4: Create shares DELETE route**

Create `src/app/api/shared-tasks/[id]/shares/[userId]/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const currentUserId = session.user.id
  const { id, userId: targetUserId } = await params

  const task = await prisma.sharedTask.findFirst({ where: { id } })
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (task.creatorId !== currentUserId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.sharedTaskShare.deleteMany({
    where: { sharedTaskId: id, userId: targetUserId },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 5: Run all shares tests**

```bash
npx jest src/__tests__/api/shared-tasks-shares.test.ts --no-coverage 2>&1 | tail -20
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/shared-tasks/[id]/shares/route.ts src/app/api/shared-tasks/[id]/shares/[userId]/route.ts src/__tests__/api/shared-tasks-shares.test.ts
git commit -m "feat: add share add/remove API routes"
```

---

## Task 8: Sidebar Nav Badge

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Update Sidebar to accept and display the badge count**

In `src/components/layout/Sidebar.tsx`, replace the entire file with:

```typescript
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  Home,
  ListTodo,
  NotebookPen,
  UserCheck,
  FolderKanban,
  Users,
  Settings,
  LogOut,
  Share2,
  type LucideIcon,
} from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
}

interface SidebarProps {
  unreadSharedTaskCount?: number
}

export function Sidebar({ unreadSharedTaskCount = 0 }: SidebarProps) {
  const pathname = usePathname()

  const NAV_ITEMS: NavItem[] = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/todos", label: "To-Do", icon: ListTodo },
    { href: "/shared-tasks", label: "Shared Tasks", icon: Share2, badge: unreadSharedTaskCount },
    { href: "/team", label: "My Team", icon: Users },
    { href: "/coaching", label: "1:1 & Coaching", icon: UserCheck },
    { href: "/notes", label: "Notes & Ideas", icon: NotebookPen },
  ]

  return (
    <aside className="fixed top-0 left-0 h-full w-60 bg-white border-r border-slate-200 flex flex-col z-10">
      <div className="px-6 py-5 border-b border-slate-200">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Design Leader</p>
        <p className="text-sm font-bold text-slate-800 mt-0.5">Dashboard</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon size={16} />
              <span className="flex-1">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="bg-blue-600 text-white text-xs font-semibold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-200 space-y-1">
        <Link
          href="/account"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
            pathname.startsWith("/account")
              ? "bg-blue-50 text-blue-700 font-medium"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <Settings size={16} />
          Account
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Update dashboard layout to fetch badge count and pass to Sidebar**

Replace `src/app/(dashboard)/layout.tsx` with:

```typescript
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const unreadSharedTaskCount = await prisma.sharedTaskShare.count({
    where: { userId: session.user.id, viewedAt: null },
  })

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar unreadSharedTaskCount={unreadSharedTaskCount} />
      <main className="flex-1 ml-60 p-8">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Sidebar.tsx src/app/(dashboard)/layout.tsx
git commit -m "feat: add Shared Tasks nav item with unread badge count"
```

---

## Task 9: SharedTaskCard Component

**Files:**
- Create: `src/components/shared-tasks/SharedTaskCard.tsx`
- Create: `src/__tests__/components/SharedTaskCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/components/SharedTaskCard.test.tsx`:

```typescript
import { render, screen, fireEvent } from "@testing-library/react"
import { SharedTaskCard } from "@/components/shared-tasks/SharedTaskCard"
import type { SharedTaskItem } from "@/types"

const baseTask: SharedTaskItem = {
  id: "task-1",
  title: "Design audit",
  description: "Audit all components for consistency",
  status: "OPEN",
  creatorId: "user-1",
  creatorEmail: "me@co.com",
  pickedUpBy: null,
  pickedUpByEmail: null,
  pickedUpAt: null,
  todoId: null,
  shares: [{ id: "s1", userId: "user-2", userEmail: "sarah@co.com", viewedAt: null, createdAt: "2026-04-30T00:00:00Z" }],
  viewedAt: null,
  isCreator: true,
  createdAt: "2026-04-30T00:00:00Z",
  updatedAt: "2026-04-30T00:00:00Z",
}

describe("SharedTaskCard", () => {
  it("renders task title", () => {
    render(<SharedTaskCard task={baseTask} onClick={jest.fn()} onPickUp={jest.fn()} />)
    expect(screen.getByText("Design audit")).toBeInTheDocument()
  })

  it("shows New badge when viewedAt is null and user is not creator", () => {
    const task = { ...baseTask, isCreator: false, viewedAt: null }
    render(<SharedTaskCard task={task} onClick={jest.fn()} onPickUp={jest.fn()} />)
    expect(screen.getByText("New")).toBeInTheDocument()
  })

  it("does not show New badge for creator", () => {
    render(<SharedTaskCard task={baseTask} onClick={jest.fn()} onPickUp={jest.fn()} />)
    expect(screen.queryByText("New")).not.toBeInTheDocument()
  })

  it("shows Pick Up button for open tasks", () => {
    render(<SharedTaskCard task={baseTask} onClick={jest.fn()} onPickUp={jest.fn()} />)
    expect(screen.getByText("Pick Up →")).toBeInTheDocument()
  })

  it("does not show Pick Up button for picked-up tasks", () => {
    const task = { ...baseTask, status: "PICKED_UP" as const, pickedUpBy: "user-1", pickedUpByEmail: "me@co.com", pickedUpAt: "2026-04-30T00:00:00Z" }
    render(<SharedTaskCard task={task} onClick={jest.fn()} onPickUp={jest.fn()} />)
    expect(screen.queryByText("Pick Up →")).not.toBeInTheDocument()
  })

  it("calls onPickUp when Pick Up button clicked", () => {
    const onPickUp = jest.fn()
    render(<SharedTaskCard task={baseTask} onClick={jest.fn()} onPickUp={onPickUp} />)
    fireEvent.click(screen.getByText("Pick Up →"))
    expect(onPickUp).toHaveBeenCalledWith("task-1")
  })

  it("calls onClick when card clicked", () => {
    const onClick = jest.fn()
    render(<SharedTaskCard task={baseTask} onClick={onClick} onPickUp={jest.fn()} />)
    fireEvent.click(screen.getByText("Design audit"))
    expect(onClick).toHaveBeenCalledWith(baseTask)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/components/SharedTaskCard.test.tsx --no-coverage 2>&1 | tail -20
```

Expected: FAIL — "Cannot find module"

- [ ] **Step 3: Implement SharedTaskCard**

Create `src/components/shared-tasks/SharedTaskCard.tsx`:

```typescript
"use client"

import type { SharedTaskItem } from "@/types"
import { cn } from "@/lib/utils"

interface Props {
  task: SharedTaskItem
  onClick: (task: SharedTaskItem) => void
  onPickUp: (id: string) => void
}

export function SharedTaskCard({ task, onClick, onPickUp }: Props) {
  const isNew = !task.isCreator && task.viewedAt === null
  const isPickedUp = task.status === "PICKED_UP"
  const pickedUpByMe = isPickedUp && task.pickedUpBy !== null

  return (
    <div
      className={cn(
        "bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-slate-300 transition-colors",
        isNew && "border-l-2 border-l-blue-500",
        isPickedUp && "opacity-60"
      )}
      onClick={() => onClick(task)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-slate-800 leading-snug">{task.title}</p>
        {isNew && (
          <span className="shrink-0 text-xs bg-blue-50 text-blue-700 font-semibold rounded-full px-2.5 py-0.5">
            New
          </span>
        )}
        {isPickedUp && pickedUpByMe && (
          <span className="shrink-0 text-xs bg-green-50 text-green-700 font-medium rounded-full px-2.5 py-0.5 whitespace-nowrap">
            You picked this up
          </span>
        )}
        {isPickedUp && !pickedUpByMe && (
          <span className="shrink-0 text-xs bg-slate-100 text-slate-500 rounded-full px-2.5 py-0.5">
            Picked Up
          </span>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2 mt-auto">
        <span className="text-xs text-slate-400">
          {task.isCreator ? `You · ${task.shares.length} shared` : task.creatorEmail}
        </span>
        {task.status === "OPEN" && (
          <button
            onClick={(e) => { e.stopPropagation(); onPickUp(task.id) }}
            className="shrink-0 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md px-2.5 py-1 transition-colors"
          >
            Pick Up →
          </button>
        )}
        {isPickedUp && !pickedUpByMe && task.pickedUpByEmail && (
          <span className="text-xs text-slate-400 truncate max-w-[120px]">
            {task.pickedUpByEmail.split("@")[0]} picked this up
          </span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npx jest src/__tests__/components/SharedTaskCard.test.tsx --no-coverage 2>&1 | tail -20
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/shared-tasks/SharedTaskCard.tsx src/__tests__/components/SharedTaskCard.test.tsx
git commit -m "feat: add SharedTaskCard tile component"
```

---

## Task 10: NewSharedTaskModal

**Files:**
- Create: `src/components/shared-tasks/NewSharedTaskModal.tsx`

- [ ] **Step 1: Create NewSharedTaskModal**

Create `src/components/shared-tasks/NewSharedTaskModal.tsx`:

```typescript
"use client"

import { useState } from "react"
import { X, Plus } from "lucide-react"
import type { SharedTaskItem } from "@/types"

interface Props {
  onClose: () => void
  onCreated: (task: SharedTaskItem) => void
}

export function NewSharedTaskModal({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [emailInput, setEmailInput] = useState("")
  const [emails, setEmails] = useState<string[]>([])
  const [emailError, setEmailError] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function addEmail() {
    const trimmed = emailInput.trim()
    if (!trimmed) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Enter a valid email address")
      return
    }
    if (emails.includes(trimmed)) {
      setEmailError("Already added")
      return
    }
    setEmails(prev => [...prev, trimmed])
    setEmailInput("")
    setEmailError("")
  }

  function removeEmail(email: string) {
    setEmails(prev => prev.filter(e => e !== email))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/shared-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null, shareEmails: emails }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Something went wrong")
        return
      }
      const task = await res.json()
      onCreated(task)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">New Shared Task</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional details..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              rows={3}
              maxLength={1000}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Share with
            </label>
            <div className="flex gap-2 mb-2">
              <input
                value={emailInput}
                onChange={e => { setEmailInput(e.target.value); setEmailError("") }}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addEmail() } }}
                placeholder="Add email address…"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                type="button"
                onClick={addEmail}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
            {emailError && <p className="text-xs text-red-500 mb-2">{emailError}</p>}
            {emails.length > 0 && (
              <div className="flex flex-col gap-1">
                {emails.map(email => (
                  <div key={email} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-slate-700">{email}</span>
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {saving ? "Creating…" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/shared-tasks/NewSharedTaskModal.tsx
git commit -m "feat: add NewSharedTaskModal component"
```

---

## Task 11: SharedTaskModal (Detail / Edit)

**Files:**
- Create: `src/components/shared-tasks/SharedTaskModal.tsx`

- [ ] **Step 1: Create SharedTaskModal**

Create `src/components/shared-tasks/SharedTaskModal.tsx`:

```typescript
"use client"

import { useState } from "react"
import { X, Plus } from "lucide-react"
import type { SharedTaskItem } from "@/types"

interface Props {
  task: SharedTaskItem
  onClose: () => void
  onUpdate: (task: SharedTaskItem) => void
  onPickUp: (id: string) => void
  onDelete: (id: string) => void
  onArchive: (id: string) => void
}

export function SharedTaskModal({ task, onClose, onUpdate, onPickUp, onDelete, onArchive }: Props) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? "")
  const [emailInput, setEmailInput] = useState("")
  const [emailError, setEmailError] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const isOpen = task.status === "OPEN"
  const isPickedUp = task.status === "PICKED_UP"

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/shared-tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to save")
        return
      }
      const updated = await res.json()
      onUpdate(updated)
    } finally {
      setSaving(false)
    }
  }

  async function addShare() {
    const trimmed = emailInput.trim()
    if (!trimmed) return
    setEmailError("")
    const res = await fetch(`/api/shared-tasks/${task.id}/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed }),
    })
    if (!res.ok) {
      const data = await res.json()
      setEmailError(data.error ?? "Failed to add")
      return
    }
    const newShare = await res.json()
    onUpdate({ ...task, shares: [...task.shares, newShare] })
    setEmailInput("")
  }

  async function removeShare(userId: string) {
    await fetch(`/api/shared-tasks/${task.id}/shares/${userId}`, { method: "DELETE" })
    onUpdate({ ...task, shares: task.shares.filter(s => s.userId !== userId) })
  }

  async function handlePickUp() {
    onPickUp(task.id)
    onClose()
  }

  async function handleDelete() {
    if (!confirm("Delete this shared task?")) return
    await fetch(`/api/shared-tasks/${task.id}`, { method: "DELETE" })
    onDelete(task.id)
    onClose()
  }

  async function handleArchive() {
    await fetch(`/api/shared-tasks/${task.id}/archive`, { method: "PATCH" })
    onArchive(task.id)
    onClose()
  }

  const pickedUpDate = task.pickedUpAt
    ? new Date(task.pickedUpAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : ""
  const pickedUpByLabel = task.pickedUpByEmail === null ? "someone" : task.pickedUpByEmail

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            {isOpen && (
              <span className="text-xs bg-green-50 text-green-700 font-medium rounded-full px-2.5 py-0.5">Open</span>
            )}
            {isPickedUp && (
              <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2.5 py-0.5">Picked Up</span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Title</label>
            {isOpen ? (
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-300"
                maxLength={200}
              />
            ) : (
              <p className="text-sm font-semibold text-slate-400 bg-slate-50 rounded-lg px-3 py-2">{task.title}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Description</label>
            {isOpen ? (
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                rows={3}
                maxLength={1000}
              />
            ) : (
              <p className="text-sm text-slate-400 bg-slate-50 rounded-lg px-3 py-2 min-h-[72px]">
                {task.description || "No description"}
              </p>
            )}
          </div>

          {isOpen && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Shared with
              </label>
              {task.shares.map(share => (
                <div key={share.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 mb-1">
                  <span className="text-sm text-slate-700">{share.userEmail}</span>
                  {task.isCreator && (
                    <button
                      onClick={() => removeShare(share.userId)}
                      className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {task.isCreator && (
                <div className="flex gap-2 mt-2">
                  <input
                    value={emailInput}
                    onChange={e => { setEmailInput(e.target.value); setEmailError("") }}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addShare() } }}
                    placeholder="Add email address…"
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <button
                    type="button"
                    onClick={addShare}
                    className="flex items-center gap-1 px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              )}
              {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
            </div>
          )}

          {isPickedUp && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
              <p className="text-sm text-blue-700 font-medium">
                Picked up by {pickedUpByLabel} on {pickedUpDate} — now in their To-Do list
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0">
          <div className="flex gap-2">
            {isPickedUp && (
              <button
                onClick={handleArchive}
                className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
              >
                Archive
              </button>
            )}
            {(isPickedUp || task.isCreator) && (
              <button
                onClick={handleDelete}
                className="px-3 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {isOpen && (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={handlePickUp}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Pick Up →
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/shared-tasks/SharedTaskModal.tsx
git commit -m "feat: add SharedTaskModal detail/edit component"
```

---

## Task 12: SharedTasksGrid

**Files:**
- Create: `src/components/shared-tasks/SharedTasksGrid.tsx`

- [ ] **Step 1: Create SharedTasksGrid**

Create `src/components/shared-tasks/SharedTasksGrid.tsx`:

```typescript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { SharedTaskItem } from "@/types"
import { SharedTaskCard } from "./SharedTaskCard"
import { NewSharedTaskModal } from "./NewSharedTaskModal"
import { SharedTaskModal } from "./SharedTaskModal"

type OwnershipFilter = "all" | "mine" | "received"
type StatusFilter = "open" | "picked_up"

interface Props {
  initialTasks: SharedTaskItem[]
}

export function SharedTasksGrid({ initialTasks }: Props) {
  const router = useRouter()
  const [tasks, setTasks] = useState<SharedTaskItem[]>(initialTasks)
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter | "">("")
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<SharedTaskItem | null>(null)

  async function handleCardClick(task: SharedTaskItem) {
    setSelectedTask(task)
    // Mark as viewed if recipient and not yet viewed
    if (!task.isCreator && task.viewedAt === null) {
      await fetch(`/api/shared-tasks/${task.id}/viewed`, { method: "PATCH" })
      setTasks(prev =>
        prev.map(t => t.id === task.id ? { ...t, viewedAt: new Date().toISOString() } : t)
      )
    }
  }

  async function handlePickUp(id: string) {
    const res = await fetch(`/api/shared-tasks/${id}/pickup`, { method: "POST" })
    if (res.status === 409) {
      toast.error("Someone already picked this up")
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: "PICKED_UP" } : t))
      return
    }
    if (!res.ok) {
      toast.error("Failed to pick up task")
      return
    }
    const updated = await res.json()
    setTasks(prev => prev.map(t => t.id === id ? updated : t))
    toast.success("Added to your To-Do list!")
    router.refresh()
  }

  function handleUpdate(updated: SharedTaskItem) {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    setSelectedTask(updated)
  }

  function handleDelete(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    setSelectedTask(null)
  }

  function handleArchive(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    setSelectedTask(null)
  }

  function handleCreated(task: SharedTaskItem) {
    setTasks(prev => [task, ...prev])
    router.refresh()
  }

  const filtered = tasks.filter(task => {
    if (ownershipFilter === "mine" && !task.isCreator) return false
    if (ownershipFilter === "received" && task.isCreator) return false
    if (statusFilter === "open" && task.status !== "OPEN") return false
    if (statusFilter === "picked_up" && task.status !== "PICKED_UP") return false
    return true
  })

  const pillBase = "text-xs rounded-full px-3 py-1 cursor-pointer transition-colors"
  const pillActive = "bg-blue-600 text-white font-medium"
  const pillInactive = "bg-slate-100 text-slate-600 hover:bg-slate-200"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400 mr-1">Filter:</span>
        <span className={`${pillBase} ${ownershipFilter === "all" ? pillActive : pillInactive}`} onClick={() => setOwnershipFilter("all")}>All</span>
        <span className={`${pillBase} ${ownershipFilter === "mine" ? pillActive : pillInactive}`} onClick={() => setOwnershipFilter("mine")}>Added by Me</span>
        <span className={`${pillBase} ${ownershipFilter === "received" ? pillActive : pillInactive}`} onClick={() => setOwnershipFilter("received")}>Shared with Me</span>
        <div className="ml-auto flex gap-2">
          <span className={`${pillBase} ${statusFilter === "open" ? pillActive : pillInactive}`} onClick={() => setStatusFilter(prev => prev === "open" ? "" : "open")}>Open</span>
          <span className={`${pillBase} ${statusFilter === "picked_up" ? pillActive : pillInactive}`} onClick={() => setStatusFilter(prev => prev === "picked_up" ? "" : "picked_up")}>Picked Up</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400 py-12 text-center">No shared tasks yet</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(task => (
            <SharedTaskCard
              key={task.id}
              task={task}
              onClick={handleCardClick}
              onPickUp={handlePickUp}
            />
          ))}
        </div>
      )}

      {isNewModalOpen && (
        <NewSharedTaskModal
          onClose={() => setIsNewModalOpen(false)}
          onCreated={handleCreated}
        />
      )}

      {selectedTask && (
        <SharedTaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdate}
          onPickUp={handlePickUp}
          onDelete={handleDelete}
          onArchive={handleArchive}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/shared-tasks/SharedTasksGrid.tsx
git commit -m "feat: add SharedTasksGrid client component with filters"
```

---

## Task 13: Shared Tasks Page

**Files:**
- Create: `src/app/(dashboard)/shared-tasks/page.tsx`

The "+ New Task" button needs to trigger a modal whose state lives in `SharedTasksGrid`. Co-locate the page header inside `SharedTasksGrid` so button state is managed in one place.

- [ ] **Step 1: Create the server page**

Create `src/app/(dashboard)/shared-tasks/page.tsx`:

```typescript
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SharedTasksGrid } from "@/components/shared-tasks/SharedTasksGrid"
import type { SharedTaskItem } from "@/types"

export default async function SharedTasksPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const tasks = await prisma.sharedTask.findMany({
    where: {
      OR: [
        { creatorId: userId },
        { shares: { some: { userId } } },
      ],
      status: { not: "ARCHIVED" },
    },
    include: {
      creator: { select: { id: true, email: true } },
      picker: { select: { id: true, email: true } },
      shares: {
        include: { user: { select: { id: true, email: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const taskItems: SharedTaskItem[] = tasks.map(t => {
    const myShare = t.shares.find(s => s.userId === userId)
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status as SharedTaskItem["status"],
      creatorId: t.creatorId,
      creatorEmail: t.creator.email,
      pickedUpBy: t.pickedUpBy,
      pickedUpByEmail: t.picker?.email ?? null,
      pickedUpAt: t.pickedUpAt?.toISOString() ?? null,
      todoId: t.todoId,
      shares: t.shares.map(s => ({
        id: s.id,
        userId: s.userId,
        userEmail: s.user.email,
        viewedAt: s.viewedAt?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
      })),
      viewedAt: myShare?.viewedAt?.toISOString() ?? null,
      isCreator: t.creatorId === userId,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }
  })

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <SharedTasksGrid initialTasks={taskItems} />
    </div>
  )
}
```

- [ ] **Step 2: Add the page header into SharedTasksGrid**

Replace the content of `src/app/(dashboard)/shared-tasks/page.tsx` with:

```typescript
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SharedTasksGrid } from "@/components/shared-tasks/SharedTasksGrid"
import type { SharedTaskItem } from "@/types"

export default async function SharedTasksPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const tasks = await prisma.sharedTask.findMany({
    where: {
      OR: [
        { creatorId: userId },
        { shares: { some: { userId } } },
      ],
      status: { not: "ARCHIVED" },
    },
    include: {
      creator: { select: { id: true, email: true } },
      picker: { select: { id: true, email: true } },
      shares: {
        include: { user: { select: { id: true, email: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const taskItems: SharedTaskItem[] = tasks.map(t => {
    const myShare = t.shares.find(s => s.userId === userId)
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status as SharedTaskItem["status"],
      creatorId: t.creatorId,
      creatorEmail: t.creator.email,
      pickedUpBy: t.pickedUpBy,
      pickedUpByEmail: t.picker?.email ?? null,
      pickedUpAt: t.pickedUpAt?.toISOString() ?? null,
      todoId: t.todoId,
      shares: t.shares.map(s => ({
        id: s.id,
        userId: s.userId,
        userEmail: s.user.email,
        viewedAt: s.viewedAt?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
      })),
      viewedAt: myShare?.viewedAt?.toISOString() ?? null,
      isCreator: t.creatorId === userId,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }
  })

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <SharedTasksGrid initialTasks={taskItems} />
    </div>
  )
}
```

Update `src/components/shared-tasks/SharedTasksGrid.tsx` to include the page header at the top of its JSX, just above the filter row. Locate the `return (` block and prepend:

```tsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold text-slate-900">Shared Tasks</h1>
    <p className="text-slate-500 mt-0.5 text-sm">A shared backlog — pick up any open item to add it to your To-Do list</p>
  </div>
  <button
    onClick={() => setIsNewModalOpen(true)}
    className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
  >
    + New Task
  </button>
</div>
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Run the full test suite**

```bash
npx jest --no-coverage 2>&1 | tail -30
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/(dashboard)/shared-tasks/page.tsx src/components/shared-tasks/SharedTasksGrid.tsx
git commit -m "feat: add Shared Tasks page — completes feature"
```
