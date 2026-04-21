"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { type TodoItem } from "@/types"

const CATEGORIES = [
  "Design",
  "Strategy",
  "Coaching",
  "Process",
  "Stakeholder",
  "Team",
  "Other",
]

const STATUSES: { value: TodoItem["status"]; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "INPROGRESS", label: "In Progress" },
  { value: "AWAITING", label: "Awaiting Response" },
  { value: "COMPLETE", label: "Complete" },
]

type SavePayload = Pick<
  TodoItem,
  "title" | "description" | "category" | "status" | "dueDate" | "urgent"
>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  todo: TodoItem | null
  onSave: (data: SavePayload) => void
}

export function TodoModal({ open, onOpenChange, todo, onSave }: Props) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("Design")
  const [status, setStatus] = useState<TodoItem["status"]>("TODO")
  const [dueDate, setDueDate] = useState("")
  const [urgent, setUrgent] = useState(false)

  useEffect(() => {
    if (open) {
      setTitle(todo?.title ?? "")
      setDescription(todo?.description ?? "")
      setCategory(todo?.category ?? "Design")
      setStatus(todo?.status ?? "TODO")
      setDueDate(todo?.dueDate ?? "")
      setUrgent(todo?.urgent ?? false)
    }
  }, [open, todo])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      category,
      status,
      dueDate: dueDate || null,
      urgent,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{todo ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Task title"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional details"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={v => setCategory(v ?? "Design")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={v => setStatus(v as TodoItem["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 pb-0.5">
              <Checkbox
                id="urgent"
                checked={urgent}
                onCheckedChange={v => setUrgent(Boolean(v))}
              />
              <Label htmlFor="urgent" className="cursor-pointer">Urgent</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{todo ? "Save changes" : "Create task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
