import { matchRoleLevel, getBenchmark } from "@/components/coaching/lib/benchmarks"

describe("matchRoleLevel", () => {
  it("matches standard role names case-insensitively", () => {
    expect(matchRoleLevel("Intern")).toBe("intern")
    expect(matchRoleLevel("INTERN")).toBe("intern")
    expect(matchRoleLevel("Apprentice")).toBe("apprentice")
    expect(matchRoleLevel("Level 1")).toBe("level_1")
    expect(matchRoleLevel("Level 2")).toBe("level_2")
    expect(matchRoleLevel("Senior")).toBe("senior")
    expect(matchRoleLevel("Lead")).toBe("lead")
    expect(matchRoleLevel("Principal")).toBe("principal")
    expect(matchRoleLevel("Manager")).toBe("manager")
  })

  it("matches multi-word role names", () => {
    expect(matchRoleLevel("Lead Accessibility Designer")).toBe("lead_accessibility")
    expect(matchRoleLevel("Sr. Manager")).toBe("sr_manager")
    expect(matchRoleLevel("Senior Manager")).toBe("sr_manager")
    expect(matchRoleLevel("Sr Manager")).toBe("sr_manager")
  })

  it("does not match 'senior' when role contains 'senior manager'", () => {
    expect(matchRoleLevel("Senior Manager")).toBe("sr_manager")
  })

  it("does not match 'lead' when role contains 'lead accessibility'", () => {
    expect(matchRoleLevel("Lead Accessibility Designer")).toBe("lead_accessibility")
  })

  it("returns null for unknown or director roles", () => {
    expect(matchRoleLevel("Contract Designer")).toBeNull()
    expect(matchRoleLevel("Director of Design")).toBeNull()
    expect(matchRoleLevel("")).toBeNull()
    expect(matchRoleLevel("   ")).toBeNull()
  })
})

describe("getBenchmark", () => {
  it("returns the correct expected value for a known role and skill", () => {
    expect(getBenchmark("Level 2", "visual_design")).toBe(5)
    expect(getBenchmark("Senior", "ia")).toBe(6)
    expect(getBenchmark("intern", "empathy")).toBe(2)
    expect(getBenchmark("Principal", "communication")).toBe(9)
  })

  it("returns 0 for a skill with no benchmark at that role level", () => {
    expect(getBenchmark("Intern", "research")).toBe(0)
    expect(getBenchmark("Intern", "facilitation")).toBe(0)
    expect(getBenchmark("Apprentice", "accessibility")).toBe(0)
  })

  it("returns 0 for an unknown role", () => {
    expect(getBenchmark("Contract Designer", "visual_design")).toBe(0)
    expect(getBenchmark("", "visual_design")).toBe(0)
  })

  it("returns 0 for an unknown skill key", () => {
    expect(getBenchmark("Senior", "nonexistent_skill")).toBe(0)
  })

  it("returns 0 for director (no benchmark defined)", () => {
    expect(getBenchmark("Director of Design", "visual_design")).toBe(0)
  })
})
