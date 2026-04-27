import { parsePlanSections } from "@/components/coaching/lib/plan-prompt"

describe("parsePlanSections", () => {
  const sample = `QUARTER FOCUS: Build confidence presenting to senior stakeholders.

DEVELOPMENT PRIORITIES: Communicates Effectively, Collaborates — focus on cross-functional influence.

COACHING APPROACH: Competent stage — shift from directive to facilitative. Ask reflective questions rather than giving answers.

KEY MILESTONES: Month 1: identify one cross-functional project to lead. Month 2: present a design decision to senior stakeholders. Month 3: reflect on growth with evidence.`

  it("parses all four sections", () => {
    const result = parsePlanSections(sample)
    expect(result.quarterFocus).toContain("Build confidence")
    expect(result.developmentPriorities).toContain("Communicates Effectively")
    expect(result.coachingApproach).toContain("Competent stage")
    expect(result.keyMilestones).toContain("Month 1")
  })

  it("trims whitespace from section values", () => {
    const result = parsePlanSections(sample)
    expect(result.quarterFocus).toBe(result.quarterFocus.trim())
  })

  it("returns empty strings for missing sections", () => {
    const result = parsePlanSections("QUARTER FOCUS: Only this one.")
    expect(result.developmentPriorities).toBe("")
    expect(result.coachingApproach).toBe("")
    expect(result.keyMilestones).toBe("")
  })
})
