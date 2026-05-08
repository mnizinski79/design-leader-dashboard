# Skill Benchmarks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two new skills (Accessibility, AI) to the Skills tab, rename the "Advanced" tier to "Knowledgeable", and show per-skill benchmark indicators (below/at/exceeding) derived from role-level documentation.

**Architecture:** Benchmark data lives in a new hardcoded config module (`benchmarks.ts`) that maps role level strings to expected skill values. `SkillsTab` reads the selected designer's `roleLevel`, looks up expected values per skill, and renders a grey tier label + red/green pill next to each dot row. No database changes required.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Jest + Testing Library

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/components/coaching/lib/skills.ts` | Modify | Add `accessibility`/`ai` skills; rename "Advanced"→"Knowledgeable" |
| `src/components/coaching/lib/benchmarks.ts` | **Create** | Benchmark data + `matchRoleLevel` + `getBenchmark` |
| `src/__tests__/lib/benchmarks.test.ts` | **Create** | Unit tests for benchmark lookup logic |
| `src/components/coaching/tabs/SkillsTab.tsx` | Modify | Import `getBenchmark`; render benchmark indicators per row |
| `src/components/coaching/SkillDetailPanel.tsx` | No change needed | `tier.label` from TIER_DEFINITIONS updates automatically |

---

## Task 1: Update skills.ts — add new skills and rename tier

**Files:**
- Modify: `src/components/coaching/lib/skills.ts`

- [ ] **Step 1: Add `accessibility` and `ai` to SKILL_LABELS**

Open `src/components/coaching/lib/skills.ts`. Replace the `SKILL_LABELS` export:

```ts
export const SKILL_LABELS: Record<string, string> = {
  visual_design: "Visual Design",
  interaction: "Interaction Design",
  prototyping: "Prototyping",
  ia: "Information Architecture",
  research: "Research",
  facilitation: "Facilitation",
  accessibility: "Accessibility",
  ai: "AI / Emerging Tools",
  empathy: "Empathy",
  analytical: "Analytical Skill",
  communication: "Communication",
  leadership: "Leading",
  balancing: "Balancing Stakeholders",
  process: "Process / Product Strategy",
}
```

- [ ] **Step 2: Add new skills to SKILL_GROUPS and update tier label**

Replace `SKILL_GROUPS` and `tierLabel`:

```ts
export const SKILL_GROUPS: Record<string, string[]> = {
  "Experience Design": ["visual_design", "interaction", "prototyping", "ia", "research", "facilitation", "accessibility", "ai"],
  "Leadership": ["empathy", "analytical", "communication", "leadership", "balancing", "process"],
}

export const ALL_SKILL_KEYS = [
  ...SKILL_GROUPS["Experience Design"],
  ...SKILL_GROUPS["Leadership"],
]

export function tierLabel(value: number): string {
  if (value === 0) return ""
  if (value <= 3) return "Base"
  if (value <= 6) return "Knowledgeable"
  return "Expert"
}
```

- [ ] **Step 3: Update TIER_DEFINITIONS middle tier label**

In the `TIER_DEFINITIONS` array, change the middle tier from `"Advanced"` to `"Knowledgeable"`:

```ts
export const TIER_DEFINITIONS = [
  {
    key: "base",
    label: "Base",
    range: "1–3",
    traits: [
      "Understanding is being built",
      "Rule focused",
      "Little to no use of discretionary judgment",
      "Limited situational perception",
      "Unable to discern importance between tasks",
    ],
  },
  {
    key: "advanced",
    label: "Knowledgeable",
    range: "4–6",
    traits: [
      "Managing multiple activities at once",
      "Understanding of action in relation to product outcomes",
      "Planning and vision is present in actions",
      "Ability to prioritize",
      "Possess situational adaptability",
    ],
  },
  {
    key: "expert",
    label: "Expert",
    range: "7–9",
    traits: [
      "Supremely adaptable",
      "Deep understanding of situations",
      "Clear vision of what is possible",
      "Analytical capability that transcends structured approach",
    ],
  },
]
```

- [ ] **Step 4: Add SKILL_DETAILS entries for the two new skills**

Append to the `SKILL_DETAILS` object (after the existing `process` entry):

```ts
  accessibility: {
    group: "Experience Design",
    subSkills: [
      "WCAG Standards",
      "Screen Reader Testing",
      "Color Contrast",
      "Keyboard Navigation",
      "Inclusive Design Patterns",
    ],
  },
  ai: {
    group: "Experience Design",
    subSkills: [
      "Prompt Design",
      "AI Tool Evaluation",
      "Generative UI",
      "AI-Assisted Prototyping",
      "Ethical AI Considerations",
    ],
  },
```

- [ ] **Step 5: Verify the app builds without TypeScript errors**

```bash
cd "/Users/mnizinski/Documents/Code Experiments/Design Leader Dashboard/app/.claude/worktrees/amazing-poitras-08a030"
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing unrelated errors).

- [ ] **Step 6: Commit**

```bash
git add src/components/coaching/lib/skills.ts
git commit -m "feat: add accessibility and AI skills; rename Advanced→Knowledgeable tier"
```

---

## Task 2: Write failing tests for the benchmarks module

**Files:**
- Create: `src/__tests__/lib/benchmarks.test.ts`

- [ ] **Step 1: Create the test directory and file**

```bash
mkdir -p "/Users/mnizinski/Documents/Code Experiments/Design Leader Dashboard/app/.claude/worktrees/amazing-poitras-08a030/src/__tests__/lib"
```

Create `src/__tests__/lib/benchmarks.test.ts`:

```ts
import { matchRoleLevel, getBenchmark } from "@/components/coaching/lib/benchmarks"

describe("matchRoleLevel", () => {
  it("matches standard role names case-insensitively", () => {
    expect(matchRoleLevel("Intern")).toBe("intern")
    expect(matchRoleLevel("INTERN")).toBe("intern")
    expect(matchRoleLevel("Apprentice")).toBe("apprentice")
    expect(matchRoleLevel("Level 1")).toBe("level_1")
    expect(matchRoleLevel("Level 2")).toBe("level_2")
    expect(matchRoleLevel("Senior")).toBe("senior")
    expect(matchRoleLevel("Lead")).toBe("lead")
    expect(matchRoleLevel("Principal")).toBe("principal")
    expect(matchRoleLevel("Manager")).toBe("manager")
  })

  it("matches multi-word role names", () => {
    expect(matchRoleLevel("Lead Accessibility Designer")).toBe("lead_accessibility")
    expect(matchRoleLevel("Sr. Manager")).toBe("sr_manager")
    expect(matchRoleLevel("Senior Manager")).toBe("sr_manager")
    expect(matchRoleLevel("Sr Manager")).toBe("sr_manager")
  })

  it("does not match 'senior' when role contains 'senior manager'", () => {
    expect(matchRoleLevel("Senior Manager")).toBe("sr_manager")
  })

  it("does not match 'lead' when role contains 'lead accessibility'", () => {
    expect(matchRoleLevel("Lead Accessibility Designer")).toBe("lead_accessibility")
  })

  it("returns null for unknown or director roles", () => {
    expect(matchRoleLevel("Contract Designer")).toBeNull()
    expect(matchRoleLevel("Director of Design")).toBeNull()
    expect(matchRoleLevel("")).toBeNull()
    expect(matchRoleLevel("   ")).toBeNull()
  })
})

describe("getBenchmark", () => {
  it("returns the correct expected value for a known role and skill", () => {
    expect(getBenchmark("Level 2", "visual_design")).toBe(5)
    expect(getBenchmark("Senior", "ia")).toBe(6)
    expect(getBenchmark("intern", "empathy")).toBe(2)
    expect(getBenchmark("Principal", "communication")).toBe(9)
  })

  it("returns 0 for a skill with no benchmark at that role level", () => {
    expect(getBenchmark("Intern", "research")).toBe(0)
    expect(getBenchmark("Intern", "facilitation")).toBe(0)
    expect(getBenchmark("Apprentice", "accessibility")).toBe(0)
  })

  it("returns 0 for an unknown role", () => {
    expect(getBenchmark("Contract Designer", "visual_design")).toBe(0)
    expect(getBenchmark("", "visual_design")).toBe(0)
  })

  it("returns 0 for an unknown skill key", () => {
    expect(getBenchmark("Senior", "nonexistent_skill")).toBe(0)
  })

  it("returns 0 for director (no benchmark defined)", () => {
    expect(getBenchmark("Director of Design", "visual_design")).toBe(0)
  })
})
```

- [ ] **Step 2: Run the tests — confirm they fail with module-not-found**

```bash
cd "/Users/mnizinski/Documents/Code Experiments/Design Leader Dashboard/app/.claude/worktrees/amazing-poitras-08a030"
npx jest src/__tests__/lib/benchmarks.test.ts --no-coverage 2>&1 | tail -20
```

Expected: `FAIL` with `Cannot find module '@/components/coaching/lib/benchmarks'`

- [ ] **Step 3: Commit the failing tests**

```bash
git add src/__tests__/lib/benchmarks.test.ts
git commit -m "test: add failing tests for benchmarks module"
```

---

## Task 3: Implement benchmarks.ts

**Files:**
- Create: `src/components/coaching/lib/benchmarks.ts`

- [ ] **Step 1: Create the benchmarks module**

Create `src/components/coaching/lib/benchmarks.ts`:

```ts
export type RoleLevelKey =
  | "intern"
  | "apprentice"
  | "level_1"
  | "level_2"
  | "senior"
  | "lead"
  | "lead_accessibility"
  | "principal"
  | "manager"
  | "sr_manager"

// Expected skill values (1–9) per role level. 0 = no benchmark for that skill at that level.
// Accessibility and Facilitation share values. AI mirrors IA.
const ROLE_BENCHMARKS: Record<RoleLevelKey, Record<string, number>> = {
  intern: {
    visual_design: 2, interaction: 2, prototyping: 2, ia: 2, research: 0,
    facilitation: 0, accessibility: 0, ai: 2,
    empathy: 2, analytical: 0, communication: 0, leadership: 0, balancing: 0, process: 0,
  },
  apprentice: {
    visual_design: 3, interaction: 2, prototyping: 2, ia: 2, research: 0,
    facilitation: 0, accessibility: 0, ai: 2,
    empathy: 3, analytical: 3, communication: 2, leadership: 0, balancing: 0, process: 0,
  },
  level_1: {
    visual_design: 4, interaction: 3, prototyping: 3, ia: 3, research: 2,
    facilitation: 0, accessibility: 0, ai: 3,
    empathy: 4, analytical: 4, communication: 3, leadership: 2, balancing: 0, process: 0,
  },
  level_2: {
    visual_design: 5, interaction: 3, prototyping: 4, ia: 3, research: 4,
    facilitation: 2, accessibility: 2, ai: 3,
    empathy: 4, analytical: 4, communication: 4, leadership: 3, balancing: 3, process: 3,
  },
  senior: {
    visual_design: 7, interaction: 4, prototyping: 6, ia: 6, research: 4,
    facilitation: 3, accessibility: 3, ai: 6,
    empathy: 4, analytical: 6, communication: 6, leadership: 4, balancing: 3, process: 4,
  },
  lead: {
    visual_design: 7, interaction: 6, prototyping: 6, ia: 6, research: 6,
    facilitation: 5, accessibility: 5, ai: 6,
    empathy: 6, analytical: 6, communication: 6, leadership: 6, balancing: 6, process: 6,
  },
  lead_accessibility: {
    visual_design: 7, interaction: 6, prototyping: 6, ia: 6, research: 6,
    facilitation: 5, accessibility: 5, ai: 6,
    empathy: 6, analytical: 6, communication: 6, leadership: 6, balancing: 6, process: 6,
  },
  principal: {
    visual_design: 8, interaction: 7, prototyping: 6, ia: 7, research: 7,
    facilitation: 7, accessibility: 7, ai: 7,
    empathy: 7, analytical: 7, communication: 9, leadership: 7, balancing: 9, process: 7,
  },
  manager: {
    visual_design: 7, interaction: 6, prototyping: 6, ia: 6, research: 6,
    facilitation: 5, accessibility: 5, ai: 6,
    empathy: 6, analytical: 6, communication: 6, leadership: 6, balancing: 6, process: 6,
  },
  sr_manager: {
    visual_design: 8, interaction: 7, prototyping: 6, ia: 7, research: 6,
    facilitation: 6, accessibility: 6, ai: 7,
    empathy: 6, analytical: 6, communication: 7, leadership: 6, balancing: 7, process: 5,
  },
}

// Ordered longest-match-first so "senior manager" matches sr_manager before "senior" matches senior,
// and "lead accessibility" matches lead_accessibility before "lead" matches lead.
const ROLE_PATTERNS: [string, RoleLevelKey | null][] = [
  ["lead accessibility", "lead_accessibility"],
  ["sr. manager",        "sr_manager"],
  ["senior manager",     "sr_manager"],
  ["sr manager",         "sr_manager"],
  ["principal",          "principal"],
  ["director",           null],
  ["manager",            "manager"],
  ["level 1",            "level_1"],
  ["level 2",            "level_2"],
  ["senior",             "senior"],
  ["lead",               "lead"],
  ["apprentice",         "apprentice"],
  ["intern",             "intern"],
]

export function matchRoleLevel(roleLevel: string): RoleLevelKey | null {
  const normalized = roleLevel.toLowerCase().trim()
  if (!normalized) return null
  for (const [pattern, key] of ROLE_PATTERNS) {
    if (normalized.includes(pattern)) return key
  }
  return null
}

export function getBenchmark(roleLevel: string, skillKey: string): number {
  const key = matchRoleLevel(roleLevel)
  if (!key) return 0
  return ROLE_BENCHMARKS[key][skillKey] ?? 0
}
```

- [ ] **Step 2: Run the tests — confirm they pass**

```bash
cd "/Users/mnizinski/Documents/Code Experiments/Design Leader Dashboard/app/.claude/worktrees/amazing-poitras-08a030"
npx jest src/__tests__/lib/benchmarks.test.ts --no-coverage 2>&1 | tail -20
```

Expected: `PASS` — all tests green.

- [ ] **Step 3: Commit**

```bash
git add src/components/coaching/lib/benchmarks.ts
git commit -m "feat: add role-level skill benchmark data and lookup functions"
```

---

## Task 4: Update SkillsTab to show benchmark indicators

**Files:**
- Modify: `src/components/coaching/tabs/SkillsTab.tsx`

- [ ] **Step 1: Add getBenchmark import**

At the top of `src/components/coaching/tabs/SkillsTab.tsx`, add the import after the existing lib imports:

```ts
import { getBenchmark } from "@/components/coaching/lib/benchmarks"
```

- [ ] **Step 2: Replace the tier label span with the benchmark indicator block**

Find this block inside the skill row map (the last element before the closing `</div>` of the row):

```tsx
<span className="text-xs text-muted-foreground w-20">{tier}</span>
```

Replace it with:

```tsx
{(() => {
  const expected = getBenchmark(designer.roleLevel ?? "", key)
  const showIndicator = value > 0 && expected > 0
  return (
    <div className="flex items-center gap-1.5 min-w-[9rem]">
      {tier && <span className="text-xs text-slate-400 shrink-0">{tier}</span>}
      {showIndicator && value < expected && (
        <span className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded-full whitespace-nowrap font-medium leading-none">
          ↑ Expected: {tierLabel(expected)} ({expected})
        </span>
      )}
      {showIndicator && value > expected && (
        <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full whitespace-nowrap font-medium leading-none">
          ✓ Exceeding
        </span>
      )}
    </div>
  )
})()}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd "/Users/mnizinski/Documents/Code Experiments/Design Leader Dashboard/app/.claude/worktrees/amazing-poitras-08a030"
npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 4: Run full test suite to confirm no regressions**

```bash
cd "/Users/mnizinski/Documents/Code Experiments/Design Leader Dashboard/app/.claire/worktrees/amazing-poitras-08a030"
npx jest --no-coverage 2>&1 | tail -30
```

Expected: all existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/coaching/tabs/SkillsTab.tsx
git commit -m "feat: show role-level benchmark indicators on skill rows"
```

---

## Task 5: Smoke test in the browser

**Files:** none (manual verification)

- [ ] **Step 1: Start the dev server**

```bash
cd "/Users/mnizinski/Documents/Code Experiments/Design Leader Dashboard/app/.claude/worktrees/amazing-poitras-08a030"
npm run dev -- --port 3001 &
```

- [ ] **Step 2: Open the app and navigate to a direct report**

Open `http://localhost:3001` in the browser. Sign in with the test account. Go to **1:1 & Coaching**, select a direct report. Click the **Skills** tab.

- [ ] **Step 3: Verify the new skills appear**

Confirm that **Accessibility** and **AI / Emerging Tools** now appear in the Experience Design group after Facilitation. Confirm the tier label reads **"Knowledgeable"** (not "Advanced") once a dot in the 4–6 range is set.

- [ ] **Step 4: Verify benchmark indicators**

The designer must have a `roleLevel` set (e.g. "Level 2"). Set Visual Design to 3 dots. Confirm the red pill `↑ Expected: Knowledgeable (5)` appears. Set it to 5 — confirm only grey `Knowledgeable` appears (no pill). Set it to 7 — confirm green `✓ Exceeding` appears.

Leave a skill at 0 dots — confirm no pill renders.

- [ ] **Step 5: Verify no indicator for unrecognized role level**

Edit the designer's role level to "Contract Designer". Confirm all benchmark pills disappear.

- [ ] **Step 6: Kill the dev server and commit any fixups**

```bash
kill %1
```

If any visual tweaks were needed, commit them now:

```bash
git add -p
git commit -m "fix: skill benchmark indicator visual adjustments"
```

---

## Self-Review

### Spec coverage
- ✅ Add Accessibility and AI skills → Task 1
- ✅ Rename "Advanced" → "Knowledgeable" → Task 1 (tierLabel + TIER_DEFINITIONS)
- ✅ Facilitation mirrors Accessibility benchmark values → encoded in ROLE_BENCHMARKS (Task 3)
- ✅ Benchmark config module with matchRoleLevel + getBenchmark → Task 3
- ✅ Tests for benchmark logic → Task 2
- ✅ Grey current tier label left of pills → Task 4
- ✅ Red pill when below, no pill when at, green pill when exceeding → Task 4
- ✅ No pill when score = 0 → Task 4 (`showIndicator = value > 0 && expected > 0`)
- ✅ No indicator when roleLevel unset or unknown → Task 4 (`getBenchmark` returns 0)

### Type consistency
- `getBenchmark(roleLevel: string, skillKey: string): number` — used consistently in Task 4
- `matchRoleLevel(roleLevel: string): RoleLevelKey | null` — only used internally and in tests
- `tierLabel(value: number): string` — already imported in SkillsTab, used for both current tier display and expected tier name in red pill

### Placeholder scan
None found. All steps include complete code.
