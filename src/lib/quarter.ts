export interface QuarterInfo {
  quarter: string
  startDate: string
  endDate: string
}

export function getCurrentQuarter(date: Date = new Date()): QuarterInfo {
  const year = date.getFullYear()
  const month = date.getMonth() // 0-indexed, local timezone

  if (month < 3) {
    return { quarter: `Q1 ${year}`, startDate: `${year}-01-01`, endDate: `${year}-03-31` }
  } else if (month < 6) {
    return { quarter: `Q2 ${year}`, startDate: `${year}-04-01`, endDate: `${year}-06-30` }
  } else if (month < 9) {
    return { quarter: `Q3 ${year}`, startDate: `${year}-07-01`, endDate: `${year}-09-30` }
  } else {
    return { quarter: `Q4 ${year}`, startDate: `${year}-10-01`, endDate: `${year}-12-31` }
  }
}
