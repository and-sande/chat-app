export type Competition = {
  id: string
  name: string
  date: string // ISO YYYY-MM-DD
  location: string
  distanceKm: number
  imageUrl?: string
  organizer?: string
  homepage?: string
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
