import { render, screen } from "@testing-library/react"
import { NoteDetail } from "@/components/notes/NoteDetail"
import type { NoteItem } from "@/types"

jest.mock("@/components/claude/ClaudePanel", () => ({
  ClaudePanel: () => null,
}))
jest.mock("@/components/claude/SplitButton", () => ({
  SplitButton: ({ label }: { label: string }) => <button>{label}</button>,
}))

const mockNote: NoteItem = {
  id: "n1",
  title: "Test Note",
  project: "Design System",
  date: "2026-04-28",
  body: "Some content here",
  tags: [],
}

const mockRouterPush = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush, refresh: jest.fn() }),
}))

describe("NoteDetail", () => {
  const onUpdate = jest.fn()
  const onDelete = jest.fn()
  const onTagsChange = jest.fn()

  it("renders the note title", () => {
    render(<NoteDetail note={mockNote} allTags={[]} onUpdate={onUpdate} onDelete={onDelete} onTagsChange={onTagsChange} />)
    expect(screen.getByDisplayValue("Test Note")).toBeInTheDocument()
  })

  it("renders a delete button with trash icon aria-label", () => {
    render(<NoteDetail note={mockNote} allTags={[]} onUpdate={onUpdate} onDelete={onDelete} onTagsChange={onTagsChange} />)
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument()
  })

  it("renders an edit button with pencil icon aria-label", () => {
    render(<NoteDetail note={mockNote} allTags={[]} onUpdate={onUpdate} onDelete={onDelete} onTagsChange={onTagsChange} />)
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument()
  })
})
