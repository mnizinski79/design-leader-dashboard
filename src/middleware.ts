import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const PUBLIC_PATHS = ["/login", "/register"]

export default auth((req) => {
  const isPublic = PUBLIC_PATHS.some((p) => req.nextUrl.pathname.startsWith(p))

  if (!req.auth && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (req.auth && isPublic) {
    return NextResponse.redirect(new URL("/", req.url))
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
