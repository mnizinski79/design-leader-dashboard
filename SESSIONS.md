## 2026-05-12 — Cleanup: remove redundant role field for direct reports

### Accomplished
- Pulled latest main and cleaned up stale worktrees (removed `claude/naughty-hermann-902d4e` worktree + branch)
- Removed the redundant free-text `role` field for direct reports everywhere it appeared:
  - `PersonModal` — role field hidden for directs; save guard updated; `isDirect` moved before `handleSave`
  - `TeamPageClient` — dropped the Role column from My Directs table entirely; aligned column layout to match Leadership/Peers tables
  - `DesignerList` (coaching sidebar) — replaced `d.role` with `d.roleLevel` for directs
  - `CoachingBrief` — removed `designer.role` from both AI prompt templates (brief + 1:1 questions)
  - `api/designers/route.ts` — made `role` optional in POST schema (defaults to `""`) so directs can be created without it
- Non-direct members (Leadership, Peer) retain the free-text role field throughout
- Committed and pushed to main: `275c77d`

### Next Steps
1. Decide whether to delete dead code: `DesignerModal.tsx` and `AddDesignerModal.tsx` (both unused)
2. Remove the `.worktrees/feature/shared-tasks` leftover worktree
3. Consider whether the `feat/card-layout-redesign` local branch is still relevant or can be deleted
4. Continue broader codebase cleanup

---
