/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({ auth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    project: { findMany: jest.fn() },
    designer: { findMany: jest.fn() },
  },
}))
jest.mock("next/navigation", () => ({ redirect: jest.fn() }))
jest.mock("@/components/projects/ProjectsPageClient", () => ({
  ProjectsPageClient: () => null,
}))

// This test verifies the server page module exports a default async function.
describe("projects server page module", () => {
  it("exports a default async function", async () => {
    const mod = await import("@/app/(dashboard)/projects/page")
    expect(typeof mod.default).toBe("function")
  })
})
