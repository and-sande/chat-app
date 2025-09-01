export type Competition = {
  id: string
  name: string
  date: string // ISO YYYY-MM-DD
  location: string
  distanceKm?: number
  imageUrl?: string
  organizer?: string
  homepage?: string
  // Optional scraped metadata
  sport?: string
  level?: string
  signupBegin?: string // ISO
  signupEnd?: string // ISO
  startTime?: string // HH:mm (local)
  races?: { name: string; startTime?: string }[]
  premium?: boolean
  enrolledCount?: number
}

export type RaceResult = {
  competitionId: string
  timeSec: number
  position: number
  date: string // ISO
}

export type Runner = {
  id: string
  name: string
  age?: number
  club?: string
  country?: string
  avatarUrl?: string
  results: RaceResult[]
}
