import { render, screen, fireEvent } from "@testing-library/react"
import { NotesSidebar } from "@/components/notes/NotesSidebar"
import type { NoteItem, NoteTagItem } from "@/types"

const baseNotes: NoteItem[] = [
  { id: "n1", userId: "u1", title: "Army Hotel Updates", project: "General", date: "2026-04-23", body: "", summary: null, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z", tags: [] },
  { id: "n2", userId: "u1", title: "Agentic Voice", project: "Design System", date: "2026-04-21", body: "", summary: null, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z", tags: [{ id: "t1", name: "dls" }] },
]
const allTags: NoteTagItem[] = [{ id: "t1", name: "dls" }]

describe("NotesSidebar", () => {
  it("renders note titles as buttons", () => {
    render(<NotesSidebar notes={baseNotes} allTags={allTags} selectedId={null} onSelect={jest.fn()} />)
    expect(screen.getByText("Army Hotel Updates")).toBeInTheDocument()
    expect(screen.getByText("Agentic Voice")).toBeInTheDocument()
  })

  it("calls onSelect with the correct id when a note is clicked", () => {
    const onSelect = jest.fn()
    render(<NotesSidebar notes={baseNotes} allTags={allTags} selectedId={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText("Army Hotel Updates"))
    expect(onSelect).toHaveBeenCalledWith("n1")
  })

  it("applies selected styling to the active note", () => {
    render(<NotesSidebar notes={baseNotes} allTags={allTags} selectedId="n1" onSelect={jest.fn()} />)
    const btn = screen.getByText("Army Hotel Updates").closest("button")
    expect(btn?.className).toContain("bg-[#EFF6FF]")
  })

  it("renders tag chip for notes with tags", () => {
    render(<NotesSidebar notes={baseNotes} allTags={allTags} selectedId={null} onSelect={jest.fn()} />)
    // "dls" appears in both the tag chip span and the select option, so use getAllByText
    const chips = screen.getAllByText("dls")
    expect(chips.some(el => el.tagName === "SPAN")).toBe(true)
  })
})
