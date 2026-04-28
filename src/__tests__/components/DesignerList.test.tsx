import { render, screen, fireEvent } from "@testing-library/react"
import { DesignerList } from "@/components/coaching/DesignerList"
import type { DesignerItem } from "@/types"

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
  topics: [
    { id: "t1", designerId: "d1", title: "Career growth", discussed: false, createdAt: "2026-04-01T00:00:00.000Z" },
    { id: "t2", designerId: "d1", title: "Old topic", discussed: true, createdAt: "2026-03-01T00:00:00.000Z" },
  ],
  notes: [],
}

describe("DesignerList", () => {
  it("renders designer name", () => {
    render(<DesignerList designers={[baseDesigner]} selectedId={null} onSelect={jest.fn()} />)
    expect(screen.getByText("Jade Maddox")).toBeInTheDocument()
  })

  it("calls onSelect with designer id on click", () => {
    const onSelect = jest.fn()
    render(<DesignerList designers={[baseDesigner]} selectedId={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText("Jade Maddox"))
    expect(onSelect).toHaveBeenCalledWith("d1")
  })

  it("shows next 1:1 date", () => {
    render(<DesignerList designers={[baseDesigner]} selectedId={null} onSelect={jest.fn()} />)
    expect(screen.getByText("2026-04-29")).toBeInTheDocument()
  })

  it("shows pending topic count for undiscussed topics only", () => {
    render(<DesignerList designers={[baseDesigner]} selectedId={null} onSelect={jest.fn()} />)
    expect(screen.getByText("1 topic")).toBeInTheDocument()
  })

  it("applies selected card styling to the active designer", () => {
    render(<DesignerList designers={[baseDesigner]} selectedId="d1" onSelect={jest.fn()} />)
    const btn = screen.getByText("Jade Maddox").closest("button")
    expect(btn?.className).toContain("bg-[#EFF6FF]")
  })
})
