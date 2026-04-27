import { DesignerItem } from "@/types"
import { DREYFUS_LABELS, DREYFUS_DESCRIPTIONS } from "@/components/coaching/lib/coaching-framework"
import { SKILL_LABELS, tierLabel } from "@/components/coaching/lib/skills"

// Maps app skill keys to Korn Ferry FYI competency names + descriptors
const KF_COMPETENCY_MAP: Record<string, { name: string; skilled: string; lessSkilled: string }> = {
  communication: {
    name: "Communicates Effectively",
    skilled: "Is effective in a variety of communication settings; adjusts to fit the audience and message.",
    lessSkilled: "Struggles to communicate clearly; messages don't land well with different audiences.",
  },
  empathy: {
    name: "Interpersonal Savvy",
    skilled: "Relates openly and comfortably with diverse groups of people; picks up on interpersonal dynamics.",
    lessSkilled: "Struggles to connect with others; misses social cues and relationship dynamics.",
  },
  balancing: {
    name: "Balances Stakeholders",
    skilled: "Anticipates and balances the needs of multiple stakeholders; finds common ground.",
    lessSkilled: "Tends to focus on one group; overlooks competing needs and perspectives.",
  },
  leadership: {
    name: "Collaborates",
    skilled: "Builds partnerships and works collaboratively with others to meet shared objectives.",
    lessSkilled: "Prefers to work alone; doesn't actively seek input or build relationships across teams.",
  },
  process: {
    name: "Optimizes Work Processes",
    skilled: "Figures out the processes necessary to get things done; knows how to organize people and activities.",
    lessSkilled: "Struggles to establish efficient processes; work is often disorganized or reactive.",
  },
  analytical: {
    name: "Manages Complexity",
    skilled: "Makes sense of complex information; asks the right questions to get to the root of problems.",
    lessSkilled: "Gets overwhelmed by complex problems; struggles to identify what matters most.",
  },
  visual_design: {
    name: "Demonstrates Self-Awareness",
    skilled: "Uses a combination of feedback and self-reflection to gain productive insight into personal strengths and weaknesses.",
    lessSkilled: "Doesn't seek feedback on craft; unaware of how their visual design choices land with others.",
  },
  ia: {
    name: "Business Insight",
    skilled: "Applies knowledge of business and the marketplace to advance the organization's goals.",
    lessSkilled: "Doesn't connect design decisions to business impact; operates in isolation from strategy.",
  },
  research: {
    name: "Customer Focus",
    skilled: "Builds strong customer relationships and delivers solutions that meet customer needs.",
    lessSkilled: "Doesn't consistently prioritize user needs; solutions miss what customers actually want.",
  },
  facilitation: {
    name: "Builds Effective Teams",
    skilled: "Forms teams with appropriate and diverse mix of styles; creates strong morale and team spirit.",
    lessSkilled: "Doesn't actively build alignment or team cohesion; workshops and sessions lack structure or energy.",
  },
  prototyping: {
    name: "Situational Adaptability",
    skilled: "Adapts approach and demeanor in real time to match the shifting demands of different situations.",
    lessSkilled: "Uses only one fidelity level regardless of the decision being made.",
  },
}

function getLowestSkills(designer: DesignerItem, count = 3): string[] {
  return [...designer.skills]
    .sort((a, b) => a.value - b.value)
    .slice(0, count)
    .map((s) => s.skillName)
}

function buildKfSection(skillKeys: string[]): string {
  const competencies = skillKeys
    .map((key) => KF_COMPETENCY_MAP[key])
    .filter(Boolean)
    .filter((c, i, arr) => arr.findIndex((x) => x.name === c.name) === i) // dedupe by name
    .slice(0, 3)

  if (competencies.length === 0) return ""

  return competencies
    .map(
      (c) =>
        `- **${c.name}**: Skilled looks like: "${c.skilled}" Less skilled: "${c.lessSkilled}"`
    )
    .join("\n")
}

export function buildPlanSystemPrompt(designer: DesignerItem): string {
  const stage = designer.dreyfusStage ?? "COMPETENT"
  const stageLabel = DREYFUS_LABELS[stage] ?? stage
  const stageDesc = DREYFUS_DESCRIPTIONS[stage] ?? ""
  const lowestSkills = getLowestSkills(designer)
  const kfSection = buildKfSection(lowestSkills)

  const skillSummary = designer.skills
    .map((s) => `${SKILL_LABELS[s.skillName] ?? s.skillName}: ${tierLabel(s.value)} (${s.value}/9)`)
    .join(", ")

  const goalsSummary =
    designer.goals.length > 0
      ? designer.goals.map((g) => `- ${g.title} (${g.status})`).join("\n")
      : "No active goals yet."

  return `You are a senior design leadership coach at IHG Hotels & Resorts. Your role is to help design leaders develop their teams using evidence-based coaching frameworks.

**Frameworks to apply:**

Dreyfus Model — ${stageLabel} stage: ${stageDesc}
Adjust your coaching style accordingly. ${stage === "NOVICE" || stage === "ADVANCED_BEGINNER" ? "Be more directive and concrete." : stage === "PROFICIENT" || stage === "EXPERT" ? "Be facilitative and challenge assumptions." : "Balance direction with ownership-building."}

Korn Ferry FYI Competencies most relevant to this designer's skill gaps:
${kfSection || "Focus on balanced development across all competency areas."}

**Designer context:**
- Name: ${designer.name}
- Role: ${designer.role} (${designer.roleLevel})
- Dreyfus stage: ${stageLabel}
- Skill ratings: ${skillSummary}
- Current goals:
${goalsSummary}

Produce a focused, practical 90-day plan. Keep it actionable and specific to this person. When asked to finalize, output it using EXACTLY these four labeled lines (each label on its own line, followed by the content):

QUARTER FOCUS: [1-2 sentences on the theme]
DEVELOPMENT PRIORITIES: [key competency areas and specific behaviors to develop]
COACHING APPROACH: [how to coach this person given their Dreyfus stage and KF gaps]
KEY MILESTONES: [month-by-month checkpoints — Month 1: ..., Month 2: ..., Month 3: ...]`
}

export function buildPlanInitialPrompt(
  designer: DesignerItem,
  quarter: string,
  endDate: string
): string {
  const lowestSkills = getLowestSkills(designer)
    .map((key) => SKILL_LABELS[key] ?? key)
    .join(", ")

  const goalsList =
    designer.goals.length > 0
      ? designer.goals.map((g) => g.title).join("; ")
      : "none yet"

  return `Create a 90-day development plan for ${designer.name} for ${quarter}. Their lowest-scoring skill areas are: ${lowestSkills}. Their current goals are: ${goalsList}. Focus on practical growth they can demonstrate by ${endDate}.`
}

export function parsePlanSections(text: string): {
  quarterFocus: string
  developmentPriorities: string
  coachingApproach: string
  keyMilestones: string
} {
  function extract(label: string, nextLabel?: string): string {
    const pattern = nextLabel
      ? new RegExp(`${label}:\\s*([\\s\\S]*?)(?=${nextLabel}:|$)`, "i")
      : new RegExp(`${label}:\\s*([\\s\\S]*)`, "i")
    const match = text.match(pattern)
    return match ? match[1].trim() : ""
  }

  return {
    quarterFocus: extract("QUARTER FOCUS", "DEVELOPMENT PRIORITIES"),
    developmentPriorities: extract("DEVELOPMENT PRIORITIES", "COACHING APPROACH"),
    coachingApproach: extract("COACHING APPROACH", "KEY MILESTONES"),
    keyMilestones: extract("KEY MILESTONES"),
  }
}
