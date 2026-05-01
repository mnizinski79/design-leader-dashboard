# Shared Tasks — Design Spec

**Date:** 2026-04-30  
**Status:** Approved

---

## Overview

Shared Tasks is a new dashboard section that acts as a shared backlog between platform users. Any user can add tasks to the backlog and share them with other registered users by email address. Anyone with access — creator or recipient — can pick up an open task, which claims it and adds it to their personal To-Do Kanban board. Once picked up, the shared task becomes read-only and can only be archived or deleted.

---

## Data Model

### `SharedTask`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `title` | String (max 200) | Required |
| `description` | String? (max 1000) | Optional |
| `status` | Enum | `OPEN`, `PICKED_UP`, `ARCHIVED` |
| `creatorId` | FK → User | Who created the task |
| `pickedUpBy` | FK → User? | Set when someone picks it up |
| `pickedUpAt` | DateTime? | Timestamp of pickup |
| `todoId` | UUID? (unique) | Links to the spawned `Todo` record |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

### `SharedTaskShare`

One record per recipient (does not include the creator).

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `sharedTaskId` | FK → SharedTask | |
| `userId` | FK → User | The recipient |
| `viewedAt` | DateTime? | Null = "New" badge; set on first view |
| `createdAt` | DateTime | Auto |

**Unique constraint:** `(sharedTaskId, userId)`

### `SharedTaskStatus` enum

```
OPEN        — visible and editable by all participants
PICKED_UP   — claimed; read-only for everyone
ARCHIVED    — soft-hidden; excluded from default list view
```

---

## Navigation

- A new **"Shared Tasks"** item is added to the sidebar, between To-Do and My Team.
- The nav label shows an unread badge count: the number of `SharedTaskShare` records where `userId = currentUser` AND `viewedAt IS NULL`.
- The count is fetched server-side in the dashboard layout and passed as a prop to the Sidebar component.

---

## Page Layout

A single unified list rendered as a wrapping tile grid (3 columns, matching the Ideas card style). No permanent split between "mine" and "received" — everything coexists in one view with filter pills to narrow down.

**Filter pills (top of page):**
- Ownership: All · Added by Me · Shared with Me
- Status: Open · Picked Up (Archived items hidden by default)

**Tile anatomy:**
- Title (bold)
- Description (2-line truncated preview)
- Footer: creator email (or "You") + share count — and "Pick Up →" button for open tasks
- "New" badge on tiles not yet viewed by the current user
- New/unread tiles have a blue left border to stand out
- Picked-up tiles are dimmed (opacity reduced) with a note on who claimed them

---

## Detail View

Opened as a modal (consistent with the existing Todo and Note modals) when clicking "View" or the tile itself.

### Open task (editable)
- Title and description fields are editable inline
- "Shared with" section lists current recipients with ability to remove them or add new ones by email
- Email resolution happens at save time — unrecognized emails show an inline error
- Actions: **Save**, **Pick Up →**
- Creator also sees **Delete** to remove the task entirely before it is picked up

### Picked-up task (read-only)
- Title and description rendered as static text
- A blue info banner: "Picked up by [name] on [date] — now in their To-Do list" (or "you" if the current user picked it up)
- Actions: **Archive**, **Delete**

---

## Key Flows

### Create & Share
1. Click "+ New Task"
2. Modal opens with title, description, and email input for recipients
3. On submit, each email is resolved to a registered user account
4. Unrecognized emails show an inline error and block submission
5. Task created with `status = OPEN`; a `SharedTaskShare` record is created per recipient
6. Task immediately visible in all recipients' Shared Tasks grids

### View (New Badge)
1. Task arrives with `viewedAt = null` → "New" badge + blue border on tile, nav counter incremented
2. On first open of the detail view, `PATCH /api/shared-tasks/:id/viewed` is called
3. `viewedAt` is set → badge clears, nav counter decrements

### Pick Up
1. Click "Pick Up →" on an open task (tile or detail)
2. API atomically:
   - Sets `SharedTask.status = PICKED_UP`
   - Sets `pickedUpBy` and `pickedUpAt`
   - Creates a new `Todo` record (title + description copied, `status = TODO`) for the current user
   - Stores the new `Todo.id` in `SharedTask.todoId`
3. Task becomes read-only for all participants
4. No further pickup is possible

### Archive / Delete
- Available only on picked-up tasks
- **Archive:** sets `status = ARCHIVED`; task hidden from default view
- **Delete:** permanently removes the `SharedTask` and all associated `SharedTaskShare` records
- Either action can be performed by any participant (creator or recipient)

---

## API Routes

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/shared-tasks` | Create task + share records |
| `GET` | `/api/shared-tasks` | List all tasks where user is creator OR recipient |
| `PATCH` | `/api/shared-tasks/:id` | Update title/description (open tasks only) |
| `POST` | `/api/shared-tasks/:id/pickup` | Pick up task → creates Todo |
| `PATCH` | `/api/shared-tasks/:id/archive` | Archive task (picked-up only) |
| `DELETE` | `/api/shared-tasks/:id` | Delete task permanently |
| `POST` | `/api/shared-tasks/:id/shares` | Add a recipient by email |
| `DELETE` | `/api/shared-tasks/:id/shares/:userId` | Remove a recipient |
| `PATCH` | `/api/shared-tasks/:id/viewed` | Mark task as viewed (clears New badge) |

All routes follow the existing auth pattern: `const session = await auth()` with 401 on missing session and 403 on ownership/access violations.

**Authorization rules:**
- Any participant (creator or any recipient) can view, edit, and pick up an open task
- Archive and delete are available to any participant on picked-up tasks
- Adding/removing recipients is restricted to the creator only

---

## Error States

| Scenario | Behavior |
|---|---|
| Share email not found | Inline error: "No account with that email address" |
| Task already picked up | 409 Conflict; UI refreshes to show picked-up state |
| Non-participant tries to access | 403 Forbidden |
| Pick up own task | Allowed — creator is treated the same as any recipient |

---

## Out of Scope (v1)

- Email notifications (no email service)
- Comments or activity log on shared tasks
- Sharing Notes or Ideas (possible future extension using same pattern)
- Reassigning a picked-up task
- Due dates or urgency flags on shared tasks
