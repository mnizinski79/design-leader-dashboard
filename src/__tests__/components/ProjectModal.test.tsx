import { render, screen, fireEvent } from "@testing-library/react"
import { ProjectModal } from "@/components/projects/ProjectModal"

const designers = [
  { id: "des-1", name: "Alice Chen" },
  { id: "des-2", name: "Ben Park" },
]

describe("ProjectModal", () => {
  const onClose = jest.fn()
  const onSave = jest.fn()

  beforeEach(() => jest.clearAllMocks())

  it("renders modal title 'Add Project' when no project prop", () => {
    render(<ProjectModal isOpen onClose={onClose} onSave={onSave} allDesigners={designers} />)
    expect(screen.getByText("Add Project")).toBeInTheDocument()
  })

  it("renders modal title 'Edit Project' when project prop provided", () => {
    const project = {
      id: "p1", userId: "u1", name: "Hotel Redesign",
      phase: "DESIGN" as const, status: "AT_RISK" as const,
      description: null, dueDate: null, sprintSnapshot: null,
      stakeholders: null, attention: null, blockers: null, details: null,
      createdAt: "2026-04-24T00:00:00.000Z", decisions: [], designers: [],
    }
    render(<ProjectModal isOpen onClose={onClose} onSave={onSave} project={project} allDesigners={designers} />)
    expect(screen.getByText("Edit Project")).toBeInTheDocument()
  })

  it("calls onSave with form data when Save is clicked", () => {
    render(<ProjectModal isOpen onClose={onClose} onSave={onSave} allDesigners={designers} />)
    fireEvent.change(screen.getByPlaceholderText("Project name"), { target: { value: "New Project" } })
    fireEvent.click(screen.getByRole("button", { name: /save/i }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: "New Project" }))
  })

  it("calls onClose when Cancel is clicked", () => {
    render(<ProjectModal isOpen onClose={onClose} onSave={onSave} allDesigners={designers} />)
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it("does not render when isOpen is false", () => {
    render(<ProjectModal isOpen={false} onClose={onClose} onSave={onSave} allDesigners={designers} />)
    expect(screen.queryByText("Add Project")).not.toBeInTheDocument()
  })

  it("lists designers as checkboxes", () => {
    render(<ProjectModal isOpen onClose={onClose} onSave={onSave} allDesigners={designers} />)
    expect(screen.getByText("Alice Chen")).toBeInTheDocument()
    expect(screen.getByText("Ben Park")).toBeInTheDocument()
  })
})
