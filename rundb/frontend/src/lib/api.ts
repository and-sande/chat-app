export const API_BASE = (import.meta as any).env?.VITE_RUNDB_API ?? 'http://localhost:8001'

export type EventRace = { id: string; event_id: string; name: string; start_time?: string | null }
export type Event = {
  id: string
  name: string
  date: string
  start_time?: string | null
  location_city?: string | null
  location_country?: string | null
  organizer?: string | null
  homepage?: string | null
  sport?: string | null
  level?: string | null
  signup_begin?: string | null
  signup_end?: string | null
  image_url?: string | null
  premium?: boolean
  enrolled_count?: number
  distance_km?: number | null
  races?: EventRace[]
}

export type Runner = { id: string; name: string; sex?: string | null; date?: string | null; club?: string | null; country?: string | null; avatar_url?: string | null }
export type Athlete = Runner & {
  run_count: number
  last_race_date?: string | null
  podium_1?: number
  podium_2?: number
  podium_3?: number
  podium_top3?: number
  popularity?: number
  popularity_star?: number
}
export type Stats = { runners_count: number; events_count: number; results_count: number }
export type SearchItem = { type: 'event'|'runner'; id: string; label: string }

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const api = {
  events: (opts?: { upcoming?: boolean }) => get<Event[]>(`/rundb/events${opts?.upcoming ? '?upcoming=true' : ''}`),
  event: (id: string) => get<Event>(`/rundb/events/${id}`),
  eventResults: (id: string) => get<any[]>(`/rundb/events/${id}/results`),
  runners: () => get<Runner[]>(`/rundb/runners`),
  runner: (id: string) => get<Runner>(`/rundb/runners/${id}`),
  runnerResults: (id: string) => get<any[]>(`/rundb/runners/${id}/results`),
  stats: () => get<Stats>(`/rundb/stats`),
  search: (q: string) => get<SearchItem[]>(`/rundb/search?q=${encodeURIComponent(q)}`),
  results: (limit = 100) => get<any[]>(`/rundb/results?limit=${limit}`),
  athletes: (p?: {
    q?: string
    sex?: 'M'|'F'|''
    min_runs?: number
    date_from?: string
    podium?: '1'|'2'|'3'|'top3'
    top?: 'popular3'
    min_p1?: number
    min_p2?: number
    min_p3?: number
    min_top3?: number
    popularity_min?: number
    popularity_max?: number
  }) => {
    const params = new URLSearchParams()
    if (p?.q) params.set('q', p.q)
    if (p?.sex) params.set('sex', p.sex)
    if (typeof p?.min_runs === 'number' && p.min_runs > 0) params.set('min_runs', String(p.min_runs))
    if (p?.date_from) params.set('date_from', p.date_from)
    if (p?.podium) params.set('podium', p.podium)
    if (p?.top) params.set('top', p.top)
    if (typeof p?.min_p1 === 'number' && p.min_p1 > 0) params.set('min_p1', String(p.min_p1))
    if (typeof p?.min_p2 === 'number' && p.min_p2 > 0) params.set('min_p2', String(p.min_p2))
    if (typeof p?.min_p3 === 'number' && p.min_p3 > 0) params.set('min_p3', String(p.min_p3))
    if (typeof p?.min_top3 === 'number' && p.min_top3 > 0) params.set('min_top3', String(p.min_top3))
    if (typeof p?.popularity_min === 'number') params.set('popularity_min', String(p.popularity_min))
    if (typeof p?.popularity_max === 'number') params.set('popularity_max', String(p.popularity_max))
    const qs = params.toString()
    return get<Athlete[]>(`/rundb/athletes${qs ? `?${qs}` : ''}`)
  },
}
