# 90-Day Plan Feature — Design Spec

**Date:** 2026-04-27  
**Feature:** AI-assisted 90-day development plan for designers in the 1:1 & Coaching Goals tab

---

## Overview

A "Generate Plan" SplitButton in the Goals tab header opens the existing ClaudePanel with a rich coaching prompt. The user converses with Claude to shape the plan, then saves it. The finalized plan attaches as a structured card at the top of the Goals area for reference throughout the quarter. Inline editing handles small tweaks; "Revise with Claude" handles bigger rethinks. After saving, Claude-suggested goals surface as one-click chips to add to the goals list.

---

## 1. Data Model

### Schema change

Add one field to the `Designer` model in `prisma/schema.prisma`:

```prisma
model Designer {
  // existing fields...
  ninetyDayPlan Json?
}
```

### Plan shape (TypeScript)

```typescript
interface NinetyDayPlan {
  quarter: string               // "Q2 2026"
  startDate: string             // "2026-04-01"
  endDate: string               // "2026-06-30"
  quarterFocus: string          // 1–2 sentence theme for the quarter
  developmentPriorities: string // KF competency areas matched to skill gaps + specific behaviors
  coachingApproach: string      // Dreyfus stage coaching style + KF skilled/less-skilled descriptors
  keyMilestones: string         // Month-by-month checkpoints
  createdAt: string
  updatedAt: string
}
```

### Quarter snapping (client-side utility)

Auto-fills from today's date. User never manually picks dates.

```
Q1 = Jan 1  – Mar 31
Q2 = Apr 1  – Jun 30
Q3 = Jul 1  – Sep 30
Q4 = Oct 1  – Dec 31
```

---

## 2. API

### New routes

`PATCH /api/designers/[id]/plan`

- **Body:** `NinetyDayPlan` JSON object
- **Behavior:** Upserts — creates on first save, replaces on revise
- **Response:** Updated designer object

`DELETE /api/designers/[id]/plan`

- **Behavior:** Clears `ninetyDayPlan` field (sets to null)
- **Response:** Updated designer object

The existing `GET /api/designers/[id]` already returns the full designer object, so `ninetyDayPlan` rides along for free. No new read endpoint needed.

---

## 3. Claude Prompt & Panel Flow

### System prompt (sent once, not visible to user)

```
You are a senior design leadership coach at IHG Hotels & Resorts.
Your role is to help design leaders develop their teams using
evidence-based coaching frameworks.

Frameworks to apply:
- Dreyfus Model: adjust coaching style to the designer's stage
  (Novice → Expert). Earlier stages need more directive guidance;
  later stages need facilitative/stretch coaching.
- Korn Ferry FYI Competencies: use skilled/less-skilled/talented
  descriptors for the competency areas most relevant to this
  designer's skill gaps to define what good looks like.

Designer context:
- Name: [name]
- Dreyfus stage: [stage label + description]
- Skill ratings: [skill: tier label for each skill]
- Existing goals: [title + status for each active goal]
- Quarter: [Q# YYYY, start date – end date]

Produce a focused, practical 90-day plan. When asked to finalize,
output it in exactly these four labeled sections:
  QUARTER FOCUS: ...
  DEVELOPMENT PRIORITIES: ...
  COACHING APPROACH: ...
  KEY MILESTONES: ...
```

### Initial user-facing prompt

```
Create a 90-day development plan for [name] for [Q# YYYY].
Their lowest-scoring skill areas are [X, Y, Z].
Their current goals are: [list].
Focus on practical growth they can show by [end date].
```

### Multi-turn conversation

User converses naturally — adjusting priorities, tone, milestones, etc. The panel works identically to all other ClaudePanel uses in the app.

### Saving the plan

A **"Save as Plan"** button appears in the panel footer once Claude has sent at least one response (new prop on ClaudePanel, only shown for this use case).

When clicked:
1. Sends follow-up prompt: *"Finalize the plan now using the four labeled sections."*
2. Claude responds with `QUARTER FOCUS: ... DEVELOPMENT PRIORITIES: ... COACHING APPROACH: ... KEY MILESTONES: ...`
3. App parses the four labeled sections into the `NinetyDayPlan` JSON fields
4. Calls `PATCH /api/designers/[id]/plan`
5. Panel closes; plan card appears at top of GoalsTab

### Goal extraction (post-save)

Immediately after saving, a follow-up Claude call sends: *"List any specific goals you suggested during our conversation, one per line, as: GOAL: [title] | [timeline]."*

Extracted goals surface as one-click chips below the plan card (see Section 5).

---

## 4. Plan Card UI

Rendered at the top of the GoalsTab when `designer.ninetyDayPlan` is non-null. Appears above the goals list.

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Q2 2026 · Apr 1 – Jun 30          [Revise ✦] [···] │
├─────────────────────────────────────────────────────┤
│  QUARTER FOCUS                                       │
│  [editable section body]                             │
├─────────────────────────────────────────────────────┤
│  DEVELOPMENT PRIORITIES                              │
│  [editable section body]                             │
├─────────────────────────────────────────────────────┤
│  COACHING APPROACH                                   │
│  [editable section body]                             │
├─────────────────────────────────────────────────────┤
│  KEY MILESTONES                                      │
│  [editable section body]                             │
└─────────────────────────────────────────────────────┘
```

### Inline editing

Click any section body → becomes a textarea. Auto-saves on blur via `PATCH /api/designers/[id]/plan` with the updated field merged into the existing plan object.

### Revise with Claude

Re-opens ClaudePanel with the existing plan injected as context:
*"Here is the current plan: [plan text]. Let's revise it."*

Same save flow as initial creation.

### `···` menu

Single option: **Delete plan** — requires confirmation before calling `DELETE /api/designers/[id]/plan` (new route) and clearing the card.

---

## 5. Goal Auto-Add Chips

After the plan saves, if Claude suggested specific goals, a row of chips appears below the plan card:

```
Suggested goals from this plan:
[+ Lead a cross-functional review · Q2 2026]
[+ Present to senior stakeholders · May 2026]
[+ Complete presentation skills workshop · Jun 2026]
```

- Clicking a chip calls `onGoalAdd` with title and timeline pre-filled
- Chip disappears once goal is added (or can be individually dismissed)
- Row does not render if no goals were extracted

---

## 6. Component Structure

| Component | File | Responsibility |
|---|---|---|
| `NinetyDayPlanCard` | `components/coaching/plan/NinetyDayPlanCard.tsx` | Renders plan card, inline editing, Revise/Delete |
| `GoalSuggestionChips` | `components/coaching/plan/GoalSuggestionChips.tsx` | Post-save suggested goal chips |
| `buildPlanPrompt()` | `lib/plan-prompt.ts` | Constructs system prompt + initial user prompt from designer data |
| `getCurrentQuarter()` | `lib/quarter.ts` | Returns quarter label + start/end dates from a given date |
| `parsePlanSections()` | `lib/plan-prompt.ts` | Parses `SECTION: ...` labeled output into `NinetyDayPlan` fields |
| Updated `GoalsTab` | `components/coaching/tabs/GoalsTab.tsx` | Adds SplitButton, plan card, chips; receives new `onPlanSave` and `onPlanDelete` props (handlers owned by CoachingPageClient) |
| Updated `ClaudePanel` | `components/claude/ClaudePanel.tsx` | Adds optional `onSave` prop + "Save as Plan" footer button |

---

## 7. KF Competency Mapping

The system prompt selects KF competencies based on the designer's lowest-scoring skill areas:

| App Skill | KF Competency |
|---|---|
| Empathy | Interpersonal Savvy, Customer Focus |
| Communication | Communicates Effectively |
| Leadership | Balances Stakeholders, Collaborates |
| Strategy | Business Insight, Manages Complexity |
| Process | Optimizes Work Processes, Situational Adaptability |
| Self-development | Self-Development |

The `buildPlanPrompt()` function selects the 2–3 most relevant KF competencies based on tier scores, includes their Skilled/Less-skilled/Talented descriptors inline in the system prompt.

---

## 8. Constraints & Decisions

- **No plan history in v1.** Each quarter's plan overwrites the previous. History can be added in a future session if needed.
- **Quarter snapping is automatic.** No date picker exposed to the user.
- **"Save as Plan" only appears for the 90-day plan panel variant.** All other ClaudePanel uses are unchanged.
- **Goal extraction is best-effort.** If Claude returns no parseable goals, the chips row is silently omitted.
- **Inline edit autosaves on blur.** No explicit Save button for section edits — consistent with the Notes autosave pattern already in the app.
