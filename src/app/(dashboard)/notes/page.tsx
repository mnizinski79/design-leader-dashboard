import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { NotesPageClient } from "@/components/notes/NotesPageClient"
import { type NoteItem, type NoteTagItem, type IdeaItem } from "@/types"

export default async function NotesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id

  const [notes, tags, ideas] = await Promise.all([
    prisma.note.findMany({
      where: { userId },
      include: { tags: { include: { tag: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.noteTag.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
    prisma.idea.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const noteItems: NoteItem[] = notes.map(n => ({
    id: n.id,
    userId: n.userId,
    title: n.title,
    project: n.project,
    body: n.body,
    summary: n.summary,
    date: n.date.toISOString().split("T")[0],
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
    tags: n.tags.map(t => ({ id: t.tag.id, name: t.tag.name })),
  }))

  const tagItems: NoteTagItem[] = tags.map(t => ({ id: t.id, name: t.name }))

  const ideaItems: IdeaItem[] = ideas.map(i => ({
    id: i.id,
    userId: i.userId,
    title: i.title,
    category: i.category,
    createdAt: i.createdAt.toISOString(),
  }))

  return (
    <div className="h-full">
      <NotesPageClient
        initialNotes={noteItems}
        initialTags={tagItems}
        initialIdeas={ideaItems}
      />
    </div>
  )
}
