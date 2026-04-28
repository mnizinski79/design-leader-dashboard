import { render, screen } from "@testing-library/react"
import { CoachingPageClient } from "@/components/coaching/CoachingPageClient"
import type { DesignerItem } from "@/types"

// Mutable ref so individual tests can override the param value
let mockDesignerParam: string | null = null

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: (_key: string) => mockDesignerParam }),
  useRouter: () => ({ refresh: jest.fn() }),
}))

// Mock CoachingPanel
jest.mock("@/components/coaching/CoachingPanel", () => ({
  CoachingPanel: () => <div data-testid="coaching-panel" />,
}))

// Mock DesignerList
jest.mock("@/components/coaching/DesignerList", () => ({
  DesignerList: () => <div data-testid="designer-list" />,
}))

// Mock AddDesignerModal
jest.mock("@/components/coaching/AddDesignerModal", () => ({
  AddDesignerModal: () => <div data-testid="add-designer-modal" />,
}))

// Mock ClaudePanel
jest.mock("@/components/claude/ClaudePanel", () => ({
  ClaudePanel: () => <div data-testid="claude-panel" />,
}))

const baseDesigner: DesignerItem = {
  id: "d1",
  userId: "u1",
  name: "Jade Maddox",
  role: "Senior Designer",
  roleLevel: "Senior",
  dreyfusStage: "PROFICIENT",
  avatarClass: "av-blue",
  nextOneOnOne: "2026-04-29",
  createdAt: "2026-01-01T00:00:00.000Z",
  ninetyDayPlan: null,
  skills: [],
  sessions: [],
  goals: [],
  feedback: [],
  topics: [],
  notes: [],
}

describe("CoachingPageClient", () => {
  afterEach(() => { mockDesignerParam = null })

  it("renders empty state message when no designer is selected", () => {
    render(<CoachingPageClient initialDesigners={[baseDesigner]} />)
    expect(screen.getByText(/Select a designer/i)).toBeInTheDocument()
  })

  it("does not render CoachingPanel when no designer is selected", () => {
    render(<CoachingPageClient initialDesigners={[baseDesigner]} />)
    expect(screen.queryByTestId("coaching-panel")).not.toBeInTheDocument()
  })

  it("renders CoachingPanel when a designer is pre-selected via URL param", () => {
    mockDesignerParam = "d1"
    const { container } = render(<CoachingPageClient initialDesigners={[baseDesigner]} />)
    expect(screen.getByTestId("coaching-panel")).toBeInTheDocument()
    const card = container.querySelector(".bg-white.border-l")
    expect(card).not.toBeNull()
  })

  it("detail panel has border-l separator instead of gray wrapper", () => {
    mockDesignerParam = "d1"
    const { container } = render(<CoachingPageClient initialDesigners={[baseDesigner]} />)
    const panel = container.querySelector(".border-l.border-slate-100")
    expect(panel).not.toBeNull()
  })
})
