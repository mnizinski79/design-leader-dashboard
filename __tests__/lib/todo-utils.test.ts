import { getDueBadge } from "@/lib/todo-utils"

const TODAY = new Date("2024-06-15")

describe("getDueBadge", () => {
  it("returns null for no due date", () => {
    expect(getDueBadge(null, TODAY)).toBeNull()
  })

  it("returns overdue for a past date", () => {
    expect(getDueBadge("2024-06-14", TODAY)).toBe("overdue")
  })

  it("returns overdue for dates more than a day in the past", () => {
    expect(getDueBadge("2024-06-01", TODAY)).toBe("overdue")
  })

  it("returns today for the same date", () => {
    expect(getDueBadge("2024-06-15", TODAY)).toBe("today")
  })

  it("returns soon for 1 day from now", () => {
    expect(getDueBadge("2024-06-16", TODAY)).toBe("soon")
  })

  it("returns soon for 3 days from now", () => {
    expect(getDueBadge("2024-06-18", TODAY)).toBe("soon")
  })

  it("returns null for 4 days from now", () => {
    expect(getDueBadge("2024-06-19", TODAY)).toBeNull()
  })

  it("returns null for far future dates", () => {
    expect(getDueBadge("2024-07-01", TODAY)).toBeNull()
  })
})
