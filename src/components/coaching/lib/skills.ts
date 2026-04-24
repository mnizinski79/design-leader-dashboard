export const SKILL_LABELS: Record<string, string> = {
  visual_design: "Visual Design",
  interaction: "Interaction Design",
  prototyping: "Prototyping",
  ia: "IA",
  research: "Research",
  facilitation: "Facilitation",
  empathy: "Empathy",
  analytical: "Analytical Skill",
  communication: "Communication",
  leadership: "Leadership",
  balancing: "Balancing Stakeholders",
  process: "Process / Product Strategy",
}

export const SKILL_GROUPS: Record<string, string[]> = {
  "Core Skills": ["visual_design", "interaction", "prototyping", "ia", "research", "facilitation"],
  "Leadership Skills": ["empathy", "analytical", "communication", "leadership", "balancing", "process"],
}

export const ALL_SKILL_KEYS = [
  ...SKILL_GROUPS["Core Skills"],
  ...SKILL_GROUPS["Leadership Skills"],
]

export function tierLabel(value: number): string {
  if (value <= 3) return "Base"
  if (value <= 6) return "Knowledgeable"
  return "Expert"
}
