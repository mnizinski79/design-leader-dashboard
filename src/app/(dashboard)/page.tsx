import { auth } from "@/lib/auth"

export default async function HomePage() {
  const session = await auth()
  const firstName = session?.user?.name?.split(" ")[0] ?? "there"

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Good morning, {firstName}</h1>
      <p className="text-slate-500 mt-1">Dashboard coming in Phase 2.</p>
    </div>
  )
}
