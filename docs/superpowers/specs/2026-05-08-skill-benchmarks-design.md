# Skill Benchmarks Feature Design
**Date:** 2026-05-08  
**Status:** Approved

## Overview

Add role-level skill benchmarks to the Skills tab so managers can immediately see how a direct report's current skill scores compare to the expected level for their role. Indicators appear next to each skill row, showing current tier (grey), a red "↑ Expected" pill when below, a green "✓ Exceeding" pill when above, and nothing extra when exactly at the benchmark. No indicator renders until at least one dot has been set.

---

## Skill Changes

### New skills added to Experience Design group
- **Accessibility** (`accessibility`) — own benchmark values per role (from doc charts)
- **AI** (`ai`) — benchmarks mirror IA values per role
- **Facilitation** (`facilitation`) — benchmarks mirror Accessibility values per role

Experience Design group order (8 skills):
`visual_design`, `interaction`, `prototyping`, `ia`, `research`, `facilitation`, `accessibility`, `ai`

### Tier label rename
- `"Advanced"` → `"Knowledgeable"` everywhere (tier label function, tier definitions, SkillDetailPanel)

---

## Benchmark Data

Stored as a hardcoded config in `src/components/coaching/lib/benchmarks.ts`. No database changes required — these are framework-level constants that come from the official role documentation.

### Canonical role keys and matching
```
intern          → "intern"
apprentice      → "apprentice"
level 1         → "level_1"
level 2         → "level_2"
senior          → "senior"
lead            → "lead"
lead accessibility → "lead_accessibility"
principal       → "principal"
manager         → "manager"
sr. manager / senior manager → "sr_manager"
director        → "director"  (no benchmark — different skill set)
```

Matching: `matchRoleLevel(roleLevel: string): RoleLevelKey | null`  
Normalize to lowercase, trim whitespace, then check for substring matches in priority order (longest match first to avoid "senior" matching "senior manager"). Returns `null` if no match → no indicators shown.

### Expected values per role (1–9 scale)

Derived by counting filled cells in official role documentation charts. `ai` mirrors `ia`, `accessibility` mirrors `visual_design`.

| Role | VD | ID | Proto | IA | Res | Fac | Acc* | AI* | Emp | Ana | Comm | Lead | Bal | Proc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Role | VD | ID | Proto | IA | Res | Fac* | Acc | AI* | Emp | Ana | Comm | Lead | Bal | Proc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Intern | 2 | 2 | 2 | 2 | 0 | 0 | 0 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Apprentice | 3 | 2 | 2 | 2 | 0 | 0 | 0 | 2 | 3 | 3 | 2 | 0 | 0 | 0 |
| Level 1 | 4 | 3 | 3 | 3 | 2 | 0 | 0 | 3 | 4 | 4 | 3 | 2 | 0 | 0 |
| Level 2 | 5 | 3 | 4 | 3 | 4 | 2 | 2 | 3 | 4 | 4 | 4 | 3 | 3 | 3 |
| Senior | 7 | 4 | 6 | 6 | 4 | 3 | 3 | 6 | 4 | 6 | 6 | 4 | 3 | 4 |
| Lead | 7 | 6 | 6 | 6 | 6 | 5 | 5 | 6 | 6 | 6 | 6 | 6 | 6 | 6 |
| Lead Accessibility | 7 | 6 | 6 | 6 | 6 | 5 | 5 | 6 | 6 | 6 | 6 | 6 | 6 | 6 |
| Principal | 8 | 7 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | 7 | 9 | 7 | 9 | 7 |
| Manager | 7 | 6 | 6 | 6 | 6 | 5 | 5 | 6 | 6 | 6 | 6 | 6 | 6 | 6 |
| Sr. Manager | 8 | 7 | 6 | 7 | 6 | 6 | 6 | 7 | 6 | 6 | 7 | 6 | 7 | 5 |

*Fac mirrors Acc (doc values), AI mirrors IA

`0` = no benchmark set for this skill at this role level (no indicator shown).

---

## Display Logic (SkillsTab)

For each skill row, given `actual` (current value) and `expected` (from benchmark, 0 = none):

```
if expected === 0 → no indicator (skill not benchmarked for this role)
if actual === 0   → no indicator (not yet rated)
if actual < expected  → grey tier label + red pill "↑ Expected: {tierName} ({expected})"
if actual === expected → grey tier label only
if actual > expected  → grey tier label + green pill "✓ Exceeding"
```

`tierName` uses the existing `tierLabel()` function applied to `expected`.

If the designer has no `roleLevel` set, or `matchRoleLevel` returns null, benchmark indicators are hidden entirely.

---

## Files Changed

### `src/components/coaching/lib/skills.ts`
- Add `accessibility` and `ai` to `SKILL_LABELS`, `SKILL_GROUPS["Experience Design"]`, `ALL_SKILL_KEYS`
- Add `SKILL_DETAILS` entries for both new skills
- Change `tierLabel` to return `"Knowledgeable"` (not `"Advanced"`) for values 4–6
- Update `TIER_DEFINITIONS` middle tier label to `"Knowledgeable"`

### `src/components/coaching/lib/benchmarks.ts` *(new)*
- `ROLE_BENCHMARKS`: `Record<RoleLevelKey, Record<string, number>>`
- `matchRoleLevel(roleLevel: string): RoleLevelKey | null`
- `getBenchmark(roleLevel: string, skillKey: string): number` — returns 0 if no match

### `src/components/coaching/tabs/SkillsTab.tsx`
- Import `getBenchmark`
- In skill row render: compute `expected = getBenchmark(designer.roleLevel ?? "", key)`
- Add benchmark indicator markup to the right of the dot track
- Layout: `[skill button] [9 dots] [grey tier label] [red or green pill if applicable]`

### `src/components/coaching/SkillDetailPanel.tsx`
- "Advanced" → "Knowledgeable" in TIER_COLORS key and any rendered text

---

## Edge Cases

- **No role level set**: no benchmark indicators anywhere; skill tab works as before
- **Unknown role level** (e.g. "Contract Designer"): `matchRoleLevel` returns null; no indicators
- **Score = 0, benchmark > 0**: no pill (don't pressure before rating starts)
- **Director / non-standard roles**: no benchmark data; match returns null
- **Benchmark = 0 for a skill at a role** (e.g. Research for Intern): no indicator for that skill

---

## Out of Scope

- UI for editing benchmarks (hardcoded config is intentional — from official role docs)
- Director-track skills (Creative Direction, Service Design, Org Design) — different skill set, separate feature
- Research benchmark is 0 for Intern/Apprentice (not expected at those levels)
