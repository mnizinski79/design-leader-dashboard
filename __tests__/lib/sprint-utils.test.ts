import { getSprintInfo, SPRINT_LENGTH_DAYS } from "@/lib/sprint-utils"

describe("getSprintInfo", () => {
  it("SPRINT_LENGTH_DAYS is 14", () => {
    expect(SPRINT_LENGTH_DAYS).toBe(14)
  })

  it("sprint 1 starts on the epoch date with 14 days remaining", () => {
    const info = getSprintInfo(new Date("2024-01-01"))
    expect(info.number).toBe(1)
    expect(info.daysElapsed).toBe(0)
    expect(info.daysRemaining).toBe(14)
  })

  it("mid-sprint calculates correctly", () => {
    const info = getSprintInfo(new Date("2024-01-08"))
    expect(info.number).toBe(1)
    expect(info.daysElapsed).toBe(7)
    expect(info.daysRemaining).toBe(7)
  })

  it("last day of sprint has 1 day remaining", () => {
    const info = getSprintInfo(new Date("2024-01-14"))
    expect(info.number).toBe(1)
    expect(info.daysElapsed).toBe(13)
    expect(info.daysRemaining).toBe(1)
  })

  it("sprint 2 starts on day 14", () => {
    const info = getSprintInfo(new Date("2024-01-15"))
    expect(info.number).toBe(2)
    expect(info.daysElapsed).toBe(0)
    expect(info.daysRemaining).toBe(14)
  })

  it("endsOn is the correct date", () => {
    const info = getSprintInfo(new Date("2024-01-01"))
    expect(info.endsOn.toISOString().split("T")[0]).toBe("2024-01-15")
  })
})
