export const SPRINT_LENGTH_DAYS = 14

const EPOCH = new Date("2024-01-01T00:00:00Z")

export interface SprintInfo {
  number: number
  daysElapsed: number
  daysRemaining: number
  endsOn: Date
}

export function getSprintInfo(today = new Date()): SprintInfo {
  const todayStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const epochStart = Date.UTC(EPOCH.getUTCFullYear(), EPOCH.getUTCMonth(), EPOCH.getUTCDate())
  const daysSinceEpoch = Math.floor((todayStart - epochStart) / (1000 * 60 * 60 * 24))
  const daysElapsed = daysSinceEpoch % SPRINT_LENGTH_DAYS
  const daysRemaining = SPRINT_LENGTH_DAYS - daysElapsed
  const number = Math.floor(daysSinceEpoch / SPRINT_LENGTH_DAYS) + 1
  const endsOn = new Date(todayStart + daysRemaining * 24 * 60 * 60 * 1000)
  return { number, daysElapsed, daysRemaining, endsOn }
}
