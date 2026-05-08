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
