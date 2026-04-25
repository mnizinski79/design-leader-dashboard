"use client"

import { useState } from "react"
import { ProjectItem, ProjectDecisionItem } from "@/types"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { ProjectModal, ProjectFormData } from "@/components/projects/ProjectModal"

interface Props {
  initialProjects: ProjectItem[]
  allDesigners: { id: string; name: string }[]
}

const STATUS_ORDER: Record<string, number> = {
  BLOCKED: 0,
  AT_RISK: 1,
  ON_TRACK: 2,
  COMPLETE: 3,
}

export function ProjectsPageClient({ initialProjects, allDesigners }: Props) {
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectItem | undefined>(undefined)

  const sorted = [...projects].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
  )

  function updateProject(id: string, patch: Partial<ProjectItem>) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function openAdd() {
    setEditingProject(undefined)
    setModalOpen(true)
  }

  function openEdit(project: ProjectItem) {
    setEditingProject(project)
    setModalOpen(true)
  }

  async function handleSave(data: ProjectFormData) {
    if (editingProject) {
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          description: data.description || null,
          dueDate: data.dueDate || null,
          sprintSnapshot: data.sprintSnapshot || null,
          stakeholders: data.stakeholders || null,
          attention: data.attention || null,
          blockers: data.blockers || null,
        }),
      })
      if (res.ok) {
        const updated: ProjectItem = await res.json()
        updateProject(editingProject.id, updated)
      }
    } else {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          description: data.description || null,
          dueDate: data.dueDate || null,
          sprintSnapshot: data.sprintSnapshot || null,
          stakeholders: data.stakeholders || null,
          attention: data.attention || null,
          blockers: data.blockers || null,
        }),
      })
      if (res.ok) {
        const created: ProjectItem = await res.json()
        setProjects((prev) => [...prev, created])
      }
    }
    setModalOpen(false)
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id))
    }
  }

  async function handleDecisionAdd(projectId: string, text: string) {
    const res = await fetch(`/api/projects/${projectId}/decisions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
    if (res.ok) {
      const decision: ProjectDecisionItem = await res.json()
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, decisions: [decision, ...p.decisions] }
            : p
        )
      )
    }
  }

  async function handleDecisionDelete(projectId: string, decisionId: string) {
    const res = await fetch(`/api/projects/${projectId}/decisions/${decisionId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, decisions: p.decisions.filter((d) => d.id !== decisionId) }
            : p
        )
      )
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1d1d1f]">Projects</h1>
        <button
          onClick={openAdd}
          className="bg-[#0071e3] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          + Add Project
        </button>
      </div>

      {/* Cards */}
      {sorted.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-[#6e6e73] text-sm">
          No projects yet — add your first one
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl">
          {sorted.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={openEdit}
              onDelete={handleDelete}
              onDecisionAdd={handleDecisionAdd}
              onDecisionDelete={handleDecisionDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        project={editingProject}
        allDesigners={allDesigners}
      />
    </div>
  )
}
