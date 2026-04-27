import type { NextAuthConfig } from "next-auth"

// Edge-safe config — no Prisma, no bcrypt. Used by middleware only.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isPublic = ["/login", "/register"].some((p) =>
        nextUrl.pathname.startsWith(p)
      )
      if (!isLoggedIn && !isPublic)
        return Response.redirect(new URL("/login", nextUrl))
      if (isLoggedIn && isPublic)
        return Response.redirect(new URL("/home", nextUrl))
      return true
    },
  },
}
