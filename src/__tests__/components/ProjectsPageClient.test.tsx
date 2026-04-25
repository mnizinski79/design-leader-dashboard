import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ProjectsPageClient } from "@/components/projects/ProjectsPageClient"
import { ProjectItem } from "@/types"

// Mock fetch
global.fetch = jest.fn()

const mockProjects: ProjectItem[] = [
  {
    id: "p1", userId: "u1", name: "Hotel Redesign",
    phase: "DESIGN", status: "ON_TRACK",
    description: null, dueDate: null, sprintSnapshot: null,
    stakeholders: null, attention: null, blockers: null,
    createdAt: "2026-04-24T00:00:00.000Z",
    decisions: [], designers: [],
  },
]

describe("ProjectsPageClient", () => {
  beforeEach(() => jest.clearAllMocks())

  it("renders projects from initialProjects", () => {
    render(<ProjectsPageClient initialProjects={mockProjects} allDesigners={[]} />)
    expect(screen.getByText("Hotel Redesign")).toBeInTheDocument()
  })

  it("renders empty state when no projects", () => {
    render(<ProjectsPageClient initialProjects={[]} allDesigners={[]} />)
    expect(screen.getByText(/no projects yet/i)).toBeInTheDocument()
  })

  it("renders Add Project button", () => {
    render(<ProjectsPageClient initialProjects={[]} allDesigners={[]} />)
    expect(screen.getByRole("button", { name: /add project/i })).toBeInTheDocument()
  })

  it("opens modal when Add Project is clicked", () => {
    render(<ProjectsPageClient initialProjects={[]} allDesigners={[]} />)
    fireEvent.click(screen.getByRole("button", { name: /add project/i }))
    expect(screen.getByText("Add Project")).toBeInTheDocument()
  })

  it("removes project from list on delete after confirmation", async () => {
    window.confirm = jest.fn(() => true)
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
    render(<ProjectsPageClient initialProjects={mockProjects} allDesigners={[]} />)
    fireEvent.click(screen.getByRole("button", { name: /delete/i }))
    await waitFor(() => expect(screen.queryByText("Hotel Redesign")).not.toBeInTheDocument())
  })
})
