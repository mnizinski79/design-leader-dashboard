import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AccountPageClient } from "./AccountPageClient"

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  return (
    <AccountPageClient
      initialName={session.user.name ?? ""}
      email={session.user.email ?? ""}
    />
  )
}
