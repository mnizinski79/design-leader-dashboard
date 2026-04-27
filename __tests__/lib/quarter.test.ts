import { getCurrentQuarter } from "@/lib/quarter"

describe("getCurrentQuarter", () => {
  it("returns Q1 for January", () => {
    const result = getCurrentQuarter(new Date(2026, 0, 15)) // Jan 15, local time
    expect(result).toEqual({
      quarter: "Q1 2026",
      startDate: "2026-01-01",
      endDate: "2026-03-31",
    })
  })

  it("returns Q2 for April", () => {
    const result = getCurrentQuarter(new Date(2026, 3, 27)) // Apr 27, local time
    expect(result).toEqual({
      quarter: "Q2 2026",
      startDate: "2026-04-01",
      endDate: "2026-06-30",
    })
  })

  it("returns Q3 for July", () => {
    const result = getCurrentQuarter(new Date(2026, 6, 1)) // Jul 1, local time
    expect(result).toEqual({
      quarter: "Q3 2026",
      startDate: "2026-07-01",
      endDate: "2026-09-30",
    })
  })

  it("returns Q4 for October", () => {
    const result = getCurrentQuarter(new Date(2026, 9, 31)) // Oct 31, local time
    expect(result).toEqual({
      quarter: "Q4 2026",
      startDate: "2026-10-01",
      endDate: "2026-12-31",
    })
  })

  it("uses today when no date provided", () => {
    const result = getCurrentQuarter()
    expect(result.quarter).toMatch(/^Q[1-4] \d{4}$/)
  })
})
