// Type-level test — verifies shape at compile time
import { ProjectItem, ProjectDecisionItem, ProjectDesignerItem } from "@/types"

describe("ProjectItem type", () => {
  it("has the required fields", () => {
    const decision: ProjectDecisionItem = {
      id: "d1",
      projectId: "p1",
      text: "Used shadcn",
      createdAt: "2026-04-24T00:00:00.000Z",
    }

    const designer: ProjectDesignerItem = {
      designerId: "des-1",
      designer: { id: "des-1", name: "Alice Chen" },
    }

    const project: ProjectItem = {
      id: "p1",
      userId: "u1",
      name: "Hotel Redesign",
      phase: "DESIGN",
      status: "AT_RISK",
      description: "Revamping booking flow",
      dueDate: "2026-06-30",
      sprintSnapshot: "8 tickets, 3 in review",
      stakeholders: "Sarah PM, Dev lead",
      attention: "Dev handoff docs incomplete",
      blockers: null, details: null,
      createdAt: "2026-04-24T00:00:00.000Z",
      decisions: [decision],
      designers: [designer],
    }

    expect(project.name).toBe("Hotel Redesign")
    expect(project.decisions).toHaveLength(1)
    expect(project.designers).toHaveLength(1)
  })
})
