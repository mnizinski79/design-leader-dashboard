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

// ─── Tier definitions (same across all skills) ────────────────────────────────

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

// ─── Per-skill sub-skills ─────────────────────────────────────────────────────

export interface SkillDetail {
  group: string
  subSkills: string[]
}

export const SKILL_DETAILS: Record<string, SkillDetail> = {
  visual_design: {
    group: "Experience Design",
    subSkills: [
      "Color Theory",
      "Layout",
      "Affordance",
      "Mobile Patterns",
      "Responsive Patterns",
    ],
  },
  interaction: {
    group: "Experience Design",
    subSkills: [
      "Micro Interactions",
      "Flow",
      "Purpose",
      "Form Factor",
      "Journey Maps",
    ],
  },
  prototyping: {
    group: "Experience Design",
    subSkills: [
      "Interaction Presentation",
      "Transition",
      "Prototype Creation",
      "Video Motion Graphics / Animation",
    ],
  },
  ia: {
    group: "Experience Design",
    subSkills: [
      "Taxonomy",
      "Hierarchy",
      "Site Structure",
      "Components",
      "Content Design",
    ],
  },
  research: {
    group: "Experience Design",
    subSkills: [
      "Usability Research",
      "Qualitative Research",
      "Analytics And Analysis",
      "Benchmarking",
      "Customer Interviewing",
      "Observational",
      "Syntheses",
      "Journey / System Mapping",
      "Empathy Mapping",
      "Persona Creation",
    ],
  },
  facilitation: {
    group: "Experience Design",
    subSkills: [
      "Delivery",
      "Expectation Setting",
      "Process Evaluation",
      "Experimentation",
      "Workshop Design",
    ],
  },
  empathy: {
    group: "Leadership",
    subSkills: [
      "User Empathy",
      "Partner Empathy",
      "Listening",
      "Alignment",
    ],
  },
  analytical: {
    group: "Leadership",
    subSkills: [
      "Problem Identification",
      "Landscape Mapping",
      "Stakeholder Mapping",
      "Prioritization",
      "Value Identification",
      "Mental Models",
      "Second Order Of Impact",
    ],
  },
  communication: {
    group: "Leadership",
    subSkills: [
      "Intent Vs Impact",
      "Presentation",
      "Story Telling",
      "Multi Modal Approach",
    ],
  },
  leadership: {
    group: "Leadership",
    subSkills: [
      "Situational Adaptability",
      "Collaboration",
      "Business Insight",
      "Self Development",
      "Interpersonal Savvy",
      "Customer Focus",
      "Managing Complexity",
    ],
  },
  balancing: {
    group: "Leadership",
    subSkills: [
      "Internal Vs External",
      "Cultural Impacts",
      "Conflict Resolution",
    ],
  },
  process: {
    group: "Leadership",
    subSkills: [
      "Delivery",
      "Prioritization",
      "Expectation Setting",
      "Process Evaluation",
      "Experimentation",
      "Facilitation",
    ],
  },
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
}
