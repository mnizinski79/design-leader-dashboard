import { prisma } from "@/lib/prisma"

describe("prisma singleton", () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it("exports a PrismaClient instance", () => {
    expect(prisma).toBeDefined()
    expect(typeof prisma.user.findMany).toBe("function")
    expect(typeof prisma.todo.findMany).toBe("function")
    expect(typeof prisma.designer.findMany).toBe("function")
  })

  it("returns the same instance on repeated imports", async () => {
    const { prisma: prisma2 } = await import("@/lib/prisma")
    expect(prisma).toBe(prisma2)
  })
})
