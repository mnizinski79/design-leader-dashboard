import { render, screen, fireEvent } from "@testing-library/react"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { ProjectItem } from "@/types"

const baseProject: ProjectItem = {
  id: "p1",
  userId: "u1",
  name: "Hotel Redesign",
  phase: "DESIGN",
  status: "AT_RISK",
  description: "Revamping the booking flow",
  dueDate: "2026-06-30",
  sprintSnapshot: "8 tickets, 3 in review",
  stakeholders: "Sarah PM, Dev lead",
  attention: "Dev handoff docs incomplete",
  blockers: null, details: null,
  createdAt: "2026-04-24T00:00:00.000Z",
  decisions: [
    { id: "d1", projectId: "p1", text: "Used shadcn", createdAt: "2026-04-12T00:00:00.000Z" },
  ],
  designers: [
    { designerId: "des-1", designer: { id: "des-1", name: "Alice Chen" } },
  ],
}

describe("ProjectCard", () => {
  const onEdit = jest.fn()
  const onDelete = jest.fn()
  const onDecisionAdd = jest.fn()
  const onDecisionDelete = jest.fn()
  const onDetailsChange = jest.fn()

  beforeEach(() => jest.clearAllMocks())

  it("renders project name", () => {
    render(<ProjectCard project={baseProject} onEdit={onEdit} onDelete={onDelete} onDecisionAdd={onDecisionAdd} onDecisionDelete={onDecisionDelete} onDetailsChange={onDetailsChange} />)
    expect(screen.getByText("Hotel Redesign")).toBeInTheDocument()
  })

  it("renders attention callout when attention is set", () => {
    render(<ProjectCard project={baseProject} onEdit={onEdit} onDelete={onDelete} onDecisionAdd={onDecisionAdd} onDecisionDelete={onDecisionDelete} onDetailsChange={onDetailsChange} />)
    expect(screen.getByText("Dev handoff docs incomplete")).toBeInTheDocument()
  })

  it("does not render blocker callout when blockers is null", () => {
    render(<ProjectCard project={baseProject} onEdit={onEdit} onDelete={onDelete} onDecisionAdd={onDecisionAdd} onDecisionDelete={onDecisionDelete} onDetailsChange={onDetailsChange} />)
    expect(screen.queryByText("Blocked")).not.toBeInTheDocument()
  })

  it("calls onEdit when Edit button is clicked", () => {
    render(<ProjectCard project={baseProject} onEdit={onEdit} onDelete={onDelete} onDecisionAdd={onDecisionAdd} onDecisionDelete={onDecisionDelete} onDetailsChange={onDetailsChange} />)
    fireEvent.click(screen.getByRole("button", { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledWith(baseProject)
  })

  it("calls onDecisionAdd when decision is logged", () => {
    render(<ProjectCard project={baseProject} onEdit={onEdit} onDelete={onDelete} onDecisionAdd={onDecisionAdd} onDecisionDelete={onDecisionDelete} onDetailsChange={onDetailsChange} />)
    const input = screen.getByPlaceholderText("Log a decision…")
    fireEvent.change(input, { target: { value: "New decision" } })
    fireEvent.click(screen.getByRole("button", { name: /log/i }))
    expect(onDecisionAdd).toHaveBeenCalledWith("p1", "New decision")
  })

  it("renders existing decision text", () => {
    render(<ProjectCard project={baseProject} onEdit={onEdit} onDelete={onDelete} onDecisionAdd={onDecisionAdd} onDecisionDelete={onDecisionDelete} onDetailsChange={onDetailsChange} />)
    expect(screen.getByText("Used shadcn")).toBeInTheDocument()
  })

  it("renders designer names", () => {
    render(<ProjectCard project={baseProject} onEdit={onEdit} onDelete={onDelete} onDecisionAdd={onDecisionAdd} onDecisionDelete={onDecisionDelete} onDetailsChange={onDetailsChange} />)
    expect(screen.getByText("Alice Chen")).toBeInTheDocument()
  })
})
