import { render, screen, fireEvent } from "@testing-library/react"
import { SharedTaskCard } from "@/components/shared-tasks/SharedTaskCard"
import type { SharedTaskItem } from "@/types"

const baseTask: SharedTaskItem = {
  id: "task-1",
  title: "Design audit",
  description: "Audit all components for consistency",
  status: "OPEN",
  creatorId: "user-1",
  creatorEmail: "me@co.com",
  pickedUpBy: null,
  pickedUpByEmail: null,
  pickedUpAt: null,
  todoId: null,
  shares: [{ id: "s1", userId: "user-2", userEmail: "sarah@co.com", viewedAt: null, createdAt: "2026-04-30T00:00:00Z" }],
  viewedAt: null,
  isCreator: true,
  createdAt: "2026-04-30T00:00:00Z",
  updatedAt: "2026-04-30T00:00:00Z",
}

describe("SharedTaskCard", () => {
  it("renders task title", () => {
    render(<SharedTaskCard task={baseTask} onClick={jest.fn()} onPickUp={jest.fn()} />)
    expect(screen.getByText("Design audit")).toBeInTheDocument()
  })

  it("shows New badge when viewedAt is null and user is not creator", () => {
    const task = { ...baseTask, isCreator: false, viewedAt: null }
    render(<SharedTaskCard task={task} onClick={jest.fn()} onPickUp={jest.fn()} />)
    expect(screen.getByText("New")).toBeInTheDocument()
  })

  it("does not show New badge for creator", () => {
    render(<SharedTaskCard task={baseTask} onClick={jest.fn()} onPickUp={jest.fn()} />)
    expect(screen.queryByText("New")).not.toBeInTheDocument()
  })

  it("shows Pick Up button for open tasks", () => {
    render(<SharedTaskCard task={baseTask} onClick={jest.fn()} onPickUp={jest.fn()} />)
    expect(screen.getByText("Pick Up →")).toBeInTheDocument()
  })

  it("does not show Pick Up button for picked-up tasks", () => {
    const task = { ...baseTask, status: "PICKED_UP" as const, pickedUpBy: "user-1", pickedUpByEmail: "me@co.com", pickedUpAt: "2026-04-30T00:00:00Z" }
    render(<SharedTaskCard task={task} onClick={jest.fn()} onPickUp={jest.fn()} />)
    expect(screen.queryByText("Pick Up →")).not.toBeInTheDocument()
  })

  it("calls onPickUp when Pick Up button clicked", () => {
    const onPickUp = jest.fn()
    render(<SharedTaskCard task={baseTask} onClick={jest.fn()} onPickUp={onPickUp} />)
    fireEvent.click(screen.getByText("Pick Up →"))
    expect(onPickUp).toHaveBeenCalledWith("task-1")
  })

  it("calls onClick when card clicked", () => {
    const onClick = jest.fn()
    render(<SharedTaskCard task={baseTask} onClick={onClick} onPickUp={jest.fn()} />)
    fireEvent.click(screen.getByText("Design audit"))
    expect(onClick).toHaveBeenCalledWith(baseTask)
  })
})
